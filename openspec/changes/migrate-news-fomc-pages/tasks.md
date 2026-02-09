## 1. 后端数据模型

- [x] 1.1 创建 NewsArticle 数据模型 (backend/uteki/domains/news/models/news_article.py)
- [x] 1.2 创建 EconomicEvent 数据模型 (backend/uteki/domains/macro/models/economic_event.py)
- [x] 1.3 创建 Alembic 迁移脚本
- [x] 1.4 执行数据库迁移，验证表结构

## 2. 后端服务层

- [x] 2.1 创建 JeffCoxService (新闻抓取服务)
  - CNBC RSS/GraphQL 抓取
  - 文章解析和去重
  - 重要新闻标记
- [x] 2.2 创建 FMPCalendarService (经济日历服务)
  - FOMC 会议日程
  - FMP API 经济数据获取
  - 数据增强和合并
- [x] 2.3 创建 NewsAnalysisAgent (AI 分析服务)
  - 新闻流式分析
  - 事件流式分析
  - 分析结果预加载

## 3. 后端 API 层

- [x] 3.1 创建新闻 API (backend/uteki/domains/news/api.py)
  - GET /api/news/jeff-cox/monthly/{year}/{month}
  - GET /api/news/jeff-cox/article/{id}
  - GET /api/news/jeff-cox/latest
  - POST /api/news/jeff-cox/scrape
- [x] 3.2 创建经济日历 API (backend/uteki/domains/macro/api.py)
  - GET /api/economic-calendar/events/monthly/{year}/{month}/enriched
  - GET /api/economic-calendar/statistics
- [x] 3.3 创建 AI 分析 API (backend/uteki/domains/news/analysis_api.py)
  - POST /api/news-analysis/analyze-news-stream (SSE)
  - POST /api/news-analysis/analyze-event-stream (SSE)
- [x] 3.4 注册路由到 FastAPI 应用

## 4. 后端调度任务

- [x] 4.1 创建新闻调度任务 (backend/uteki/schedulers/news_scheduler.py)
  - 定时抓取 (每 30 分钟)
  - 启动时抓取
  - 错误处理和日志

## 5. 前端基础设施

- [x] 5.1 创建 TypeScript 类型定义文件 (types/news.ts, types/economicCalendar.ts)
- [x] 5.2 创建 news API 模块 (api/news.ts)
- [x] 5.3 创建 economicCalendar API 模块 (api/economicCalendar.ts)

## 6. News Timeline 前端页面

- [x] 6.1 创建 NewsTimelinePage.tsx 基础结构和布局
- [x] 6.2 实现日历面板组件 (年月选择、日历网格、日期高亮)
- [x] 6.3 实现新闻标题列表组件
- [x] 6.4 实现新闻列表面板 (按日期分组、新闻卡片)
- [x] 6.5 实现无限滚动加载逻辑 (滚动到顶部/底部加载相邻月份)
- [x] 6.6 实现日期点击与新闻列表联动
- [x] 6.7 实现新闻筛选功能 (全部/重要/加密货币/股票/外汇)
- [x] 6.8 实现 AI 新闻解读功能 (流式输出)
- [x] 6.9 创建 ArticleDetailDialog 组件 (文章详情对话框)
- [x] 6.10 适配主题系统 (所有颜色使用 theme 变量)

## 7. FOMC Calendar 前端页面

- [x] 7.1 创建 FOMCCalendar.tsx 基础结构和布局
- [x] 7.2 实现经济日历面板组件 (月度日历、日期高亮)
- [x] 7.3 实现事件列表组件
- [x] 7.4 实现时间线面板 (按日期分组、事件卡片)
- [x] 7.5 实现事件类型筛选功能 (全部/FOMC/就业/通胀/消费&GDP)
- [x] 7.6 实现统计信息卡片显示
- [x] 7.7 实现日期点击与时间线联动
- [x] 7.8 实现经济数据详情显示 (actual/forecast/previous)
- [x] 7.9 实现 AI 事件解读功能 (流式输出、超时处理)
- [x] 7.10 适配主题系统 (所有颜色使用 theme 变量)

## 8. 路由和导航

- [x] 8.1 在 App.tsx 添加 /news-timeline 路由
- [x] 8.2 在 App.tsx 添加 /macro/fomc-calendar 路由
- [x] 8.3 在 HoverSidebar.tsx 添加"新闻时间线"菜单项
- [x] 8.4 在 HoverSidebar.tsx 添加"经济日历"菜单项 (在 TRADING 分类下)

## 9. 验证和测试

- [ ] 9.1 验证后端 API 基本功能 (新闻列表、文章详情)
- [ ] 9.2 验证后端 AI 分析流式输出
- [ ] 9.3 验证经济日历 API (事件列表、FMP 数据增强)
- [ ] 9.4 验证 News Timeline 页面基本功能 (日历、新闻列表、筛选)
- [ ] 9.5 验证 News Timeline AI 解读功能
- [ ] 9.6 验证 FOMC Calendar 页面基本功能 (日历、事件列表、筛选)
- [ ] 9.7 验证 FOMC Calendar AI 解读功能
- [ ] 9.8 验证深色/浅色主题切换
