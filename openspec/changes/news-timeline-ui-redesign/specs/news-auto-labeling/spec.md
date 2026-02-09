## ADDED Requirements

### Requirement: Auto-label articles during scraping
The system SHALL automatically assign importance, impact, and confidence labels to news articles during the scraping workflow without manual intervention.

#### Scenario: New article scraped and labeled
- **WHEN** a new article is scraped from CNBC
- **THEN** the system automatically assigns `importance_level`, `ai_impact`, and `impact_confidence` values before saving to database

#### Scenario: Labeling combined with translation
- **WHEN** the translation service processes an article
- **THEN** the same LLM call produces both translation and labels in a single request

### Requirement: Importance level classification
The system SHALL classify each article into one of four importance levels: `critical`, `high`, `medium`, or `low`.

#### Scenario: Critical importance assigned
- **WHEN** an article discusses Federal Reserve rate decisions, major policy changes, or market-moving announcements
- **THEN** the system assigns `importance_level = "critical"`

#### Scenario: High importance assigned
- **WHEN** an article discusses significant economic data releases, employment reports, or inflation data
- **THEN** the system assigns `importance_level = "high"`

#### Scenario: Medium importance assigned
- **WHEN** an article discusses market commentary, analyst opinions, or sector-specific news
- **THEN** the system assigns `importance_level = "medium"`

#### Scenario: Low importance assigned
- **WHEN** an article discusses routine market updates or minor economic indicators
- **THEN** the system assigns `importance_level = "low"`

### Requirement: Market impact classification
The system SHALL classify each article's market impact direction as `bullish`, `bearish`, or `neutral`.

#### Scenario: Bullish impact assigned
- **WHEN** an article indicates positive market sentiment, growth signals, or dovish policy
- **THEN** the system assigns `ai_impact = "bullish"`

#### Scenario: Bearish impact assigned
- **WHEN** an article indicates negative market sentiment, recession signals, or hawkish policy
- **THEN** the system assigns `ai_impact = "bearish"`

#### Scenario: Neutral impact assigned
- **WHEN** an article has mixed signals or no clear directional impact
- **THEN** the system assigns `ai_impact = "neutral"`

### Requirement: Confidence level classification
The system SHALL assign a confidence level (`high`, `medium`, `low`) indicating certainty of the impact assessment.

#### Scenario: High confidence assigned
- **WHEN** the article contains clear, unambiguous market implications
- **THEN** the system assigns `impact_confidence = "high"`

#### Scenario: Low confidence assigned
- **WHEN** the article is speculative, opinion-based, or has conflicting signals
- **THEN** the system assigns `impact_confidence = "low"`

### Requirement: Database schema for labels
The system SHALL store label values in the NewsArticle model with appropriate field types.

#### Scenario: Fields added to model
- **WHEN** the NewsArticle model is defined
- **THEN** it includes `importance_level` (String, nullable), `ai_impact` (String, nullable, already exists), and `impact_confidence` (String, nullable)

#### Scenario: Invalid label rejected
- **WHEN** the LLM returns an invalid enum value
- **THEN** the system sets the field to null and logs a warning

### Requirement: Labeling prompt produces structured output
The system SHALL use a prompt that produces JSON output with all required label fields.

#### Scenario: JSON output parsed successfully
- **WHEN** the LLM responds with valid JSON containing label fields
- **THEN** the system extracts and stores each label value

#### Scenario: Malformed JSON handled gracefully
- **WHEN** the LLM response cannot be parsed as JSON
- **THEN** the system falls back to translation-only mode and logs the error
