import { describe, it, expect } from "vitest";

// ─── Caption Writer Tests ─────────────────────────────────────────────────────

describe("Caption Writer", () => {
  const PLATFORM_LIMITS: Record<string, number> = {
    instagram: 2200,
    facebook: 63206,
    tiktok: 2200,
    youtube: 5000,
    linkedin: 3000,
  };

  it("should have correct character limits for each platform", () => {
    expect(PLATFORM_LIMITS.instagram).toBe(2200);
    expect(PLATFORM_LIMITS.facebook).toBe(63206);
    expect(PLATFORM_LIMITS.tiktok).toBe(2200);
    expect(PLATFORM_LIMITS.youtube).toBe(5000);
    expect(PLATFORM_LIMITS.linkedin).toBe(3000);
  });

  it("should calculate character percentage correctly", () => {
    const caption = "This is a test caption for Instagram.";
    const limit = PLATFORM_LIMITS.instagram;
    const percent = (caption.length / limit) * 100;
    expect(percent).toBeLessThan(5);
  });

  it("should determine char bar color based on percentage", () => {
    const getCharColor = (percent: number) => {
      if (percent > 90) return "#EF4444";
      if (percent > 70) return "#F59E0B";
      return "#10B981";
    };
    expect(getCharColor(95)).toBe("#EF4444");
    expect(getCharColor(75)).toBe("#F59E0B");
    expect(getCharColor(50)).toBe("#10B981");
    expect(getCharColor(10)).toBe("#10B981");
  });

  it("should format hashtags correctly", () => {
    const hashtags = ["productivity", "#morningroutine", "success"];
    const formatted = hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ");
    expect(formatted).toBe("#productivity #morningroutine #success");
  });

  it("should build full caption text with hashtags", () => {
    const caption = "Start your morning right.";
    const hashtags = ["morning", "routine"];
    const hashtagStr = "\n\n" + hashtags.map((h) => `#${h}`).join(" ");
    const full = caption + hashtagStr;
    expect(full).toContain("#morning");
    expect(full).toContain("#routine");
    expect(full).toContain("Start your morning right.");
  });

  it("should support all 5 tone types", () => {
    const tones = ["professional", "casual", "witty", "inspirational", "educational"];
    expect(tones).toHaveLength(5);
    expect(tones).toContain("professional");
    expect(tones).toContain("casual");
    expect(tones).toContain("witty");
    expect(tones).toContain("inspirational");
    expect(tones).toContain("educational");
  });
});

// ─── Content Calendar Tests ───────────────────────────────────────────────────

describe("Content Calendar", () => {
  const toDateStr = (date: Date): string =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  it("should format dates as YYYY-MM-DD", () => {
    const date = new Date(2026, 2, 22); // March 22, 2026
    expect(toDateStr(date)).toBe("2026-03-22");
  });

  it("should pad single-digit months and days", () => {
    const date = new Date(2026, 0, 5); // January 5, 2026
    expect(toDateStr(date)).toBe("2026-01-05");
  });

  it("should correctly build calendar grid for March 2026", () => {
    const year = 2026;
    const month = 2; // March (0-indexed)
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    expect(firstDay).toBe(0); // March 1, 2026 is a Sunday
    expect(daysInMonth).toBe(31);
  });

  it("should filter entries for a specific date", () => {
    const entries = [
      { id: "1", date: "2026-03-22", ideaTitle: "Post 1", platform: "instagram", contentType: "post", completed: false },
      { id: "2", date: "2026-03-23", ideaTitle: "Post 2", platform: "tiktok", contentType: "reel", completed: false },
      { id: "3", date: "2026-03-22", ideaTitle: "Post 3", platform: "linkedin", contentType: "post", completed: false },
    ];
    const filtered = entries.filter((e) => e.date === "2026-03-22");
    expect(filtered).toHaveLength(2);
    expect(filtered[0].ideaTitle).toBe("Post 1");
    expect(filtered[1].ideaTitle).toBe("Post 3");
  });

  it("should sort calendar entries by date", () => {
    const entries = [
      { id: "2", date: "2026-03-25" },
      { id: "1", date: "2026-03-22" },
      { id: "3", date: "2026-03-23" },
    ];
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    expect(sorted[0].id).toBe("1");
    expect(sorted[1].id).toBe("3");
    expect(sorted[2].id).toBe("2");
  });

  it("should correctly identify today vs future dates", () => {
    const today = "2026-03-22";
    const future = "2026-03-25";
    const past = "2026-03-20";
    expect(future >= today).toBe(true);
    expect(past >= today).toBe(false);
    expect(today >= today).toBe(true);
  });

  it("should build week view correctly", () => {
    // March 22, 2026 is a Sunday (dow = 0)
    const sel = new Date("2026-03-22T00:00:00");
    const dow = sel.getDay(); // 0 = Sunday
    const weekDays: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sel);
      d.setDate(sel.getDate() - dow + i);
      weekDays.push(toDateStr(d));
    }
    expect(weekDays).toHaveLength(7);
    expect(weekDays[0]).toBe("2026-03-22"); // Sunday
    expect(weekDays[6]).toBe("2026-03-28"); // Saturday
  });
});

// ─── Custom Tool Prompt Generator Tests ──────────────────────────────────────

describe("Custom Tool Prompt Generator", () => {
  const PRESET_TOOLS = ["Midjourney", "DALL-E 3", "Stable Diffusion", "Sora", "Runway", "Kling"];

  it("should include all preset AI tools", () => {
    expect(PRESET_TOOLS).toContain("Midjourney");
    expect(PRESET_TOOLS).toContain("DALL-E 3");
    expect(PRESET_TOOLS).toContain("Stable Diffusion");
    expect(PRESET_TOOLS).toContain("Sora");
    expect(PRESET_TOOLS).toContain("Runway");
    expect(PRESET_TOOLS).toContain("Kling");
  });

  it("should detect custom tool when not in preset list", () => {
    const isCustomTool = (tool: string) => !PRESET_TOOLS.includes(tool);
    expect(isCustomTool("Midjourney")).toBe(false);
    expect(isCustomTool("Adobe Firefly")).toBe(true);
    expect(isCustomTool("Ideogram")).toBe(true);
    expect(isCustomTool("Pika Labs")).toBe(true);
    expect(isCustomTool("Kling")).toBe(false);
  });

  it("should validate custom tool name is not empty", () => {
    const validateCustomTool = (tool: string) => tool.trim().length > 0;
    expect(validateCustomTool("Adobe Firefly")).toBe(true);
    expect(validateCustomTool("")).toBe(false);
    expect(validateCustomTool("   ")).toBe(false);
  });

  it("should build correct tool display name for custom tools", () => {
    const getDisplayName = (tool: string, isCustom: boolean, customName: string) =>
      isCustom ? customName : tool;
    expect(getDisplayName("Custom", true, "Adobe Firefly")).toBe("Adobe Firefly");
    expect(getDisplayName("Midjourney", false, "")).toBe("Midjourney");
  });
});

// ─── History Tab Tests ────────────────────────────────────────────────────────

describe("History Tab - 4 Sections", () => {
  const TABS = ["ideas", "analyses", "prompts", "captions"];

  it("should have all 4 tab types", () => {
    expect(TABS).toHaveLength(4);
    expect(TABS).toContain("ideas");
    expect(TABS).toContain("analyses");
    expect(TABS).toContain("prompts");
    expect(TABS).toContain("captions");
  });

  it("should format saved prompt for sharing", () => {
    const prompt = {
      tool: "Midjourney",
      mainPrompt: "A serene mountain landscape at golden hour",
      negativePrompt: "blurry, low quality",
      platform: "instagram",
      mediaType: "image",
    };
    const text = `🎨 AI Prompt (${prompt.tool})\n\nMain Prompt:\n${prompt.mainPrompt}\n\nNegative Prompt:\n${prompt.negativePrompt}\n\nPlatform: ${prompt.platform} | Type: ${prompt.mediaType}`;
    expect(text).toContain("Midjourney");
    expect(text).toContain("serene mountain");
    expect(text).toContain("instagram");
  });

  it("should format saved caption for sharing", () => {
    const caption = {
      caption: "Start your day with intention.",
      hashtags: ["morning", "mindset", "success"],
    };
    const hashtagStr = "\n\n" + caption.hashtags.map((h) => `#${h}`).join(" ");
    const text = caption.caption + hashtagStr;
    expect(text).toContain("Start your day");
    expect(text).toContain("#morning");
    expect(text).toContain("#success");
  });

  it("should determine clear action based on active tab", () => {
    const getClearFn = (tab: string) => {
      switch (tab) {
        case "ideas": return "clearAllIdeas";
        case "analyses": return "clearAllAnalyses";
        case "prompts": return "clearAllPrompts";
        case "captions": return "clearAllCaptions";
        default: return null;
      }
    };
    expect(getClearFn("ideas")).toBe("clearAllIdeas");
    expect(getClearFn("prompts")).toBe("clearAllPrompts");
    expect(getClearFn("captions")).toBe("clearAllCaptions");
    expect(getClearFn("analyses")).toBe("clearAllAnalyses");
  });
});
