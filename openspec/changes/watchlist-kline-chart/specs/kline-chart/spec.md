# K-Line Chart Component Spec

## ADDED Requirements

### Requirement: Candlestick chart rendering
The system SHALL render OHLCV data as a professional candlestick chart using TradingView lightweight-charts@5.1.0.

#### Scenario: Display daily candlestick chart
- **WHEN** user selects a symbol from the watchlist
- **THEN** system displays a candlestick chart with daily OHLCV data for the selected symbol

#### Scenario: Chart color scheme
- **WHEN** chart renders candlesticks
- **THEN** bullish candles (close > open) SHALL be green (#4caf50) and bearish candles (close < open) SHALL be red (#f44336)

### Requirement: Time interval switching
The system SHALL allow users to switch between daily, weekly, and monthly time intervals.

#### Scenario: Switch to weekly interval
- **WHEN** user selects "Weekly" interval option
- **THEN** chart aggregates daily data into weekly OHLCV candles and re-renders

#### Scenario: Switch to monthly interval
- **WHEN** user selects "Monthly" interval option
- **THEN** chart aggregates daily data into monthly OHLCV candles and re-renders

### Requirement: Technical indicator overlay
The system SHALL support overlaying MA (Moving Average) indicators on the chart.

#### Scenario: Display MA50 line
- **WHEN** user enables MA50 indicator
- **THEN** chart displays a 50-day moving average line overlaid on the candlestick chart

#### Scenario: Display MA200 line
- **WHEN** user enables MA200 indicator
- **THEN** chart displays a 200-day moving average line overlaid on the candlestick chart

### Requirement: Chart interaction
The system SHALL support zoom and pan interactions for navigating historical data.

#### Scenario: Zoom in on chart
- **WHEN** user uses mouse wheel or pinch gesture on the chart
- **THEN** chart zooms in/out while maintaining data visibility

#### Scenario: Pan through history
- **WHEN** user drags the chart horizontally
- **THEN** chart pans to show earlier or later time periods

#### Scenario: Crosshair tooltip
- **WHEN** user hovers over a candlestick
- **THEN** system displays a tooltip showing date, open, high, low, close, and volume

### Requirement: Responsive layout
The system SHALL adapt chart dimensions to container size.

#### Scenario: Container resize
- **WHEN** the container element resizes
- **THEN** chart automatically adjusts its dimensions to fill available space

### Requirement: Dark/light theme support
The system SHALL render the chart with colors matching the current application theme.

#### Scenario: Dark mode chart
- **WHEN** application is in dark mode
- **THEN** chart background, grid, and text colors match the dark theme palette

#### Scenario: Light mode chart
- **WHEN** application is in light mode
- **THEN** chart background, grid, and text colors match the light theme palette

### Requirement: Volume histogram
The system SHALL display a volume histogram below the candlestick chart.

#### Scenario: Volume bars display
- **WHEN** chart renders
- **THEN** a volume histogram is displayed in a sub-pane below the price chart with bars colored to match candle direction
