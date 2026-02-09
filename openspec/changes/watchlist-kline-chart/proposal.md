## Why

当前 Settings → Watchlist 页面以卡片网格展示 ETF 列表，缺乏价格走势的直观可视化。用户无法快速了解各 ETF 的历史表现和当前趋势，需要一个专业的 K 线图组件来展示 OHLCV 数据，并确保数据的实时性和连续性。

## What Changes

- **前端 UI 重构**: Watchlist 从卡片网格改为「左侧列表 + 右侧 K 线图」Master-Detail 布局
- **K 线图组件**: 使用 TradingView `lightweight-charts@5.1.0` 实现专业级 K 线图
- **数据源扩展**:
  - 历史日线数据 (已有 FMP 集成)
  - 当日实时数据 (T): 扩展 quote API 返回当日 OHLC
  - 可选: WebSocket 实时推送 (FMP Premium)
- **定时任务**: 创建数据更新调度任务，确保每日收盘后自动拉取最新数据
- **数据校验**: 增加数据连续性检测，发现断点时告警

## Capabilities

### New Capabilities
- `kline-chart`: K 线图前端组件，基于 lightweight-charts 5.1.0，支持日线/周线/月线切换、技术指标叠加 (MA/RSI)、缩放平移交互
- `price-data-scheduler`: 行情数据调度服务，每日自动更新历史数据、检测数据断点、支持手动触发补数据

### Modified Capabilities
- `index-data`: 扩展 quote API 返回当日 OHLC 数据，增加日内数据端点 (可选)

## Impact

- **前端**:
  - 新增依赖 `lightweight-charts@5.1.0`
  - 重构 `SettingsPanel.tsx` Watchlist 区域布局
  - 新增 `KlineChart.tsx` 组件
- **后端**:
  - 扩展 `data_service.py` 支持当日数据
  - 扩展 `scheduler_service.py` 增加价格数据更新任务类型
  - 新增数据连续性校验逻辑
- **API**:
  - `GET /api/index/quotes/{symbol}` 扩展返回当日 OHLC
  - `GET /api/index/history/{symbol}` 已有，无变更
  - `POST /api/index/data/validate` 新增数据校验端点
- **数据库**: 无 schema 变更，复用 `index_prices` 表
