## Why

The original uchu_trade system has a fully functional SNB (Snowball Securities / 雪盈证券) trading page at `/record/snb` that provides US stock trading capabilities including account monitoring, order management, and transaction history with evaluation notes. This needs to be migrated to uteki.open as part of the platform consolidation effort, following the established domain-driven architecture patterns (async FastAPI, SQLAlchemy 2.0, PostgreSQL, React/TypeScript with MUI).

## What Changes

- **New backend domain** `snb/` under `backend/uteki/domains/` with:
  - Real-time API routes for account balance, positions, orders — data fetched live from SNB brokerage, not cached
  - Order management: create orders (market/limit, DAY/GTC) and cancel pending orders
  - Transaction history persistence: transactions fetched from SNB API are persisted to PostgreSQL, enabling offline access, historical queries, and data integrity across sessions
  - Transaction notes with full CRUD: create, read, update notes and reasonableness evaluations on each transaction. Edits update in-place (upsert by unique key) to prevent duplicate or stale data
  - SNB API client wrapper around the `snbpy` SDK for brokerage communication
  - SQLAlchemy models for transaction records and transaction notes (PostgreSQL, `snb` schema)
  - Pydantic schemas for request/response validation with strict typing
  - Service layer with dependency injection (following existing patterns)
- **New frontend page** `SnbTradingPage.tsx` (TypeScript rewrite) with:
  - Account balance dashboard (total assets, cash, market value, available funds)
  - Positions table with unrealized P&L calculations
  - Orders table with create/cancel functionality
  - Transaction history with symbol filtering, sourced from persisted data
  - Transaction notes dialog with edit support: modify existing evaluations and notes, with optimistic UI updates
  - Full theme support (dark/light) using existing theme system
  - LoadingDots for all loading states
- **Frontend routing & navigation**: New route `/trading/snb` and sidebar menu item under TRADING section
- **Backend router registration** in `main.py` at prefix `/api/snb`

### Key Design Constraints

- **Real-time data**: Balance, positions, and orders are always fetched live from SNB API — no stale caching
- **Transaction persistence**: Transaction records are synced from SNB API to PostgreSQL on each fetch, using upsert logic (unique key: account_id + symbol + trade_time + side) to avoid duplicates
- **Notes editability**: Transaction notes support create and update via a single upsert endpoint. The frontend must allow editing existing notes without creating duplicates
- **Data correctness**: All write operations (orders, notes) must validate inputs, handle API errors gracefully, and return clear error messages. Concurrent note updates are handled by the upsert's unique constraint

## Capabilities

### New Capabilities

- `snb-trading`: SNB brokerage integration covering real-time account queries, order management, position tracking, transaction history persistence, and transaction note CRUD with edit support

### Modified Capabilities

_(none — no existing spec requirements are changing)_

## Impact

- **Backend**: New domain at `backend/uteki/domains/snb/` (~8-10 new files). New dependency on `snbpy` SDK. New PostgreSQL schema `snb` with `snb_transactions` and `snb_transaction_notes` tables.
- **Frontend**: New page component + API client module (~2-3 new files). Updates to `App.tsx` (route) and `HoverSidebar.tsx` (menu item).
- **Configuration**: SNB credentials (account, API key, environment) need to be configured — either via environment variables or admin API keys table.
- **Dependencies**: `snbpy` package added to backend requirements.
