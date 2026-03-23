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

## Onboarding Flow
- [x] Create onboarding context to track first-launch state (AsyncStorage)
- [x] Build onboarding screen 1: Welcome / hero splash
- [x] Build onboarding screen 2: Feature highlights (3 key features)
- [x] Build onboarding screen 3: Niche selection with search + popular niches
- [x] Wire onboarding gate in root layout (show onboarding if first launch)
- [x] Smooth animated transitions between onboarding steps
- [x] Skip / back navigation within onboarding
- [x] Reset onboarding option in Settings screen

## Bug Fixes - Text Visibility
- [x] Audit theme.config.js - ensure foreground/background contrast is correct
- [x] Fix text visibility on Analyze screen - fixed ScreenContainer bg-background token issue
- [x] Audit and fix text visibility on all other screens (Home, Ideas, Trending, More, Onboarding)
- [x] Ensure explicit text colors used everywhere (no reliance on inherited/default colors)
- [x] Fix ScreenContainer to use style={{ backgroundColor: colors.background }} from useColors()
- [x] Remove all containerClassName="bg-background" overrides from all 5 tab screens

## Bug Fixes - Android & UX
- [x] Fix niche sheet not showing on Android (Modal z-index / elevation issue)
- [x] Wrap platform chips instead of horizontal scroll on Ideas screen
- [x] Wrap content type chips instead of horizontal scroll on Ideas screen
- [x] Wrap platform filter chips on Trending screen

## History & Saved Results
- [x] Add History tab (6th tab) for saved ideas and URL analyses
- [x] Show saved ideas list with platform, niche, date, copy/delete actions
- [x] Show saved URL analyses with resonance score, date, delete action
- [x] Persist URL analyses to AsyncStorage automatically after each analysis
- [x] Add clear all / delete individual items functionality
