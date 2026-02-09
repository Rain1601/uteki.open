# Index Data API Spec

## ADDED Requirements

### Requirement: Current day OHLC data
The quote API SHALL return current trading day OHLC data in addition to the latest price.

#### Scenario: Get quote with today's OHLC
- **WHEN** client requests GET /api/index/quotes/{symbol}
- **THEN** response includes today's open, high, low, close (if market has traded), along with existing price and change data

#### Scenario: Pre-market quote
- **WHEN** market has not opened yet for the day
- **THEN** today_open, today_high, today_low fields are null or omitted, and only previous close is returned

### Requirement: Historical OHLCV data endpoint
The system SHALL provide an endpoint to retrieve historical daily OHLCV data for charting.

#### Scenario: Get historical data with date range
- **WHEN** client requests GET /api/index/history/{symbol}?start=2024-01-01&end=2024-12-31
- **THEN** response contains array of {date, open, high, low, close, volume} objects for each trading day in range

#### Scenario: Get default historical data
- **WHEN** client requests GET /api/index/history/{symbol} without date parameters
- **THEN** response contains last 365 days of OHLCV data

### Requirement: Data validation endpoint
The system SHALL provide an endpoint to check data integrity and continuity.

#### Scenario: Validate symbol data
- **WHEN** client requests POST /api/index/data/validate with symbol parameter
- **THEN** response includes: total_records, date_range, missing_dates (if any), last_updated timestamp

#### Scenario: Validate all watchlist symbols
- **WHEN** client requests POST /api/index/data/validate without symbol parameter
- **THEN** response includes validation results for all active watchlist symbols

### Requirement: Intraday data endpoint (optional)
The system MAY provide an endpoint for intraday price data when available.

#### Scenario: Get intraday data
- **WHEN** client requests GET /api/index/intraday/{symbol}?interval=5min
- **THEN** response contains intraday OHLCV data at the specified interval (1min, 5min, 15min, 30min, 1hour)

#### Scenario: Intraday data unavailable
- **WHEN** intraday data is not available (API tier limitation or outside market hours)
- **THEN** response returns appropriate message indicating data unavailability

### Requirement: Real-time quote polling
The quote endpoint SHALL return fresh data suitable for periodic polling.

#### Scenario: Quote freshness
- **WHEN** client polls GET /api/index/quotes/{symbol} during market hours
- **THEN** response includes a timestamp indicating data freshness (delay < 15 minutes for standard tier)

#### Scenario: Stale data indicator
- **WHEN** cached quote data is older than configured threshold
- **THEN** response includes stale: true flag to indicate data may not be current
