"""YFinance provider — covers US stocks, ETFs, forex, HK stocks, and futures."""

import asyncio
import logging
import time
from datetime import date, timedelta
from typing import List, Optional

from .base import BaseDataProvider, DataProvider, KlineRow

logger = logging.getLogger(__name__)

MAX_RETRIES = 3
RETRY_BASE_DELAY = 1.0  # seconds; exponential: 1s → 2s → 4s


class YFinanceProvider(BaseDataProvider):
    """Fetch daily OHLCV via yfinance (free, no API key required)."""

    provider = DataProvider.YFINANCE

    async def fetch_daily_klines(
        self,
        symbol: str,
        start: Optional[date] = None,
        end: Optional[date] = None,
    ) -> List[KlineRow]:
        if start is None:
            start = date.today() - timedelta(days=20 * 365)
        if end is None:
            end = date.today()

        # yfinance is synchronous — run in executor with retries
        loop = asyncio.get_event_loop()

        last_error: Optional[Exception] = None
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                rows = await loop.run_in_executor(
                    None, self._fetch_sync, symbol, start, end,
                )
                return rows
            except Exception as e:
                last_error = e
                if attempt < MAX_RETRIES:
                    delay = RETRY_BASE_DELAY * (2 ** (attempt - 1))
                    logger.warning(
                        f"yfinance attempt {attempt}/{MAX_RETRIES} failed for {symbol}: {e}. "
                        f"Retrying in {delay:.1f}s…"
                    )
                    await asyncio.sleep(delay)
                else:
                    logger.error(
                        f"yfinance all {MAX_RETRIES} attempts failed for {symbol}: {e}"
                    )

        raise last_error  # type: ignore[misc]

    def _fetch_sync(
        self, symbol: str, start: date, end: date,
    ) -> List[KlineRow]:
        import yfinance as yf

        ticker = yf.Ticker(symbol)
        # end is exclusive in yfinance, add 1 day
        df = ticker.history(
            start=start.isoformat(),
            end=(end + timedelta(days=1)).isoformat(),
            auto_adjust=False,
        )

        if df is None or df.empty:
            logger.warning(f"yfinance returned no data for {symbol}")
            return []

        rows: List[KlineRow] = []
        for idx, row in df.iterrows():
            try:
                trade_date = idx.date() if hasattr(idx, "date") else idx
                rows.append(KlineRow(
                    time=trade_date,
                    open=float(row.get("Open", 0)),
                    high=float(row.get("High", 0)),
                    low=float(row.get("Low", 0)),
                    close=float(row.get("Close", 0)),
                    volume=float(row.get("Volume", 0)),
                    adj_close=float(row["Adj Close"]) if "Adj Close" in row and row["Adj Close"] is not None else None,
                ))
            except Exception as e:
                logger.warning(f"Skip row {symbol}/{idx}: {e}")

        logger.info(f"yfinance fetched {len(rows)} rows for {symbol}")
        return rows

    async def get_quote(self, symbol: str) -> Optional[dict]:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._quote_sync, symbol)

    def _quote_sync(self, symbol: str) -> Optional[dict]:
        try:
            import yfinance as yf

            ticker = yf.Ticker(symbol)
            info = ticker.fast_info

            price = getattr(info, "last_price", None)
            prev_close = getattr(info, "previous_close", None)
            change_pct = None
            if price and prev_close and prev_close > 0:
                change_pct = round((price - prev_close) / prev_close * 100, 4)

            return {
                "symbol": symbol,
                "price": price,
                "change_pct": change_pct,
                "volume": getattr(info, "last_volume", None),
                "market_cap": getattr(info, "market_cap", None),
                "timestamp": None,  # yfinance fast_info doesn't provide timestamp
            }
        except Exception as e:
            logger.error(f"yfinance quote error for {symbol}: {e}")
            return None
