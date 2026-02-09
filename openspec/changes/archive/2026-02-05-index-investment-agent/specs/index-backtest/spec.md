## ADDED Requirements

### Requirement: Simple index backtest
The system SHALL evaluate index ETF performance over a given time period with initial capital and optional monthly DCA contributions.

#### Scenario: Lump sum backtest
- **WHEN** user requests backtest with `{symbol: "VOO", start: "2020-01", end: "2025-12", initial_capital: 10000, monthly_dca: 0}`
- **THEN** the system returns `{total_return_pct, annualized_return_pct, max_drawdown_pct, sharpe_ratio, final_value, monthly_values: [...]}`

#### Scenario: DCA backtest
- **WHEN** user requests backtest with `{symbol: "VOO", start: "2020-01", end: "2025-12", initial_capital: 10000, monthly_dca: 1000}`
- **THEN** the system simulates buying at the first trading day of each month and returns cumulative performance including all DCA contributions

#### Scenario: Insufficient historical data
- **WHEN** the requested date range exceeds available data
- **THEN** the system returns an error indicating the earliest available date for the symbol

### Requirement: Multi-index comparison backtest
The system SHALL support backtesting multiple indices simultaneously for side-by-side comparison.

#### Scenario: Compare two indices
- **WHEN** user requests backtest with `{symbols: ["VOO", "QQQ"], start: "2020-01", end: "2025-12", initial_capital: 10000, monthly_dca: 1000}`
- **THEN** the system returns independent results for each symbol with identical parameters, enabling direct comparison

### Requirement: Agent decision backtest
The system SHALL replay agent decisions against historical data to verify consistency.

#### Scenario: Replay a historical Arena decision
- **WHEN** user selects a past Decision Harness for replay
- **THEN** the system re-sends the same Harness to the same models and compares the new outputs with the original outputs, reporting any differences in action or allocations

#### Scenario: Historical data isolation
- **WHEN** replaying a decision from 2025-06-01
- **THEN** the system SHALL only provide market data up to 2025-06-01 in the Harness, never including data after that date
