## 1. Backend — Timeline API

- [x] 1.1 Add `get_arena_timeline()` method to `arena_service.py` — query DecisionHarness joined with ModelIO count, DecisionLog (for adopted action), PromptVersion; return array of `{harness_id, created_at, account_total, action, harness_type, model_count, prompt_version, budget}` sorted by created_at ASC
- [x] 1.2 Add `GET /api/index/arena/timeline` route in `api.py` with `limit` query param (default 50)

## 2. Frontend — API Layer

- [x] 2.1 Add `ArenaTimelinePoint` type and `fetchArenaTimeline()` function in `frontend/src/api/index.ts`

## 3. Frontend — Timeline Chart Component

- [x] 3.1 Create `ArenaTimelineChart` component using lightweight-charts `LineSeries` + markers — color-coded by action (green=BUY, red=SELL, orange=HOLD, gray=unknown), crosshair tooltip, `onSelectPoint` callback with `harness_id`
- [x] 3.2 Add active/selected dot highlighting (larger marker size for the selected harness_id)

## 4. Frontend — ArenaView Rewrite

- [x] 4.1 Rewrite ArenaView layout to left-right dual panel (left 40% chart, right 60% model cards) with responsive stacking below 900px
- [x] 4.2 Wire up chart interaction: load timeline on mount, default select latest point, click point → fetch arena results → update right panel
- [x] 4.3 Remove old list/detail view state toggle and Back button; chart serves as the navigator
