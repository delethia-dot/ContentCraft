# ContentCraft TODO

## Setup & Config
- [x] Configure teal/navy/gold/white theme in theme.config.js
- [x] Update tailwind.config.js with brand colors
- [x] Set up tab navigation with 5 tabs
- [x] Add all icon mappings to icon-symbol.tsx
- [x] Generate app logo and update branding assets

## Screens
- [x] Home (Dashboard) screen with greeting, niche badge, quick-access cards
- [x] Idea Generator screen with platform selector and AI generation
- [x] URL Analyzer screen with resonance analysis
- [x] Trending Today screen with daily niche-based ideas
- [x] Content Framework screen with proven frameworks
- [x] Settings/Niche screen with niche selector

## Components
- [x] PlatformChip component (Instagram, Facebook, TikTok, YouTube, LinkedIn)
- [x] IdeaCard component with copy/save actions
- [x] AnalysisCard component with resonance score
- [x] TrendingCard component with trend score bar
- [x] NicheSheet bottom sheet for niche selection
- [x] FrameworkCard component
- [x] StatBadge for home screen stats

## AI / Backend Features
- [x] Idea Generator AI endpoint (server LLM)
- [x] URL Analyzer AI endpoint (server LLM)
- [x] Daily Trending Ideas AI endpoint (server LLM)
- [x] Content Framework AI endpoint

## Data Persistence
- [x] AsyncStorage for niche preference
- [x] AsyncStorage for saved ideas
- [x] AsyncStorage for saved analyses
- [x] AsyncStorage for daily trending cache

## Polish
- [x] Haptic feedback on primary actions
- [x] Loading states for all AI calls
- [x] Empty states for all screens
- [x] Error handling for URL analyzer
- [x] Pull-to-refresh on Trending screen
- [x] Unit tests written and passing (14/14)

## Bug Fixes
- [x] Fix niche selector not responding to taps on mobile (Pressable className issue)
- [x] Fix all Pressable components - replace with TouchableOpacity across all screens
- [x] Verify Modal bottom sheets work on iOS/Android - fixed overlay layout
- [x] Fix any other mobile interaction issues - all screens now use TouchableOpacity
