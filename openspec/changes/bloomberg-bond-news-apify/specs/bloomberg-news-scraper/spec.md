## ADDED Requirements

### Requirement: Apify Category Scraper 获取文章列表
系统 SHALL 通过 Apify `piotrv1001/bloomberg-category-news-scraper` Actor 从 Bloomberg 分类页获取新闻文章列表。默认分类页为 `https://www.bloomberg.com/fixed-income` 和 `https://www.bloomberg.com/markets/rates-bonds`。每次抓取 SHALL 返回文章的标题、URL、作者、发布日期。

#### Scenario: 成功获取文章列表
- **WHEN** 调用 Category Scraper 并传入分类页 URL 和 maxItemsPerUrl 参数
- **THEN** 返回文章列表，每篇文章包含 title、url、author、published_at 字段

#### Scenario: 分类页 URL 可自定义
- **WHEN** 调用时传入自定义的 Bloomberg 分类页 URL 列表
- **THEN** 系统 SHALL 使用传入的 URL 替代默认分类页进行抓取

#### Scenario: Apify Actor 调用失败
- **WHEN** Apify Actor 运行失败或超时（超过 120 秒）
- **THEN** 系统 SHALL 记录错误日志并返回空列表，不抛出异常

### Requirement: Apify News Scraper 获取文章全文
系统 SHALL 通过 Apify `romy/bloomberg-news-scraper` Actor 获取单篇 Bloomberg 文章的全文内容（绕过 paywall）。

#### Scenario: 成功获取全文
- **WHEN** 传入一篇 Bloomberg 文章 URL
- **THEN** 返回文章全文内容、标题、作者、发布日期

#### Scenario: 全文抓取失败降级
- **WHEN** News Scraper 无法获取某篇文章全文（paywall 未绕过或 Actor 失败）
- **THEN** 系统 SHALL 保存已有的标题/URL/作者/日期，`is_full_content` 设为 `False`

### Requirement: 两阶段抓取编排
系统 SHALL 实现两阶段抓取流程：先用 Category Scraper 获取文章列表，与数据库去重后，再用 News Scraper 逐篇获取新文章全文。

#### Scenario: 完整抓取流程
- **WHEN** 触发 Bloomberg 新闻抓取
- **THEN** 系统先调用 Category Scraper 获取文章列表，过滤掉数据库中已存在的 URL，再对新 URL 逐篇调用 News Scraper 获取全文

#### Scenario: 无新文章时跳过全文抓取
- **WHEN** Category Scraper 返回的所有文章 URL 在数据库中均已存在
- **THEN** 系统 SHALL 跳过 News Scraper 调用，返回 `new_articles_saved: 0`

### Requirement: 文章数据写入 news_articles 表
系统 SHALL 将 Bloomberg 文章写入现有 `news_articles` 表。`source` 字段 SHALL 设为 `"bloomberg"`。文章 ID SHALL 使用 URL 的 MD5 哈希值。

#### Scenario: 新文章入库
- **WHEN** 抓取到一篇新的 Bloomberg 文章
- **THEN** 创建 NewsArticle 记录，`source="bloomberg"`，`category="fixed_income"`，`is_full_content=True`（如有全文），`scraped_at` 设为当前时间

#### Scenario: 重复文章去重
- **WHEN** 抓取到的文章 URL 在数据库中已存在
- **THEN** 系统 SHALL 跳过该文章，不创建重复记录

### Requirement: Apify 客户端配置
系统 SHALL 使用 `ApifyClientAsync` 异步客户端，API Token 从环境变量 `APIFY_API_TOKEN` 读取。

#### Scenario: Token 未配置
- **WHEN** `APIFY_API_TOKEN` 环境变量未设置
- **THEN** 服务初始化时 SHALL 记录警告日志，抓取调用时返回错误提示

#### Scenario: 正常初始化
- **WHEN** `APIFY_API_TOKEN` 环境变量已设置
- **THEN** 系统 SHALL 创建 `ApifyClientAsync` 实例用于后续 Actor 调用

### Requirement: 定时抓取调度
系统 SHALL 注册定时任务，每 2 小时自动触发一次 Bloomberg 新闻抓取。

#### Scenario: 定时任务执行
- **WHEN** 定时任务触发
- **THEN** 系统 SHALL 执行完整的两阶段抓取流程，并记录抓取结果日志

#### Scenario: 定时任务失败不阻塞
- **WHEN** 定时抓取过程中发生错误
- **THEN** 系统 SHALL 记录错误日志，不影响下次定时任务的执行
