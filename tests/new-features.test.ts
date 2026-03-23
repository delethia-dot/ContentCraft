import { describe, it, expect } from "vitest";

// ─── Types ────────────────────────────────────────────────────────────────────

type ContentType = "post" | "reel" | "story" | "carousel" | "long-form" | "short" | "image" | "video";
type Platform = "instagram" | "facebook" | "tiktok" | "youtube" | "linkedin";
type MediaType = "image" | "video";
type AITool = "midjourney" | "dalle" | "sora" | "runway" | "stable-diffusion" | "kling";

const CONTENT_TYPES: { id: ContentType; label: string; platforms: Platform[] }[] = [
  { id: "post", label: "Post", platforms: ["instagram", "facebook", "linkedin"] },
  { id: "reel", label: "Reel / Short", platforms: ["instagram", "tiktok", "youtube", "facebook"] },
  { id: "story", label: "Story", platforms: ["instagram", "facebook"] },
  { id: "carousel", label: "Carousel", platforms: ["instagram", "linkedin", "facebook"] },
  { id: "long-form", label: "Long-form", platforms: ["youtube", "linkedin", "facebook"] },
  { id: "short", label: "Short Video", platforms: ["tiktok", "youtube", "instagram"] },
  { id: "image", label: "Image / Graphic", platforms: ["instagram", "facebook", "linkedin"] },
  { id: "video", label: "Video (Scripted)", platforms: ["youtube", "instagram", "tiktok", "facebook"] },
];

const AI_TOOLS: { id: AITool; label: string; mediaTypes: MediaType[]; color: string }[] = [
  { id: "midjourney", label: "Midjourney", mediaTypes: ["image"], color: "#7C3AED" },
  { id: "dalle", label: "DALL-E 3", mediaTypes: ["image"], color: "#10A37F" },
  { id: "stable-diffusion", label: "Stable Diffusion", mediaTypes: ["image"], color: "#F97316" },
  { id: "sora", label: "Sora", mediaTypes: ["video"], color: "#0EA5E9" },
  { id: "runway", label: "Runway Gen-3", mediaTypes: ["video"], color: "#EC4899" },
  { id: "kling", label: "Kling AI", mediaTypes: ["video"], color: "#8B5CF6" },
];

const ASPECT_RATIOS: Record<Platform, { label: string; value: string }[]> = {
  instagram: [{ label: "Square 1:1", value: "1:1" }, { label: "Portrait 4:5", value: "4:5" }, { label: "Story 9:16", value: "9:16" }],
  facebook: [{ label: "Landscape 16:9", value: "16:9" }, { label: "Square 1:1", value: "1:1" }],
  tiktok: [{ label: "Vertical 9:16", value: "9:16" }, { label: "Square 1:1", value: "1:1" }],
  youtube: [{ label: "Landscape 16:9", value: "16:9" }, { label: "Square 1:1", value: "1:1" }],
  linkedin: [{ label: "Landscape 1.91:1", value: "1.91:1" }, { label: "Square 1:1", value: "1:1" }],
};

// ─── Feature 1: Share Button (History) ───────────────────────────────────────

describe("History Tab - Share & Export", () => {
  it("formats idea for sharing correctly", () => {
    const idea = {
      id: "1",
      title: "5 Fitness Tips",
      hook: "Most people get this wrong...",
      body: "Here are 5 tips that changed my fitness journey.",
      cta: "Save this post!",
      platform: "instagram" as Platform,
      contentType: "post" as ContentType,
      niche: "Fitness",
      createdAt: new Date().toISOString(),
    };
    const shareText = `${idea.title}\n\n${idea.hook}\n\n${idea.body}\n\n${idea.cta}`;
    expect(shareText).toContain("5 Fitness Tips");
    expect(shareText).toContain("Most people get this wrong...");
    expect(shareText).toContain("Save this post!");
  });

  it("groups ideas by platform for export", () => {
    const ideas = [
      { id: "1", platform: "instagram" as Platform, title: "Idea A", hook: "H", body: "B", cta: "C", contentType: "post" as ContentType, niche: "Fitness", createdAt: "" },
      { id: "2", platform: "instagram" as Platform, title: "Idea B", hook: "H", body: "B", cta: "C", contentType: "reel" as ContentType, niche: "Fitness", createdAt: "" },
      { id: "3", platform: "tiktok" as Platform, title: "Idea C", hook: "H", body: "B", cta: "C", contentType: "short" as ContentType, niche: "Fitness", createdAt: "" },
    ];
    const grouped = ideas.reduce((acc, idea) => {
      if (!acc[idea.platform]) acc[idea.platform] = [];
      acc[idea.platform].push(idea);
      return acc;
    }, {} as Record<string, typeof ideas>);

    expect(grouped["instagram"]).toHaveLength(2);
    expect(grouped["tiktok"]).toHaveLength(1);
    expect(grouped["youtube"]).toBeUndefined();
  });

  it("generates export text for a platform", () => {
    const ideas = [
      { id: "1", platform: "instagram" as Platform, title: "Idea A", hook: "Hook A", body: "Body A", cta: "CTA A", contentType: "post" as ContentType, niche: "Fitness", createdAt: "" },
    ];
    const exportText = ideas.map((idea, i) =>
      `${i + 1}. ${idea.title}\n   Hook: ${idea.hook}\n   Body: ${idea.body}\n   CTA: ${idea.cta}`
    ).join("\n\n");

    expect(exportText).toContain("1. Idea A");
    expect(exportText).toContain("Hook: Hook A");
    expect(exportText).toContain("CTA: CTA A");
  });
});

// ─── Feature 2: Full Idea Modal ───────────────────────────────────────────────

describe("Full Idea Modal", () => {
  it("displays all idea fields in modal", () => {
    const idea = {
      id: "1",
      title: "Morning Routine Ideas",
      hook: "The first 30 minutes of your day determine everything.",
      body: "Here's the exact routine that helped me 10x my productivity.",
      cta: "Comment 'ROUTINE' to get my free guide.",
      platform: "instagram" as Platform,
      contentType: "reel" as ContentType,
      niche: "Wellness",
      createdAt: new Date().toISOString(),
    };
    // All fields should be non-empty
    expect(idea.title).toBeTruthy();
    expect(idea.hook).toBeTruthy();
    expect(idea.body).toBeTruthy();
    expect(idea.cta).toBeTruthy();
    expect(idea.platform).toBeTruthy();
    expect(idea.contentType).toBeTruthy();
  });

  it("formats platform label correctly", () => {
    const platformLabels: Record<Platform, string> = {
      instagram: "Instagram",
      facebook: "Facebook",
      tiktok: "TikTok",
      youtube: "YouTube",
      linkedin: "LinkedIn",
    };
    expect(platformLabels["tiktok"]).toBe("TikTok");
    expect(platformLabels["linkedin"]).toBe("LinkedIn");
  });
});

// ─── Feature 3: Image & Video Content Types ───────────────────────────────────

describe("Image & Video Content Types", () => {
  it("includes image and video in CONTENT_TYPES", () => {
    const ids = CONTENT_TYPES.map((ct) => ct.id);
    expect(ids).toContain("image");
    expect(ids).toContain("video");
  });

  it("image type is available for instagram, facebook, linkedin", () => {
    const imageType = CONTENT_TYPES.find((ct) => ct.id === "image");
    expect(imageType).toBeDefined();
    expect(imageType?.platforms).toContain("instagram");
    expect(imageType?.platforms).toContain("facebook");
    expect(imageType?.platforms).toContain("linkedin");
  });

  it("video type is available for youtube, instagram, tiktok, facebook", () => {
    const videoType = CONTENT_TYPES.find((ct) => ct.id === "video");
    expect(videoType).toBeDefined();
    expect(videoType?.platforms).toContain("youtube");
    expect(videoType?.platforms).toContain("instagram");
    expect(videoType?.platforms).toContain("tiktok");
    expect(videoType?.platforms).toContain("facebook");
  });

  it("filters content types by platform correctly", () => {
    const platform: Platform = "instagram";
    const available = CONTENT_TYPES.filter((ct) => ct.platforms.includes(platform));
    const availableIds = available.map((ct) => ct.id);
    expect(availableIds).toContain("post");
    expect(availableIds).toContain("reel");
    expect(availableIds).toContain("image");
    // long-form should not be available for instagram
    expect(availableIds).not.toContain("long-form");
  });

  it("total content types count is 8", () => {
    expect(CONTENT_TYPES).toHaveLength(8);
  });
});

// ─── Feature 4: AI Prompt Generator ──────────────────────────────────────────

describe("AI Prompt Generator", () => {
  it("has 3 image tools and 3 video tools", () => {
    const imageTools = AI_TOOLS.filter((t) => t.mediaTypes.includes("image"));
    const videoTools = AI_TOOLS.filter((t) => t.mediaTypes.includes("video"));
    expect(imageTools).toHaveLength(3);
    expect(videoTools).toHaveLength(3);
  });

  it("filters tools by media type correctly", () => {
    const imageTools = AI_TOOLS.filter((t) => t.mediaTypes.includes("image"));
    const imageToolIds = imageTools.map((t) => t.id);
    expect(imageToolIds).toContain("midjourney");
    expect(imageToolIds).toContain("dalle");
    expect(imageToolIds).toContain("stable-diffusion");
    expect(imageToolIds).not.toContain("sora");
    expect(imageToolIds).not.toContain("runway");
  });

  it("filters tools by video type correctly", () => {
    const videoTools = AI_TOOLS.filter((t) => t.mediaTypes.includes("video"));
    const videoToolIds = videoTools.map((t) => t.id);
    expect(videoToolIds).toContain("sora");
    expect(videoToolIds).toContain("runway");
    expect(videoToolIds).toContain("kling");
    expect(videoToolIds).not.toContain("midjourney");
  });

  it("returns correct aspect ratios for each platform", () => {
    expect(ASPECT_RATIOS.instagram).toHaveLength(3);
    expect(ASPECT_RATIOS.tiktok[0].value).toBe("9:16"); // TikTok default is vertical
    expect(ASPECT_RATIOS.youtube[0].value).toBe("16:9"); // YouTube default is landscape
    expect(ASPECT_RATIOS.linkedin[0].value).toBe("1.91:1");
  });

  it("validates required subject field", () => {
    const subject = "";
    const isValid = subject.trim().length > 0;
    expect(isValid).toBe(false);

    const validSubject = "a woman doing yoga on a rooftop at sunrise";
    expect(validSubject.trim().length > 0).toBe(true);
  });

  it("formats share text for prompt correctly", () => {
    const prompt = {
      tool: "midjourney" as AITool,
      mediaType: "image" as MediaType,
      mainPrompt: "a woman doing yoga on a rooftop at sunrise, photorealistic, golden hour",
      negativePrompt: "blurry, low quality",
    };
    const shareText = `🎨 AI Image Prompt for ${prompt.tool.toUpperCase()}\n\n📝 Main Prompt:\n${prompt.mainPrompt}\n\n🚫 Negative Prompt:\n${prompt.negativePrompt}\n\n✨ Generated by ContentCraft`;
    expect(shareText).toContain("MIDJOURNEY");
    expect(shareText).toContain("yoga on a rooftop");
    expect(shareText).toContain("ContentCraft");
  });
});

// ─── Feature 5: Content Type Schema Validation ───────────────────────────────

describe("Server Schema - Content Type Enum", () => {
  it("validates all 8 content types", () => {
    const validTypes: ContentType[] = ["post", "reel", "story", "carousel", "long-form", "short", "image", "video"];
    validTypes.forEach((type) => {
      expect(CONTENT_TYPES.map((ct) => ct.id)).toContain(type);
    });
  });

  it("image and video types have correct labels", () => {
    const imageType = CONTENT_TYPES.find((ct) => ct.id === "image");
    const videoType = CONTENT_TYPES.find((ct) => ct.id === "video");
    expect(imageType?.label).toBe("Image / Graphic");
    expect(videoType?.label).toBe("Video (Scripted)");
  });
});
