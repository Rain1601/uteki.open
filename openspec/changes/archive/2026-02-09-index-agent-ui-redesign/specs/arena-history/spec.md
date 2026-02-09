## ADDED Requirements

### Requirement: Arena history list endpoint
The backend SHALL provide a `GET /api/index/arena/history` endpoint that returns a paginated list of past Arena runs, ordered by creation time descending. Each item SHALL include `harness_id`, `harness_type`, `created_at`, `budget`, and `model_count` (number of associated model_io records).

#### Scenario: Fetch arena history with defaults
- **WHEN** client sends `GET /api/index/arena/history`
- **THEN** the system returns up to 20 items sorted by `created_at` descending, each containing `harness_id`, `harness_type`, `created_at`, `budget`, and `model_count`

#### Scenario: Fetch arena history with pagination
- **WHEN** client sends `GET /api/index/arena/history?limit=10&offset=10`
- **THEN** the system returns the second page of 10 items

#### Scenario: No arena history exists
- **WHEN** client sends `GET /api/index/arena/history` and no runs have been performed
- **THEN** the system returns `{"success": true, "data": []}`

### Requirement: Arena view displays history list
The Arena tab SHALL display a list of past Arena runs below the Run Arena controls when no run is in progress and no result is being viewed. Each list item SHALL show the run date, harness type, model count, and budget.

#### Scenario: User opens Arena tab with existing history
- **WHEN** user navigates to the Arena tab and past runs exist
- **THEN** the history list is displayed below the Run Arena controls showing date, type, model count, and budget for each run

#### Scenario: User opens Arena tab with no history
- **WHEN** user navigates to the Arena tab and no past runs exist
- **THEN** the existing "Multi-Model Arena" placeholder description is displayed

### Requirement: Arena history detail view
When the user clicks a history item, the Arena tab SHALL switch to a detail view showing all model results for that run using the existing ModelCard grid. A back button SHALL be displayed to return to the list view.

#### Scenario: View historical arena run details
- **WHEN** user clicks on a history list item
- **THEN** the system fetches the full arena result via `GET /api/index/arena/{harness_id}` and displays the ModelCard grid with all model outputs

#### Scenario: Return to history list from detail view
- **WHEN** user clicks the back button in the detail view
- **THEN** the view returns to the history list

### Requirement: New arena run transitions to detail view
After a new Arena run completes, the view SHALL automatically show the results in the detail view. When the user navigates back to the list, the new run SHALL appear at the top.

#### Scenario: Arena run completes
- **WHEN** user runs a new Arena and it completes successfully
- **THEN** the results are displayed in the detail view (same as clicking a history item)

#### Scenario: Navigate back after new run
- **WHEN** user clicks back after viewing a new run's results
- **THEN** the history list refreshes and shows the new run at the top

### Requirement: Chat tab removed
The Chat tab SHALL be removed from the Index Agent page navigation. The tab order SHALL be: Arena, History, Leaderboard, Backtest, Settings.

#### Scenario: Page loads without chat tab
- **WHEN** user navigates to the Index Agent page
- **THEN** the tab bar shows 5 tabs: Arena, History, Leaderboard, Backtest, Settings
- **THEN** the default active tab is Arena (index 0)

### Requirement: System prompt save uses correct HTTP method
The frontend `updatePrompt` function SHALL use the HTTP `PUT` method to match the backend route definition.

#### Scenario: Save system prompt successfully
- **WHEN** user edits the system prompt content and clicks Save
- **THEN** the frontend sends a `PUT /api/index/prompt` request and the save succeeds

### Requirement: Debug section hidden in production
The Debug section in Settings SHALL only be visible when the application is running in development mode (`import.meta.env.DEV === true`).

#### Scenario: Production build
- **WHEN** the application is built for production
- **THEN** the Debug chip and DebugSection component are not rendered in the Settings panel

#### Scenario: Development mode
- **WHEN** the application is running in development mode
- **THEN** the Debug chip and DebugSection are visible and functional in the Settings panel
