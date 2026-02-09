## ADDED Requirements

### Requirement: Real-time account balance query
The system SHALL fetch account balance data live from the SNB API on every request. The response MUST include total assets, cash, market value, and available funds with field names normalized for the frontend (`total_value`, `market_value`, `cash`).

#### Scenario: Successful balance fetch
- **WHEN** the frontend requests `GET /api/snb/balance`
- **THEN** the backend calls the SNB API in real-time, transforms field names, and returns the balance data with `success: true`

#### Scenario: SNB API is unreachable
- **WHEN** the frontend requests `GET /api/snb/balance` and the SNB API is down or returns an error
- **THEN** the backend returns `success: false` with a descriptive error message, and does not crash or hang

#### Scenario: Token expired
- **WHEN** the SNB client token has expired before a balance request
- **THEN** the backend automatically re-logs-in before making the API call, transparently to the frontend

### Requirement: Real-time positions query
The system SHALL fetch open positions live from the SNB API. Each position MUST include computed fields: `quantity`, `cost` (quantity * average_price), `market_value` (quantity * market_price), and `unrealized_pnl` (market_value - cost).

#### Scenario: Successful positions fetch with P&L calculation
- **WHEN** the frontend requests `GET /api/snb/positions`
- **THEN** the backend returns a list of positions, each with the original SNB fields plus computed `quantity`, `cost`, `market_value`, and `unrealized_pnl`

#### Scenario: No open positions
- **WHEN** the account has no open positions
- **THEN** the backend returns `success: true` with an empty list `[]`

### Requirement: Real-time orders query
The system SHALL fetch orders live from the SNB API with optional status filtering and limit.

#### Scenario: Fetch all orders
- **WHEN** the frontend requests `GET /api/snb/orders`
- **THEN** the backend returns up to 100 orders (default limit) from the SNB API

#### Scenario: Fetch orders with status filter
- **WHEN** the frontend requests `GET /api/snb/orders?status=PENDING`
- **THEN** the backend returns only orders matching the specified status

### Requirement: Place order
The system SHALL allow placing market or limit orders through the SNB API. The request MUST validate that `symbol`, `side` (BUY/SELL), and `quantity` are provided. For limit orders, `price` MUST be provided.

#### Scenario: Place a market order
- **WHEN** the frontend sends `POST /api/snb/orders` with `{symbol: "AAPL", side: "BUY", quantity: 10, order_type: "MKT"}`
- **THEN** the backend places the order via SNB API and returns the order confirmation with `success: true`

#### Scenario: Place a limit order
- **WHEN** the frontend sends `POST /api/snb/orders` with `{symbol: "AAPL", side: "SELL", quantity: 5, order_type: "LMT", price: 150.00, time_in_force: "GTC"}`
- **THEN** the backend places the limit order via SNB API and returns the order confirmation

#### Scenario: Place limit order without price
- **WHEN** the frontend sends a limit order request without a `price` field
- **THEN** the backend returns a 422 validation error with a message indicating price is required for limit orders

### Requirement: Cancel order
The system SHALL allow cancelling a pending order by order ID.

#### Scenario: Cancel a pending order
- **WHEN** the frontend sends `DELETE /api/snb/orders/{order_id}`
- **THEN** the backend cancels the order via SNB API and returns `success: true`

#### Scenario: Cancel a non-existent order
- **WHEN** the frontend sends a cancel request with an invalid order_id
- **THEN** the backend returns `success: false` with the error from SNB API

### Requirement: Transaction history persistence
The system SHALL fetch transaction records from the SNB API and persist them to the `snb.snb_transactions` PostgreSQL table using upsert logic. The unique key for upsert MUST be `(account_id, symbol, trade_time, side)`. Existing records MUST be updated (not duplicated) when the same transaction is fetched again.

#### Scenario: Fetch and persist transactions
- **WHEN** the frontend requests `GET /api/snb/transactions`
- **THEN** the backend fetches transactions from SNB API, upserts them into PostgreSQL, and returns the persisted records joined with any existing notes

#### Scenario: Fetch transactions with symbol filter
- **WHEN** the frontend requests `GET /api/snb/transactions?symbol=AAPL`
- **THEN** the backend returns only transactions for the specified symbol

#### Scenario: Re-fetch does not create duplicates
- **WHEN** the frontend requests transactions multiple times for the same time period
- **THEN** the database contains exactly one row per unique (account_id, symbol, trade_time, side) combination — no duplicates

#### Scenario: Transaction data is updated on re-fetch
- **WHEN** a transaction record's metadata (e.g., commission) has changed in the SNB API since last sync
- **THEN** the upsert updates the existing row with the latest data and the `updated_at` timestamp is refreshed

### Requirement: Transaction notes create and edit
The system SHALL support creating and editing notes on transactions via a single upsert endpoint. The unique key for notes MUST be `(account_id, symbol, trade_time, side)`. The `is_reasonable` field (boolean, nullable) and `notes` field (text) MUST both be editable.

#### Scenario: Create a new note
- **WHEN** the frontend sends `PUT /api/snb/transactions/notes` with `{account_id, symbol, trade_time, side, is_reasonable: true, notes: "Good entry point"}`
- **THEN** the backend creates a new note record and returns it with `success: true`

#### Scenario: Edit an existing note
- **WHEN** the frontend sends `PUT /api/snb/transactions/notes` with the same unique key but different `is_reasonable` or `notes` values
- **THEN** the backend updates the existing note in-place (not creating a duplicate), the `updated_at` timestamp is refreshed, and the response contains the updated note

#### Scenario: Clear a note's reasonableness evaluation
- **WHEN** the frontend sends a note update with `is_reasonable: null`
- **THEN** the backend updates the note, setting `is_reasonable` to NULL (no evaluation)

#### Scenario: Concurrent note updates
- **WHEN** two requests attempt to update the same note simultaneously
- **THEN** one succeeds and the other either succeeds with the later value or returns a conflict error — no duplicate rows are created

### Requirement: Connection status check
The system SHALL provide an endpoint to check the SNB client connection and token status.

#### Scenario: Check status when connected
- **WHEN** the frontend requests `GET /api/snb/status`
- **THEN** the backend returns connection status including whether the client is logged in and token validity

### Requirement: SNB client configuration
The system SHALL read SNB credentials from environment variables (`SNB_ACCOUNT`, `SNB_API_KEY`, `SNB_ENV`). If environment variables are not set, the system SHALL return a clear error message on any API call.

#### Scenario: Environment variables configured
- **WHEN** `SNB_ACCOUNT`, `SNB_API_KEY`, and `SNB_ENV` are set
- **THEN** the SNB client initializes successfully and API calls work normally

#### Scenario: Environment variables missing
- **WHEN** SNB environment variables are not configured
- **THEN** any API call to `/api/snb/*` returns HTTP 503 with message "SNB credentials not configured"

### Requirement: Frontend trading page
The system SHALL provide a trading page at route `/trading/snb` accessible from the sidebar under the TRADING section. The page MUST support both dark and light themes using the existing theme system.

#### Scenario: Page loads with balance dashboard
- **WHEN** the user navigates to `/trading/snb`
- **THEN** the page displays account balance (total assets, cash, market value, available funds) fetched in real-time, with LoadingDots during loading

#### Scenario: Positions tab shows P&L
- **WHEN** the user views the positions tab
- **THEN** each position shows symbol, quantity, average cost, market price, market value, unrealized P&L, and return percentage

#### Scenario: Orders tab with create and cancel
- **WHEN** the user is on the positions & orders tab
- **THEN** the user can view pending orders, create new orders via a dialog, and cancel pending orders with confirmation

#### Scenario: Transaction history tab with notes
- **WHEN** the user switches to the transaction history tab
- **THEN** the user sees a table of transactions with symbol filter, and can click to add or edit notes on any transaction

#### Scenario: Edit existing note via dialog
- **WHEN** the user clicks the note icon on a transaction that already has a note
- **THEN** the notes dialog opens pre-filled with the existing `is_reasonable` and `notes` values, and the user can modify and save them

#### Scenario: Theme compatibility
- **WHEN** the user switches between dark and light theme
- **THEN** all page elements (backgrounds, text, borders, chips) adapt correctly using theme variables
