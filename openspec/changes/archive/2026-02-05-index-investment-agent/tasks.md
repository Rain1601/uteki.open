## 1. Module Setup & Database Models

- [x] 1.1 Create module structure `backend/uteki/domains/index/` with `__init__.py`, `api.py`, `schemas.py`, `models/`, `services/`, `tools/`
- [x] 1.2 Create `Watchlist` model (`watchlist` table in `index` schema): symbol, name, type, is_active, timestamps
- [x] 1.3 Create `IndexPrice` model (`index_prices` table): symbol, date, open, high, low, close, volume, timestamps
- [x] 1.4 Create `PromptVersion` model (`prompt_version` table): version, content, description, is_current, timestamps
- [x] 1.5 Create `AgentMemory` model (`agent_memory` table): user_id, category, content, metadata JSON, timestamps
- [x] 1.6 Create `DecisionHarness` model (`decision_harness` table): harness_type, prompt_version_id FK, market_snapshot JSON, account_state JSON, memory_summary JSON, task JSON, tool_definitions JSON, timestamps
- [x] 1.7 Create `ModelIO` model (`model_io` table): harness_id FK, model_provider, model_name, input_prompt TEXT, input_token_count, output_raw TEXT, output_structured JSON, tool_calls JSON, output_token_count, latency_ms, cost_usd, parse_status, timestamps
- [x] 1.8 Create `DecisionLog` model (`decision_log` table): harness_id FK, adopted_model_io_id FK (nullable), user_action, original_allocations JSON, executed_allocations JSON, execution_results JSON, user_notes, timestamps
- [x] 1.9 Create `Counterfactual` model (`counterfactual` table): decision_log_id FK, model_io_id FK, was_adopted, tracking_days, hypothetical_return_pct, actual_prices JSON, calculated_at
- [x] 1.10 Create `ModelScore` model (`model_score` table): model_provider, model_name, prompt_version_id FK, adoption_count, win_count, loss_count, total_decisions, counterfactual_win_count, counterfactual_total, timestamps
- [x] 1.11 Create `ScheduleTask` model (`schedule_task` table): name, cron_expression, task_type, config JSON, is_enabled, last_run_at, last_run_status, next_run_at, timestamps
- [x] 1.12 Register all models in `models/__init__.py` and add debug create-tables endpoint

## 2. Index Data Service

- [x] 2.1 Implement `DataService.get_quote(symbol)` — fetch real-time quote from FMP API with Alpha Vantage fallback, return standardized quote dict (price, change_pct, pe_ratio, ma50, ma200, volume, 52w range)
- [x] 2.2 Implement `DataService.get_history(symbol, start, end)` — fetch historical daily OHLCV from FMP, store in `index_prices` table, return from DB
- [x] 2.3 Implement incremental daily update — fetch only missing days since last stored date for each active watchlist symbol
- [x] 2.4 Implement initial history load — when symbol is added to watchlist, fetch up to 5 years of daily data
- [x] 2.5 Implement data validation — flag price anomalies (>20% change), log missing trading day data
- [x] 2.6 Implement technical indicators calculation — MA50, MA200, RSI(14) from stored daily prices
- [x] 2.7 Implement watchlist CRUD — add/remove symbols, pre-seed defaults (VOO, IVV, QQQ, ACWI, VGT), mark inactive on remove (retain data)
- [x] 2.8 Add API endpoints: `GET /api/index/quotes/{symbol}`, `GET /api/index/history/{symbol}`, `GET /api/index/watchlist`, `POST /api/index/watchlist`, `DELETE /api/index/watchlist/{symbol}`, `POST /api/index/data/refresh`

## 3. Backtest Engine

- [x] 3.1 Implement `BacktestService.run(symbol, start, end, initial_capital, monthly_dca)` — simulate lump sum + DCA, return total_return_pct, annualized_return_pct, max_drawdown_pct, sharpe_ratio, final_value, monthly_values
- [x] 3.2 Implement multi-index comparison — run identical backtest for multiple symbols, return independent results per symbol
- [x] 3.3 Implement agent decision replay — re-send historical Harness to models, compare new outputs with original, report differences (historical data isolation enforced)
- [x] 3.4 Add API endpoints: `POST /api/index/backtest`, `POST /api/index/backtest/compare`, `POST /api/index/backtest/replay/{harness_id}`

## 4. System Prompt Versioning

- [x] 4.1 Implement `PromptService.get_current()` — return current active prompt version
- [x] 4.2 Implement `PromptService.update(content, description)` — create new version, set `is_current=true`, previous version set to `is_current=false`
- [x] 4.3 Implement `PromptService.get_history()` — list all versions ordered by creation date
- [x] 4.4 Create initial default System Prompt (v1.0) for index investment agent
- [x] 4.5 Add API endpoints: `GET /api/index/prompt/current`, `PUT /api/index/prompt`, `GET /api/index/prompt/history`

## 5. Memory Module

- [x] 5.1 Implement `MemoryService.write(user_id, category, content, metadata)` — persist memory entry
- [x] 5.2 Implement `MemoryService.read(user_id, category, limit)` — retrieve memories filtered by category, ordered by time descending
- [x] 5.3 Implement `MemoryService.get_summary(user_id)` — return last 3 decisions + last 1 reflection + all experiences for Harness construction
- [x] 5.4 Add API endpoints: `GET /api/index/memory`, `POST /api/index/memory`

## 6. Decision Harness & Arena

- [x] 6.1 Implement `HarnessBuilder.build(harness_type, budget, constraints)` — fetch market quotes for all watchlist symbols, fetch account state from SNB (balance + positions), get memory summary, get current prompt version, assemble immutable Harness, persist to DB
- [x] 6.2 Implement `ArenaService.run(harness)` — for each configured model: construct full prompt (system prompt + serialized Harness + tools), call via `LLMAdapterFactory` in parallel with `asyncio.gather()`, handle per-model timeout (60s) and errors
- [x] 6.3 Implement structured output parsing — JSON parse attempt, regex fallback for key fields (action, confidence, allocations), raw_only fallback; store `parse_status` field
- [x] 6.4 Implement complete I/O persistence — save `model_io` record per model with full input_prompt, output_raw, output_structured, tool_calls, token counts, latency, cost
- [x] 6.5 Add API endpoints: `POST /api/index/arena/run` (manual trigger), `GET /api/index/arena/{harness_id}` (get Arena results), `GET /api/index/arena/latest`

## 7. Agent Tools

- [x] 7.1 Define `LLMTool` definitions for all 11 tools: get_index_quote, get_index_history, run_backtest, get_portfolio, get_balance, get_transactions, place_order, search_web, read_memory, write_memory, get_decision_log
- [x] 7.2 Implement tool execution dispatcher — map tool names to service method calls
- [x] 7.3 Integrate with existing `SnbClient` for get_portfolio, get_balance, get_transactions, place_order
- [x] 7.4 Integrate with existing research tools for search_web

## 8. Index Agent Service

- [x] 8.1 Implement `AgentService.chat(user_id, message)` — process user message with system prompt + memory context + tools, return agent response with tool call results
- [x] 8.2 Implement Decision Card generation from Arena results — extract allocations, confidence, source model, create structured card data
- [x] 8.3 Implement order execution flow — validate TOTP, enforce position limit (max 3 ETFs), call `SnbClient.place_order()` for each allocation, record execution results in decision log
- [x] 8.4 Implement user adoption flow — adopt model recommendation, custom allocation, skip/reject with notes
- [x] 8.5 Implement watchlist expansion via agent — agent proposes new symbol with research, generate New Symbol Card for user confirmation
- [x] 8.6 Add API endpoints: `POST /api/index/agent/chat`, `POST /api/index/decisions/{id}/adopt`, `POST /api/index/decisions/{id}/approve`, `POST /api/index/decisions/{id}/skip`, `POST /api/index/decisions/{id}/reject`

## 9. Decision History & Counterfactual Tracking

- [x] 9.1 Implement `DecisionService.create_log(harness_id, user_action, ...)` — create immutable decision log entry (approved/modified/skipped/rejected)
- [x] 9.2 Implement immutability enforcement — reject updates/deletes on decision_log records at application layer
- [x] 9.3 Implement `DecisionService.get_timeline(filters)` — return decisions in reverse chronological order with expandable detail, support filtering by date range, type, model, action
- [x] 9.4 Implement counterfactual calculation — for each model's allocation at a decision: compute hypothetical return using entry prices (from Harness) vs prices N days later
- [x] 9.5 Implement counterfactual scheduler — trigger calculations at 7d, 30d, 90d after each decision for all model suggestions (adopted and non-adopted)
- [x] 9.6 Implement post-decision performance tracking — calculate actual return of executed trades at 7d, 30d, 90d
- [x] 9.7 Implement "missed opportunity" and "dodged bullet" classification — positive counterfactual for non-adopted = missed opportunity, negative = dodged bullet
- [x] 9.8 Add API endpoints: `GET /api/index/decisions`, `GET /api/index/decisions/{id}`, `GET /api/index/decisions/{id}/counterfactuals`

## 10. Model Scoring & Leaderboard

- [x] 10.1 Implement `ModelScore` update on adoption — increment adoption count for adopted model
- [x] 10.2 Implement `ModelScore` update on counterfactual — update win/loss records for all models when counterfactual data becomes available
- [x] 10.3 Implement leaderboard query — rank models by composite score (adoption rate, win rate, average return, counterfactual win rate), grouped by prompt version
- [x] 10.4 Add API endpoints: `GET /api/index/leaderboard`, `GET /api/index/leaderboard?prompt_version_id={id}`

## 11. Decision Scheduler

- [x] 11.1 Implement `SchedulerService` with APScheduler + SQLAlchemyJobStore — register, pause, resume, remove jobs
- [x] 11.2 Implement schedule CRUD — create, update cron expression, enable/disable, delete schedule tasks
- [x] 11.3 Implement job execution — on trigger: build Harness → run Arena → update last_run_at/status
- [x] 11.4 Implement process restart recovery — reload all enabled schedules from DB on startup
- [x] 11.5 Implement manual trigger — execute scheduled task immediately on user request, reject if already running
- [x] 11.6 Pre-seed default schedules on first initialization (monthly DCA, weekly check, monthly reflection)
- [x] 11.7 Add API endpoints: `GET /api/index/schedules`, `POST /api/index/schedules`, `PUT /api/index/schedules/{id}`, `DELETE /api/index/schedules/{id}`, `POST /api/index/schedules/{id}/trigger`

## 12. Reflection Generation

- [x] 12.1 Implement reflection agent — review past month's decisions, compare predicted vs actual outcomes using counterfactual data, identify correct calls and mistakes
- [x] 12.2 Implement experience extraction — from reflection, extract lessons and write new experiences to memory
- [x] 12.3 Integrate with scheduler — monthly reflection schedule triggers reflection generation automatically

## 13. Frontend — Page Structure & Chat

- [x] 13.1 Create `IndexAgentPage.tsx` with 5-tab layout (Chat, Arena, History, Leaderboard, Settings)
- [x] 13.2 Implement `ChatPanel.tsx` — message input, agent response display, tool call result rendering
- [x] 13.3 Implement `DataPanel.tsx` — watchlist cards with price/change/sparkline, position display with P&L (merged into SettingsPanel watchlist section)
- [x] 13.4 Implement `WatchlistPanel.tsx` — add/remove symbols, display current watchlist with mini charts (merged into SettingsPanel watchlist section)
- [x] 13.5 Add SNB API client functions for index endpoints (`/api/index/*`)

## 14. Frontend — Decision Cards

- [x] 14.1 Implement `DecisionCard.tsx` — display allocations table, source model, confidence, action buttons (approve/modify/skip) (inline in ChatPanel)
- [x] 14.2 Implement TOTP approval dialog — TOTP input on approve, execute orders, display results inline
- [x] 14.3 Implement allocation modification form — pre-filled editable form, submit modified allocations

## 15. Frontend — Arena View

- [x] 15.1 Implement `ArenaView.tsx` — multi-model side-by-side cards with summary (action, allocations, confidence, reasoning, latency, cost)
- [x] 15.2 Implement `ModelCard.tsx` — single model result card with adopt button (inline in ArenaView)
- [x] 15.3 Implement `ModelIODetail.tsx` — expandable full I/O panel (inline in ArenaView ModelCard expand)
- [x] 15.4 Implement `HarnessViewer.tsx` — display Harness content: timestamp, prompt version, market data table, account state, memory summary, task, tools

## 16. Frontend — History & Counterfactual

- [x] 16.1 Implement `DecisionTimeline.tsx` — reverse chronological list grouped by month, showing date, type, prompt version badge, model count, adopted model, user action, execution summary
- [x] 16.2 Implement timeline expand — show Harness, all model I/O, user action, execution results, counterfactual data
- [x] 16.3 Implement `CounterfactualBadge.tsx` — green/red badges for hypothetical returns, "missed opportunity" / "dodged bullet" labels (inline in DecisionTimeline)
- [x] 16.4 Implement timeline filtering — date range, decision type, model name, user action filters

## 17. Frontend — Leaderboard & Settings

- [x] 17.1 Implement `LeaderboardTable.tsx` — ranked model table (rank, name, adoption rate, win rate, avg return, counterfactual win rate, score, trend)
- [x] 17.2 Implement prompt version grouping — dropdown to select prompt version, default to current
- [x] 17.3 Implement `SchedulerPanel.tsx` — display schedule tasks with cron (human-readable), next trigger time, last run, action buttons (trigger/edit/enable-disable) (in SettingsPanel)
- [x] 17.4 Implement System Prompt editor — text editor with version display, save creates new version with description (in SettingsPanel)
- [x] 17.5 Implement prompt version history — list versions with date, description, view full text (in SettingsPanel)

## 18. Frontend — Backtest

- [x] 18.1 Implement `BacktestChart.tsx` — line chart for cumulative portfolio va
- nthly DCA amount

## 19. Integration & Route Registration

- [x] 19.1 Register index API router in main FastAPI app
- [x] 19.2 Add IndexAgent page route to frontend router
- [x] 19.3 Add navigation entry in sidebar for IndexAgent
- [x] 19.4 Add APScheduler startup/shutdown hooks to FastAPI lifespan
