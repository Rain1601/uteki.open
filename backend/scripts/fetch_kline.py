#!/usr/bin/env python
"""K线数据获取脚本 — 从 FMP 拉取历史价格数据存入数据库

用法:
    python scripts/fetch_kline.py --symbol VOO           # 获取单个 symbol
    python scripts/fetch_kline.py --all                  # 获取全部 watchlist
    python scripts/fetch_kline.py --symbol VOO --years 3 # 指定年数
    python scripts/fetch_kline.py --all --validate       # 获取后验证数据连续性
"""

import argparse
import asyncio
import logging
import sys
from datetime import date, timedelta
from pathlib import Path

# 添加项目根目录到 path
sys.path.insert(0, str(Path(__file__).parent.parent))

from uteki.common.config import settings
from uteki.common.database import db_manager
from uteki.domains.index.services.data_service import get_data_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


async def fetch_symbol(symbol: str, years: int = 5, validate: bool = False):
    """获取单个 symbol 的历史数据"""
    data_service = get_data_service()

    async with db_manager.get_postgres_session() as session:
        from_date = (date.today() - timedelta(days=years * 365)).isoformat()

        logger.info(f"Fetching {symbol} from {from_date}...")
        count = await data_service.fetch_and_store_history(symbol, session, from_date=from_date)
        logger.info(f"✓ {symbol}: {count} new records")

        if validate:
            result = await data_service.validate_data_continuity(symbol, session)
            if result["is_valid"]:
                logger.info(f"  ✓ Data continuous: {result['first_date']} → {result['last_date']}")
            else:
                logger.warning(f"  ✗ Missing {len(result['missing_dates'])} trading days")
                for d in result["missing_dates"][:5]:
                    logger.warning(f"    - {d}")
                if len(result["missing_dates"]) > 5:
                    logger.warning(f"    ... and {len(result['missing_dates']) - 5} more")

        return count


async def fetch_all_watchlist(years: int = 5, validate: bool = False):
    """获取 watchlist 中所有 symbol 的历史数据"""
    data_service = get_data_service()

    async with db_manager.get_postgres_session() as session:
        # 获取 watchlist
        watchlist = await data_service.get_watchlist(session, active_only=True)

        if not watchlist:
            logger.warning("Watchlist is empty. Add symbols first or use --symbol.")
            return

        logger.info(f"Found {len(watchlist)} symbols in watchlist")

        total = 0
        for item in watchlist:
            symbol = item["symbol"]
            count = await fetch_symbol(symbol, years=years, validate=validate)
            total += count

        logger.info(f"Done. Total {total} new records across {len(watchlist)} symbols.")


async def main():
    parser = argparse.ArgumentParser(description="K线数据获取脚本")
    parser.add_argument("--symbol", "-s", help="单个 symbol (如 VOO)")
    parser.add_argument("--all", "-a", action="store_true", help="获取全部 watchlist")
    parser.add_argument("--years", "-y", type=int, default=5, help="历史年数 (默认 5)")
    parser.add_argument("--validate", "-v", action="store_true", help="获取后验证数据连续性")

    args = parser.parse_args()

    if not settings.fmp_api_key:
        logger.error("FMP_API_KEY not set. Please configure it in .env")
        sys.exit(1)

    if not args.symbol and not args.all:
        parser.print_help()
        sys.exit(1)

    # 初始化数据库连接
    await db_manager.initialize()

    try:
        if args.symbol:
            await fetch_symbol(args.symbol.upper(), years=args.years, validate=args.validate)
        elif args.all:
            await fetch_all_watchlist(years=args.years, validate=args.validate)
    finally:
        await db_manager.close()


if __name__ == "__main__":
    asyncio.run(main())
