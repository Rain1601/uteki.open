"""Bloomberg 新闻抓取客户端 - DuckDuckGo 搜索文章列表 + Apify 获取全文"""

import os
import logging
from datetime import datetime
from typing import List, Dict, Optional

from ddgs import DDGS

logger = logging.getLogger(__name__)

# DuckDuckGo 搜索关键词（用于发现 Bloomberg 文章）
DEFAULT_SEARCH_QUERIES = [
    "bloomberg corporate bond fixed income",
    "bloomberg credit market bonds",
]

# Apify Actor ID
NEWS_SCRAPER_ACTOR = "romy/bloomberg-news-scraper"

# Actor 调用超时（秒）
ACTOR_TIMEOUT_SECS = 120


class BloombergApifyClient:
    """Bloomberg 新闻抓取客户端

    阶段 1: 通过 DuckDuckGo News 搜索发现 Bloomberg 文章 URL（免费）
    阶段 2: 通过 Apify News Scraper 获取文章全文（绕过 paywall）
    """

    def __init__(self):
        self._token = os.getenv("APIFY_API_TOKEN", "")
        self._client = None

        if not self._token:
            logger.warning("APIFY_API_TOKEN 未设置，Bloomberg 全文抓取将不可用")

    def _get_client(self):
        """延迟初始化 Apify 异步客户端"""
        if self._client is None:
            if not self._token:
                raise ValueError("APIFY_API_TOKEN 未设置")
            from apify_client import ApifyClientAsync
            self._client = ApifyClientAsync(self._token)
        return self._client

    async def fetch_category_articles(
        self,
        search_queries: Optional[List[str]] = None,
        max_items_per_url: int = 20,
    ) -> List[Dict]:
        """
        通过 DuckDuckGo News 搜索获取 Bloomberg 文章列表

        Args:
            search_queries: 搜索关键词列表，None 则使用默认值
            max_items_per_url: 每个查询最多返回的文章数

        Returns:
            文章列表 [{"title": ..., "url": ..., "author": ..., "published_at": ...}, ...]
        """
        queries = search_queries or DEFAULT_SEARCH_QUERIES

        try:
            articles = []
            seen_urls = set()
            ddgs = DDGS()

            for query in queries:
                try:
                    logger.info(f"DuckDuckGo 搜索: {query}")
                    results = ddgs.news(
                        query,
                        region="us-en",
                        max_results=max_items_per_url,
                    )

                    for r in results:
                        url = r.get("url", "")
                        # 只保留 Bloomberg 文章链接
                        if "bloomberg.com/news/articles/" not in url:
                            continue
                        if url in seen_urls:
                            continue
                        seen_urls.add(url)

                        articles.append({
                            "title": r.get("title", ""),
                            "url": url,
                            "author": r.get("source", "Bloomberg"),
                            "published_at": self._parse_date(r.get("date")),
                        })

                except Exception as e:
                    logger.error(f"DuckDuckGo 搜索失败 ({query}): {e}", exc_info=True)
                    continue

            logger.info(f"DuckDuckGo 搜索共发现 {len(articles)} 篇 Bloomberg 文章")
            return articles

        except Exception as e:
            logger.error(f"文章列表获取失败: {e}", exc_info=True)
            return []

    async def fetch_article_full_text(self, article_url: str) -> Optional[Dict]:
        """
        通过 Apify News Scraper 获取单篇文章全文

        Args:
            article_url: Bloomberg 文章 URL

        Returns:
            文章数据字典，失败返回 None
        """
        try:
            client = self._get_client()
            actor = client.actor(NEWS_SCRAPER_ACTOR)

            run_input = {
                "url": article_url,
            }

            logger.info(f"调用 News Scraper: {article_url}")
            run_result = await actor.call(
                run_input=run_input,
                timeout_secs=ACTOR_TIMEOUT_SECS,
            )

            if not run_result:
                logger.warning(f"News Scraper 返回空结果: {article_url}")
                return None

            dataset = client.dataset(run_result["defaultDatasetId"])
            items_result = await dataset.list_items()
            items = items_result.items if items_result else []

            if not items:
                logger.warning(f"News Scraper 未返回文章数据: {article_url}")
                return None

            item = items[0]

            # 从 components 中提取全文
            content_full = self._extract_content_from_components(item.get("components", []))

            # 解析发布时间（Unix timestamp）
            published_ts = item.get("published")
            published_at = None
            if published_ts and isinstance(published_ts, (int, float)):
                published_at = datetime.utcfromtimestamp(published_ts)
            else:
                published_at = self._parse_date(
                    item.get("publishedAt") or item.get("date")
                )

            return {
                "title": item.get("title", ""),
                "content_full": content_full,
                "author": item.get("byline") or item.get("author", ""),
                "published_at": published_at,
                "url": item.get("longURL") or article_url,
                "summary": item.get("summary") or "",
                "category": item.get("primaryCategory") or "",
                "word_count": item.get("wordCount") or 0,
            }

        except ValueError:
            logger.error("APIFY_API_TOKEN 未设置，无法调用 News Scraper")
            return None
        except Exception as e:
            logger.error(f"News Scraper 调用失败 ({article_url}): {e}", exc_info=True)
            return None

    @staticmethod
    def _extract_content_from_components(components: list) -> str:
        """从 Bloomberg API 返回的 components 中提取文章全文"""
        paragraphs = []
        for comp in components:
            if not isinstance(comp, dict):
                continue
            role = comp.get("role", "")
            if role in ("p", "li"):
                parts = comp.get("parts", [])
                text_parts = []
                for part in parts:
                    if isinstance(part, dict) and part.get("text"):
                        text_parts.append(part["text"])
                if text_parts:
                    paragraphs.append("".join(text_parts))
            elif role in ("h2", "h3"):
                parts = comp.get("parts", [])
                for part in parts:
                    if isinstance(part, dict) and part.get("text"):
                        paragraphs.append(part["text"])
        return "\n\n".join(paragraphs)

    @staticmethod
    def _parse_date(date_str: Optional[str]) -> Optional[datetime]:
        """解析日期字符串"""
        if not date_str:
            return None
        if isinstance(date_str, datetime):
            return date_str
        try:
            cleaned = date_str.replace("Z", "+00:00")
            if "+" in cleaned:
                cleaned = cleaned.split("+")[0]
            return datetime.fromisoformat(cleaned)
        except (ValueError, AttributeError):
            pass
        try:
            return datetime.strptime(date_str, "%Y-%m-%d")
        except (ValueError, AttributeError):
            logger.warning(f"无法解析日期: {date_str}")
            return None


# 全局单例
_bloomberg_apify_client: Optional[BloombergApifyClient] = None


def get_bloomberg_apify_client() -> BloombergApifyClient:
    global _bloomberg_apify_client
    if _bloomberg_apify_client is None:
        _bloomberg_apify_client = BloombergApifyClient()
    return _bloomberg_apify_client
