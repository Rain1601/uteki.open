## 1. 依赖与配置

- [x] 1.1 在 `backend/requirements.txt`（或 pyproject.toml）中添加 `apify-client` 依赖
- [x] 1.2 在环境变量配置中添加 `APIFY_API_TOKEN`，更新 `.env.example`

## 2. Apify 客户端封装

- [x] 2.1 创建 `backend/uteki/domains/news/services/bloomberg_apify.py`，封装 `ApifyClientAsync` 初始化（从 `APIFY_API_TOKEN` 读取 token）
- [x] 2.2 实现 `fetch_category_articles(category_urls, max_items_per_url)` 方法，调用 `piotrv1001/bloomberg-category-news-scraper` Actor，返回文章列表（title, url, author, published_at）
- [x] 2.3 实现 `fetch_article_full_text(article_url)` 方法，调用 `romy/bloomberg-news-scraper` Actor，返回文章全文内容
- [x] 2.4 添加超时处理（120s）和错误日志，Actor 调用失败时返回空结果不抛异常

## 3. Bloomberg 编排服务

- [x] 3.1 创建 `backend/uteki/domains/news/services/bloomberg_service.py`，实现 `BloombergService` 类和 `get_bloomberg_service()` 全局单例
- [x] 3.2 实现 `collect_and_enrich(session, max_news, category_urls)` 方法：调用 Category Scraper → 数据库 URL 去重 → 调用 News Scraper 获取全文 → 写入 news_articles 表（source="bloomberg"）
- [x] 3.3 实现全文抓取降级逻辑：News Scraper 失败时保存已有元数据，`is_full_content=False`
- [x] 3.4 实现 `get_articles(session, limit, offset, start_date, end_date, category)` 查询方法，过滤 source="bloomberg"
- [x] 3.5 实现 `get_monthly_news(session, year, month, category)` 和 `get_article_by_id(session, article_id)` 方法
- [x] 3.6 在 `services/__init__.py` 中导出 `BloombergService` 和 `get_bloomberg_service`

## 4. API 端点

- [x] 4.1 创建 `backend/uteki/domains/news/bloomberg_api.py`，添加 `GET /bloomberg/latest` 端点
- [x] 4.2 添加 `GET /bloomberg/monthly/{year}/{month}` 端点（支持 category 查询参数）
- [x] 4.3 添加 `GET /bloomberg/article/{article_id}` 端点
- [x] 4.4 添加 `POST /bloomberg/scrape` 端点（支持 max_news 参数和可选的 category_urls body）
- [x] 4.5 添加 `POST /bloomberg/translate` 和 `POST /bloomberg/article/{article_id}/translate` 端点，复用 translation_service
- [x] 4.6 在主路由中注册 Bloomberg API router

## 5. 定时任务

- [x] 5.1 在 scheduler_service 中注册 Bloomberg 新闻定时抓取任务，每 2 小时执行一次
- [x] 5.2 定时任务中加入错误处理，失败不阻塞后续执行

## 6. 测试验证

- [ ] 6.1 手动调用 `POST /bloomberg/scrape` 验证完整抓取流程
- [ ] 6.2 验证文章数据正确写入 news_articles 表（source="bloomberg"，content_full 有值）
- [ ] 6.3 验证 `POST /bloomberg/translate` 能正确翻译 Bloomberg 文章
- [ ] 6.4 验证定时任务正常注册和执行
