export type Platform = "instagram" | "facebook" | "tiktok" | "youtube" | "linkedin";
export type ContentType = "post" | "reel" | "story" | "carousel" | "long-form" | "short" | "image" | "video" | "talking-head";

export interface ContentIdea {
  id: string;
  title: string;
  hook: string;
  body: string;
  cta: string;
  platform: Platform;
  contentType: ContentType;
  niche: string;
  createdAt: string;
  saved?: boolean;
  starred?: boolean;
}

export interface SavedVisual {
  id: string;
  ideaId: string;
  ideaTitle: string;
  platform: Platform;
  contentType: ContentType;
  mediaType: "image" | "video";
  concept: string;
  lighting: string;
  colors: string;
  cameraAngle: string;
  additionalElements: string[];
  promptReadyDescription: string;
  savedAt: string;
}

export interface UrlAnalysis {
  id: string;
  url: string;
  title?: string;
  platform?: Platform;
  resonanceScore: number;
  whatWorked: string[];
  whatDidntWork: string[];
  audienceInsights: string;
  frameworkRecommendation: string;
  summary: string;
  createdAt: string;
}

export interface SavedPrompt {
  id: string;
  tool: string; // can be preset or custom tool name
  mediaType: "image" | "video";
  subject: string;
  platform: Platform;
  mainPrompt: string;
  negativePrompt: string;
  tips: string[];
  variations: string[];
  estimatedQuality: string;
  createdAt: string;
}

export interface SavedCaption {
  id: string;
  topic: string;
  platform: Platform;
  tone: string;
  caption: string;
  hashtags: string[];
  characterCount: number;
  createdAt: string;
}

export interface CalendarEntry {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  ideaId?: string;
  ideaTitle: string;
  platform: Platform;
  contentType: ContentType;
  notes?: string;
  completed: boolean;
}

export interface TrendingIdea {
  id: string;
  title: string;
  description: string;
  platform: Platform;
  trendScore: number;
  niche: string;
  contentType: ContentType;
  date: string;
}

export interface ContentFramework {
  id: string;
  name: string;
  acronym?: string;
  description: string;
  steps: FrameworkStep[];
  bestFor: Platform[];
  contentTypes: ContentType[];
}

export interface FrameworkStep {
  label: string;
  description: string;
  example: string;
}

export const PLATFORMS: { id: Platform; label: string; color: string; iconName: string }[] = [
  { id: "instagram", label: "Instagram", color: "#E1306C", iconName: "photo.fill" },
  { id: "facebook", label: "Facebook", color: "#1877F2", iconName: "globe" },
  { id: "tiktok", label: "TikTok", color: "#00C2CB", iconName: "video.fill" },
  { id: "youtube", label: "YouTube", color: "#FF0000", iconName: "play.fill" },
  { id: "linkedin", label: "LinkedIn", color: "#0A66C2", iconName: "doc.text.fill" },
];

export const CONTENT_TYPES: { id: ContentType; label: string; platforms: Platform[] }[] = [
  { id: "post", label: "Post", platforms: ["instagram", "facebook", "linkedin"] },
  { id: "reel", label: "Reel / Short", platforms: ["instagram", "tiktok", "youtube", "facebook"] },
  { id: "story", label: "Story", platforms: ["instagram", "facebook"] },
  { id: "carousel", label: "Carousel", platforms: ["instagram", "linkedin", "facebook"] },
  { id: "long-form", label: "Long-form", platforms: ["youtube", "linkedin", "facebook"] },
  { id: "short", label: "Short Video", platforms: ["tiktok", "youtube", "instagram"] },
  { id: "image", label: "Image / Graphic", platforms: ["instagram", "facebook", "linkedin"] },
  { id: "video", label: "Video (Scripted)", platforms: ["youtube", "instagram", "tiktok", "facebook"] },
  { id: "talking-head", label: "Talking Head", platforms: ["youtube", "instagram", "tiktok", "facebook", "linkedin"] },
];

export const POPULAR_NICHES = [
  "Fitness & Health",
  "Personal Finance",
  "Food & Cooking",
  "Travel & Adventure",
  "Technology",
  "Beauty & Fashion",
  "Business & Entrepreneurship",
  "Mental Health & Wellness",
  "Parenting & Family",
  "Education & Learning",
  "Photography",
  "Gaming",
  "Music & Entertainment",
  "Real Estate",
  "Sustainability & Eco",
  "DIY & Crafts",
  "Pets & Animals",
  "Sports",
  "Art & Design",
  "Motivational & Self-Help",
];

export const CONTENT_FRAMEWORKS: ContentFramework[] = [
  {
    id: "hook-story-offer",
    name: "Hook-Story-Offer",
    acronym: "HSO",
    description: "Grab attention, build emotional connection, then present your offer.",
    steps: [
      { label: "Hook", description: "Open with a bold statement, question, or surprising fact that stops the scroll.", example: "\"I made $10K in 30 days doing THIS one thing...\"" },
      { label: "Story", description: "Share a relatable story or journey that builds trust and emotional resonance.", example: "\"Six months ago I was broke and desperate. Here's what changed everything...\"" },
      { label: "Offer", description: "Present your product, service, or call-to-action naturally as the solution.", example: "\"That's why I created [Product] — get it free in my bio.\"" },
    ],
    bestFor: ["instagram", "tiktok", "facebook", "youtube"],
    contentTypes: ["reel", "post", "long-form"],
  },
  {
    id: "aida",
    name: "AIDA",
    acronym: "AIDA",
    description: "Classic marketing framework: Attention, Interest, Desire, Action.",
    steps: [
      { label: "Attention", description: "Capture attention immediately with a powerful opening.", example: "\"Stop scrolling if you want to lose 10 lbs without dieting.\"" },
      { label: "Interest", description: "Build interest by highlighting relevant benefits or facts.", example: "\"Most people fail because they focus on the wrong things...\"" },
      { label: "Desire", description: "Create desire by painting a vivid picture of the outcome.", example: "\"Imagine waking up every day feeling energized and confident.\"" },
      { label: "Action", description: "Give a clear, compelling call to action.", example: "\"Click the link in bio to start your free trial today.\"" },
    ],
    bestFor: ["linkedin", "facebook", "instagram", "youtube"],
    contentTypes: ["post", "carousel", "long-form"],
  },
  {
    id: "pas",
    name: "Problem-Agitate-Solve",
    acronym: "PAS",
    description: "Identify the pain, intensify it, then provide the solution.",
    steps: [
      { label: "Problem", description: "Clearly state the problem your audience is experiencing.", example: "\"Struggling to get engagement on your posts?\"" },
      { label: "Agitate", description: "Deepen the pain by exploring consequences and frustrations.", example: "\"You spend hours creating content and get 3 likes. Meanwhile competitors blow up overnight.\"" },
      { label: "Solve", description: "Present your solution as the clear answer to their problem.", example: "\"Here's the exact framework I use to get 10x more engagement every time.\"" },
    ],
    bestFor: ["instagram", "linkedin", "facebook"],
    contentTypes: ["post", "carousel", "reel"],
  },
  {
    id: "edu-entertain",
    name: "Edu-Entertain",
    acronym: "EE",
    description: "Blend education with entertainment for maximum shareability.",
    steps: [
      { label: "Entertain First", description: "Open with something funny, surprising, or visually engaging.", example: "\"POV: You just discovered the hack that changed everything...\"" },
      { label: "Educate", description: "Deliver genuine value — tips, facts, tutorials, or insights.", example: "\"Here are 5 things I wish I knew before starting my business...\"" },
      { label: "Engage", description: "End with a question or prompt to drive comments and shares.", example: "\"Which tip surprised you most? Comment below!\"" },
    ],
    bestFor: ["tiktok", "instagram", "youtube"],
    contentTypes: ["reel", "short", "story"],
  },
  {
    id: "3-act",
    name: "3-Act Structure",
    acronym: "3A",
    description: "Classic storytelling: Setup, Confrontation, Resolution.",
    steps: [
      { label: "Act 1: Setup", description: "Introduce the character, setting, and initial situation.", example: "\"Meet Sarah. She had a dream but no idea where to start.\"" },
      { label: "Act 2: Conflict", description: "Introduce the challenge, struggle, or turning point.", example: "\"She tried everything. Failed 7 times. Almost gave up.\"" },
      { label: "Act 3: Resolution", description: "Show the transformation and lesson learned.", example: "\"Then she discovered ONE thing that changed everything. Here's what it was.\"" },
    ],
    bestFor: ["youtube", "instagram", "tiktok", "facebook"],
    contentTypes: ["long-form", "reel", "post"],
  },
  {
    id: "value-ladder",
    name: "Value Ladder",
    acronym: "VL",
    description: "Lead with free value, then guide toward deeper engagement.",
    steps: [
      { label: "Free Value", description: "Give away your best tip or insight upfront, no strings attached.", example: "\"Here's my exact content strategy — completely free.\"" },
      { label: "Proof", description: "Show results or social proof to build credibility.", example: "\"This strategy helped me grow from 0 to 50K followers in 6 months.\"" },
      { label: "Next Step", description: "Invite them to the next level of value (follow, subscribe, download, buy).", example: "\"Want the full 30-day plan? Link in bio.\"" },
    ],
    bestFor: ["linkedin", "instagram", "youtube"],
    contentTypes: ["post", "carousel", "long-form"],
  },
];
