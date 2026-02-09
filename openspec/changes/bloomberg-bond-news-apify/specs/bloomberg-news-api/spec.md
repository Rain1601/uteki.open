## ADDED Requirements

### Requirement: Bloomberg 最新新闻列表接口
系统 SHALL 提供 `GET /bloomberg/latest` 端点，返回最新的 Bloomberg 新闻列表。

#### Scenario: 获取最新新闻
- **WHEN** 请求 `GET /bloomberg/latest?limit=10`
- **THEN** 返回按 `published_at` 降序排列的最多 10 篇 Bloomberg 新闻，响应格式为 `{"success": true, "data": [...], "total_count": N}`

#### Scenario: limit 参数校验
- **WHEN** 请求 `GET /bloomberg/latest?limit=200`
- **THEN** 返回 422 错误，limit 参数范围 SHALL 为 1-100

### Requirement: Bloomberg 月度新闻接口
系统 SHALL 提供 `GET /bloomberg/monthly/{year}/{month}` 端点，返回指定月份的 Bloomberg 新闻（按日期分组）。

#### Scenario: 获取月度新闻
- **WHEN** 请求 `GET /bloomberg/monthly/2026/2`
- **THEN** 返回该月份的新闻，按日期分组为 `{"2026-02-01": [...], "2026-02-02": [...]}`

#### Scenario: 支持分类筛选
- **WHEN** 请求 `GET /bloomberg/monthly/2026/2?category=important`
- **THEN** 仅返回标记为重要的 Bloomberg 新闻

### Requirement: Bloomberg 文章详情接口
系统 SHALL 提供 `GET /bloomberg/article/{article_id}` 端点，返回单篇文章的完整信息。

#### Scenario: 获取文章详情
- **WHEN** 请求 `GET /bloomberg/article/{article_id}` 且文章存在
- **THEN** 返回 `{"success": true, "data": {...}}` 包含文章全部字段

#### Scenario: 文章不存在
- **WHEN** 请求 `GET /bloomberg/article/{article_id}` 且文章不存在
- **THEN** 返回 404 错误

### Requirement: 手动触发抓取接口
系统 SHALL 提供 `POST /bloomberg/scrape` 端点，手动触发 Bloomberg 新闻抓取。

#### Scenario: 手动触发抓取
- **WHEN** 请求 `POST /bloomberg/scrape?max_news=10`
- **THEN** 执行完整的两阶段抓取流程，返回 `{"success": true, "new_urls_found": N, "new_articles_saved": M, "duration": S}`

#### Scenario: 自定义分类页 URL
- **WHEN** 请求 `POST /bloomberg/scrape` 并在 body 中传入 `category_urls` 列表
- **THEN** 使用传入的 URL 替代默认分类页进行抓取

### Requirement: Bloomberg 翻译和标注接口
系统 SHALL 复用现有翻译/标注端点模式，提供 Bloomberg 文章的翻译和标注接口。

#### Scenario: 批量翻译 Bloomberg 文章
- **WHEN** 请求 `POST /bloomberg/translate?limit=10&provider=deepseek`
- **THEN** 对 source 为 "bloomberg" 且 translation_status 不为 "completed" 的文章执行翻译和标注

#### Scenario: 单篇翻译
- **WHEN** 请求 `POST /bloomberg/article/{article_id}/translate`
- **THEN** 对指定文章执行翻译和标注，返回翻译结果
