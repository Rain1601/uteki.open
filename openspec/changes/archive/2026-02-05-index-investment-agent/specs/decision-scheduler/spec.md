## ADDED Requirements

### Requirement: Cron-based decision scheduling
The system SHALL support cron-based scheduling of decision tasks, with task configuration persisted in the database.

#### Scenario: Monthly DCA schedule
- **WHEN** the system starts with a configured monthly DCA schedule (`0 9 1 * *`)
- **THEN** APScheduler registers the job, calculates the next trigger time, and displays it in the scheduler panel

#### Scenario: Weekly position check schedule
- **WHEN** the system starts with a configured weekly check schedule (`0 9 * * 1`)
- **THEN** APScheduler registers the job, and on trigger it builds a Harness with `harness_type: "weekly_check"` and runs an Arena analysis

#### Scenario: Monthly reflection schedule
- **WHEN** the monthly reflection schedule triggers
- **THEN** the system invokes the agent in reflection mode (review past decisions, compare outcomes, write experiences to memory)

### Requirement: Schedule persistence and recovery
Schedule tasks SHALL be persisted in the database and automatically recovered after process restart.

#### Scenario: Process restart recovery
- **WHEN** the backend process restarts
- **THEN** all enabled schedule tasks are reloaded from the `schedule_task` table and re-registered with APScheduler, preserving their next trigger times

#### Scenario: Missed trigger after downtime
- **WHEN** the system was down during a scheduled trigger time
- **THEN** the missed job is executed once upon recovery (APScheduler `misfire_grace_time` configuration)

### Requirement: Manual trigger
The system SHALL allow users to manually trigger any scheduled task immediately.

#### Scenario: User triggers monthly DCA manually
- **WHEN** user clicks "trigger now" on the monthly DCA schedule
- **THEN** the system immediately builds a Harness and runs the Arena analysis, same as an automatic trigger. The `last_run_at` is updated.

#### Scenario: Manual trigger while a run is in progress
- **WHEN** user triggers a task that is already running
- **THEN** the system rejects the trigger with an error indicating the task is already in progress

### Requirement: Schedule editing
The system SHALL allow users to create, edit, enable/disable, and delete schedule tasks via API.

#### Scenario: Edit cron expression
- **WHEN** user changes the monthly DCA cron from `0 9 1 * *` to `0 9 15 * *`
- **THEN** the schedule is updated in DB, APScheduler reschedules the job, and the new `next_run_at` is recalculated and displayed

#### Scenario: Disable a schedule
- **WHEN** user disables a schedule task
- **THEN** the job is paused in APScheduler, `is_enabled` is set to `false`, and the task no longer triggers automatically

#### Scenario: Create a new schedule
- **WHEN** user creates a new schedule task with name, cron expression, task type, and config
- **THEN** the task is persisted in DB and registered with APScheduler

#### Scenario: Delete a schedule
- **WHEN** user deletes a schedule task
- **THEN** the job is removed from APScheduler and the DB record is deleted

### Requirement: Schedule status visibility
The system SHALL display the current status of each schedule task, including next trigger time and last run result.

#### Scenario: Display next trigger time
- **WHEN** user views the scheduler panel
- **THEN** each enabled task shows: name, cron expression (human-readable), next trigger time (with relative time like "25 days from now"), last run time, and last run status

#### Scenario: Last run status tracking
- **WHEN** a scheduled task completes
- **THEN** `last_run_at` and `last_run_status` are updated. Status can be: `success`, `error`, or `pending_user_action` (Arena completed, awaiting user decision)

### Requirement: Pre-seeded default schedules
The system SHALL create default schedule tasks on first initialization.

#### Scenario: Default schedules
- **WHEN** the system initializes with no existing schedule tasks
- **THEN** the following defaults are created:
  - Monthly DCA analysis: `0 9 1 * *` (1st of month, 09:00 UTC)
  - Weekly position check: `0 9 * * 1` (Monday, 09:00 UTC)
  - Monthly reflection: `0 18 L * *` (last business day of month, 18:00 UTC)
