## Context

The uchu_trade project has a working SNB trading page (JavaScript frontend + synchronous Python backend + SQLite). We are migrating it to uteki.open which uses a different stack: TypeScript/React/MUI frontend, async FastAPI backend, PostgreSQL with schema-per-domain, SQLAlchemy 2.0 with `mapped_column`, and dependency injection via `Depends()`.

The original SNB implementation consists of:
- `snb_client.py` (600 lines) — wraps the `snbpy` SDK, handles login, field transformations
- `snb_controller.py` (540 lines) — FastAPI routes, loads credentials from `config.json`, singleton client
- `SnbTransactionNote` model — SQLite table for user trade evaluations
- `SnbTradingPage.js` (1,472 lines) — React class component with Material-UI

Key constraints from the proposal: real-time API for live data, transaction persistence via upsert, editable notes, and data correctness guarantees.

## Goals / Non-Goals

**Goals:**
- Migrate all SNB trading functionality to uteki.open's domain-driven architecture
- Real-time data: balance, positions, orders fetched live from SNB API on every request
- Persist transaction records to PostgreSQL with upsert (no duplicates)
- Full CRUD for transaction notes with edit-in-place support
- TypeScript rewrite of frontend with proper typing and theme integration
- Configuration via environment variables (not `config.json`)

**Non-Goals:**
- Real-time quote/market data endpoint (original was unimplemented, skip for now)
- Trading Advisor / AI analysis FAB (separate feature, not part of this migration)
- WebSocket-based real-time streaming (polling on user action is sufficient)
- Multi-account support (single account configuration, same as original)

## Decisions

### 1. Backend domain structure

**Decision:** Create `backend/uteki/domains/snb/` following the existing domain pattern.

```
domains/snb/
├── __init__.py
├── api.py              # FastAPI routes
├── schemas.py           # Pydantic request/response models
├── models/
│   ├── __init__.py
│   ├── snb_transaction.py       # Persisted transaction records
│   └── snb_transaction_note.py  # User notes/evaluations
├── services/
│   ├── __init__.py
│   ├── snb_client.py    # snbpy SDK wrapper (async)
│   └── snb_service.py   # Business logic (transaction sync, notes CRUD)
```

**Rationale:** Matches existing domains (news, macro, admin). The client wrapper is separate from business logic to isolate SDK concerns.

### 2. SNB client: async wrapper with auto-login

**Decision:** Wrap the synchronous `snbpy` SDK with `asyncio.to_thread()` to avoid blocking the event loop. The client auto-logs-in when the token is missing or expired.

```python
class SnbClient:
    async def _ensure_login(self):
        if not self._logged_in:
            await asyncio.to_thread(self._sync_login)

    async def get_balance(self) -> dict:
        await self._ensure_login()
        response = await asyncio.to_thread(self.client.get_balance)
        return self._transform_balance(response)
```

**Alternative considered:** Running snbpy in a separate process — rejected as over-engineered for the call frequency.

### 3. Configuration via environment variables

**Decision:** Read SNB credentials from environment variables (`SNB_ACCOUNT`, `SNB_API_KEY`, `SNB_ENV`), not from `config.json`.

**Rationale:** uteki.open deploys to Cloud Run where env vars are the standard config mechanism. Falls back to admin API keys table lookup if env vars are not set.

### 4. Transaction persistence with upsert

**Decision:** When the frontend requests transaction history, the backend:
1. Fetches transactions from SNB API (live)
2. Upserts each transaction into `snb.snb_transactions` table (unique key: `account_id + symbol + trade_time + side`)
3. Joins with `snb_transaction_notes` to attach any existing notes
4. Returns the merged result

**Upsert implementation:**
```python
from sqlalchemy.dialects.postgresql import insert

stmt = insert(SnbTransaction).values(records)
stmt = stmt.on_conflict_do_update(
    constraint="uq_snb_transaction",
    set_={col: stmt.excluded[col] for col in updatable_columns}
)
await session.execute(stmt)
```

**Rationale:** This guarantees no duplicates while always reflecting the latest data from SNB. The PostgreSQL `ON CONFLICT DO UPDATE` is atomic and handles concurrent requests safely.

### 5. Transaction notes upsert endpoint

**Decision:** Single `PUT /api/snb/transactions/notes` endpoint handles both create and update. Uses the same unique constraint (`account_id + symbol + trade_time + side`) for upsert.

**Frontend behavior:**
- Notes dialog loads existing note data if present
- User can modify `is_reasonable` and `notes` fields
- Submit always calls the same PUT endpoint — backend upserts
- Response returns the updated note, frontend updates state in-place

**Rationale:** Simpler than separate POST/PATCH endpoints. The upsert pattern prevents duplicates from rapid clicks or concurrent tabs.

### 6. Database schema design

**Decision:** Two tables in PostgreSQL schema `snb`:

**`snb.snb_transactions`** — persisted transaction records:
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | Auto-generated |
| account_id | VARCHAR(50) | SNB account |
| symbol | VARCHAR(20) | Stock ticker |
| trade_time | BIGINT | Timestamp in milliseconds |
| side | VARCHAR(10) | BUY / SELL |
| quantity | FLOAT | Trade quantity |
| price | FLOAT | Execution price |
| commission | FLOAT | Trading commission |
| order_id | VARCHAR(50) | Related order ID |
| raw_data | JSONB | Full SNB API response |
| created_at / updated_at | TIMESTAMPTZ | TimestampMixin |

Unique constraint: `(account_id, symbol, trade_time, side)`
Indexes: `(account_id, symbol)`, `(trade_time)`

**`snb.snb_transaction_notes`** — user evaluations:
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | Auto-generated |
| account_id | VARCHAR(50) | SNB account |
| symbol | VARCHAR(20) | Stock ticker |
| trade_time | BIGINT | Matches transaction |
| side | VARCHAR(10) | BUY / SELL |
| is_reasonable | BOOLEAN (nullable) | User evaluation |
| notes | TEXT | User notes |
| created_at / updated_at | TIMESTAMPTZ | TimestampMixin |

Unique constraint: `(account_id, symbol, trade_time, side)`

**Rationale:** Separating transactions from notes keeps concerns clean — transactions are system-synced data, notes are user-generated. The join is cheap on the unique key.

### 7. API route design

**Decision:** Routes registered at `/api/snb`:

| Method | Path | Source | Description |
|---|---|---|---|
| GET | `/balance` | Live API | Account balance |
| GET | `/positions` | Live API | Open positions with P&L |
| GET | `/orders` | Live API | Order list (optional status filter) |
| POST | `/orders` | Live API | Place new order |
| DELETE | `/orders/{order_id}` | Live API | Cancel order |
| GET | `/transactions` | Live API → DB sync | Transaction history (with notes) |
| PUT | `/transactions/notes` | DB | Upsert transaction note |
| GET | `/status` | Live API | Connection/token status |

### 8. Frontend: TypeScript rewrite with tabs

**Decision:** Single `SnbTradingPage.tsx` component with two tabs, following the same structure as the original but using:
- TypeScript interfaces for all API response types
- MUI v5 `sx` prop with theme variables (no `makeStyles`)
- `useTheme()` hook with `isDark` conditional for backgrounds
- `LoadingDots` component for all loading states
- Negative margin layout (`m: -3`) for seamless sidebar integration
- Frontend API module at `frontend/src/api/snb.ts`

Route: `/trading/snb` — placed under TRADING section in sidebar.

## Risks / Trade-offs

**[snbpy SDK is synchronous]** → Wrapped with `asyncio.to_thread()`. This creates a thread per call but SNB API calls are infrequent (user-triggered). Acceptable for this use case.

**[SNB API rate limits / downtime]** → All API calls wrapped in try/catch with clear error messages returned to frontend. The client auto-retries login on token expiration.

**[Transaction sync on every fetch]** → Adds write overhead per GET request. Mitigated by PostgreSQL upsert being fast on small datasets (typical trading history is hundreds of rows, not millions).

**[Single account only]** → Current design uses one global SNB client instance. Multi-account would require client-per-user architecture. Acceptable for current use case.

**[snbpy package availability]** → Must be added to `pyproject.toml` / Docker build. If not on PyPI, may need to vendor or install from git.
