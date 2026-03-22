# ContentCraft — Mobile App Interface Design

## Brand Identity

**App Name:** ContentCraft  
**Tagline:** Create. Analyze. Trend.  
**Target Users:** Content creators, social media managers, marketers, entrepreneurs

---

## Color Palette

| Token | Light Value | Dark Value | Usage |
|-------|-------------|------------|-------|
| `primary` (Teal) | `#0D9488` | `#14B8A6` | CTAs, active tabs, highlights |
| `accent` (Gold) | `#B8860B` | `#F0C040` | Badges, trending indicators, premium feel |
| `navy` | `#0F2044` | `#1E3A6E` | Headers, section titles |
| `background` | `#FFFFFF` | `#0A0F1E` | Screen backgrounds |
| `surface` | `#F4F7FB` | `#111827` | Cards, panels |
| `foreground` | `#0F2044` | `#F0F4FF` | Primary text |
| `muted` | `#6B7280` | `#9CA3AF` | Secondary text, placeholders |
| `border` | `#E2E8F0` | `#1E3A6E` | Dividers, card borders |

---

## Screen List

1. **Home (Dashboard)** — Overview with greeting, niche badge, quick-access cards
2. **Idea Generator** — Platform selector + AI-generated content ideas
3. **URL Analyzer** — Paste URL → AI analysis of content resonance
4. **Trending Today** — Daily trending ideas based on selected niche
5. **Content Framework** — Proven frameworks (Hook-Story-Offer, AIDA, etc.)
6. **Settings / Niche** — Change niche, preferences, theme toggle

---

## Screen Details

### 1. Home (Dashboard)
- **Header:** "Good morning, [Name]" with current niche badge (gold pill)
- **Quick Stats Row:** Ideas Generated, URLs Analyzed, Streak (days)
- **Feature Cards Grid (2×2):** Idea Generator, URL Analyzer, Trending Today, Frameworks
- **Recent Activity:** Last 3 generated ideas or analyses (FlatList)
- **Bottom Tab Bar:** Home, Ideas, Analyze, Trending, More

### 2. Idea Generator
- **Platform Selector:** Horizontal scrollable chips — Instagram, Facebook, TikTok, YouTube, LinkedIn (with brand colors/icons)
- **Content Type Selector:** Post, Reel/Short, Story, Carousel, Long-form
- **Niche Display:** Current niche with "Change" link
- **Generate Button:** Large teal CTA with haptic feedback
- **Results:** Scrollable list of 5 idea cards with title, hook, CTA suggestion, copy button

### 3. URL Analyzer
- **Input Field:** Paste URL with clear button
- **Analyze Button:** Teal CTA
- **Analysis Results Card:**
  - Resonance Score (0–100, circular progress)
  - What Worked (green checkmarks)
  - What Didn't Work (red indicators)
  - Audience Insights
  - Framework Recommendation
- **Save to Library button**

### 4. Trending Today
- **Date Header:** "Trending for [Date]" with refresh indicator
- **Niche Badge:** Current niche with change option
- **Platform Filter Tabs:** All, Instagram, TikTok, YouTube, Facebook, LinkedIn
- **Trending Cards:** Title, platform icon, trend score bar, "Use This Idea" button
- **Refresh:** Pull-to-refresh for new daily ideas

### 5. Content Framework
- **Framework List:** AIDA, Hook-Story-Offer, PAS, 3-Act, Edu-Entertain, etc.
- **Framework Detail:** Step-by-step breakdown with examples per platform
- **Apply to Idea:** Link to Idea Generator with pre-filled framework

### 6. Settings / Niche
- **Niche Selector:** Search + popular niches grid (Fitness, Finance, Food, Travel, Tech, Beauty, etc.)
- **Custom Niche Input:** Free text entry
- **Preferences:** Notification toggle for daily trends
- **Theme:** Light/Dark toggle

---

## Key User Flows

### Flow 1: Generate Content Ideas
Home → Tap "Idea Generator" card → Select platform (e.g., TikTok) → Select content type → Tap "Generate" → View 5 ideas → Copy or Save idea

### Flow 2: Analyze a URL
Home → Tap "URL Analyzer" card → Paste URL → Tap "Analyze" → View resonance score + breakdown → Save analysis

### Flow 3: Daily Trending Ideas
Home → Tap "Trending Today" card → View today's trends by niche → Filter by platform → Tap "Use This Idea" → Opens Idea Generator pre-filled

### Flow 4: Change Niche
Any screen → Tap niche badge → Niche Selector sheet → Search or pick niche → Confirm → All screens update

---

## Typography

- **Headlines:** Bold, 24–32px, Navy/Foreground
- **Section Titles:** SemiBold, 18–20px
- **Body:** Regular, 14–16px, Foreground/Muted
- **Labels/Chips:** Medium, 12–13px
- **Monospace (URLs):** 12px, Muted

---

## Component Library

- `PlatformChip` — Platform selector with icon + label
- `IdeaCard` — Generated idea with copy/save actions
- `AnalysisCard` — URL analysis result with score ring
- `TrendingCard` — Trending idea with score bar
- `NicheSheet` — Bottom sheet for niche selection
- `FrameworkCard` — Framework step-by-step card
- `StatBadge` — Home screen quick stat
- `SectionHeader` — Consistent section title + action link

---

## Navigation Structure

```
Tab Bar (bottom)
├── Home (house.fill)
├── Ideas (lightbulb.fill)
├── Analyze (link)
├── Trending (chart.bar.fill)
└── More (ellipsis) → Framework, Settings
```
