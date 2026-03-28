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

## New Features - Round 3
- [x] History tab: native share button on each saved idea (Share API)
- [x] History tab: full idea detail modal (hook, body, CTA, platform, niche)
- [x] History tab: export button to compile all ideas for a platform into a text block
- [x] Ideas tab: add Image / Graphic content type
- [x] Ideas tab: add Video (Scripted) content type
- [x] Server router: image and video added to contentTypeSchema
- [x] New Prompt Generator tab: AI-powered image/video prompt generator
- [x] Prompt Generator: tool selector (Midjourney, DALL-E 3, Stable Diffusion, Sora, Runway, Kling)
- [x] Prompt Generator: platform + aspect ratio selector per platform
- [x] Prompt Generator: visual style chips (10 styles)
- [x] Prompt Generator: mood & atmosphere chips (10 moods)
- [x] Prompt Generator: subject and additional details text inputs
- [x] Prompt Generator: main prompt, negative prompt, tips, variations output
- [x] Prompt Generator: copy individual fields and share full prompt
- [x] Server router: generatePrompt endpoint with LLM integration (6 tools supported)

## New Features - Round 4
- [x] Prompt Generator: add "Custom Tool" option for any user-specified AI tool
- [x] Prompt Generator: custom tool name input field (e.g. Ideogram, Adobe Firefly, Pika)
- [x] Prompt Generator: AI optimizes prompt for the custom tool the user specifies
- [x] Prompt Generator: save generated prompts to History tab
- [x] History tab: show saved prompts section alongside ideas and analyses
- [x] History tab: prompt cards show tool name, media type, subject, copy/share/delete
- [x] Caption Writer screen: new tab with platform-optimized caption generation
- [x] Caption Writer: input idea title/topic and select platform
- [x] Caption Writer: AI generates full caption with hashtags, emojis, character count
- [x] Caption Writer: copy caption and hashtags separately
- [x] Caption Writer: tone selector (professional, casual, witty, inspirational, educational)
- [x] Caption Writer: character count bar with platform limit
- [x] Caption Writer: A/B test hook alternative
- [x] Caption Writer: platform-specific tips
- [x] Caption Writer: save to History and native share
- [x] Content Calendar screen: new tab for scheduling ideas to dates
- [x] Content Calendar: weekly and monthly view
- [x] Content Calendar: pin/schedule generated ideas to specific dates and platforms
- [x] Content Calendar: visual posting schedule with platform color coding
- [x] Content Calendar: tap a date to add or view scheduled ideas
- [x] Content Calendar: link saved ideas to calendar entries
- [x] Content Calendar: mark posts as complete with checkbox
- [x] Content Calendar: upcoming posts summary (next 7 days)
- [x] History tab: 4 sub-tabs (Ideas, Analyses, Prompts, Captions)
- [x] History tab: caption cards with copy/share/delete
- [x] Caption tab added to main tab bar
- [x] Calendar tab added to main tab bar

## New Features - Round 5
- [x] Hashtag Research: trending hashtag finder inside Caption Writer (niche + platform input, ranked by reach/competition)
- [x] Hashtag Research: copy individual hashtags and full hashtag block
- [x] Hashtag Research: server endpoint for AI hashtag suggestions
- [x] Post Performance Tracker: manual entry of published post metrics (likes, views, shares, comments)
- [x] Post Performance Tracker: compare actual performance vs AI resonance score prediction
- [x] Post Performance Tracker: platform breakdown and performance history list
- [x] Post Performance Tracker: save/persist tracker entries to AsyncStorage
- [x] Tracker tab added to main tab bar
- [x] Niche Competitor Analysis: "Analyze Competitor" mode in Analyze tab
- [x] Niche Competitor Analysis: accept competitor profile URL or handle
- [x] Niche Competitor Analysis: identify top-performing content patterns and posting frequency
- [x] Niche Competitor Analysis: server endpoint for competitor analysis
- [x] Responsive Layout: useResponsive hook for tablet/desktop breakpoints
- [x] Responsive Layout: tablet/desktop multi-column grid for Home screen
- [x] Responsive Layout: responsive tab bar height for tablet
- [x] All 82 tests pass

## Desktop/Tablet Layout & Notifications
- [x] Build sidebar navigation component for tablet/desktop (replaces bottom tab bar)
- [x] Sidebar: icon-only on tablet (72px), full labels on desktop (220px)
- [x] Sidebar: shows app logo, nav items with icons + labels, active state, niche badge
- [x] Tab layout: detect breakpoint and render sidebar vs bottom tab bar
- [x] DesktopContainer: max-width centered container (900px desktop, 680px tablet)
- [x] Desktop Home: responsive multi-column feature card grid
- [x] Desktop Ideas: DesktopContainer wrapping for centered layout
- [x] Desktop Trending: DesktopContainer wrapping for centered layout
- [x] notification-service.ts: daily local notification scheduling with expo-notifications
- [x] Notification handler setup in root _layout.tsx
- [x] Daily Reminder toggle in Settings tab (More screen)
- [x] Configurable reminder time (hour +/- 1, minute +/- 15)
- [x] Android notification channel setup (contentcraft-reminders)
- [x] Permission request with fallback alert if denied
- [x] Notification prefs persisted to AsyncStorage
- [x] minus icon added to icon-symbol.tsx
- [x] All 82 tests pass

## Bug Fixes & Navigation Overhaul
- [x] Fix TikTok icon not visible in dark mode (changed to teal #00C2CB)
- [x] Add "Powered by Simply Your Marketer, LLC" to About section in Settings
- [x] Reorganize bottom nav: reduce to 5 primary tabs (Home, Ideas, Trending, Tools, More)
- [x] Create Tools hub screen accessible from Tools tab (Analyze, Prompt, Caption, Calendar, Tracker, Competitor, History)
- [x] Remove Analyze, Prompt, Caption, Calendar, Tracker from bottom tab bar
- [x] Update sidebar nav to reflect new navigation structure
- [x] Ensure all Tools hub items navigate correctly to their screens

## Bug Fixes - Navigation & Persistence
- [x] History missing from mobile navigation - added to Tools Hub grid
- [x] History card added to Home screen Quick Access grid (5th card)
- [x] Saved Ideas stat on Home now taps through to History screen
- [x] Frameworks stat on Home now taps through to More/Frameworks screen
- [x] "See all" link on Home Saved Ideas preview now goes to History (was going to Ideas)
- [x] URL analyses persist correctly - Analyze writes to @contentcraft_analyses, History reads same key
- [x] All 82 tests pass

## Bug Fixes - Navigation UX (Round 2)
- [x] Home: Platforms stat should navigate to Ideas tab (shows all 5 platforms)
- [x] Home: Saved Ideas preview cards should open full idea detail modal when tapped
- [x] History: sub-tabs (Ideas/Analyses/Prompts/Captions) should be fixed-width, not scroll off screen
- [x] History: sticky header + tab bar so they stay visible while content scrolls
- [x] History: analysis cards should open a full detail modal when tapped
- [x] History: idea cards should open full idea detail modal when tapped
- [x] History: prompt cards should open full prompt detail modal when tapped
- [x] History: caption cards should open full caption detail modal when tapped

## Share Web/Desktop URL
- [x] Add deployed web URL (contentapp-mkf2zi5j.manus.space) to app constants
- [x] Add "Share App" / "Share Desktop Link" option in Settings/More screen
- [x] Include web URL in the app's native share sheet so users can share access to the desktop version

## Settings Desktop Fixes
- [x] Fix Replay Onboarding button not working on desktop
- [x] Fix Daily Reminder toggle/button not working on desktop (hidden on web — push notifications not supported in browser)
- [x] Fix Appearance (dark mode) toggle not working on desktop
- [x] Update Open Desktop and Share App URL from manus.space to contentcraft-app.netlify.app

## Dark Mode Toggle Web Fix
- [x] Fix dark mode / appearance toggle not applying theme change on desktop web

## Bug Fixes Round 3
- [x] Dark mode toggle still not working on desktop web (deeper fix needed)
- [x] TikTok color fixed to teal (#00C2CB) across all screens — was incorrectly set to near-black #010101

## URL Analyzer Fix
- [x] URL Analyzer fixed: AI prompt rewritten to stop fabricating follower counts/niche data, disclaimer banner added to results, section reframed as strategy advice not real analytics

## Approved Changes Batch
- [x] Remove URL Analyzer tab (analyze.tsx) from tab bar, desktop sidebar, and Tools Hub
- [x] Rename Trending tab to "Content Playbook" everywhere (tab bar, desktop sidebar, screen title, Tools Hub)
- [x] Replace appearance toggle switch with Light/Dark click buttons in Settings
- [x] URL Analyzer removed; Niche Strategy deferred to next session
- [x] Redeploy to Netlify

## Appearance Fix
- [x] Restore toggle switch on mobile, keep Light/Dark buttons on desktop web (platform detection)

## Critical Fixes
- [x] Remove Analyze tab completely — deleted analyze.tsx file so Expo Router no longer auto-adds it to the tab bar
- [x] Fix Appearance: isDark now reads from ThemeContext (reactive) instead of useColorScheme (stale) — buttons now update correctly on press

## Appearance Button Web Fix (Round 2)
- [x] Light/Dark buttons fixed: useColors now reads from ThemeContext (not system hook) so all components re-render when scheme changes
- [x] Add Caption Writer as third feature card on onboarding Features slide so "Three powerful tools" subtitle is accurate
- [x] Diagnose and fix Caption Writer not working
- [x] Deploy backend to Railway for permanent 24/7 hosting (api-production-1afb.up.railway.app)

## Approved Fixes - Content Quality Round
- [x] Fix Idea Generator: format-specific AI prompts and structured outputs (script, carousel breakdown, image brief, short-form, blog)
- [x] Fix Idea Generator UI: render format-specific sections per content type
- [x] Rename Hashtag Research to Hashtag Suggestions with disclaimer about AI training data
- [x] Reframe Content Playbook as Niche Intelligence (Competitor Landscape, Content Gaps, Audience Pain Points, Content Pillars)
- [x] Remove broken "Use this Idea" button from Content Playbook / Niche Intelligence
- [x] Add disclaimer to Niche Intelligence: based on AI training data, not live analytics

## UI Fixes Round 2
- [x] Onboarding features slide: add instructional note above feature cards ("Tap the Choose Your Niche button below to continue")
- [x] Desktop Niche Intelligence: fix Content Gaps first-line text overflow — ensure text wraps correctly
- [x] Desktop menu/sidebar: rename "Content Playbook" to "Niche Intelligence"
- [x] Niche Intelligence (desktop + mobile): add Save button to results so users can save to History

## Bug Fixes Round 4
- [ ] History Analyses tab: show saved Niche Intelligence analyses (currently saved to @contentcraft_niche_analyses but not displayed in History)
- [ ] Niche Intelligence desktop: Content Gaps text still not fully wrapping — fix container flex/shrink styles

## Bug Fixes Round 5
- [x] History tab mobile: tapping saved items (ideas, analyses, prompts, captions) does not open detail modal — works on desktop but broken on mobile

## Bug Fixes Round 6
- [x] History tab Android: detail modals do not open on physical Android device (works in web preview, broken on native)

## Regression Fixes Round 7
- [x] Content Gaps text wrapping broken on desktop — reverted gapCard/gapTitle to exact working state from checkpoint f76501a
- [x] History modals still not opening on Android after APK 1.0.17 (nested touch fix was insufficient)

## Bug Fixes Round 8
- [x] Content Gaps badge text overflow on desktop — gapBadge and gapBadgeText need flexWrap so long content format strings wrap correctly

## Bug Fixes Round 9
- [x] Content Gaps badge flexWrap on View breaks mobile layout — remove from gapBadge View, keep only on gapBadgeText

## Bug Fixes Round 10
- [x] History modals Android: ScrollView content body collapses to zero height — fix with useWindowDimensions explicit height

## Critical APK Fix
- [x] APK crashes on any feature tap when sandbox is offline — hardcoded Railway URL fallback in getApiBaseUrl() so native builds always reach the production server
- [x] Niche Intelligence silent catch replaced with proper Alert so failures show a message instead of crashing silently

## Feature Updates Round 11
- [x] History: add export functionality to Analyses tab (compile all analyses into exportable text block)
- [x] History: add export functionality to Prompts tab (compile all prompts into exportable text block)
- [x] History: add export functionality to Captions tab (compile all captions into exportable text block)
- [x] Idea Generator: add "Talking Head" content type with topics best suited for talking head videos
- [x] Idea Generator: server prompt for Talking Head — industry insights, how-to tutorials, Q&As, company announcements, storytelling
- [x] Prompt Generator: replace Sora with Hedra as a video AI tool option

## Bug Fixes Round 12
- [x] Talking Head content type: clicking Generate 5 Ideas does nothing — Railway server was running old code without talking-head in contentTypeSchema; redeployed server to Railway

## Feature Updates Round 13
- [x] Add "Use in Caption Writer" shortcut button on Talking Head idea cards — pre-fills Caption Writer with idea title and platform

## Feature Updates Round 14
- [x] Idea Generator: add visualDirection field to every idea — 3 image suggestions, 3 video suggestions, best-pick recommendation, lighting, colors, camera angle, and prompt-ready elements
- [x] Server: extend generateIdeas AI prompt to return visualDirection object for all content types and platforms
- [x] ideas.tsx: render Visual Direction section on every expanded idea card

## Feature Updates Round 15
- [x] Visual Direction: "Use in Prompt Generator" shortcut pre-fills Subject/Scene with concept and Additional Details with lighting/colors/camera/elements
- [x] prompt.tsx: read prefillSubject and prefillAdditionalDetails navigation params and apply to correct fields
- [x] Visual Direction: "Save Visual" button stores visual direction suggestion to History (new SavedVisual type)
- [x] History: add Visuals tab showing saved visual directions with export functionality
- [x] Saved Ideas (History): add star/favorite toggle — starred ideas show a gold star badge and sort to top of list

## Bug Fixes Round 16
- [x] Standalone image/video content type: Save button now routes to saveVisual (Visuals tab) instead of saveIdea
- [x] Visual Direction section missing on some idea cards 2014 added fallback placeholder when visualDirection absent
- [ ] Intermittent idea card rendering — tapping generated idea sometimes does not expand
- [x] Star/favorite icon 2014 confirmed in code; fixed tapHint flexShrink so buttons never clip
- [x] Use in Prompt Generator button 2014 verified wired correctly, no change needed

## Bug Fixes Round 17
- [x] Netlify SPA routing: add _redirects file so all routes serve index.html (fixes 404 on idea card expansion on desktop)
- [x] Ensure _redirects is always included in future Expo web builds via public/ folder

## Bug Fixes Round 18 - Desktop Visual Direction & Blank Screen
- [x] Fix intermittent blank screen on idea card expansion: replace IIFE in JSX with proper VisualDirectionSection component
- [x] Fix Visual Direction not rendering on desktop: extract IIFE into named component to avoid React reconciler issues on web
- [x] Rebuild and redeploy to Netlify with clean build

## UI Text & History Fix Round 12
- [x] Rename "Content Calendar" to "Content Planning Calendar" in Tools tab
- [x] Change calendar description to "Your content roadmap, built for planning, not posting."
- [x] Change "No posts scheduled" to "Your calendar is empty. Start planning."
- [x] Change "+ Schedule" button to "Plan Content"
- [x] Fix history tab visuals not opening to show full details

## Round N - Name Fix & History Visuals
- [x] Update SOP PDF to use Delethia Johnson instead of Dee Dee Johnson
- [x] Fix History tab Visuals sub-tab: tapping a visual card must open full detail modal

## Proper Fixes Round
- [ ] Apply correct previous fix for History visuals not opening (find from git history)
- [ ] Fix SOP PDF cover page: prepared-for name visible, white text on dark green background
- [x] Fix VisualDetailModal on Android — modal opens but only shows bottom strip, needs full screen height so all content is visible

## Client-Requested Feature Updates (Approved)
- [x] Fix "Schedule Post" button text to "Plan Content" in calendar add/edit modal
- [x] Add time-of-post picker to Content Planning Calendar
- [x] Add calendar list item detail modal (tap item → slide-up detail sheet)
- [x] Make saved ideas in History editable, with Save and Add to Calendar flow
- [x] Performance Tracker: auto-populate from calendar when post is planned
- [x] Performance Tracker: remove Resonance Score field
- [x] Performance Tracker: add 30-day metrics log (Views, Likes, Shares, Comments)
- [x] Performance Tracker: add pattern summary (best platform, content type, day of week)

## Parity Bug Fixes Round 1 (Mobile ↔ Desktop)
- [x] Calendar: "Plan Content" button text not updated on desktop version
- [x] Calendar: list item detail modal does not open on mobile or desktop
- [x] Calendar: list items with trash icon do not appear on desktop
- [x] Calendar: time picker not functional on desktop when adding a post
- [x] History: ideas are not editable on desktop (edit modal missing)
- [x] History: editing an idea does not update the linked calendar entry (mobile + desktop)
- [x] Performance Tracker: desktop still shows old interface — all Phase 5 changes missing on desktop
