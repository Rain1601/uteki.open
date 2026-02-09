# Price Data Scheduler Spec

## ADDED Requirements

### Requirement: Daily price data update task
The system SHALL automatically fetch and store updated price data for all watchlist symbols after market close.

#### Scenario: Scheduled daily update
- **WHEN** the configured daily update time (default: 5:00 AM UTC, after US market close) is reached
- **THEN** system fetches latest EOD (end-of-day) data from FMP for all active watchlist symbols and stores in database

#### Scenario: Update only missing dates
- **WHEN** daily update runs
- **THEN** system only fetches data for dates not already in the database (incremental update)

### Requirement: Data continuity validation
The system SHALL detect gaps in price data and alert when data is missing.

#### Scenario: Detect missing trading days
- **WHEN** data validation runs for a symbol
- **THEN** system identifies any trading days (excluding weekends and known holidays) without price data

#### Scenario: Alert on data gaps
- **WHEN** data gaps are detected for a symbol
- **THEN** system logs a warning with the symbol and missing date range

### Requirement: Manual data refresh trigger
The system SHALL allow users to manually trigger a data refresh for all symbols or a specific symbol.

#### Scenario: Refresh all symbols
- **WHEN** user clicks "Refresh Data" button without selecting a symbol
- **THEN** system fetches latest data for all watchlist symbols

#### Scenario: Refresh single symbol
- **WHEN** user triggers refresh for a specific symbol
- **THEN** system fetches latest data only for that symbol

### Requirement: Initial history load
The system SHALL load historical data when a new symbol is added to the watchlist.

#### Scenario: New symbol added
- **WHEN** a new symbol is added to the watchlist
- **THEN** system fetches 5 years of historical daily OHLCV data from FMP and stores in database

### Requirement: Data backfill capability
The system SHALL support backfilling missing data for a specified date range.

#### Scenario: Backfill date range
- **WHEN** admin triggers backfill for a symbol with start and end dates
- **THEN** system fetches and stores all missing data within that range

### Requirement: Scheduler task management
The system SHALL allow enabling/disabling and configuring the price update schedule.

#### Scenario: Disable scheduled updates
- **WHEN** admin disables the price update task
- **THEN** automatic daily updates stop until re-enabled

#### Scenario: Configure update time
- **WHEN** admin changes the cron expression for the price update task
- **THEN** subsequent updates run at the new configured time

### Requirement: Update status tracking
The system SHALL track the status and history of data update jobs.

#### Scenario: Record successful update
- **WHEN** a price data update completes successfully
- **THEN** system records timestamp, symbols updated, and records fetched

#### Scenario: Record failed update
- **WHEN** a price data update fails (API error, network issue)
- **THEN** system records the error and affected symbols for troubleshooting
