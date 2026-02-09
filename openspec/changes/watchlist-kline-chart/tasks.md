# Watchlist K-Line Chart Tasks

## 1. Frontend Setup

- [x] 1.1 Install lightweight-charts@5.1.0: `npm install lightweight-charts@5.1.0`
- [x] 1.2 Create KlineChart component shell at `frontend/src/components/index/KlineChart.tsx`
- [x] 1.3 Add TypeScript types for chart props (symbol, data, interval, indicators)

## 2. K-Line Chart Core Implementation

- [x] 2.1 Implement chart initialization with useRef + useEffect lifecycle
- [x] 2.2 Add candlestick series with bullish/bearish color scheme (#4caf50/#f44336)
- [x] 2.3 Add volume histogram sub-pane below price chart
- [x] 2.4 Implement data loading from fetchHistory API
- [x] 2.5 Add crosshair tooltip showing date, OHLC, volume on hover

## 3. Chart Interactions & Features

- [x] 3.1 Implement time interval selector (Daily/Weekly/Monthly buttons)
- [x] 3.2 Add data aggregation logic for weekly/monthly intervals
- [x] 3.3 Implement MA50/MA200 indicator toggle switches
- [x] 3.4 Add moving average line series overlay
- [x] 3.5 Configure zoom (mouse wheel) and pan (drag) interactions
- [x] 3.6 Implement responsive resize using ResizeObserver

## 4. Theme Support

- [x] 4.1 Create chart theme options matching app dark/light themes
- [x] 4.2 Apply theme colors to background, grid, axes, crosshair
- [x] 4.3 Update chart theme when app theme changes

## 5. Watchlist Layout Refactor

- [x] 5.1 Refactor SettingsPanel Watchlist section to Master-Detail layout
- [x] 5.2 Create SymbolList component (240px fixed width, scrollable)
- [x] 5.3 Add symbol selection state and highlight active item
- [x] 5.4 Integrate KlineChart in right panel area
- [x] 5.5 Handle empty state (no symbol selected)

## 6. Backend - Quote API Extension

- [x] 6.1 Extend QuoteData type to include today_open, today_high, today_low fields
- [x] 6.2 Update data_service.get_quote() to fetch and return intraday OHLC from FMP
- [x] 6.3 Update GET /api/index/quotes/{symbol} response schema
- [x] 6.4 Add stale data indicator based on timestamp threshold

## 7. Backend - Data Validation

- [x] 7.1 Implement validate_data_continuity() in data_service.py
- [x] 7.2 Add logic to detect missing trading days (exclude weekends)
- [x] 7.3 Create POST /api/index/data/validate endpoint
- [x] 7.4 Return validation result with missing_dates array
- [x] 7.5 Add logging/warning when gaps detected

## 8. Backend - Scheduler Integration

- [x] 8.1 Add `price_update` task type to scheduler_service.py
- [x] 8.2 Implement price_update task handler: loop watchlist + incremental_update()
- [x] 8.3 Add data validation step after update completes
- [x] 8.4 Create default price_update schedule (cron: 0 5 * * *)
- [x] 8.5 Add task execution logging (symbols updated, records fetched, errors)

## 9. Frontend API Integration

- [x] 9.1 Add fetchValidation() API function in index.ts
- [x] 9.2 Update QuoteData interface with new fields
- [x] 9.3 Add data caching in KlineChart to avoid redundant fetches
- [x] 9.4 Show loading state while fetching chart data

## 10. Testing & Polish (Manual Verification Required)

- [ ] 10.1 Test chart rendering with real VOO/QQQ/SPY data
- [ ] 10.2 Test interval switching (daily → weekly → monthly)
- [ ] 10.3 Test MA indicator toggle on/off
- [ ] 10.4 Test theme switching (dark ↔ light)
- [ ] 10.5 Test scheduler task execution manually
- [ ] 10.6 Verify data validation detects gaps correctly
