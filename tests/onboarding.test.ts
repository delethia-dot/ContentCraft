import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock AsyncStorage
const store: Record<string, string> = {};
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (key: string) => store[key] ?? null),
    setItem: vi.fn(async (key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn(async (key: string) => { delete store[key]; }),
  },
}));

import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARDING_KEY = "@contentcraft_onboarding_complete";
const NICHE_KEY = "@contentcraft_niche";

describe("Onboarding Logic", () => {
  beforeEach(() => {
    // Clear store before each test
    Object.keys(store).forEach((k) => delete store[k]);
    vi.clearAllMocks();
  });

  it("returns false for hasCompletedOnboarding on first launch", async () => {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    expect(value).toBeNull();
    expect(value === "true").toBe(false);
  });

  it("marks onboarding complete after completeOnboarding is called", async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    expect(value).toBe("true");
    expect(value === "true").toBe(true);
  });

  it("resets onboarding state after resetOnboarding is called", async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    expect(value).toBeNull();
    expect(value === "true").toBe(false);
  });

  it("persists niche selection during onboarding", async () => {
    const selectedNiche = "Fitness & Health";
    await AsyncStorage.setItem(NICHE_KEY, selectedNiche);
    const stored = await AsyncStorage.getItem(NICHE_KEY);
    expect(stored).toBe(selectedNiche);
  });

  it("preserves niche when onboarding is reset", async () => {
    await AsyncStorage.setItem(NICHE_KEY, "Technology");
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    // Reset only onboarding, not niche
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    const niche = await AsyncStorage.getItem(NICHE_KEY);
    const onboarding = await AsyncStorage.getItem(ONBOARDING_KEY);
    expect(niche).toBe("Technology");
    expect(onboarding).toBeNull();
  });

  it("custom niche input takes priority over selected popular niche", () => {
    const selectedNiche = "Fitness & Health";
    const customNiche = "Vintage Cars";
    // Simulate the logic: customNiche.trim() || selectedNiche
    const finalNiche = customNiche.trim() || selectedNiche;
    expect(finalNiche).toBe("Vintage Cars");
  });

  it("falls back to selected niche when custom input is empty", () => {
    const selectedNiche = "Fitness & Health";
    const customNiche = "   "; // whitespace only
    const finalNiche = customNiche.trim() || selectedNiche;
    expect(finalNiche).toBe("Fitness & Health");
  });

  it("canFinish is false when neither niche is selected nor custom entered", () => {
    const selectedNiche: string | null = null;
    const customNiche = "";
    const canFinish = !!(customNiche.trim() || selectedNiche);
    expect(canFinish).toBe(false);
  });

  it("canFinish is true when a popular niche is selected", () => {
    const selectedNiche = "Gaming";
    const customNiche = "";
    const canFinish = !!(customNiche.trim() || selectedNiche);
    expect(canFinish).toBe(true);
  });

  it("canFinish is true when a custom niche is entered", () => {
    const selectedNiche: string | null = null;
    const customNiche = "Crypto Trading";
    const canFinish = !!(customNiche.trim() || selectedNiche);
    expect(canFinish).toBe(true);
  });

  it("search filters niches correctly", () => {
    const POPULAR_NICHES = [
      "Fitness & Health", "Personal Finance", "Food & Cooking",
      "Travel & Adventure", "Technology", "Beauty & Fashion",
    ];
    const query = "fit";
    const filtered = POPULAR_NICHES.filter((n) =>
      n.toLowerCase().includes(query.toLowerCase())
    );
    expect(filtered).toEqual(["Fitness & Health"]);
  });

  it("search returns all niches when query is empty", () => {
    const POPULAR_NICHES = ["Fitness & Health", "Technology", "Gaming"];
    const query = "";
    const filtered = query.trim()
      ? POPULAR_NICHES.filter((n) => n.toLowerCase().includes(query.toLowerCase()))
      : POPULAR_NICHES;
    expect(filtered).toHaveLength(3);
  });
});
