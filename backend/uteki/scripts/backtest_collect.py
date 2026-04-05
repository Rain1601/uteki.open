"""
Backtest Data Collector — run Company Agent analysis at a historical date.

Usage:
    python -m uteki.scripts.backtest_collect --symbols AAPL,MSFT --date 2023-01-01
    python -m uteki.scripts.backtest_collect --symbols AAPL --date 2024-06-01 --output backtest.json

Produces JSON with analysis results + actual future price for validation.

Limitations:
- yfinance Ticker.info returns CURRENT fundamentals (PE, margins, etc.)
  which cannot be rolled back to a historical date. These are used as-is
  but flagged with "financials_as_of": "latest".
- Historical prices (analysis date + 6 months later) are accurate via history().
"""
from __future__ import annotations

import argparse
import asyncio
import json
import logging
import sys
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


def parse_args():
    parser = argparse.ArgumentParser(description="Backtest data collector for Company Agent")
    parser.add_argument("--symbols", required=True, help="Comma-separated symbols (AAPL,MSFT)")
    parser.add_argument("--date", required=True, help="Analysis date (YYYY-MM-DD)")
    parser.add_argument("--output", default=None, help="Output JSON file (default: stdout)")
    parser.add_argument("--model", default="deepseek-chat", help="LLM model (default: deepseek-chat)")
    return parser.parse_args()


def fetch_historical_price(symbol: str, date_str: str) -> Optional[float]:
    """Get closing price on a specific date via yfinance."""
    import yfinance as yf

    dt = datetime.strptime(date_str, "%Y-%m-%d")
    # Try a 5-day window to handle weekends/holidays
    start = dt - timedelta(days=3)
    end = dt + timedelta(days=3)

    ticker = yf.Ticker(symbol)
    hist = ticker.history(start=start.strftime("%Y-%m-%d"), end=end.strftime("%Y-%m-%d"))

    if hist.empty:
        return None

    # Find closest date <= target
    target = dt.strftime("%Y-%m-%d")
    for idx in sorted(hist.index, reverse=True):
        if idx.strftime("%Y-%m-%d") <= target:
            return round(float(hist.loc[idx, "Close"]), 2)

    # Fallback: first available
    return round(float(hist.iloc[0]["Close"]), 2)


def fetch_future_price(symbol: str, date_str: str, months_ahead: int = 6) -> Optional[float]:
    """Get closing price N months after the analysis date."""
    dt = datetime.strptime(date_str, "%Y-%m-%d")
    future_dt = dt + timedelta(days=months_ahead * 30)

    # Don't look into the future
    if future_dt > datetime.now():
        return None

    return fetch_historical_price(symbol, future_dt.strftime("%Y-%m-%d"))


async def fetch_company_data_at_date(symbol: str, date_str: str) -> Dict[str, Any]:
    """Fetch company data with historical price override.

    Uses fetch_company_data() for fundamentals (current, with caveat),
    then overrides price_data with the historical closing price.
    """
    from uteki.domains.company.financials import fetch_company_data

    # Get current fundamentals (cannot roll back)
    data = await fetch_company_data(symbol)
    if "error" in data:
        return data

    # Override price with historical
    hist_price = fetch_historical_price(symbol, date_str)
    if hist_price is not None:
        data["price_data"]["current_price"] = hist_price
        data["price_data"]["_price_source"] = f"historical_{date_str}"
    else:
        logger.warning(f"[backtest] Could not fetch historical price for {symbol} on {date_str}")

    # Tag the data source
    data["_backtest_meta"] = {
        "analysis_date": date_str,
        "price_source": "yfinance_history",
        "financials_source": "yfinance_info_latest",
        "caveat": "Fundamental data (PE, margins, etc.) is current, not as-of analysis date",
    }

    return data


def extract_gate_scores(skills: Dict[str, Any]) -> Dict[str, Any]:
    """Extract key scores from each gate's parsed output."""
    scores = {}
    gate_keys = {
        "business_analysis": ["sustainability_score", "business_quality"],
        "fisher_qa": ["total_score", "growth_verdict"],
        "moat_assessment": ["moat_width", "moat_trend", "moat_durability_years"],
        "management_assessment": ["management_score"],
        "reverse_test": ["resilience_score"],
        "valuation": ["buy_confidence", "price_assessment", "safety_margin"],
    }
    for skill_name, keys in gate_keys.items():
        gate_data = skills.get(skill_name, {})
        parsed = gate_data.get("parsed", {})
        if not parsed:
            continue
        gate_scores = {}
        for field in keys:
            val = parsed.get(field)
            if val is not None:
                gate_scores[field] = val
        if gate_scores:
            scores[skill_name] = gate_scores
    return scores


async def run_single(symbol: str, date_str: str, model_config: Dict[str, Any]) -> Dict[str, Any]:
    """Run analysis for one symbol at one date."""
    from uteki.domains.company.skill_runner import CompanySkillRunner

    print(f"  [{symbol}] Fetching data...", flush=True)
    company_data = await fetch_company_data_at_date(symbol, date_str)
    if "error" in company_data:
        return {"symbol": symbol, "analysis_date": date_str, "error": company_data["error"]}

    price_at_analysis = company_data["price_data"].get("current_price", 0)

    print(f"  [{symbol}] Running pipeline (price=${price_at_analysis})...", flush=True)

    def progress(e):
        if e.get("type") == "gate_complete":
            sys.stdout.write(f"G{e.get('gate')} ")
            sys.stdout.flush()

    runner = CompanySkillRunner(model_config, company_data, on_progress=progress)
    result = await runner.run_pipeline()
    print(flush=True)

    verdict = result.get("verdict", {})
    gate_scores = extract_gate_scores(result.get("skills", {}))

    # Fetch future price for validation
    price_6m = fetch_future_price(symbol, date_str, months_ahead=6)
    price_12m = fetch_future_price(symbol, date_str, months_ahead=12)

    return_6m = round((price_6m / price_at_analysis - 1) * 100, 2) if price_6m and price_at_analysis else None
    return_12m = round((price_12m / price_at_analysis - 1) * 100, 2) if price_12m and price_at_analysis else None

    return {
        "symbol": symbol,
        "analysis_date": date_str,
        "model": model_config.get("model", ""),
        "action": verdict.get("action", "UNKNOWN"),
        "conviction": verdict.get("conviction", 0),
        "quality_verdict": verdict.get("quality_verdict", "UNKNOWN"),
        "price_at_analysis": price_at_analysis,
        "price_6m_later": price_6m,
        "return_6m_pct": return_6m,
        "price_12m_later": price_12m,
        "return_12m_pct": return_12m,
        "gate_scores": gate_scores,
        "total_latency_ms": result.get("total_latency_ms", 0),
        "tool_calls_count": len(result.get("tool_calls", []) or []),
        "financials_caveat": "Fundamental data is current (not as-of analysis date)",
    }


async def main():
    args = parse_args()
    symbols = [s.strip().upper() for s in args.symbols.split(",") if s.strip()]
    date_str = args.date

    # Validate date
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        if dt > datetime.now():
            print(f"Error: date {date_str} is in the future", file=sys.stderr)
            sys.exit(1)
    except ValueError:
        print(f"Error: invalid date format {date_str}, use YYYY-MM-DD", file=sys.stderr)
        sys.exit(1)

    # Resolve model
    from uteki.common.config import settings
    aihub_key = getattr(settings, "aihubmix_api_key", None)
    if not aihub_key:
        print("Error: AIHUBMIX_API_KEY not configured", file=sys.stderr)
        sys.exit(1)

    model_config = {
        "provider": "openai",
        "model": args.model,
        "api_key": aihub_key,
        "base_url": getattr(settings, "aihubmix_base_url", "https://aihubmix.com/v1"),
    }

    print(f"Backtest: {len(symbols)} symbols @ {date_str} (model={args.model})")
    print(f"Symbols: {', '.join(symbols)}")
    print()

    results = []
    for symbol in symbols:
        try:
            result = await run_single(symbol, date_str, model_config)
            results.append(result)

            action = result.get("action", "?")
            conv = result.get("conviction", 0)
            ret_6m = result.get("return_6m_pct")
            ret_str = f"6m return={ret_6m:+.1f}%" if ret_6m is not None else "6m return=N/A"
            print(f"  [{symbol}] → {action} (conv={conv:.2f}) {ret_str}")
            print()
        except Exception as e:
            logger.error(f"[backtest] {symbol} failed: {e}", exc_info=True)
            results.append({"symbol": symbol, "analysis_date": date_str, "error": str(e)})
            print(f"  [{symbol}] ERROR: {e}")
            print()

    # Output
    output_json = json.dumps(results, indent=2, ensure_ascii=False, default=str)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(output_json)
        print(f"Results written to {args.output}")
    else:
        print(output_json)


if __name__ == "__main__":
    logging.basicConfig(level=logging.WARNING)
    asyncio.run(main())
