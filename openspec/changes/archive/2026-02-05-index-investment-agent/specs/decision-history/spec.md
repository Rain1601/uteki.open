## ADDED Requirements

### Requirement: Decision log persistence
The system SHALL create an immutable decision log entry for every Arena decision, regardless of whether the user approves, modifies, or skips.

#### Scenario: Approved decision
- **WHEN** user approves a decision card with TOTP
- **THEN** a `decision_log` record is created with: `harness_id`, `adopted_model_io_id`, `user_action: "approved"`, `executed_allocations` (actual trades), `execution_results` (SNB order responses)

#### Scenario: Modified decision
- **WHEN** user modifies allocations before approving
- **THEN** a `decision_log` record is created with: `user_action: "modified"`, `original_allocations` (from model), `executed_allocations` (user's version), user notes

#### Scenario: Skipped decision
- **WHEN** user skips a decision
- **THEN** a `decision_log` record is created with: `user_action: "skipped"`, optional user notes, no execution results

#### Scenario: Rejected decision
- **WHEN** user rejects a decision (e.g., rebalance suggestion)
- **THEN** a `decision_log` record is created with: `user_action: "rejected"`, optional user notes

### Requirement: Immutable records
Decision log entries SHALL be append-only. No updates or deletes are permitted.

#### Scenario: Attempt to modify a decision log
- **WHEN** any code attempts to update or delete a `decision_log` record
- **THEN** the operation SHALL be rejected (enforced at application layer)

### Requirement: Counterfactual tracking
The system SHALL track hypothetical returns for ALL model suggestions (adopted and non-adopted) at 7-day, 30-day, and 90-day intervals.

#### Scenario: Counterfactual calculation at 30 days
- **WHEN** 30 days have passed since a decision
- **THEN** the system calculates, for each model's allocation: the hypothetical return percentage based on entry prices (from Harness snapshot) vs prices 30 days later

#### Scenario: Counterfactual for skipped decisions
- **WHEN** a decision was skipped (no model adopted)
- **THEN** counterfactual tracking still runs for all models' suggestions, showing what would have happened

#### Scenario: "Missed opportunities" identification
- **WHEN** a non-adopted model's suggestion has positive counterfactual return
- **THEN** this is classified as a "missed opportunity" and attributed to that model's counterfactual win rate

#### Scenario: "Dodged bullet" identification
- **WHEN** a non-adopted model's suggestion has negative counterfactual return
- **THEN** this is classified as a "dodged bullet"

### Requirement: Decision timeline view
The system SHALL provide a chronological timeline of all decisions with expandable detail.

#### Scenario: Timeline listing
- **WHEN** user opens the decision history view
- **THEN** decisions are listed in reverse chronological order, showing: date, type (monthly DCA / rebalance / etc.), prompt version, number of Arena models, adopted model, user action, execution summary

#### Scenario: Expand decision detail
- **WHEN** user expands a decision in the timeline
- **THEN** the system displays: Harness content (market snapshot + account state), all model I/O (expandable per model), user action and notes, execution results, counterfactual data (if available)

#### Scenario: Filter and search
- **WHEN** user applies filters (date range, decision type, model name, user action)
- **THEN** the timeline is filtered accordingly

### Requirement: Post-decision performance tracking
The system SHALL track actual portfolio performance after each executed decision at 7d, 30d, 90d intervals.

#### Scenario: 30-day performance update
- **WHEN** 30 days have passed since an executed decision
- **THEN** the system calculates actual return of the executed trades and records it in the decision log
