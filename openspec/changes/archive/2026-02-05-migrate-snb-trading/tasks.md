## 1. Backend Domain Setup

- [x] 1.1 Create domain directory structure: `backend/uteki/domains/snb/` with `__init__.py`, `api.py`, `schemas.py`, `models/__init__.py`, `services/__init__.py`
- [x] 1.2 Add `snbpy` to `pyproject.toml` dependencies and verify it installs

## 2. Database Models

- [x] 2.1 Create `models/snb_transaction.py` — `SnbTransaction` model with columns: id (UUID), account_id, symbol, trade_time (BigInteger), side, quantity, price, commission, order_id, raw_data (JSONB). Unique constraint on (account_id, symbol, trade_time, side). Indexes on (account_id, symbol) and (trade_time). PostgreSQL schema `snb`.
- [x] 2.2 Create `models/snb_transaction_note.py` — `SnbTransactionNote` model with columns: id (UUID), account_id, symbol, trade_time, side, is_reasonable (Boolean nullable), notes (Text). Unique constraint on (account_id, symbol, trade_time, side). PostgreSQL schema `snb`.
- [x] 2.3 Export models from `models/__init__.py`
- [x] 2.4 Add debug endpoint to create `snb` schema and tables (similar to admin's `create-admin-tables`)

## 3. SNB Client Wrapper

- [x] 3.1 Create `services/snb_client.py` — async wrapper around snbpy SDK using `asyncio.to_thread()`. Include: `_ensure_login()` auto-login, `get_balance()` with field transformation (net_liquidation_value → total_value, securities_gross_position_value → market_value), `get_positions()` with computed fields (quantity, cost, market_value, unrealized_pnl), `get_orders()` with status filter and limit, `place_order()` with validation, `cancel_order()`, `get_transaction_list()` with symbol/date filters, `get_token_status()`
- [x] 3.2 Add singleton getter `get_snb_client()` that reads config from env vars (`SNB_ACCOUNT`, `SNB_API_KEY`, `SNB_ENV`), returns HTTP 503 if not configured

## 4. Service Layer

- [x] 4.1 Create `services/snb_service.py` — `SnbService` class with: `sync_transactions()` — fetch from SNB API and upsert into PostgreSQL using `ON CONFLICT DO UPDATE`, `get_transactions()` — query persisted transactions joined with notes (with optional symbol filter), `upsert_note()` — create or update transaction note via upsert on unique key, return updated note
- [x] 4.2 Add singleton getter `get_snb_service()` and export from `services/__init__.py`

## 5. Pydantic Schemas

- [x] 5.1 Create `schemas.py` with: `PlaceOrderRequest` (symbol, side, quantity, order_type, price optional, time_in_force), `TransactionNoteRequest` (account_id, symbol, trade_time, side, is_reasonable nullable, notes), `SnbResponse` (generic success/error wrapper), `TransactionResponse`, `TransactionNoteResponse`, `BalanceResponse`, `PositionResponse`

## 6. API Routes

- [x] 6.1 Create `api.py` with router and `get_db_session` dependency
- [x] 6.2 Implement `GET /status` — connection/token status
- [x] 6.3 Implement `GET /balance` — real-time balance from SNB API
- [x] 6.4 Implement `GET /positions` — real-time positions with computed P&L
- [x] 6.5 Implement `GET /orders` — real-time orders with optional status filter and limit
- [x] 6.6 Implement `POST /orders` — place order with validation (price required for LMT)
- [x] 6.7 Implement `DELETE /orders/{order_id}` — cancel order
- [x] 6.8 Implement `GET /transactions` — fetch from SNB API, upsert to DB, return with notes
- [x] 6.9 Implement `PUT /transactions/notes` — upsert transaction note

## 7. Router Registration

- [x] 7.1 Import snb router in `backend/uteki/main.py` and register at prefix `/api/snb` with tag `snb`

## 8. Frontend API Module

- [x] 8.1 Create `frontend/src/api/snb.ts` with typed API functions: `fetchBalance()`, `fetchPositions()`, `fetchOrders()`, `placeOrder()`, `cancelOrder()`, `fetchTransactions()`, `upsertTransactionNote()`, `fetchStatus()`

## 9. Frontend Trading Page

- [x] 9.1 Create `frontend/src/pages/SnbTradingPage.tsx` with TypeScript interfaces for all data types (Balance, Position, Order, Transaction, TransactionNote)
- [x] 9.2 Implement balance dashboard section — 4 stat cards (total assets, cash, market value, available funds) with LoadingDots
- [x] 9.3 Implement Tab 0: Positions table (symbol, quantity, avg cost, market price, market value, unrealized P&L, return %) + Orders table (status, type, symbol, quantity, price, actions)
- [x] 9.4 Implement create order dialog — symbol, direction (BUY/SELL), order type (MKT/LMT), quantity, price (for LMT), time-in-force (DAY/GTC)
- [x] 9.5 Implement cancel order confirmation dialog
- [x] 9.6 Implement Tab 1: Transaction history table with symbol filter dropdown
- [x] 9.7 Implement transaction notes dialog — pre-fill existing is_reasonable and notes, support edit and save via upsert endpoint
- [x] 9.8 Apply theme support — use `useTheme()`, `isDark`, theme variables for all colors. Use `m: -3` negative margin layout for seamless sidebar integration. Use LoadingDots for all loading states.

## 10. Routing & Navigation

- [x] 10.1 Add route `/trading/snb` → `SnbTradingPage` in `App.tsx`
- [x] 10.2 Add "雪盈证券" menu item under TRADING section in `HoverSidebar.tsx` with appropriate icon
