## Why

Index Agent 页面存在多个可用性问题：System Prompt 保存接口 405 报错（前后端 HTTP 方法不匹配）、Arena 运行结果刷新即丢失（无历史浏览）、Chat tab 功能与 Arena 重叠且实用性低、Debug 面板在生产环境暴露。这些问题影响核心投资决策工作流的使用体验。

## What Changes

- **移除 Chat tab**：Chat（单模型对话）与 Arena（多模型对比）功能重叠，移除以简化界面
- **Arena 历史记录**：新增 Arena Run 历史列表，支持查看过去的多模型对比结果，不再刷新即丢失
- **修复 System Prompt 405 Bug**：前端 `updatePrompt` 使用 `POST` 方法，后端路由定义为 `PUT`，统一为 `PUT`
- **Debug 面板限制**：Debug 区域（Create Tables / Seed Defaults）仅在开发环境显示，生产环境隐藏

## Capabilities

### New Capabilities
- `arena-history`: Arena 运行历史浏览功能 — 用户可以查看过去的 Arena Run 结果，包括各模型的决策、状态、延迟等信息

### Modified Capabilities
_None — 以上变更不涉及已有 spec 的需求级变更_

## Impact

- **前端**：
  - `IndexAgentPage.tsx` — 移除 Chat tab，调整 tab 索引
  - `ChatPanel.tsx` — 移除（或保留文件但不再引用）
  - `ArenaView.tsx` — 新增历史列表 UI
  - `SettingsPanel.tsx` — Debug 区域加环境判断，修复 prompt 保存方法
  - `frontend/src/api/index.ts` — `updatePrompt` 方法从 `post` 改为 `put`，新增 Arena 历史查询 API
- **后端**：
  - `backend/uteki/domains/index/api.py` — 新增 Arena 历史查询端点（已有 `GET /arena/{harness_id}` 但缺少列表端点）
- **数据库**：无 schema 变更，复用现有 `decision_harness` + `model_io` 表
