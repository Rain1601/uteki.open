#!/usr/bin/env python
"""从 uchu_trade 项目迁移 Jeff Cox 新闻数据到 uteki.open

用法:
    python scripts/migrate_news_from_uchu.py
"""

import asyncio
import sqlite3
import logging
import sys
from pathlib import Path
from datetime import datetime

# 添加项目根目录到 path
sys.path.insert(0, str(Path(__file__).parent.parent))

from uteki.common.database import db_manager
from uteki.domains.news.models import NewsArticle
from sqlalchemy import select

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# 源数据库路径
SOURCE_DB = "/Users/rain/PycharmProjects/uchu_trade/backend/data_providers/news.db"


def parse_datetime(value):
    """解析日期时间字符串"""
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    try:
        # 尝试多种格式
        for fmt in [
            "%Y-%m-%d %H:%M:%S.%f",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%dT%H:%M:%S.%f",
            "%Y-%m-%dT%H:%M:%S",
        ]:
            try:
                return datetime.strptime(value, fmt)
            except ValueError:
                continue
        return None
    except Exception:
        return None


async def migrate_news():
    """迁移新闻数据"""
    # 连接源 SQLite 数据库
    logger.info(f"连接源数据库: {SOURCE_DB}")
    conn = sqlite3.connect(SOURCE_DB)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # 查询所有 Jeff Cox 文章
    cursor.execute("""
        SELECT * FROM news_articles
        WHERE source = 'cnbc_jeff_cox'
        ORDER BY published_at ASC
    """)
    rows = cursor.fetchall()
    logger.info(f"源数据库共 {len(rows)} 篇文章")

    # 初始化目标数据库
    await db_manager.initialize()

    migrated = 0
    skipped = 0
    failed = 0

    async with db_manager.get_postgres_session() as session:
        for row in rows:
            try:
                article_id = row["id"]
                url = row["url"]

                # 检查是否已存在
                stmt = select(NewsArticle).where(NewsArticle.url == url)
                result = await session.execute(stmt)
                existing = result.scalar_one_or_none()

                if existing:
                    skipped += 1
                    continue

                # 判断是否重要
                important_keywords = ['fed', 'powell', 'federal reserve', 'fomc', 'interest rate', 'inflation']
                title = row["title"] or ""
                title_lower = title.lower()
                is_important = any(kw in title_lower for kw in important_keywords)

                # 创建新文章
                new_article = NewsArticle(
                    id=article_id,
                    source=row["source"],
                    title=title,
                    content=row["content"] or "",
                    content_full=row["content_full"] or "",
                    summary_keypoints=row["summary_keypoints"] or "",
                    url=url,
                    author=row["author"] or "Jeff Cox",
                    published_at=parse_datetime(row["published_at"]),
                    category=row["category"] or "finance",
                    keywords=row["keywords"] or "Jeff Cox,CNBC,经济",
                    tags=["finance", "economy"],
                    is_full_content=bool(row["is_full_content"]),
                    scraped_at=parse_datetime(row["scraped_at"]),
                    summary=row["summary"],
                    # 翻译字段
                    title_zh=row["title_zh"],
                    content_zh=row["content_zh"],
                    content_full_zh=row["content_full_zh"],
                    summary_keypoints_zh=row["summary_keypoints_zh"],
                    translation_status=row["translation_status"] or "pending",
                    translated_at=parse_datetime(row["translated_at"]),
                    translation_model=row["translation_model"],
                    # AI 分析字段
                    ai_analysis=row["ai_analysis"],
                    ai_impact=row["ai_impact"],
                    ai_analysis_status=row["ai_analysis_status"] or "pending",
                    ai_analyzed_at=parse_datetime(row["ai_analyzed_at"]),
                    ai_analysis_model=row["ai_analysis_model"],
                    # 反馈字段
                    ai_feedback_like_count=int(row["ai_feedback_like_count"] or 0),
                    ai_feedback_dislike_count=int(row["ai_feedback_dislike_count"] or 0),
                    ai_feedback_updated_at=parse_datetime(row["ai_feedback_updated_at"]),
                    # 重要性
                    important=is_important,
                )

                session.add(new_article)
                migrated += 1

                if migrated % 50 == 0:
                    await session.commit()
                    logger.info(f"已迁移 {migrated} 篇...")

            except Exception as e:
                logger.error(f"迁移文章失败 {row['id']}: {e}")
                failed += 1
                continue

        # 提交剩余
        await session.commit()

    conn.close()
    await db_manager.close()

    logger.info(f"迁移完成: 成功 {migrated}, 跳过 {skipped}, 失败 {failed}")
    return {"migrated": migrated, "skipped": skipped, "failed": failed}


if __name__ == "__main__":
    asyncio.run(migrate_news())
