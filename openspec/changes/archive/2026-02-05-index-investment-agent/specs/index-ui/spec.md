## ADDED Requirements

### Requirement: Main page layout with tab navigation
The system SHALL provide an IndexAgent page with tab-based navigation between different views.

#### Scenario: Page structure
- **WHEN** user navigates to the IndexAgent page
- **THEN** the page displays 5 tabs: Chat, Arena, History, Leaderboard, Settings

#### Scenario: Default tab
- **WHEN** user opens the IndexAgent page for the first time
- **THEN** the Chat tab is active by default

### Requirement: Chat panel with decision cards
The system SHALL provide a chat interface with inline decision cards for agent interaction.

#### Scenario: Chat conversation
- **WHEN** user sends a message in the chat panel
- **THEN** the agent processes the message with function calling tools and returns a response with data-backed reasoning

#### Scenario: Decision card inline display
- **WHEN** an Arena analysis completes and the user adopts a model
- **THEN** a Decision Card is rendered inline in the chat flow, showing: source model, confidence, allocation table, and action buttons (approve/modify/skip)

#### Scenario: Decision card approval with TOTP
- **WHEN** user clicks "approve" on a Decision Card
- **THEN** a TOTP input dialog appears. Upon valid TOTP, orders are placed via SNB and execution results are displayed inline.

#### Scenario: Decision card modification
- **WHEN** user clicks "modify" on a Decision Card
- **THEN** an editable allocation form appears pre-filled with the model's suggestion, allowing the user to adjust amounts before approving

### Requirement: Data panel
The system SHALL provide a data panel showing watchlist, positions, and market data alongside the chat.

#### Scenario: Watchlist display
- **WHEN** user views the data panel
- **THEN** all watchlist symbols are displayed as cards with: symbol, current price, daily change %, MA50, RSI, and a mini sparkline chart

#### Scenario: Position display
- **WHEN** user has active positions
- **THEN** the data panel shows current holdings with: symbol, quantity, average cost, current value, unrealized P&L, and portfolio weight percentage

#### Scenario: Add symbol to watchlist
- **WHEN** user clicks "add symbol" and enters an ETF symbol
- **THEN** the symbol is added to the watchlist, historical data fetch is triggered, and the new card appears

### Requirement: Arena view
The system SHALL provide a multi-model comparison view for Arena results.

#### Scenario: Current Arena display
- **WHEN** an Arena analysis has just completed
- **THEN** the Arena view shows all model results side-by-side in cards, each displaying: model name, action, allocations, confidence, key reasoning, latency, cost, and a link to full I/O

#### Scenario: Expand model I/O detail
- **WHEN** user clicks "full I/O" on a model card
- **THEN** a collapsible panel expands showing: complete input prompt (system prompt, Harness data, tool definitions — each section collapsible), complete output (chain of thought, tool calls with results, structured decision), and token counts

#### Scenario: View Harness input
- **WHEN** user clicks "view input" on the Arena header
- **THEN** the HarnessViewer component displays the complete Harness snapshot: timestamp, prompt version, market data table, account state, memory summary, task definition, and tool list

#### Scenario: Historical Arena browsing
- **WHEN** user navigates to a past Arena from the History tab
- **THEN** the Arena view renders the historical results identically, with all I/O data loaded from the stored `model_io` records

#### Scenario: Adopt model recommendation
- **WHEN** user clicks "adopt [Model Name]" in the Arena view
- **THEN** a Decision Card is generated from that model's structured output and presented for approval

### Requirement: Decision timeline view
The system SHALL provide a chronological timeline of all past decisions with expandable detail and counterfactual data.

#### Scenario: Timeline rendering
- **WHEN** user opens the History tab
- **THEN** decisions are listed in reverse chronological order, grouped by month, showing: date, type, prompt version badge, number of Arena models, adopted model, user action, and execution summary

#### Scenario: Expand decision detail
- **WHEN** user expands a decision in the timeline
- **THEN** the expanded view shows: Harness content (via HarnessViewer), all model I/O (expandable per model), user action and notes, execution results (actual trades), and counterfactual data

#### Scenario: Counterfactual badges
- **WHEN** counterfactual data is available for a decision (7d/30d/90d)
- **THEN** each model's entry shows a CounterfactualBadge: green for positive hypothetical return ("missed opportunity" if not adopted), red for negative ("dodged bullet" if not adopted)

#### Scenario: Timeline filtering
- **WHEN** user applies filters (date range, decision type, model name, user action)
- **THEN** the timeline updates to show only matching decisions

### Requirement: Leaderboard view
The system SHALL provide a model performance leaderboard grouped by System Prompt version.

#### Scenario: Leaderboard display
- **WHEN** user opens the Leaderboard tab
- **THEN** models are ranked in a table showing: rank, model name, adoption rate, win rate, average return, counterfactual win rate, total score, and trend arrow

#### Scenario: Prompt version grouping
- **WHEN** user views the leaderboard
- **THEN** scores are grouped by System Prompt version, with the current version shown by default and a dropdown to select historical versions

#### Scenario: Detailed model comparison
- **WHEN** user clicks "detailed comparison"
- **THEN** a drill-down view shows per-decision performance for each model, with links to the specific Arena and I/O records

### Requirement: Settings tab
The system SHALL provide a settings view for managing schedules, watchlist, and System Prompt.

#### Scenario: Scheduler panel
- **WHEN** user opens the Settings tab
- **THEN** the scheduler panel shows all schedule tasks with: name, cron expression (human-readable), next trigger time (absolute + relative), last run time and status, and buttons for trigger/edit/enable-disable

#### Scenario: System Prompt editor
- **WHEN** user opens the System Prompt section in Settings
- **THEN** the current prompt text is displayed in an editor, with the version number shown. Saving creates a new version with a change description.

#### Scenario: Prompt version history
- **WHEN** user clicks "version history" in the System Prompt section
- **THEN** a list of all prompt versions is displayed with: version number, date, change description, and option to view full text or diff against previous version

### Requirement: Backtest visualization
The system SHALL provide charts for backtest results.

#### Scenario: Single index backtest chart
- **WHEN** a backtest completes for a single index
- **THEN** a line chart shows cumulative portfolio value over time, with annotations for DCA contribution points, and a summary panel showing total return, annualized return, max drawdown, and Sharpe ratio

#### Scenario: Multi-index comparison chart
- **WHEN** a backtest completes for multiple indices
- **THEN** overlaid line charts show each index's performance, with a comparison table below showing key metrics side by side
