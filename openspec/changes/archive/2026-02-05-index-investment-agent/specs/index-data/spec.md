## ADDED Requirements

### Requirement: Fetch real-time ETF quotes
The system SHALL fetch real-time or near-real-time quotes for any ETF symbol via FMP API, with Alpha Vantage as fallback.

#### Scenario: Successful quote fetch
- **WHEN** `DataService.get_quote("VOO")` is called
- **THEN** the system returns `{symbol, price, change_pct, pe_ratio, market_cap, volume, high_52w, low_52w, ma50, ma200, timestamp}`

#### Scenario: FMP rate limit exceeded
- **WHEN** FMP API returns 429 or quota exceeded
- **THEN** the system falls back to Alpha Vantage for the same request

#### Scenario: Both APIs fail
- **WHEN** both FMP and Alpha Vantage return errors
- **THEN** the system returns the most recent cached price from DB with a `stale: true` flag

### Requirement: Fetch historical daily price data
The system SHALL fetch and store historical daily OHLCV data for ETF symbols.

#### Scenario: Initial history load
- **WHEN** a symbol is added to the watchlist and has no historical data in DB
- **THEN** the system fetches up to 5 years of daily price data and stores it in `index_prices` table

#### Scenario: Incremental daily update
- **WHEN** the daily update job runs
- **THEN** the system fetches only missing days since the last stored date for each watchlist symbol

### Requirement: Daily data update schedule
The system SHALL automatically update price data for all watchlist symbols once per day.

#### Scenario: Scheduled daily update
- **WHEN** the daily update cron runs (default: 06:00 UTC, after US market close)
- **THEN** the system fetches the latest daily OHLCV for every active watchlist symbol and upserts into DB

#### Scenario: Manual data refresh
- **WHEN** user triggers a manual data refresh via API
- **THEN** the system immediately fetches latest quotes for all watchlist symbols

### Requirement: Data accuracy validation
The system SHALL validate fetched price data for basic consistency.

#### Scenario: Price anomaly detection
- **WHEN** a fetched price differs from the previous close by more than 20%
- **THEN** the system logs a warning and flags the data point as `needs_review: true`

#### Scenario: Missing data detection
- **WHEN** a trading day has no price data after the update job
- **THEN** the system logs an error with the symbol and missing date

### Requirement: Watchlist management
The system SHALL allow users to add and remove ETF symbols from their observation watchlist.

#### Scenario: Add symbol to watchlist
- **WHEN** user adds a symbol (e.g., "SCHD") to their watchlist
- **THEN** the system creates a watchlist entry and triggers initial history load for that symbol

#### Scenario: Remove symbol from watchlist
- **WHEN** user removes a symbol from their watchlist
- **THEN** the system marks the watchlist entry as inactive (historical data is retained)

#### Scenario: Pre-seeded watchlist
- **WHEN** a new user initializes the system
- **THEN** the watchlist is pre-seeded with: VOO, IVV, QQQ, ACWI, VGT

### Requirement: Technical indicators calculation
The system SHALL calculate basic technical indicators from stored price data.

#### Scenario: Moving averages
- **WHEN** historical data is available for a symbol
- **THEN** the system calculates MA50, MA200, and RSI(14) from the stored daily prices

#### Scenario: Insufficient data
- **WHEN** fewer than 200 data points exist for a symbol
- **THEN** indicators requiring more data (e.g., MA200) SHALL return null
