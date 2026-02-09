## ADDED Requirements

### Requirement: Decision Harness construction
The system SHALL construct an immutable Decision Harness before every Arena run, containing a complete snapshot of all decision inputs.

#### Scenario: Build monthly DCA harness
- **WHEN** a monthly DCA Arena is triggered
- **THEN** the system builds a Harness containing: timestamp, system prompt version ID, market snapshot (price/PE/MA50/RSI for all watchlist symbols), account state (from SNB: cash/positions/total), memory summary, task definition (type/budget/constraints), and tool definitions

#### Scenario: Harness immutability
- **WHEN** a Harness is written to DB
- **THEN** it SHALL never be modified or deleted. Any subsequent access returns the identical data.

#### Scenario: Harness includes prompt version
- **WHEN** building a Harness
- **THEN** the `prompt_version_id` field references the currently active System Prompt version

### Requirement: System Prompt versioning
The system SHALL version-control the System Prompt used for agent decisions. Every change creates a new version.

#### Scenario: Update system prompt
- **WHEN** user modifies the System Prompt via API/UI
- **THEN** a new `prompt_version` record is created with incremented version string, the full prompt text, a change description, and `is_current = true` (previous version set to `is_current = false`)

#### Scenario: Harness records prompt version
- **WHEN** a Harness is built
- **THEN** it records the `prompt_version_id` of the current prompt, linking this decision to the exact prompt text used

### Requirement: Parallel multi-model invocation
The system SHALL invoke all configured LLM models in parallel with the same Harness input. Every decision defaults to all models (no model selection needed given weekly/monthly frequency).

#### Scenario: Run Arena with 4 models
- **WHEN** ArenaService.run(harness) is called with 4 configured models (Claude, GPT-4o, DeepSeek, Gemini)
- **THEN** the system constructs the same prompt (system prompt + Harness + tools) for each model, calls them in parallel via `asyncio.gather()`, and collects all results

#### Scenario: Single model timeout
- **WHEN** one model exceeds 60s response time
- **THEN** that model's result is recorded as `{status: "timeout"}` and the Arena continues with the remaining models

#### Scenario: Single model error
- **WHEN** one model returns an API error
- **THEN** that model's result is recorded as `{status: "error", error: "..."}` and the Arena continues

### Requirement: Structured output parsing
The system SHALL parse each model's output into a standardized structured format.

#### Scenario: Successful JSON parsing
- **WHEN** a model returns valid JSON matching the schema `{action, allocations, confidence, reasoning, chain_of_thought, risk_assessment, invalidation}`
- **THEN** the structured output is stored in `model_io.output_structured`

#### Scenario: Fallback parsing
- **WHEN** a model returns text that is not valid JSON
- **THEN** the system attempts regex extraction for key fields (action, confidence, allocation amounts) and stores partial structured data with `parse_status: "partial"`

#### Scenario: Complete parse failure
- **WHEN** neither JSON nor regex extraction succeeds
- **THEN** the raw output is stored with `parse_status: "raw_only"` and the model still appears in the Arena view (with raw text displayed)

### Requirement: Complete I/O persistence
The system SHALL persist the complete input and output for every model invocation, including: full input prompt text, output raw text, structured output, tool call chain, token counts, latency, and estimated cost.

#### Scenario: I/O record creation
- **WHEN** a model completes its Arena response
- **THEN** a `model_io` record is created with all fields: `harness_id`, `model_provider`, `model_name`, `input_prompt` (full text), `input_token_count`, `output_raw` (full text), `output_structured` (JSON), `tool_calls` (JSON array), `output_token_count`, `latency_ms`, `cost_usd`

#### Scenario: Input prompt includes everything
- **WHEN** viewing a model's input in the UI
- **THEN** the stored `input_prompt` contains the complete system prompt text, serialized Harness data, and tool definitions — the exact content sent to the model API

### Requirement: User adoption flow
The system SHALL allow users to adopt one model's recommendation from the Arena results.

#### Scenario: Adopt a model's recommendation
- **WHEN** user clicks "adopt Claude" in the Arena view
- **THEN** a Decision Card is generated from Claude's structured output, linked to the Arena and model_io record

#### Scenario: Custom allocation
- **WHEN** user clicks "custom" in the Arena view
- **THEN** user can manually define allocations, and the decision is logged as `source: "user_custom"` with no model attribution

### Requirement: Model scoring
The system SHALL track model performance scores based on user adoption and outcome-based metrics.

#### Scenario: Score update on adoption
- **WHEN** user adopts a model's recommendation
- **THEN** the model's adoption count is incremented

#### Scenario: Score update on counterfactual
- **WHEN** counterfactual tracking data becomes available (7d/30d/90d)
- **THEN** all models' win/loss records are updated based on whether their hypothetical return was positive

#### Scenario: Leaderboard by prompt version
- **WHEN** user views the leaderboard
- **THEN** scores are grouped by System Prompt version, with the current version shown by default and historical versions selectable
