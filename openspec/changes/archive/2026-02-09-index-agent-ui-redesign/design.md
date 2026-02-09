## Context

Index Agent 页面当前有 6 个 tab（Chat / Arena / History / Leaderboard / Backtest / Settings），存在以下问题：

1. **Chat tab 冗余** — 单模型对话与 Arena 多模型对比功能重叠，实际使用价值低
2. **Arena 无历史** — 当前 ArenaView 组件仅在 `useState` 中保存结果，刷新即丢失。后端已有 `GET /arena/{harness_id}` 获取单个结果，但缺少列表查询端点
3. **System Prompt 405** — 前端 `updatePrompt` 用 `post()`，后端路由为 `@router.put`，HTTP 方法不匹配
4. **Debug 暴露** — `DebugSection`（Create Tables / Seed Defaults）在所有环境可见

**现有数据模型**：`decision_harness` 表已存储每次 Arena Run 的完整快照（market_snapshot, account_state, task 等），`model_io` 表存储每个模型的输入输出。无需新增表。

## Goals / Non-Goals

**Goals:**
- 移除 Chat tab，简化导航为 5 个 tab
- 在 Arena tab 中增加历史 Run 列表，用户可回顾过去的多模型对比结果
- 修复 System Prompt 保存 405 错误
- Debug 面板仅在开发环境可见

**Non-Goals:**
- 不重构 Arena 的 Run 执行逻辑（模型调用、解析等）
- 不修改 Decision Timeline / Leaderboard / Backtest 功能
- 不调整后端数据模型

## Decisions

### D1: 移除 Chat tab — 直接删除引用

从 `IndexAgentPage.tsx` 的 `tabs` 数组和条件渲染中移除 Chat。`ChatPanel.tsx` 文件保留不删（避免 git 噪音），仅移除 import 和使用。

Tab 索引顺序变为：Arena(0) → History(1) → Leaderboard(2) → Backtest(3) → Settings(4)。

**替代方案**：隐藏但保留 tab → 不如直接移除干净，后续需要再加回来。

### D2: Arena 历史 — 在 ArenaView 中增加"历史列表 + 详情切换"

**后端**：新增 `GET /api/index/arena/history` 端点，查询 `decision_harness` 表（按 created_at 降序），关联 `model_io` 返回摘要信息（harness_id, harness_type, created_at, model 数量, budget）。

**前端**：ArenaView 组件增加两种视图状态：
- **默认视图**：顶部保持现有的 Run Arena 控件，下方增加历史列表（卡片或表格形式，显示时间、类型、模型数）
- **详情视图**：点击历史条目后，复用现有的 `ModelCard` 网格展示该 Run 的所有模型结果。左上角加返回按钮回到列表。

当用户执行新 Run 时，完成后自动切换到详情视图显示结果，同时历史列表会在返回时刷新。

**替代方案**：新建独立的 Arena History tab → 增加导航复杂度，不如在 Arena 内部处理。

### D3: 修复 405 — 前端改为 `put`

在 `frontend/src/api/index.ts` 中将 `updatePrompt` 的 HTTP 方法从 `post` 改为 `put`。一行改动。

**替代方案**：后端改为 POST → 语义上 PUT 更准确（更新资源），保持后端不变。

### D4: 隐藏 Debug — 通过环境变量控制

在 `SettingsPanel.tsx` 中，通过 `import.meta.env.DEV`（Vite 内置变量）判断是否渲染 Debug section chip 和 DebugSection 组件。生产构建时 `DEV` 为 `false`，Debug 区域自动消失。

**替代方案**：通过 feature flag 或用户角色控制 → 过度设计，`import.meta.env.DEV` 足够。

## Risks / Trade-offs

- **移除 Chat 不可逆（短期）** → 文件保留，如需恢复只需重新引入。低风险。
- **Arena 历史列表可能数据量大** → 后端分页（limit/offset），前端默认显示最近 20 条。
- **历史 Run 的模型结果可能缺少部分字段** → 前端 ModelCard 已处理 error/timeout 状态，无需额外处理。
