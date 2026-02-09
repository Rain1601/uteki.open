## 1. Bug Fixes (Quick Wins)

- [x] 1.1 Fix System Prompt 405: in `frontend/src/api/index.ts`, change `updatePrompt` from `post()` to `put()`
- [x] 1.2 Hide Debug in production: in `SettingsPanel.tsx`, wrap Debug chip and `DebugSection` rendering with `import.meta.env.DEV` check

## 2. Remove Chat Tab

- [x] 2.1 In `IndexAgentPage.tsx`, remove `ChatPanel` import, remove Chat entry from `tabs` array, remove `activeTab === 0 && <ChatPanel />` rendering, adjust tab indices (Arena=0, History=1, Leaderboard=2, Backtest=3, Settings=4)
- [x] 2.2 Remove `ChatIcon` from imports since it's no longer used

## 3. Backend: Arena History Endpoint

- [x] 3.1 Add `GET /arena/history` route in `backend/uteki/domains/index/api.py` — accepts `limit` (default 20) and `offset` (default 0) query params
- [x] 3.2 Implement `get_arena_history()` in the arena service — query `decision_harness` table ordered by `created_at` desc, join `model_io` count, return list of `{harness_id, harness_type, created_at, budget, model_count}`

## 4. Frontend: Arena History API

- [x] 4.1 Add `ArenaHistoryItem` type and `fetchArenaHistory(limit?, offset?)` function in `frontend/src/api/index.ts`

## 5. Frontend: Arena View Redesign

- [x] 5.1 Add view state to `ArenaView.tsx`: `'list' | 'detail'`, with `selectedHarnessId` for detail view
- [x] 5.2 Implement history list UI below Run Arena controls — show date, harness type, model count, budget per item. Fetch on mount and when returning from detail view
- [x] 5.3 On history item click: fetch full arena result via existing `GET /arena/{harness_id}`, switch to detail view showing ModelCard grid with a back button
- [x] 5.4 After new Arena run completes: set result and switch to detail view. On back, refresh history list to show new run at top
- [x] 5.5 When no history exists and no run is in progress, show existing placeholder description
