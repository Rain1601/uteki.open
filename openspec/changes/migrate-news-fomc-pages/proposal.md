## Why

将原项目 uchu_trade 的两个核心功能模块 (News Timeline 和 FOMC Calendar) 完整迁移到 uteki.open，包括后端数据模型、API、调度任务和前端页面。这是金融数据平台的核心功能，涵盖新闻抓取、经济数据聚合和 AI 分析能力。

## What Changes

### 后端数据模型
- 迁移 NewsArticle 数据模型 (SQLAlchemy)
- 迁移 EconomicEvent 数据模型 (SQLAlchemy)
- 创建数据库迁移脚本 (Alembic)

### 后端 API 控制器
- 迁移 jeff_cox_controller (新闻 API)
  - GET /api/news/jeff-cox/monthly/{year}/{month} - 月度新闻
  - GET /api/news/jeff-cox/article/{id} - 文章详情
  - GET /api/news/jeff-cox/latest - 最新新闻
  - POST /api/news/jeff-cox/scrape - 手动触发抓取
- 迁移 economic_calendar_controller (经济日历 API)
  - GET /api/economic-calendar/events/monthly/{year}/{month}/enriched - 月度事件
  - GET /api/economic-calendar/statistics - 统计数据
- 迁移 news_analysis_controller (AI 分析 API)
  - POST /api/news-analysis/analyze-news-stream - 新闻 AI 分析 (SSE)
  - POST /api/news-analysis/analyze-event-stream - 事件 AI 分析 (SSE)

### 后端服务层
- 迁移 jeff_cox_service (CNBC Jeff Cox 新闻抓取)
- 迁移 fmp_economic_calendar_service (FMP 经济日历数据)
- 迁移 news_analysis_agent (AI 分析 Agent)

### 调度任务
- 迁移 news_scheduler (新闻定时抓取)
- 迁移 jeff_cox_monitor_task (Jeff Cox 监控任务)

### 前端页面
- 迁移 NewsTimelinePage 组件到 uteki.open
  - 日历面板：月度新闻浏览、日期选择、新闻标题列表
  - 新闻列表面板：按日期分组展示新闻、无限滚动加载
  - AI 解读功能：流式输出新闻分析
  - 文章详情对话框
- 迁移 FOMCCalendar 组件到 uteki.open
  - 经济日历面板：日历视图、事件列表
  - 时间线面板：按日期分组展示事件、数据展示 (actual/forecast/previous)
  - AI 解读功能：经济事件分析
  - 筛选功能：FOMC会议、就业数据、通胀数据、消费&GDP
- **BREAKING**: 从 makeStyles (Material-UI v4) 迁移到 MUI v5 sx prop 样式
- 适配 uteki.open 主题系统
- 添加路由配置 (/news-timeline, /macro/fomc-calendar)

## Capabilities

### New Capabilities
- `news-scraping`: CNBC Jeff Cox 新闻抓取和存储
- `economic-calendar`: FMP 经济日历数据聚合
- `news-analysis`: AI 驱动的新闻和事件分析
- `news-timeline`: 财经新闻时间线页面，包含日历视图、新闻列表、AI解读功能
- `fomc-calendar`: 宏观经济日历页面，包含FOMC会议、经济数据发布时间线

### Modified Capabilities
(无，这是新功能迁移)

## Impact

- **数据库**:
  - 新增 `news_articles` 表
  - 新增 `economic_events` 表

- **后端模型**:
  - 新增 `backend/uteki/domains/news/models/news_article.py`
  - 新增 `backend/uteki/domains/macro/models/economic_event.py`

- **后端 API**:
  - 新增 `backend/uteki/domains/news/api.py` (新闻 API)
  - 新增 `backend/uteki/domains/macro/api.py` (经济日历 API)
  - 新增 `backend/uteki/domains/news/analysis_api.py` (AI 分析 API)

- **后端服务**:
  - 新增 `backend/uteki/domains/news/services/jeff_cox_service.py`
  - 新增 `backend/uteki/domains/macro/services/fmp_calendar_service.py`
  - 新增 `backend/uteki/domains/news/services/news_analysis_agent.py`

- **调度任务**:
  - 新增 `backend/uteki/schedulers/news_scheduler.py`

- **前端组件**:
  - 新增 `frontend/src/pages/NewsTimelinePage.tsx`
  - 新增 `frontend/src/pages/macro/FOMCCalendar.tsx`
  - 新增 `frontend/src/components/ArticleDetailDialog.tsx`
  - 新增 `frontend/src/api/news.ts`
  - 新增 `frontend/src/api/economicCalendar.ts`
  - 修改 `frontend/src/App.tsx` (添加路由)
  - 修改 `frontend/src/components/HoverSidebar.tsx` (添加菜单项)

- **技术升级**:
  - Material-UI v4 makeStyles → MUI v5 sx prop
  - 硬编码颜色 → theme.background/border/text 变量
