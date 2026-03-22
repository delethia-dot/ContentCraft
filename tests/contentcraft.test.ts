import { describe, it, expect } from "vitest";
import { PLATFORMS, CONTENT_TYPES, POPULAR_NICHES, CONTENT_FRAMEWORKS } from "../lib/types";

describe("PLATFORMS", () => {
  it("should have exactly 5 platforms", () => {
    expect(PLATFORMS).toHaveLength(5);
  });

  it("should include all required platforms", () => {
    const ids = PLATFORMS.map((p) => p.id);
    expect(ids).toContain("instagram");
    expect(ids).toContain("facebook");
    expect(ids).toContain("tiktok");
    expect(ids).toContain("youtube");
    expect(ids).toContain("linkedin");
  });

  it("each platform should have required fields", () => {
    PLATFORMS.forEach((p) => {
      expect(p.id).toBeTruthy();
      expect(p.label).toBeTruthy();
      expect(p.color).toMatch(/^#[0-9A-Fa-f]{3,8}$/);
      expect(p.iconName).toBeTruthy();
    });
  });
});

describe("CONTENT_TYPES", () => {
  it("should have at least 5 content types", () => {
    expect(CONTENT_TYPES.length).toBeGreaterThanOrEqual(5);
  });

  it("each content type should have at least one platform", () => {
    CONTENT_TYPES.forEach((ct) => {
      expect(ct.platforms.length).toBeGreaterThan(0);
    });
  });

  it("should include post, reel, story, carousel, long-form, short", () => {
    const ids = CONTENT_TYPES.map((ct) => ct.id);
    expect(ids).toContain("post");
    expect(ids).toContain("reel");
    expect(ids).toContain("story");
    expect(ids).toContain("carousel");
    expect(ids).toContain("long-form");
    expect(ids).toContain("short");
  });
});

describe("POPULAR_NICHES", () => {
  it("should have at least 10 niches", () => {
    expect(POPULAR_NICHES.length).toBeGreaterThanOrEqual(10);
  });

  it("all niches should be non-empty strings", () => {
    POPULAR_NICHES.forEach((n) => {
      expect(typeof n).toBe("string");
      expect(n.trim().length).toBeGreaterThan(0);
    });
  });
});

describe("CONTENT_FRAMEWORKS", () => {
  it("should have at least 4 frameworks", () => {
    expect(CONTENT_FRAMEWORKS.length).toBeGreaterThanOrEqual(4);
  });

  it("each framework should have required fields", () => {
    CONTENT_FRAMEWORKS.forEach((fw) => {
      expect(fw.id).toBeTruthy();
      expect(fw.name).toBeTruthy();
      expect(fw.description).toBeTruthy();
      expect(fw.steps.length).toBeGreaterThan(0);
      expect(fw.bestFor.length).toBeGreaterThan(0);
    });
  });

  it("each framework step should have label, description, and example", () => {
    CONTENT_FRAMEWORKS.forEach((fw) => {
      fw.steps.forEach((step) => {
        expect(step.label).toBeTruthy();
        expect(step.description).toBeTruthy();
        expect(step.example).toBeTruthy();
      });
    });
  });
});

describe("Content type platform filtering", () => {
  it("should return content types for instagram", () => {
    const instagramTypes = CONTENT_TYPES.filter((ct) => ct.platforms.includes("instagram"));
    expect(instagramTypes.length).toBeGreaterThan(0);
  });

  it("should return content types for linkedin", () => {
    const linkedinTypes = CONTENT_TYPES.filter((ct) => ct.platforms.includes("linkedin"));
    expect(linkedinTypes.length).toBeGreaterThan(0);
  });

  it("should return content types for tiktok", () => {
    const tiktokTypes = CONTENT_TYPES.filter((ct) => ct.platforms.includes("tiktok"));
    expect(tiktokTypes.length).toBeGreaterThan(0);
  });
});
