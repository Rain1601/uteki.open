## ADDED Requirements

### Requirement: Conversational interaction
The system SHALL provide a chat interface where users can ask questions about indices, holdings, and market conditions. The agent SHALL use function calling tools to gather data before responding.

#### Scenario: User asks about a specific ETF
- **WHEN** user asks "现在适合买 QQQ 吗？"
- **THEN** the agent calls `get_index_quote` and `get_index_history` tools, combines with memory context, and returns an analysis with data-backed reasoning

#### Scenario: User asks about past decisions
- **WHEN** user asks "为什么上个月没有买 VGT？"
- **THEN** the agent calls `get_decision_log` to retrieve the relevant Harness and model outputs, and explains the reasoning from the historical record

### Requirement: Decision card generation
The system SHALL generate structured Decision Cards from Arena results for user approval. Cards SHALL include the source model, confidence score, allocation details, and links to full I/O.

#### Scenario: Monthly DCA decision card
- **WHEN** an Arena analysis completes for a monthly DCA task
- **THEN** a Decision Card is generated with: budget, ETF allocations (symbol/amount/percentage/reason), source model name, confidence score, and action buttons (approve/modify/skip)

#### Scenario: Rebalance decision card
- **WHEN** an Arena analysis identifies a rebalancing opportunity
- **THEN** a Decision Card is generated with: sell/buy operations, before/after position percentages, trigger reason, and action buttons (approve/reject/discuss)

### Requirement: Order execution with user confirmation
The system SHALL execute trades via SNB only after explicit user confirmation with TOTP verification.

#### Scenario: User approves a decision card
- **WHEN** user clicks "approve" on a Decision Card and provides TOTP code
- **THEN** the system calls `SnbClient.place_order()` for each allocation and records the execution result in the decision log

#### Scenario: User modifies a decision
- **WHEN** user clicks "modify" and adjusts allocations
- **THEN** the modified allocations are recorded alongside the original model suggestion, and execution proceeds with the user's version

#### Scenario: User skips a decision
- **WHEN** user clicks "skip" on a Decision Card
- **THEN** the decision is logged as "skipped" with optional user notes, and counterfactual tracking begins

### Requirement: Watchlist expansion via agent research
The system SHALL allow the agent to propose new ETF symbols based on research, requiring user confirmation to add.

#### Scenario: Agent proposes a new symbol
- **WHEN** agent identifies a relevant ETF during research (via `search_web` tool)
- **THEN** agent generates a "New Symbol Card" with: symbol, name, type, recent performance, expense ratio, recommendation reason, and buttons (add to watchlist / dismiss)

#### Scenario: User confirms new symbol
- **WHEN** user clicks "add to watchlist" on a New Symbol Card
- **THEN** the symbol is added to the watchlist and historical data fetch is triggered

### Requirement: Position limit enforcement
The system SHALL enforce a maximum of 3 index ETF holdings at any time.

#### Scenario: Attempt to buy a 4th ETF
- **WHEN** an allocation includes a 4th distinct ETF while 3 are already held
- **THEN** the system rejects the allocation and instructs the agent to revise (sell one before buying another)

### Requirement: Memory module
The system SHALL persist agent observations, decisions, reflections, and learned experiences to a memory store. Memory SHALL be included in Decision Harness context.

#### Scenario: Write a new experience
- **WHEN** agent calls `write_memory({category: "experience", content: "Nasdaq回调>5%时考虑加仓"})`
- **THEN** the memory is persisted with category, content, timestamp, and related metadata

#### Scenario: Read memory for Harness
- **WHEN** HarnessBuilder constructs a new Harness
- **THEN** it includes: last 3 decision summaries, last 1 reflection, and all experiences (typically < 20 items)

### Requirement: Reflection generation
The system SHALL generate periodic reflections on past decisions, evaluating correctness and extracting lessons.

#### Scenario: Monthly reflection
- **WHEN** the monthly reflection schedule triggers
- **THEN** the agent reviews all decisions from the past month, compares predicted vs actual outcomes, identifies correct calls and mistakes, and writes new experiences to memory

#### Scenario: Reflection references counterfactual data
- **WHEN** generating a reflection
- **THEN** the agent SHALL reference counterfactual tracking data to note "if we had followed Model X's advice, the outcome would have been Y"

### Requirement: Agent tool set
The system SHALL expose the following tools via function calling to the agent:

#### Scenario: Tool availability
- **WHEN** the agent is invoked (chat or Arena)
- **THEN** the following tools are available: `get_index_quote`, `get_index_history`, `run_backtest`, `get_portfolio`, `get_balance`, `get_transactions`, `place_order`, `search_web`, `read_memory`, `write_memory`, `get_decision_log`
