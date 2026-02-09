# Backend Services Spec

后端服务和调度任务规格说明

## ADDED Requirements

### Requirement: Jeff Cox 新闻抓取服务

系统 SHALL 提供 JeffCoxService 用于抓取 CNBC Jeff Cox 新闻。

#### Scenario: 抓取新闻列表
- **WHEN** 系统调用抓取任务
- **THEN** 系统从 CNBC RSS/GraphQL 获取 Jeff Cox 最新文章
- **AND** 解析文章标题、摘要、发布时间、标签
- **AND** 存储到数据库（去重处理）

#### Scenario: 抓取文章详情
- **WHEN** 系统检测到新文章
- **THEN** 系统获取文章完整内容
- **AND** 调用翻译服务生成中文标题和内容

#### Scenario: 标记重要新闻
- **WHEN** 文章标签包含关键词 (fed, fomc, rate, inflation, economy)
- **THEN** 系统将文章标记为 important=true

### Requirement: FMP 经济日历服务

系统 SHALL 提供 FMPCalendarService 用于获取经济日历数据。

#### Scenario: 获取 FOMC 会议日程
- **WHEN** 系统查询 FOMC 会议
- **THEN** 系统从本地日程表获取 FOMC 会议信息
- **包含**: 会议日期、是否有新闻发布会、是否有经济预测

#### Scenario: 获取经济数据发布
- **WHEN** 系统查询经济数据
- **THEN** 系统从 FMP API 获取经济指标数据
- **包含**: CPI, PPI, NFP, GDP, 零售销售等
- **AND** 返回 actual, forecast, previous 值

#### Scenario: 数据增强
- **WHEN** 系统查询月度事件
- **THEN** 系统合并本地 FOMC 日程和 FMP 经济数据
- **AND** 按日期分组返回

### Requirement: 新闻分析 Agent

系统 SHALL 提供 NewsAnalysisAgent 用于 AI 分析新闻和事件。

#### Scenario: 流式分析新闻
- **WHEN** 用户请求分析某条新闻
- **THEN** 系统构造 prompt 发送给 LLM
- **AND** 以流式方式返回分析内容
- **分析内容**: 新闻摘要、市场影响、投资建议

#### Scenario: 流式分析事件
- **WHEN** 用户请求分析某个经济事件
- **THEN** 系统构造 prompt 发送给 LLM
- **AND** 以流式方式返回分析内容
- **分析内容**: 事件解读、市场影响评估

#### Scenario: 预加载分析
- **WHEN** 新闻抓取完成
- **THEN** 系统自动为重要新闻预生成 AI 分析
- **AND** 存储分析结果到数据库

### Requirement: 新闻调度任务

系统 SHALL 提供定时任务抓取新闻。

#### Scenario: 定时抓取
- **WHEN** 调度器触发（每 30 分钟）
- **THEN** 系统执行 JeffCoxService.scrape_latest()
- **AND** 记录抓取结果日志

#### Scenario: 启动时抓取
- **WHEN** 应用启动且配置启用自动抓取
- **THEN** 系统立即执行一次新闻抓取

#### Scenario: 错误重试
- **WHEN** 抓取失败
- **THEN** 系统记录错误日志
- **AND** 等待下一个调度周期重试
