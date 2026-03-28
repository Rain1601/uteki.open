"""Fetch S&P 500 + NASDAQ 100 constituent symbols for seeding.

Primary source: Wikipedia tables via ``pd.read_html``.
Fallback: built-in static list of top holdings.
"""

import logging
from typing import List

logger = logging.getLogger(__name__)


def _fetch_sp500_from_wikipedia() -> List[dict]:
    """Scrape the S&P 500 constituents table from Wikipedia."""
    import pandas as pd

    url = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
    tables = pd.read_html(url)
    df = tables[0]  # first table is the constituents list

    results = []
    for _, row in df.iterrows():
        symbol = str(row.get("Symbol", "")).strip()
        # Wikipedia uses dots for class shares (BRK.B) — Yahoo uses hyphens
        symbol = symbol.replace(".", "-")
        name = str(row.get("Security", "")).strip()
        exchange = str(row.get("Exchange", "")).strip() or None

        if symbol:
            results.append({
                "symbol": symbol,
                "name": name,
                "asset_type": "us_stock",
                "exchange": exchange,
                "data_source": "yfinance",
            })
    return results


def _fetch_nasdaq100_from_wikipedia() -> List[dict]:
    """Scrape the NASDAQ-100 constituents table from Wikipedia."""
    import pandas as pd

    url = "https://en.wikipedia.org/wiki/Nasdaq-100"
    tables = pd.read_html(url)

    # The constituents table has a "Ticker" column
    df = None
    for t in tables:
        cols_lower = [str(c).lower() for c in t.columns]
        if "ticker" in cols_lower or "symbol" in cols_lower:
            df = t
            break

    if df is None:
        logger.warning("Could not find NASDAQ-100 constituents table on Wikipedia")
        return []

    # Determine the ticker column name
    ticker_col = None
    company_col = None
    for c in df.columns:
        cl = str(c).lower()
        if cl in ("ticker", "symbol"):
            ticker_col = c
        if cl in ("company", "security", "name"):
            company_col = c

    if ticker_col is None:
        return []

    results = []
    for _, row in df.iterrows():
        symbol = str(row[ticker_col]).strip().replace(".", "-")
        name = str(row[company_col]).strip() if company_col else ""
        if symbol:
            results.append({
                "symbol": symbol,
                "name": name,
                "asset_type": "us_stock",
                "exchange": "NASDAQ",
                "data_source": "yfinance",
            })
    return results


# ---------------------------------------------------------------------------
# Static fallback — top ~50 large-caps from each index
# ---------------------------------------------------------------------------

_FALLBACK_SYMBOLS: List[str] = [
    # Mega-cap tech
    "AAPL", "MSFT", "AMZN", "GOOGL", "GOOG", "META", "NVDA", "TSLA",
    "AVGO", "ADBE", "CRM", "NFLX", "AMD", "INTC", "QCOM", "TXN",
    "CSCO", "ORCL", "IBM", "AMAT", "MU", "NOW", "ISRG", "INTU",
    "LRCX", "KLAC", "SNPS", "CDNS", "MRVL", "ADI", "PANW", "ABNB",
    # Finance
    "JPM", "V", "MA", "BAC", "WFC", "GS", "MS", "BLK", "SCHW",
    "AXP", "C", "USB", "PNC", "TFC", "COF",
    # Healthcare
    "UNH", "JNJ", "LLY", "PFE", "ABBV", "MRK", "TMO", "ABT",
    "DHR", "BMY", "AMGN", "MDT", "GILD", "VRTX", "REGN",
    # Consumer
    "WMT", "PG", "KO", "PEP", "COST", "MCD", "NKE", "SBUX",
    "TGT", "HD", "LOW", "TJX", "BKNG",
    # Industrial / Energy
    "XOM", "CVX", "COP", "SLB", "EOG",
    "CAT", "DE", "UNP", "RTX", "HON", "BA", "GE", "LMT", "MMM",
    # Communication
    "DIS", "CMCSA", "T", "VZ", "TMUS",
    # Other
    "BRK-B", "UPS", "FDX", "PYPL", "SQ", "COIN", "SNOW", "PLTR",
    "UBER", "LYFT", "RIVN", "DDOG", "ZS", "CRWD", "NET",
]


def _fallback_symbols() -> List[dict]:
    return [
        {
            "symbol": s,
            "name": s,
            "asset_type": "us_stock",
            "exchange": "NASDAQ" if s not in (
                "JPM", "BAC", "WFC", "GS", "MS", "BLK", "C", "USB", "PNC",
                "TFC", "COF", "JNJ", "PFE", "ABT", "BMY", "MDT",
                "WMT", "PG", "KO", "PEP", "MCD", "NKE", "TGT", "HD", "LOW",
                "XOM", "CVX", "COP", "SLB", "EOG", "CAT", "DE", "UNP",
                "RTX", "HON", "BA", "GE", "LMT", "MMM", "DIS", "T", "VZ",
                "BRK-B", "UPS", "FDX", "AXP", "SCHW",
            ) else "NYSE",
            "data_source": "yfinance",
        }
        for s in _FALLBACK_SYMBOLS
    ]


def get_index_constituents() -> List[dict]:
    """Return de-duplicated S&P 500 + NASDAQ 100 constituent list.

    Tries Wikipedia scraping first; falls back to a static list on failure.
    """
    all_symbols: List[dict] = []

    # S&P 500
    try:
        sp500 = _fetch_sp500_from_wikipedia()
        logger.info(f"Fetched {len(sp500)} S&P 500 constituents from Wikipedia")
        all_symbols.extend(sp500)
    except Exception as e:
        logger.warning(f"S&P 500 Wikipedia fetch failed: {e}")

    # NASDAQ 100
    try:
        ndx = _fetch_nasdaq100_from_wikipedia()
        logger.info(f"Fetched {len(ndx)} NASDAQ 100 constituents from Wikipedia")
        all_symbols.extend(ndx)
    except Exception as e:
        logger.warning(f"NASDAQ 100 Wikipedia fetch failed: {e}")

    # Fallback if both failed or returned nothing
    if not all_symbols:
        logger.warning("Using static fallback symbol list")
        all_symbols = _fallback_symbols()

    # De-duplicate by symbol (keep first occurrence)
    seen = set()
    unique = []
    for s in all_symbols:
        sym = s["symbol"].upper()
        if sym not in seen:
            seen.add(sym)
            s["symbol"] = sym
            unique.append(s)

    logger.info(f"Total unique index constituents: {len(unique)}")
    return unique
