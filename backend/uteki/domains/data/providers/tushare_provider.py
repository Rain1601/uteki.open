"""Tushare provider — US daily klines with PE/PB/market-cap enrichment."""

import asyncio
import logging
from datetime import date, timedelta
from typing import List, Optional

from .base import BaseDataProvider, DataProvider, KlineRow

logger = logging.getLogger(__name__)


class TushareProvider(BaseDataProvider):
    """Fetch US daily klines via Tushare pro API (requires token).

    Primary value: PE, PB, total_mv, float_mv, vwap fields that YFinance
    does not provide.  OHLCV is also available but YFinance is preferred
    for that purpose.

    Rate limit: ~200 req/min → caller should add ≥0.3s delay between calls.
    Max rows per query: 6000 (≈24 years of daily data, single call sufficient).
    """

    provider = DataProvider.TUSHARE

    def __init__(self):
        from uteki.common.config import settings
        token = settings.tushare_token
        if not token:
            raise ValueError(
                "TUSHARE_TOKEN not configured. "
                "Set the TUSHARE_TOKEN environment variable to use TushareProvider."
            )
        self._token = token
        # Lazy-init the pro api on first use
        self._pro = None

    def _get_pro(self):
        if self._pro is None:
            import tushare as ts
            ts.set_token(self._token)
            self._pro = ts.pro_api()
        return self._pro

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

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, self._fetch_sync, symbol, start, end,
        )

    def _fetch_sync(
        self, symbol: str, start: date, end: date,
    ) -> List[KlineRow]:
        pro = self._get_pro()

        start_str = start.strftime("%Y%m%d")
        end_str = end.strftime("%Y%m%d")

        try:
            # Tushare us_daily: US stock daily data
            # ts_code format for US stocks: AAPL (direct ticker)
            df = pro.us_daily(
                ts_code=symbol,
                start_date=start_str,
                end_date=end_str,
            )
        except Exception as e:
            logger.error(f"Tushare us_daily failed for {symbol}: {e}")
            raise

        if df is None or df.empty:
            logger.warning(f"Tushare returned no data for {symbol}")
            return []

        rows: List[KlineRow] = []
        for _, row in df.iterrows():
            try:
                trade_date = _parse_date(row.get("trade_date"))
                if trade_date is None:
                    continue

                rows.append(KlineRow(
                    time=trade_date,
                    open=_safe_float(row.get("open")),
                    high=_safe_float(row.get("high")),
                    low=_safe_float(row.get("low")),
                    close=_safe_float(row.get("close")),
                    volume=_safe_float(row.get("vol", 0)),
                    turnover=_safe_float(row.get("amount")),
                    vwap=_safe_float(row.get("vwap")),
                    pe=_safe_float(row.get("pe")),
                    pb=_safe_float(row.get("pb")),
                    total_mv=_safe_float(row.get("total_mv")),
                    float_mv=_safe_float(row.get("float_mv")),
                ))
            except Exception as e:
                logger.warning(f"Tushare skip row {symbol}/{row.get('trade_date')}: {e}")

        # Sort ascending by date (Tushare returns newest first)
        rows.sort(key=lambda r: r.time)
        logger.info(f"Tushare fetched {len(rows)} rows for {symbol}")
        return rows

    async def get_quote(self, symbol: str) -> Optional[dict]:
        """Tushare does not provide real-time quotes; return None."""
        return None


def _parse_date(val) -> Optional[date]:
    """Parse YYYYMMDD string or similar into date."""
    if val is None:
        return None
    s = str(val).strip()
    if len(s) == 8:
        return date(int(s[:4]), int(s[4:6]), int(s[6:8]))
    return None


def _safe_float(val) -> Optional[float]:
    """Convert to float, return None for NaN / None / empty."""
    if val is None:
        return None
    try:
        import math
        f = float(val)
        return None if math.isnan(f) else f
    except (ValueError, TypeError):
        return None
