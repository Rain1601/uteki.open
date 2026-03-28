"""IngestionService — batch ingestion of K-line data from multiple providers."""

import asyncio
import logging
from datetime import date, datetime, timedelta, timezone
from typing import Dict, List, Optional
from uuid import uuid4

from sqlalchemy import select, text

from uteki.common.cache import get_cache_service
from uteki.common.database import db_manager
from uteki.domains.data.models import Symbol, KlineDaily, IngestionRun
from uteki.domains.data.providers.base import (
    AssetType, DataProvider, DataProviderFactory, KlineRow, PROVIDER_ROUTING,
)

logger = logging.getLogger(__name__)

# Rate-limiting defaults
SYMBOL_DELAY = 0.8          # seconds between symbols
CONSECUTIVE_FAIL_LIMIT = 5  # consecutive failures before cooldown
COOLDOWN_DELAY = 30.0       # seconds to pause after consecutive failures


class IngestionService:
    """Write-path: fetch klines from providers and upsert into TimescaleDB."""

    async def ingest_symbol(
        self,
        symbol_record: dict,
        start: Optional[date] = None,
        end: Optional[date] = None,
    ) -> Dict:
        """Ingest daily klines for a single symbol.

        Returns: {"symbol": ..., "inserted": N, "updated": N, "status": "success"|"failed"}
        """
        sym = symbol_record["symbol"]
        asset_type = symbol_record["asset_type"]
        symbol_id = symbol_record["id"]

        try:
            provider = DataProviderFactory.get_provider(AssetType(asset_type))
        except (ValueError, KeyError):
            logger.warning(f"No provider for {sym} (asset_type={asset_type})")
            return {"symbol": sym, "inserted": 0, "updated": 0, "status": "skipped"}

        # Determine start date: last date in DB + 1 day, or 20 years ago
        if start is None:
            start = await self._get_incremental_start(sym)

        try:
            rows = await provider.fetch_daily_klines(sym, start=start, end=end)
        except Exception as e:
            logger.error(f"Provider fetch failed for {sym}: {e}")
            return {"symbol": sym, "inserted": 0, "updated": 0, "status": "failed", "error": str(e)}

        if not rows:
            return {"symbol": sym, "inserted": 0, "updated": 0, "status": "success"}

        inserted, updated = await self._upsert_klines(
            rows, sym, symbol_id, provider.provider.value,
        )

        # Invalidate cache for this symbol
        cache = get_cache_service()
        await cache.delete_pattern(f"uteki:data:klines:{sym}:")

        return {"symbol": sym, "inserted": inserted, "updated": updated, "status": "success"}

    async def ingest_all(
        self,
        asset_types: Optional[List[str]] = None,
        symbols: Optional[List[str]] = None,
    ) -> Dict:
        """Ingest klines for all active symbols, optionally filtered.

        Returns: summary dict with per-symbol results.
        """
        symbol_records = await self._get_active_symbols(asset_types, symbols)
        if not symbol_records:
            return {"total": 0, "results": []}

        # Create ingestion run log
        run_id = str(uuid4())
        source = "multi"
        asset_type_str = ",".join(set(s["asset_type"] for s in symbol_records))

        await self._create_run_log(run_id, source, asset_type_str)

        results = []
        total_inserted = 0
        total_updated = 0
        total_failed = 0
        consecutive_failures = 0
        total = len(symbol_records)

        for idx, sym_rec in enumerate(symbol_records, 1):
            sym_name = sym_rec["symbol"]

            result = await self.ingest_symbol(sym_rec)
            results.append(result)

            if result["status"] == "success":
                rows_count = result.get("inserted", 0)
                total_inserted += rows_count
                total_updated += result.get("updated", 0)
                consecutive_failures = 0
                logger.info(f"[{idx}/{total}] {sym_name}: {rows_count} rows")
            elif result["status"] == "failed":
                total_failed += 1
                consecutive_failures += 1
                logger.warning(f"[{idx}/{total}] {sym_name}: FAILED — {result.get('error', '?')}")

                # Cooldown after consecutive failures (likely rate-limited)
                if consecutive_failures >= CONSECUTIVE_FAIL_LIMIT:
                    logger.warning(
                        f"{consecutive_failures} consecutive failures — "
                        f"pausing {COOLDOWN_DELAY}s to avoid rate-limit…"
                    )
                    await asyncio.sleep(COOLDOWN_DELAY)
                    consecutive_failures = 0
            else:
                # skipped
                logger.info(f"[{idx}/{total}] {sym_name}: skipped")

            # Rate-limit: delay between symbols
            if idx < total:
                await asyncio.sleep(SYMBOL_DELAY)

        # Finalize run log
        status = "success"
        if total_failed > 0 and total_failed < len(symbol_records):
            status = "partial_failure"
        elif total_failed == len(symbol_records):
            status = "failed"

        await self._finalize_run_log(
            run_id, status, total_inserted, total_updated, total_failed,
        )

        # Post-ingestion quality check
        quality_issues = 0
        try:
            from uteki.domains.data.validation.quality_checker import get_quality_checker
            checker = get_quality_checker()
            for sym_rec in symbol_records:
                issues = await checker.check_symbol(
                    sym_rec["symbol"], sym_rec["asset_type"], sym_rec["id"],
                    lookback_days=30,
                )
                quality_issues += len(issues)
            if quality_issues:
                logger.warning(f"Post-ingestion quality: {quality_issues} issue(s) across {len(symbol_records)} symbols")
        except Exception as e:
            logger.error(f"Post-ingestion quality check failed: {e}")

        return {
            "run_id": run_id,
            "total": len(symbol_records),
            "inserted": total_inserted,
            "updated": total_updated,
            "failed": total_failed,
            "status": status,
            "quality_issues": quality_issues,
            "results": results,
        }

    async def enrich_tushare(self) -> Dict:
        """Enrich existing klines with PE/PB/total_mv/float_mv/vwap from Tushare.

        Only updates rows where pe IS NULL.
        """
        from uteki.domains.data.providers.base import DataProviderFactory, DataProvider

        try:
            provider = DataProviderFactory._create_provider(DataProvider.TUSHARE)
        except Exception as e:
            return {"status": "failed", "error": f"Cannot create Tushare provider: {e}"}

        # Find symbols that have klines but no PE data
        async with db_manager.get_postgres_session() as session:
            result = await session.execute(text("""
                SELECT DISTINCT k.symbol, k.symbol_id
                FROM market_data.klines_daily k
                WHERE k.pe IS NULL
                ORDER BY k.symbol
            """))
            symbols_to_enrich = [
                {"symbol": row[0], "symbol_id": row[1]} for row in result.fetchall()
            ]

        if not symbols_to_enrich:
            return {"status": "success", "message": "No symbols need enrichment", "enriched": 0}

        total = len(symbols_to_enrich)
        enriched_count = 0
        failed_count = 0

        for idx, sym_info in enumerate(symbols_to_enrich, 1):
            sym = sym_info["symbol"]
            try:
                rows = await provider.fetch_daily_klines(sym)
                if not rows:
                    logger.info(f"[enrich {idx}/{total}] {sym}: no Tushare data")
                    continue

                updated = await self._update_enrichment_fields(sym, rows)
                enriched_count += updated
                logger.info(f"[enrich {idx}/{total}] {sym}: updated {updated} rows")
            except Exception as e:
                failed_count += 1
                logger.warning(f"[enrich {idx}/{total}] {sym}: FAILED — {e}")

            # Tushare rate limit: ~200 req/min → 0.3s interval
            if idx < total:
                await asyncio.sleep(0.35)

        return {
            "status": "success",
            "total_symbols": total,
            "rows_enriched": enriched_count,
            "failed": failed_count,
        }

    # ── Internal helpers ──

    async def _get_incremental_start(self, symbol: str) -> date:
        """Find last date in klines_daily for this symbol, return next day."""
        async with db_manager.get_postgres_session() as session:
            result = await session.execute(
                text("""
                    SELECT max(time) FROM market_data.klines_daily
                    WHERE symbol = :symbol
                """),
                {"symbol": symbol},
            )
            last_date = result.scalar()

        if last_date:
            return last_date + timedelta(days=1)
        return date.today() - timedelta(days=20 * 365)

    async def _upsert_klines(
        self,
        rows: List[KlineRow],
        symbol: str,
        symbol_id: str,
        source: str,
    ) -> tuple[int, int]:
        """Bulk upsert kline rows using PostgreSQL ON CONFLICT.

        Uses multi-row VALUES to minimise DB round-trips.
        """
        if not rows:
            return 0, 0

        async with db_manager.get_postgres_session() as session:
            values = []
            for r in rows:
                values.append({
                    "time": r.time,
                    "symbol": symbol,
                    "symbol_id": symbol_id,
                    "open": r.open,
                    "high": r.high,
                    "low": r.low,
                    "close": r.close,
                    "volume": r.volume,
                    "adj_close": r.adj_close,
                    "turnover": r.turnover,
                    "pe": r.pe,
                    "pb": r.pb,
                    "total_mv": r.total_mv,
                    "float_mv": r.float_mv,
                    "vwap": r.vwap,
                    "source": source,
                    "quality": 0,
                })

            # Build multi-row INSERT … ON CONFLICT in batches
            inserted = 0
            batch_size = 500
            for i in range(0, len(values), batch_size):
                batch = values[i:i + batch_size]
                # Generate numbered placeholders for each row
                row_placeholders = []
                params: dict = {}
                for j, v in enumerate(batch):
                    suffix = f"_{j}"
                    row_placeholders.append(
                        f"(:time{suffix}, :symbol{suffix}, :symbol_id{suffix}, "
                        f":open{suffix}, :high{suffix}, :low{suffix}, :close{suffix}, "
                        f":volume{suffix}, :adj_close{suffix}, :turnover{suffix}, "
                        f":pe{suffix}, :pb{suffix}, :total_mv{suffix}, :float_mv{suffix}, :vwap{suffix}, "
                        f":source{suffix}, :quality{suffix})"
                    )
                    for k, val in v.items():
                        params[f"{k}{suffix}"] = val

                sql = text(
                    "INSERT INTO market_data.klines_daily "
                    "(time, symbol, symbol_id, open, high, low, close, "
                    "volume, adj_close, turnover, pe, pb, total_mv, float_mv, vwap, "
                    "source, quality) VALUES "
                    + ", ".join(row_placeholders)
                    + " ON CONFLICT (time, symbol) DO UPDATE SET "
                    "open = EXCLUDED.open, high = EXCLUDED.high, "
                    "low = EXCLUDED.low, close = EXCLUDED.close, "
                    "volume = EXCLUDED.volume, adj_close = EXCLUDED.adj_close, "
                    "turnover = EXCLUDED.turnover, "
                    "pe = COALESCE(EXCLUDED.pe, market_data.klines_daily.pe), "
                    "pb = COALESCE(EXCLUDED.pb, market_data.klines_daily.pb), "
                    "total_mv = COALESCE(EXCLUDED.total_mv, market_data.klines_daily.total_mv), "
                    "float_mv = COALESCE(EXCLUDED.float_mv, market_data.klines_daily.float_mv), "
                    "vwap = COALESCE(EXCLUDED.vwap, market_data.klines_daily.vwap), "
                    "source = EXCLUDED.source"
                )
                await session.execute(sql, params)
                inserted += len(batch)

            logger.info(f"Upserted {inserted} kline rows for {symbol}")
            return inserted, 0

    async def _update_enrichment_fields(
        self, symbol: str, rows: List[KlineRow],
    ) -> int:
        """Update only pe/pb/total_mv/float_mv/vwap for existing kline rows."""
        if not rows:
            return 0

        updated = 0
        async with db_manager.get_postgres_session() as session:
            batch_size = 500
            for i in range(0, len(rows), batch_size):
                batch = rows[i:i + batch_size]
                for j, r in enumerate(batch):
                    # Skip rows with no enrichment data
                    if r.pe is None and r.pb is None and r.total_mv is None:
                        continue

                    params = {
                        f"time_{j}": r.time,
                        f"symbol_{j}": symbol,
                        f"pe_{j}": r.pe,
                        f"pb_{j}": r.pb,
                        f"total_mv_{j}": r.total_mv,
                        f"float_mv_{j}": r.float_mv,
                        f"vwap_{j}": r.vwap,
                    }
                    sql = text(
                        f"UPDATE market_data.klines_daily SET "
                        f"pe = COALESCE(:pe_{j}, pe), "
                        f"pb = COALESCE(:pb_{j}, pb), "
                        f"total_mv = COALESCE(:total_mv_{j}, total_mv), "
                        f"float_mv = COALESCE(:float_mv_{j}, float_mv), "
                        f"vwap = COALESCE(:vwap_{j}, vwap) "
                        f"WHERE time = :time_{j} AND symbol = :symbol_{j}"
                    )
                    await session.execute(sql, params)
                    updated += 1

        return updated

    async def _get_active_symbols(
        self,
        asset_types: Optional[List[str]] = None,
        symbols: Optional[List[str]] = None,
    ) -> List[dict]:
        async with db_manager.get_postgres_session() as session:
            stmt = select(Symbol).where(Symbol.is_active.is_(True))
            if asset_types:
                stmt = stmt.where(Symbol.asset_type.in_(asset_types))
            if symbols:
                stmt = stmt.where(Symbol.symbol.in_(symbols))

            result = await session.execute(stmt)
            return [row.to_dict() for row in result.scalars().all()]

    async def _create_run_log(self, run_id: str, source: str, asset_type: str):
        async with db_manager.get_postgres_session() as session:
            run = IngestionRun(
                id=run_id,
                source=source,
                asset_type=asset_type,
            )
            session.add(run)

    async def _finalize_run_log(
        self,
        run_id: str,
        status: str,
        inserted: int,
        updated: int,
        failed: int,
    ):
        async with db_manager.get_postgres_session() as session:
            stmt = select(IngestionRun).where(IngestionRun.id == run_id)
            result = await session.execute(stmt)
            run = result.scalar_one_or_none()
            if run:
                run.finished_at = datetime.now(timezone.utc)
                run.records_inserted = inserted
                run.records_updated = updated
                run.records_failed = failed
                run.status = status

    async def get_recent_runs(self, limit: int = 20) -> List[dict]:
        async with db_manager.get_postgres_session() as session:
            stmt = (
                select(IngestionRun)
                .order_by(IngestionRun.started_at.desc())
                .limit(limit)
            )
            result = await session.execute(stmt)
            return [run.to_dict() for run in result.scalars().all()]


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------

_ingestion_service: Optional[IngestionService] = None


def get_ingestion_service() -> IngestionService:
    global _ingestion_service
    if _ingestion_service is None:
        _ingestion_service = IngestionService()
    return _ingestion_service
