## 1. Backend: Database Schema

- [x] 1.1 Add `importance_level` field to NewsArticle model (String, nullable, enum: critical/high/medium/low)
- [x] 1.2 Add `impact_confidence` field to NewsArticle model (String, nullable, enum: high/medium/low)
- [x] 1.3 Update `to_dict()` method to include new fields in API response

## 2. Backend: Auto-labeling Service

- [x] 2.1 Create labeling prompt template with JSON output format for importance, impact, confidence
- [x] 2.2 Modify `translation_service.py` to combine translation + labeling in single LLM call
- [x] 2.3 Add JSON parsing logic to extract label fields from LLM response
- [x] 2.4 Add validation for enum values (reject invalid, set null, log warning)
- [x] 2.5 Add fallback logic when JSON parsing fails (translation-only mode)

## 3. Backend: Integration

- [x] 3.1 Update `jeff_cox_service.py` to call enhanced translation service after scraping
- [x] 3.2 Add endpoint to re-label existing articles without translation (batch labeling)
- [ ] 3.3 Run batch labeling on existing unlabeled articles in database (requires DB migration)

## 4. Frontend: Type Definitions

- [x] 4.1 Update `NewsItem` type in `types/news.ts` to include `importance_level` and `impact_confidence`
- [x] 4.2 Add `ImportanceLevel`, `ImpactDirection`, `ConfidenceLevel` type aliases
- [x] 4.3 Update `NewsFilterType` to include importance-based filters

## 5. Frontend: Label Badge Components

- [x] 5.1 Create `ImportanceBadge` component with color mapping (red=critical, orange=high, blue=medium, gray=low)
- [x] 5.2 Create `ImpactBadge` component with directional icons (up-arrow=bullish, down-arrow=bearish, flat=neutral)
- [x] 5.3 Add confidence styling logic (solid=high, semi-transparent=medium, outline=low)
- [x] 5.4 Create `NewsLabelStrip` component that combines all three badges

## 6. Frontend: News Card Redesign

- [x] 6.1 Refactor news card to add label strip at top row
- [x] 6.2 Increase title font size and weight for prominence
- [x] 6.3 Limit summary to 3 lines with ellipsis truncation
- [x] 6.4 Move action buttons (EN/CN/AI) to bottom-right
- [x] 6.5 Add hover animation (lift effect, shadow increase, 0.2s transition)

## 7. Frontend: ArticleDetailDialog Redesign

- [x] 7.1 Implement two-column layout (70% content, 30% metadata sidebar)
- [x] 7.2 Move author, date, source, labels to metadata sidebar
- [x] 7.3 Add label badges to sidebar with prominent display
- [x] 7.4 Add clear visual separation between key points, content, and analysis sections
- [x] 7.5 Increase title font to 24px+
- [x] 7.6 Add mobile fallback to single column layout (< 600px)
- [x] 7.7 Add dialog open animation (fade in + scale up)

## 8. Frontend: Calendar Enhancement

- [x] 8.1 Add news density visualization (darker indicator for 5+ articles)
- [x] 8.2 Add red accent indicator for days with critical-importance articles
- [x] 8.3 Update calendar cell rendering to check article importance levels

## 9. Frontend: Filtering

- [x] 9.1 Add importance filter options to filter bar (critical, high, medium, low)
- [x] 9.2 Update `getFilteredNews()` to support importance-level filtering
- [x] 9.3 Combine importance filter with existing filters (AND logic)

## 10. Testing & Polish

- [ ] 10.1 Test auto-labeling with sample articles
- [ ] 10.2 Verify label display on news cards and dialog
- [ ] 10.3 Test filter combinations
- [ ] 10.4 Verify animations work smoothly
- [ ] 10.5 Test mobile fallback behavior in dialog
