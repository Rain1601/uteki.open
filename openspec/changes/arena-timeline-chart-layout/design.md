## Context

Arena 页面当前是 list/detail 两种视图状态切换：list 显示历史列表，点击进入 detail 显示模型卡片。用户希望改为左右双栏布局：左侧折线图展示账户资产变化和决策节点，右侧展示选中 arena 的模型卡片。`recharts` 已安装。

后端已有 `GET /arena/history` 返回每次 arena 运行的摘要，`GET /arena/{harness_id}` 返回模型结果。DecisionHarness 的 `account_state` 字段包含 `{cash, total, positions}`，`market_snapshot` 包含每个 ETF 的价格快照。

## Goals / Non-Goals

**Goals:**
- 左右双栏布局：左侧图表（约 40%），右侧模型卡片（约 60%）
- 左侧折线图展示每次 arena 运行时的账户总资产
- 图表上每个数据点标注 action（从 adopted 模型的 structured output 中提取，如 BUY/HOLD/SELL）
- 点击图表数据点自动在右侧加载对应 arena 的模型结果
- 默认选中最新一次 arena 运行
- 保留顶部 Run Arena 控制栏

**Non-Goals:**
- 不做实时账户余额监控（仅展示 arena 运行时的快照）
- 不做时间范围选择器（展示所有历史）
- 不引入新的图表库（使用已有的 recharts）

## Decisions

### 1. 后端新增 timeline 端点 vs 前端拼装

**选择**: 新增 `GET /api/index/arena/timeline` 后端端点

**理由**: DecisionHarness 的 `account_state` 和模型 `output_structured` 在现有 `arena/history` API 中不返回。新端点可以一次性聚合：日期、账户总资产、adopted 模型的 action、harness_id。避免前端多次请求。

**替代方案**: 扩展现有 `arena/history` 端点增加字段。但这会使列表 API 变重，且 timeline 是独立的数据视角。

### 2. 图表库选择

**选择**: recharts（LineChart + scatter 自定义 dot）

**理由**: 已安装，React-friendly，支持自定义 tooltip 和 dot 点击事件。用 `<Line>` 绘制资产折线，用自定义 `dot` render 展示 action 标记（颜色区分 BUY/HOLD/SELL）。

### 3. 布局方案

**选择**: CSS flexbox 左右分栏，左 40% 右 60%，小屏幕（<900px）改为上下堆叠。

**理由**: 简单直观，不需要引入额外布局库。MUI 的 `Box` + `sx` 即可实现。

### 4. 数据点交互

**选择**: recharts 的 `onClick` 事件 → 获取点击数据点的 `harness_id` → 调用 `fetchArenaResults(harness_id)` → 更新右侧面板。

## Risks / Trade-offs

- **数据量**: 如果 arena 历史很多（100+次），折线图可能拥挤 → 暂不处理，后续可增加时间范围筛选
- **无账户数据**: 早期 arena 运行可能没有 `account_state`（字段为 null）→ 这些点在图表上不显示或显示为 0
- **Action 缺失**: 如果没有 adopted 模型或模型输出未解析出 action → 显示为 "—" 或灰色节点
