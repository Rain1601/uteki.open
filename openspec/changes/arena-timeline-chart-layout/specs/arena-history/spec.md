## MODIFIED Requirements

### Requirement: Arena history data enrichment
The `GET /api/index/arena/history` endpoint SHALL continue to return the existing fields (`harness_id`, `harness_type`, `created_at`, `budget`, `model_count`, `prompt_version`). The ArenaView component SHALL use the new timeline endpoint for chart data instead of the history endpoint for the left panel.

#### Scenario: History endpoint unchanged
- **WHEN** the client calls `GET /api/index/arena/history`
- **THEN** the response format remains identical to the current implementation

### Requirement: Arena detail panel replaces list view
The ArenaView SHALL no longer have separate "list" and "detail" view states. Instead, the right panel SHALL always show model cards (for the selected arena run), and navigation happens via the timeline chart on the left.

#### Scenario: No back button needed
- **WHEN** the user is viewing model results for a specific arena run
- **THEN** the user can switch to another run by clicking a different point on the timeline chart
- **AND** there is no "Back" button (the chart serves as the navigator)
