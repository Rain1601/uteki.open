# Backend API Spec

后端 API 接口规格说明

## ADDED Requirements

### Requirement: 新闻 API

系统 SHALL 提供新闻相关的 RESTful API。

#### Scenario: 获取月度新闻
- **WHEN** 客户端请求 GET /api/news/jeff-cox/monthly/{year}/{month}
- **THEN** 系统返回该月所有新闻，按日期分组
- **格式**: `{ success: true, data: { "2024-01-15": [...], "2024-01-16": [...] } }`

#### Scenario: 获取月度新闻 - 分类筛选
- **WHEN** 客户端请求 GET /api/news/jeff-cox/monthly/{year}/{month}?category=crypto
- **THEN** 系统返回该月符合分类条件的新闻

#### Scenario: 获取文章详情
- **WHEN** 客户端请求 GET /api/news/jeff-cox/article/{article_id}
- **THEN** 系统返回文章完整内容，包含 content 和 content_zh

#### Scenario: 获取最新新闻
- **WHEN** 客户端请求 GET /api/news/jeff-cox/latest?limit=10
- **THEN** 系统返回最新的 N 条新闻

#### Scenario: 手动触发抓取
- **WHEN** 客户端请求 POST /api/news/jeff-cox/scrape
- **THEN** 系统触发新闻抓取任务，返回抓取结果

### Requirement: 经济日历 API

系统 SHALL 提供经济日历相关的 RESTful API。

#### Scenario: 获取月度事件（含 FMP 数据增强）
- **WHEN** 客户端请求 GET /api/economic-calendar/events/monthly/{year}/{month}/enriched
- **THEN** 系统返回该月所有事件，按日期分组，包含 FMP 数据增强
- **格式**: `{ success: true, data: { "2024-01-15": [...] }, fmp_status: "success" }`

#### Scenario: 获取月度事件 - 类型筛选
- **WHEN** 客户端请求 GET /api/economic-calendar/events/monthly/{year}/{month}/enriched?event_type=fomc
- **THEN** 系统返回该月符合类型条件的事件

#### Scenario: 获取统计数据
- **WHEN** 客户端请求 GET /api/economic-calendar/statistics
- **THEN** 系统返回事件统计信息
- **格式**: `{ success: true, data: { total: 100, by_type: { fomc: 8, employment: 24, ... } } }`

### Requirement: AI 分析 API

系统 SHALL 提供 AI 分析相关的流式 API。

#### Scenario: 新闻 AI 分析 (流式)
- **WHEN** 客户端请求 POST /api/news-analysis/analyze-news-stream
- **BODY**: `{ news_id: string, headline: string, summary?: string }`
- **THEN** 系统返回 SSE 流式响应，逐步输出分析内容
- **事件格式**: `data: { content: "分析文本...", done: false }`
- **完成格式**: `data: { done: true, impact: "positive", analysis: "完整分析" }`

#### Scenario: 事件 AI 分析 (流式)
- **WHEN** 客户端请求 POST /api/news-analysis/analyze-event-stream
- **BODY**: `{ event: EconomicEvent }`
- **THEN** 系统返回 SSE 流式响应，逐步输出分析内容

#### Scenario: 分析超时处理
- **WHEN** AI 分析超过 150 秒无响应
- **THEN** 系统返回超时错误: `data: { error: "Analysis timeout" }`

### Requirement: 路由注册

系统 SHALL 将新 API 路由注册到 FastAPI 应用。

#### Scenario: 注册路由
- **WHEN** 应用启动
- **THEN** 系统注册以下路由前缀:
  - /api/news/jeff-cox
  - /api/economic-calendar
  - /api/news-analysis
