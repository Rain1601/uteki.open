# Watchlist K-Line Chart Design

## Context

当前 Settings → Watchlist 页面以卡片网格展示 ETF 列表，用户无法直观了解价格走势。项目已有:
- FMP API 集成 (`data_service.py`) 支持历史数据和实时报价
- `IndexPrice` 模型存储 OHLCV 日线数据
- `scheduler_service.py` 支持 cron 定时任务
- 前端 Recharts 库（但未深度使用）

需要引入专业 K 线图组件并重构 Watchlist 布局为 Master-Detail 模式。

## Goals / Non-Goals

**Goals:**
- 在 Watchlist 页面实现「左侧列表 + 右侧 K 线图」布局
- 使用 TradingView lightweight-charts@5.1.0 渲染专业级 K 线图
- 支持日/周/月线切换，MA 指标叠加，缩放平移交互
- 确保数据自动更新，检测并告警数据断点

**Non-Goals:**
- WebSocket 实时推送（FMP Premium 专属，MVP 阶段使用轮询）
- 日内分钟级数据（可选扩展，不在 MVP）
- 技术指标库（RSI/MACD 等复杂指标作为后续迭代）

## Decisions

### D1: 图表库选择 — TradingView lightweight-charts

**Decision**: 使用 `lightweight-charts@5.1.0`

**Rationale**:
- 专为金融图表设计，原生支持 Candlestick、Volume、Line 等
- 体积小 (~45KB gzipped)，性能优秀
- API 简洁，React 集成方便
- 免费开源 (Apache 2.0)

**Alternatives Considered**:
- Recharts: 已集成但不支持原生 K 线，需自定义实现
- ECharts: 功能强大但体积大 (~300KB)，金融图表需额外配置
- TradingView charting_library: 功能最全但需商业授权

### D2: 前端布局 — Master-Detail 分栏

**Decision**: 左侧 240px 固定列表 + 右侧自适应图表区域

**Rationale**:
- 常见的金融终端布局模式，用户熟悉
- 列表固定宽度保证可读性，图表区自适应最大化展示

**Implementation**:
```
┌──────────────┬────────────────────────────────────┐
│  Watchlist   │                                    │
│  (240px)     │       K-Line Chart (flex: 1)       │
│  - VOO ✓     │                                    │
│  - QQQ       │       [日] [周] [月]  [MA50] [MA200]│
│  - SPY       │                                    │
│  - ...       │       ┌─────────────────────────┐  │
│              │       │     Candlesticks        │  │
│  [+ Add]     │       ├─────────────────────────┤  │
│              │       │     Volume Bars         │  │
└──────────────┴───────┴─────────────────────────┴──┘
```

### D3: 数据流架构

**Decision**: 前端按需加载 + 本地缓存 + 后端定时预热

**Flow**:
1. 用户点击 symbol → 前端调用 `GET /api/index/history/{symbol}`
2. 后端从 DB 返回历史数据（已由定时任务预加载）
3. 前端缓存数据，切换 symbol 时检查缓存避免重复请求
4. 定时任务每日 5:00 UTC 更新全部 watchlist 数据

**Rationale**:
- 预加载避免用户等待 FMP API 延迟
- 前端缓存减少重复请求
- 定时任务保证数据及时性

### D4: 数据更新调度 — Cron 任务

**Decision**: 复用现有 `scheduler_service.py`，新增 `price_update` 任务类型

**Implementation**:
- Task type: `price_update`
- Default cron: `0 5 * * *` (每日 UTC 5:00，美股收盘后)
- 任务执行: 遍历 watchlist，调用 `data_service.incremental_update()`

### D5: 数据校验策略

**Decision**: 在定时任务中嵌入校验，发现断点记录日志并标记

**Implementation**:
- 校验逻辑: 检查最后一条记录到当前日期之间是否有缺失交易日
- 排除规则: 周末、美国节假日 (简化: 仅排除周末)
- 告警方式: `logger.warning()` + 可选通知钩子

### D6: 组件架构

**Decision**: 分离图表容器和图表实例管理

```
<WatchlistKlineView>
  ├── <SymbolList>         // 左侧列表
  │     └── <SymbolItem>   // 单个 symbol 行
  └── <KlineChart>         // 右侧图表
        ├── <IntervalSelector>  // 日/周/月切换
        ├── <IndicatorToggle>   // MA 开关
        └── <ChartCanvas>       // lightweight-charts 实例
```

### D7: lightweight-charts React 集成

**Decision**: 使用 useRef + useEffect 管理图表生命周期

```typescript
const chartContainerRef = useRef<HTMLDivElement>(null);
const chartRef = useRef<IChartApi | null>(null);

useEffect(() => {
  if (!chartContainerRef.current) return;
  chartRef.current = createChart(chartContainerRef.current, options);
  return () => chartRef.current?.remove();
}, []);

useEffect(() => {
  // 数据更新时调用 series.setData()
}, [data]);
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| FMP API 限额不足 | 使用本地 DB 缓存，仅增量更新；监控 API 调用量 |
| 数据断点未及时发现 | 定时任务内置校验 + 日志告警；提供手动 backfill 入口 |
| 图表性能问题（大数据量） | lightweight-charts 内置优化；限制默认加载 365 天 |
| 周末/节假日误判为断点 | 简化处理: 仅排除周六日；可扩展节假日 API |

## Migration Plan

1. **Phase 1 - 前端组件** (不影响现有功能)
   - 安装 `lightweight-charts@5.1.0`
   - 创建 `KlineChart.tsx` 组件
   - 重构 `SettingsPanel.tsx` Watchlist 区域布局

2. **Phase 2 - 后端扩展**
   - 扩展 quote API 返回当日 OHLC
   - 添加数据校验端点
   - 创建默认 `price_update` 调度任务

3. **Phase 3 - 集成测试**
   - 验证图表渲染
   - 验证定时任务执行
   - 验证数据校验逻辑

**Rollback**: 前端改动可通过 git revert；后端新增端点向后兼容无需回滚

## Open Questions

1. **节假日处理**: 是否需要接入美股节假日 API 精确判断交易日？ → MVP 简化处理
2. **WebSocket 实时推送**: 是否需要在 Phase 2 支持？ → 取决于 FMP 套餐，暂不实现
3. **多图表对比**: 是否支持同时显示多个 symbol 的叠加对比？ → 后续迭代
