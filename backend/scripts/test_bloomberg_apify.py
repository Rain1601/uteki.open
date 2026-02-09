"""测试 Bloomberg Apify 抓取 - news + bond 两个部分"""

import asyncio
import os
import sys
import json
from pathlib import Path

# 加载 .env
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

# 添加项目路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from uteki.domains.news.services.bloomberg_apify import BloombergApifyClient


async def test_ddg_search():
    """测试 DuckDuckGo 搜索 Bloomberg 文章"""
    client = BloombergApifyClient()

    print("=" * 60)
    print("阶段 1: DuckDuckGo 搜索 Bloomberg 文章")
    print("=" * 60)

    # 测试 news 搜索
    news_queries = [
        "bloomberg markets news today",
        "bloomberg economy news",
    ]
    print(f"\n--- News 搜索 (queries: {news_queries}) ---")
    news_articles = await client.fetch_category_articles(
        search_queries=news_queries,
        max_items_per_url=5,
    )
    print(f"找到 {len(news_articles)} 篇 News 文章:")
    for i, a in enumerate(news_articles, 1):
        print(f"  {i}. [{a.get('published_at', 'N/A')}] {a['title'][:80]}")
        print(f"     URL: {a['url']}")

    # 测试 bond 搜索
    bond_queries = [
        "bloomberg corporate bond fixed income",
        "bloomberg credit market bonds yield",
    ]
    print(f"\n--- Bond 搜索 (queries: {bond_queries}) ---")
    bond_articles = await client.fetch_category_articles(
        search_queries=bond_queries,
        max_items_per_url=5,
    )
    print(f"找到 {len(bond_articles)} 篇 Bond 文章:")
    for i, a in enumerate(bond_articles, 1):
        print(f"  {i}. [{a.get('published_at', 'N/A')}] {a['title'][:80]}")
        print(f"     URL: {a['url']}")

    return news_articles, bond_articles


async def test_apify_fulltext(articles):
    """测试 Apify News Scraper 获取全文"""
    token = os.getenv("APIFY_API_TOKEN", "")
    if not token:
        print("\n⚠️  APIFY_API_TOKEN 未设置，跳过全文抓取测试")
        return

    client = BloombergApifyClient()

    print("\n" + "=" * 60)
    print("阶段 2: Apify News Scraper 获取全文")
    print("=" * 60)

    # 只取第一篇测试
    if not articles:
        print("没有可用的文章 URL，跳过全文测试")
        return

    test_article = articles[0]
    url = test_article["url"]
    print(f"\n测试文章: {test_article['title'][:80]}")
    print(f"URL: {url}")
    print("正在调用 Apify News Scraper...")

    result = await client.fetch_article_full_text(url)

    if result:
        print(f"\n✅ 全文获取成功!")
        print(f"  标题: {result.get('title', 'N/A')}")
        print(f"  作者: {result.get('author', 'N/A')}")
        print(f"  发布时间: {result.get('published_at', 'N/A')}")
        print(f"  分类: {result.get('category', 'N/A')}")
        print(f"  字数: {result.get('word_count', 'N/A')}")
        print(f"  摘要: {(result.get('summary', '') or '')[:200]}")
        content = result.get("content_full", "")
        print(f"  全文长度: {len(content)} 字符")
        if content:
            print(f"  全文前 500 字符:\n{'─' * 40}")
            print(content[:500])
            print(f"{'─' * 40}")
    else:
        print("❌ 全文获取失败")


async def main():
    print("Bloomberg Apify 抓取测试")
    print(f"APIFY_API_TOKEN: {'已设置' if os.getenv('APIFY_API_TOKEN') else '未设置'}")
    print()

    # 测试 DuckDuckGo 搜索
    news_articles, bond_articles = await test_ddg_search()

    # 合并所有文章取一篇测试全文
    all_articles = news_articles + bond_articles
    await test_apify_fulltext(all_articles)

    print("\n✅ 测试完成")


if __name__ == "__main__":
    asyncio.run(main())
