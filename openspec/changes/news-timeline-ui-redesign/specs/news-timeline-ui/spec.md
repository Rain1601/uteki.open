## ADDED Requirements

### Requirement: News card displays label badges
The system SHALL display importance, impact, and confidence labels as color-coded badges on each news card.

#### Scenario: Importance badge displayed
- **WHEN** a news card is rendered with `importance_level` set
- **THEN** a colored badge appears at the top of the card (red=critical, orange=high, blue=medium, gray=low)

#### Scenario: Impact badge displayed with icon
- **WHEN** a news card is rendered with `ai_impact` set
- **THEN** a badge with directional icon appears (green up-arrow=bullish, red down-arrow=bearish, gray flat-line=neutral)

#### Scenario: Confidence indicated by badge style
- **WHEN** a news card is rendered with `impact_confidence` set
- **THEN** the impact badge style reflects confidence (solid=high, semi-transparent=medium, outline=low)

#### Scenario: Missing labels handled gracefully
- **WHEN** a news card is rendered without label values
- **THEN** no label badges are displayed (fail silent)

### Requirement: News card layout with label strip
The system SHALL display news cards with labels at the top, prominent title, summary excerpt, and actions at bottom.

#### Scenario: Card structure rendered
- **WHEN** a news card is displayed
- **THEN** it shows: top row with labels and metadata, large title, 2-3 line summary, bottom row with tags and action buttons

#### Scenario: Title uses translated version when available
- **WHEN** a news card has `title_zh` populated
- **THEN** the title displays the Chinese translation by default

#### Scenario: Summary truncated appropriately
- **WHEN** a news card summary exceeds 3 lines
- **THEN** the text is truncated with ellipsis

### Requirement: Filter by importance level
The system SHALL allow filtering news by importance level in addition to existing filters.

#### Scenario: Filter by critical importance
- **WHEN** user selects "critical" filter
- **THEN** only articles with `importance_level = "critical"` are displayed

#### Scenario: Filter combined with existing filters
- **WHEN** user selects both "important" and "critical" filters
- **THEN** both filter conditions are applied (AND logic)

### Requirement: ArticleDetailDialog two-column layout
The system SHALL display article details in a two-column layout with content on the left and metadata sidebar on the right.

#### Scenario: Two-column layout rendered
- **WHEN** article detail dialog opens
- **THEN** content area takes ~70% width, metadata sidebar takes ~30% width

#### Scenario: Metadata sidebar shows labels
- **WHEN** article has label values
- **THEN** metadata sidebar displays importance, impact, and confidence badges prominently

#### Scenario: Mobile fallback to single column
- **WHEN** dialog width is below 600px
- **THEN** layout falls back to single column with metadata above content

### Requirement: ArticleDetailDialog improved visual hierarchy
The system SHALL display article content with clear visual separation between sections.

#### Scenario: Title section prominent
- **WHEN** dialog renders
- **THEN** title is displayed in large font (24px+) with author/date/source on separate line below

#### Scenario: Key points section highlighted
- **WHEN** article has key points
- **THEN** they are displayed in a visually distinct box before full content

#### Scenario: Content sections separated
- **WHEN** multiple content sections exist (key points, full article, AI analysis)
- **THEN** each has clear visual separation via borders or background differences

### Requirement: Calendar shows news density
The system SHALL indicate news density on calendar days with visual cues.

#### Scenario: High-density day highlighted
- **WHEN** a calendar day has 5+ articles
- **THEN** the day cell shows a darker/larger indicator

#### Scenario: Day with critical news highlighted
- **WHEN** a calendar day has any critical-importance article
- **THEN** the day cell shows a red accent indicator

### Requirement: Smooth animations and transitions
The system SHALL use subtle animations for improved perceived performance.

#### Scenario: News card hover animation
- **WHEN** user hovers over a news card
- **THEN** card shows subtle lift effect with shadow increase (transition: 0.2s)

#### Scenario: AI analysis expand animation
- **WHEN** AI analysis section expands
- **THEN** content fades in with slide-down animation (0.3s ease)

#### Scenario: Dialog open animation
- **WHEN** article detail dialog opens
- **THEN** dialog fades in with slight scale-up effect
