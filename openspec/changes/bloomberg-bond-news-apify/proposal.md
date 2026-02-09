## Why

目前新闻数据源仅有 CNBC Jeff Cox 一个渠道，覆盖面有限。Bloomberg 是全球最权威的固收/信用市场信息源，其企业债券和固收新闻对投资决策至关重要。通过 Apify Bloomberg Scraper 接入 Bloomberg 新闻全文，可以显著扩展新闻覆盖范围，为 AI 分析提供更丰富的市场数据。

## What Changes

- 新增 Apify Bloomberg Scraper 集成，支持抓取 Bloomberg 固收/企业债券分类页的新闻列表
- 新增 Bloomberg 文章全文抓取能力（通过 Apify News Scraper 绕过 paywall）
- 新增 Bloomberg 新闻的 API 端点（列表查询、手动触发抓取、单篇详情）
- 复用现有翻译、自动标注、AI 分析 pipeline（translation_service / news_analysis_service）
- 新增定时任务，定期从 Bloomberg 抓取最新固收新闻

## Capabilities

### New Capabilities
- `bloomberg-news-scraper`: Apify Bloomberg 新闻抓取服务，包含分类页列表采集和单篇全文抓取，数据写入现有 news_articles 表（source 字段区分来源）
- `bloomberg-news-api`: Bloomberg 新闻的 REST API 端点，提供列表查询、手动抓取触发、文章详情等接口

### Modified Capabilities
_(无需修改现有 spec——NewsArticle 模型已有 source 字段和 content_full 字段，翻译/标注/分析服务通过 source 无关的方式工作，无需变更)_

## Impact

- **后端新增文件**: `bloomberg_scraper.py`（Apify 调用）、`bloomberg_service.py`（编排服务）、Bloomberg API 路由
- **依赖**: 新增 `apify-client` Python 包
- **环境变量**: 新增 `APIFY_API_TOKEN`
- **数据库**: 无 schema 变更，复用 `news_articles` 表，`source` 值为 `"bloomberg_bond"` / `"bloomberg_fixed_income"`
- **定时任务**: 新增 Bloomberg 新闻定时抓取（复用现有 scheduler 模式）
- **成本**: Apify 免费额度 $5/月，预计可覆盖日常抓取量
