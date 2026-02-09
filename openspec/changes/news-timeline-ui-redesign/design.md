## Context

The news timeline page (`/news-timeline`) displays financial news from Jeff Cox/CNBC with AI analysis capabilities. Current implementation has:
- Left panel: Calendar + headlines list (340px fixed)
- Right panel: News cards with expandable AI analysis
- ArticleDetailDialog: Modal for full article view

Current pain points:
1. Article dialog has cramped layout with too-dense information
2. News cards lack visual hierarchy for quick scanning
3. Tags (`important`, `ai_impact`) require manual AI triggering
4. No structured labeling system for filtering by importance/confidence
5. Calendar doesn't clearly show news density per day

Existing infrastructure:
- LLM adapters for Anthropic, DeepSeek, Qwen already in place
- Translation service already uses LLM for batch processing
- `ai_impact` field exists (positive/negative/neutral) but only set during manual AI analysis

## Goals / Non-Goals

**Goals:**
- Improve readability and scannability of news timeline
- Automate labeling so new articles are tagged without user action
- Add structured importance/confidence dimensions to enable better filtering
- Enhance ArticleDetailDialog visual hierarchy and spacing
- Maintain fast page load and scroll performance

**Non-Goals:**
- Complete redesign of calendar component (only density visualization)
- Mobile-first responsive design (desktop focus)
- Real-time news push notifications
- User-customizable labeling preferences
- Multi-language label display (labels remain in English)

## Decisions

### 1. Labeling Schema Design

**Decision:** Three-dimension labeling system

| Dimension | Values | Description |
|-----------|--------|-------------|
| `importance_level` | `critical`, `high`, `medium`, `low` | How significant is this news for market participants |
| `ai_impact` | `bullish`, `bearish`, `neutral` | Market sentiment direction (already exists, reuse) |
| `impact_confidence` | `high`, `medium`, `low` | LLM's confidence in its impact assessment |

**Alternatives considered:**
- Single importance score (0-100): Rejected - harder to interpret, no confidence dimension
- Five-level scale: Rejected - too granular, harder for users to distinguish
- Emoji-based labels: Rejected - unprofessional for financial news context

**Rationale:** Three dimensions provide orthogonal information. Importance tells you "should I read this?", impact tells you "what direction?", confidence tells you "how sure is the LLM?"

### 2. Auto-labeling Architecture

**Decision:** Combine labeling with translation in single LLM call

```
[Scrape Article] → [LLM: Translate + Label] → [Save to DB]
```

**Alternatives considered:**
- Separate labeling service: Rejected - extra LLM call = more cost + latency
- Label during AI analysis: Rejected - requires manual trigger, defeats automation goal
- Rule-based labeling: Rejected - too rigid, can't understand nuance

**Rationale:** Translation already processes every scraped article. Adding labeling instructions to the same prompt is nearly free (marginal tokens) and ensures every article gets labeled automatically.

### 3. LLM Prompt Strategy

**Decision:** Structured JSON output with explicit field requirements

```
Output JSON:
{
  "title_zh": "...",
  "content_zh": "...",
  "keypoints_zh": "...",
  "importance_level": "high|medium|low|critical",
  "ai_impact": "bullish|bearish|neutral",
  "impact_confidence": "high|medium|low"
}
```

**Rationale:** JSON output is easier to parse reliably than free-form text. DeepSeek handles JSON well. Explicit enum values prevent invalid labels.

### 4. UI Label Display

**Decision:** Color-coded pill badges with icons

| Label Type | Color Scheme |
|------------|--------------|
| Critical importance | Red background, white text |
| High importance | Orange background |
| Medium importance | Blue background |
| Low importance | Gray background |
| Bullish impact | Green with up arrow |
| Bearish impact | Red with down arrow |
| Neutral impact | Gray with flat line |
| High confidence | Solid badge |
| Medium confidence | Semi-transparent badge |
| Low confidence | Outline-only badge |

**Rationale:** Color + icon provides dual encoding for accessibility. Confidence shown via opacity/style avoids badge clutter.

### 5. ArticleDetailDialog Layout

**Decision:** Two-column layout with metadata sidebar

```
┌──────────────────────────────────────────────────┐
│ Title (large, prominent)                    [X]  │
├────────────────────────────────┬─────────────────┤
│                                │ Meta sidebar:   │
│ Content area (scrollable)      │ - Author        │
│ - Key points section           │ - Date          │
│ - Full article text            │ - Source        │
│ - Tags                         │ - Labels        │
│                                │ - Impact badge  │
│                                │ - Actions       │
└────────────────────────────────┴─────────────────┘
```

**Rationale:** Separating metadata from content improves scannability. Users can focus on reading without metadata noise, but key info is always visible.

### 6. News Card Redesign

**Decision:** Horizontal layout with label strip

```
┌────────────────────────────────────────────────────┐
│ [Importance] [Impact↑] [Confidence]    12:30 CNBC │
│ Title text here (larger, bolder)                   │
│ Summary excerpt... (2-3 lines max)                 │
│ [finance] [economy]                    [EN][CN][AI]│
└────────────────────────────────────────────────────┘
```

**Rationale:** Labels at top for immediate visibility. Title prominence increased. Actions grouped at bottom-right.

## Risks / Trade-offs

**Risk: LLM labeling inconsistency**
→ Mitigation: Use temperature=0.3 for deterministic output. Add validation to reject invalid enum values and retry once.

**Risk: Translation service performance degradation**
→ Mitigation: JSON output adds ~50 tokens. Monitor latency. If problematic, can split into parallel calls.

**Risk: Label values changing over time**
→ Mitigation: Store raw LLM rationale in separate field for debugging. Version the prompt.

**Trade-off: Reusing `ai_impact` vs new `market_impact` field**
→ Decision: Reuse existing field. While it was previously set by manual analysis, auto-labeling will set it earlier. Manual AI analysis can override if needed.

**Trade-off: Complexity vs simplicity in UI**
→ Decision: Show all three label dimensions but use visual hierarchy (importance most prominent, confidence via opacity). Users can ignore confidence if they want.
