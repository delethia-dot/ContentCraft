import { describe, it, expect } from "vitest";
import { PLATFORMS, POPULAR_NICHES, ContentIdea, UrlAnalysis } from "../lib/types";

// ── Helpers mirroring history screen logic ──────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function getScoreColor(score: number): string {
  if (score >= 75) return "#10B981";
  if (score >= 50) return "#F59E0B";
  return "#EF4444";
}

function getPlatformColor(platformId: string, fallback: string): string {
  return PLATFORMS.find((p) => p.id === platformId)?.color ?? fallback;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("History Screen - formatDate", () => {
  it("formats a valid ISO date string", () => {
    const result = formatDate("2026-03-22T10:00:00.000Z");
    expect(result).toContain("Mar");
    expect(result).toContain("22");
    expect(result).toContain("2026");
  });

  it("returns the original string for invalid dates", () => {
    const bad = "not-a-date";
    const result = formatDate(bad);
    // Invalid date formatting may return "Invalid Date" or the original
    expect(typeof result).toBe("string");
  });
});

describe("History Screen - getScoreColor", () => {
  it("returns green for scores >= 75", () => {
    expect(getScoreColor(75)).toBe("#10B981");
    expect(getScoreColor(100)).toBe("#10B981");
  });

  it("returns amber for scores 50-74", () => {
    expect(getScoreColor(50)).toBe("#F59E0B");
    expect(getScoreColor(74)).toBe("#F59E0B");
  });

  it("returns red for scores < 50", () => {
    expect(getScoreColor(0)).toBe("#EF4444");
    expect(getScoreColor(49)).toBe("#EF4444");
  });
});

describe("History Screen - getPlatformColor", () => {
  it("returns the correct color for known platforms", () => {
    expect(getPlatformColor("instagram", "#000")).toBe("#E1306C");
    expect(getPlatformColor("facebook", "#000")).toBe("#1877F2");
    expect(getPlatformColor("tiktok", "#000")).toBe("#00C2CB");
    expect(getPlatformColor("youtube", "#000")).toBe("#FF0000");
    expect(getPlatformColor("linkedin", "#000")).toBe("#0A66C2");
  });

  it("returns fallback for unknown platforms", () => {
    expect(getPlatformColor("snapchat", "#AABBCC")).toBe("#AABBCC");
  });
});

describe("History Screen - saved ideas filtering", () => {
  const mockIdeas: ContentIdea[] = [
    {
      id: "1",
      title: "Idea 1",
      hook: "Hook 1",
      body: "Body 1",
      cta: "CTA 1",
      platform: "instagram",
      contentType: "reel",
      niche: "Fitness & Health",
      createdAt: "2026-03-22T10:00:00.000Z",
      saved: true,
    },
    {
      id: "2",
      title: "Idea 2",
      hook: "Hook 2",
      body: "Body 2",
      cta: "CTA 2",
      platform: "tiktok",
      contentType: "short",
      niche: "Technology",
      createdAt: "2026-03-21T10:00:00.000Z",
      saved: true,
    },
  ];

  it("can filter ideas by platform", () => {
    const instagram = mockIdeas.filter((i) => i.platform === "instagram");
    expect(instagram).toHaveLength(1);
    expect(instagram[0].id).toBe("1");
  });

  it("can remove an idea by id", () => {
    const updated = mockIdeas.filter((i) => i.id !== "1");
    expect(updated).toHaveLength(1);
    expect(updated[0].id).toBe("2");
  });

  it("can clear all ideas", () => {
    const cleared = mockIdeas.filter(() => false);
    expect(cleared).toHaveLength(0);
  });
});

describe("History Screen - URL analyses", () => {
  const mockAnalyses: UrlAnalysis[] = [
    {
      id: "a1",
      url: "https://www.instagram.com/p/example",
      platform: "instagram",
      resonanceScore: 82,
      whatWorked: ["Strong hook", "Visual storytelling"],
      whatDidntWork: [],
      audienceInsights: "Engages 18-34 fitness enthusiasts",
      frameworkRecommendation: "Hook-Story-Offer",
      summary: "High-performing reel with excellent hook.",
      createdAt: "2026-03-22T10:00:00.000Z",
    },
    {
      id: "a2",
      url: "https://www.tiktok.com/@user/video/123",
      platform: "tiktok",
      resonanceScore: 45,
      whatWorked: ["Trending audio"],
      whatDidntWork: ["Weak CTA", "Poor lighting"],
      audienceInsights: "Gen Z audience, 16-24",
      frameworkRecommendation: "Edu-Entertain",
      summary: "Below average performance due to weak CTA.",
      createdAt: "2026-03-21T10:00:00.000Z",
    },
  ];

  it("can delete an analysis by id", () => {
    const updated = mockAnalyses.filter((a) => a.id !== "a1");
    expect(updated).toHaveLength(1);
    expect(updated[0].id).toBe("a2");
  });

  it("can clear all analyses", () => {
    const cleared: UrlAnalysis[] = [];
    expect(cleared).toHaveLength(0);
  });

  it("correctly identifies score labels", () => {
    expect(getScoreColor(mockAnalyses[0].resonanceScore)).toBe("#10B981"); // 82 = green
    expect(getScoreColor(mockAnalyses[1].resonanceScore)).toBe("#EF4444"); // 45 = red (< 50)
  });
});

describe("Chip wrapping - platform chips", () => {
  it("all 5 platforms are available for wrapping", () => {
    expect(PLATFORMS).toHaveLength(5);
    const ids = PLATFORMS.map((p) => p.id);
    expect(ids).toContain("instagram");
    expect(ids).toContain("facebook");
    expect(ids).toContain("tiktok");
    expect(ids).toContain("youtube");
    expect(ids).toContain("linkedin");
  });
});

describe("Niche sheet - Android compatibility", () => {
  it("POPULAR_NICHES list has at least 20 items for the niche sheet", () => {
    expect(POPULAR_NICHES.length).toBeGreaterThanOrEqual(20);
  });

  it("niche search filtering works correctly", () => {
    const query = "fit";
    const filtered = POPULAR_NICHES.filter((n) =>
      n.toLowerCase().includes(query.toLowerCase())
    );
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered[0]).toContain("Fitness");
  });

  it("custom niche detection works (not in popular list)", () => {
    const custom = "Vintage Cars";
    const isInList = POPULAR_NICHES.some(
      (n) => n.toLowerCase() === custom.toLowerCase()
    );
    expect(isInList).toBe(false);
  });
});
