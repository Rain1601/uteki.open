## Why

The news timeline page at `/news-timeline` has usability and readability issues that affect the user experience. The article detail dialog layout is cramped with poor visual hierarchy, the main timeline view lacks proper visual organization for scanning news quickly, and the tagging system requires manual triggering which creates friction. A systematic UI/UX redesign is needed to improve readability, interactivity, and automate the news labeling workflow.

## What Changes

### UI/UX Improvements
- Redesign ArticleDetailDialog with improved layout, spacing, and visual hierarchy
- Enhance news card design with better typography, clearer metadata display, and improved tag visibility
- Add visual indicators for news importance, market impact, and confidence levels
- Improve calendar panel with better date highlighting and news density visualization
- Enhance responsive behavior and scrolling interactions
- Add subtle animations and transitions for better perceived performance

### Automated News Labeling System
- Introduce structured labeling schema: Importance (critical/high/medium/low), Impact (bullish/bearish/neutral), Confidence (high/medium/low)
- Create background service to auto-label new articles on scrape using LLM
- Display labels prominently with color-coded badges and icons
- Enable filtering by these new label categories
- Store labels in database with the article record

### Backend Enhancements
- Add `importance_level`, `impact_confidence` fields to NewsArticle model
- Create LLM-based auto-labeling service that runs after article scraping
- Update translation service to include labeling in the same pass for efficiency

## Capabilities

### New Capabilities
- `news-auto-labeling`: Automated LLM-based labeling system that assigns importance, impact, and confidence scores to news articles during the scraping workflow
- `news-timeline-ui`: Redesigned UI components for news timeline page with improved visual hierarchy, readability, and interactivity

### Modified Capabilities
(none - this change adds new functionality without modifying existing spec-level behavior)

## Impact

**Frontend:**
- `frontend/src/pages/NewsTimelinePage.tsx` - Major redesign of layout and components
- `frontend/src/components/ArticleDetailDialog.tsx` - Improved dialog layout and styling
- `frontend/src/types/news.ts` - Add new label type definitions
- `frontend/src/api/news.ts` - Update API types for new fields

**Backend:**
- `backend/uteki/domains/news/models/news_article.py` - Add importance_level, impact_confidence fields
- `backend/uteki/domains/news/services/` - New auto-labeling service
- `backend/uteki/domains/news/services/jeff_cox_service.py` - Integrate auto-labeling into scrape workflow

**Database:**
- Migration to add new columns to news_articles table
