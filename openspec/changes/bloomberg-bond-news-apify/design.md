## Context

现有新闻采集架构为 Jeff Cox 单数据源，采用两阶段模式：GraphQL 获取文章列表 → Web Scraper 抓取全文。数据存入 `news_articles` 表，后续由 translation_service 翻译/标注，news_analysis_service 做 AI 分析。

Bloomberg 的企业债券/固收新闻需要通过 Apify 第三方服务获取，因为 Bloomberg 有严格的反爬机制（robots.txt 禁止 python-requests，服务端 hard paywall）。Apify 提供两个 Actor：
- `piotrv1001/bloomberg-category-news-scraper`：从分类页获取文章列表（标题、URL、作者、日期）
- `romy/bloomberg-news-scraper`：获取单篇文章全文（绕过 paywall）

## Goals / Non-Goals

**Goals:**
- 通过 Apify 定期抓取 Bloomberg 固收/企业债券分类页的新闻列表
- 获取新文章的全文内容
- 数据写入现有 `news_articles` 表，复用翻译/标注/分析 pipeline
- 提供 Bloomberg 新闻的 REST API 端点
- 加入定时任务调度

**Non-Goals:**
- 不自建 Bloomberg 爬虫（Playwright 方案维护成本高，Bloomberg 反爬严格）
- 不修改现有 NewsArticle 模型或数据库 schema
- 不修改翻译/标注/分析服务（它们已是 source 无关的）
- 不做 Bloomberg Terminal API 集成（成本 $2000/月）

## Decisions

### 1. 使用 Apify 两阶段抓取（vs 单 Actor 全量抓取）

**选择**: 先用 Category Scraper 获取文章列表，再用 News Scraper 逐篇获取全文。

**理由**:
- Category Scraper 消耗 CU 少，可快速获取最新文章列表用于去重
- 只对数据库中不存在的新文章调用 News Scraper 获取全文，节省 Apify 额度
- 与现有 Jeff Cox 服务的两阶段模式（GraphQL 列表 → Web Scraper 全文）完全一致

**替代方案**: 只用 News Scraper 一个 Actor 直接抓全文 → 无法高效去重，每次都要全量抓取，浪费额度。

### 2. 使用 `apify-client` 异步 SDK（vs REST API 直调）

**选择**: 使用 `ApifyClientAsync` 异步客户端。

**理由**:
- 官方 SDK 提供 `actor.call()` + `dataset.list_items()` 便捷接口
- 原生 async/await 支持，与现有 FastAPI 异步架构一致
- 自动处理轮询等待 Actor 运行完成

**替代方案**: 直接调 Apify REST API → 需自行处理轮询、超时、错误重试，代码更复杂。

### 3. 复用 `news_articles` 表 + source 字段区分（vs 新建表）

**选择**: 写入同一张表，`source` 字段设为 `"bloomberg"`。

**理由**:
- NewsArticle 模型已有 `source`、`content_full`、`is_full_content` 等字段，完全适配
- 翻译/标注/分析服务是 source 无关的，无需任何修改即可处理 Bloomberg 文章
- 前端已有新闻展示组件，通过 source 过滤即可复用

**替代方案**: 新建 `bloomberg_articles` 表 → 需要重复建模、翻译/分析服务要适配新表，无必要的复杂度。

### 4. Bloomberg 分类页 URL 配置

**选择**: 抓取以下 Bloomberg 分类页：
- `https://www.bloomberg.com/fixed-income` — 固收主页
- `https://www.bloomberg.com/markets/rates-bonds` — 利率与债券

这些 URL 作为默认配置写在服务中，可通过 API 参数覆盖。

### 5. 服务架构：独立 BloombergService（vs 扩展 JeffCoxService）

**选择**: 新建 `BloombergService` 和 `bloomberg_apify.py`，与 Jeff Cox 服务并列。

**理由**:
- 职责分离，Bloomberg 有自己的数据源逻辑（Apify Actor 调用）
- 遵循现有模式：每个数据源一个 service + 一个 scraper
- API 路由也独立 `/bloomberg/...`，不与 `/jeff-cox/...` 混在一起

**文件结构**:
```
backend/uteki/domains/news/services/
├── bloomberg_apify.py       # Apify Actor 调用封装
├── bloomberg_service.py     # 编排服务（列表→去重→全文→入库）
├── cnbc_scraper.py          # (existing)
├── cnbc_graphql.py          # (existing)
├── jeff_cox_service.py      # (existing)
└── ...
```

## Risks / Trade-offs

**[Apify 免费额度耗尽]** → 每月 $5 免费额度，预计每次抓取 ~10 篇新文章。控制定时任务频率（每 2 小时一次），并在服务中加入额度消耗日志。超额时 Apify API 会返回错误，服务优雅降级。

**[Bloomberg 页面结构变更导致 Apify Actor 失效]** → Apify Actor 由社区维护，如果 Actor 失效需要等待更新或切换到其他 Actor。在服务层做好错误处理，Actor 调用失败时记录日志并跳过。

**[Apify Actor 运行超时]** → Actor `call()` 设置合理超时（120s），超时后记录错误，不阻塞后续流程。

**[全文抓取失败（部分文章 paywall 未绕过）]** → 降级保存标题/摘要/URL，`is_full_content` 设为 `False`，后续可重试。
