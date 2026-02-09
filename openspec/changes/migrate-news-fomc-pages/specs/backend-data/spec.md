# Backend Data Models Spec

后端数据模型规格说明

## ADDED Requirements

### Requirement: NewsArticle 数据模型

系统 SHALL 提供 NewsArticle 数据模型用于存储新闻文章。

#### Scenario: 存储新闻文章
- **WHEN** 系统抓取到新闻文章
- **THEN** 系统将文章存储到 news_articles 表，包含以下字段：
  - id (主键, 来源文章ID)
  - source (来源名称)
  - headline (标题)
  - title_zh (中文标题，可选)
  - content (内容)
  - content_zh (中文内容，可选)
  - summary (摘要)
  - publish_time (发布时间)
  - tags (标签数组, JSON)
  - important (是否重要)
  - ai_analysis_status (AI分析状态: pending/completed/failed)
  - ai_analysis (AI分析内容)
  - ai_impact (AI影响评估: positive/negative/neutral)
  - created_at, updated_at (时间戳)

#### Scenario: 查询月度新闻
- **WHEN** 系统按年月查询新闻
- **THEN** 返回该月所有新闻，按 publish_time 降序排列

### Requirement: EconomicEvent 数据模型

系统 SHALL 提供 EconomicEvent 数据模型用于存储经济事件。

#### Scenario: 存储经济事件
- **WHEN** 系统获取经济日历数据
- **THEN** 系统将事件存储到 economic_events 表，包含以下字段：
  - id (主键)
  - title (事件标题)
  - start_date (开始日期)
  - end_date (结束日期，可选)
  - event_type (事件类型: fomc/earnings/economic_data/employment/inflation/consumption/gdp)
  - description (描述)
  - importance (重要性: critical/high/medium/low)
  - status (状态: upcoming/ongoing/past)
  - has_press_conference (FOMC: 是否有新闻发布会)
  - has_economic_projections (FOMC: 是否有经济预测)
  - quarter (季度信息)
  - actual_value (实际值)
  - forecast_value (预测值)
  - previous_value (前值)
  - created_at, updated_at (时间戳)

#### Scenario: 查询月度事件
- **WHEN** 系统按年月查询经济事件
- **THEN** 返回该月所有事件，按 start_date 排序

### Requirement: 数据库迁移

系统 SHALL 提供 Alembic 迁移脚本创建数据表。

#### Scenario: 执行数据库迁移
- **WHEN** 运行 alembic upgrade head
- **THEN** 系统创建 news_articles 和 economic_events 表
