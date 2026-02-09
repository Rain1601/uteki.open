## Why

Arena 页面当前只有一个简单的历史列表，用户无法直观看到账户额度变化趋势和模型决策在时间轴上的分布。需要一个时间线图表来可视化决策历史，让用户一目了然地看到每次决策的时间点、action（buy/hold/sell）、以及账户资产变化，点击时间节点可自动在右侧展示该次决策的模型记录。

## What Changes

- 新增后端 API `/api/index/arena/timeline` 返回时间线图表数据（每次 arena 运行的时间、action 摘要、账户快照）
- 重构 ArenaView 为左右双栏布局：左侧 = 折线图（时间线 + 决策节点），右侧 = 详情面板（模型卡片列表）
- 左侧图表使用 recharts，展示账户 total 资产折线 + 各时间点决策标注
- 点击图表上的时间节点自动在右侧加载对应 arena 的模型结果
- 右侧默认展示最新一次 arena 的结果
- 保留顶部 Run Arena 控制栏

## Capabilities

### New Capabilities
- `arena-timeline-chart`: Arena 时间线图表组件，展示账户变化折线 + 决策节点标注 + 点击交互

### Modified Capabilities
- `arena-history`: 现有 Arena 历史列表改为右侧详情面板的一部分，增加时间线数据端点

## Impact

- `backend/uteki/domains/index/api.py` — 新增 timeline 端点
- `backend/uteki/domains/index/services/arena_service.py` — 新增 timeline 数据查询
- `frontend/src/api/index.ts` — 新增 timeline API 函数 + 类型
- `frontend/src/components/index/ArenaView.tsx` — 重写为左右双栏布局
- 依赖 recharts（已安装）
