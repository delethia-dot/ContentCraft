import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SavedPrompt, SavedCaption, CalendarEntry, SavedVisual } from "./types";

const PROMPTS_KEY = "@contentcraft_saved_prompts";
const CAPTIONS_KEY = "@contentcraft_saved_captions";
const CALENDAR_KEY = "@contentcraft_calendar_entries";
const VISUALS_KEY = "@contentcraft_saved_visuals";

interface StorageContextType {
  // Prompts
  savedPrompts: SavedPrompt[];
  savePrompt: (prompt: SavedPrompt) => Promise<void>;
  removePrompt: (id: string) => Promise<void>;
  clearAllPrompts: () => Promise<void>;
  // Captions
  savedCaptions: SavedCaption[];
  saveCaption: (caption: SavedCaption) => Promise<void>;
  removeCaption: (id: string) => Promise<void>;
  clearAllCaptions: () => Promise<void>;
  // Calendar
  calendarEntries: CalendarEntry[];
  addCalendarEntry: (entry: CalendarEntry) => Promise<void>;
  updateCalendarEntry: (id: string, updates: Partial<CalendarEntry>) => Promise<void>;
  removeCalendarEntry: (id: string) => Promise<void>;
  getEntriesForDate: (date: string) => CalendarEntry[];
  // Visuals
  savedVisuals: SavedVisual[];
  saveVisual: (visual: SavedVisual) => Promise<void>;
  removeVisual: (id: string) => Promise<void>;
  clearAllVisuals: () => Promise<void>;
}

const StorageContext = createContext<StorageContextType>({
  savedPrompts: [],
  savePrompt: async () => {},
  removePrompt: async () => {},
  clearAllPrompts: async () => {},
  savedCaptions: [],
  saveCaption: async () => {},
  removeCaption: async () => {},
  clearAllCaptions: async () => {},
  calendarEntries: [],
  addCalendarEntry: async () => {},
  updateCalendarEntry: async () => {},
  removeCalendarEntry: async () => {},
  getEntriesForDate: () => [],
  savedVisuals: [],
  saveVisual: async () => {},
  removeVisual: async () => {},
  clearAllVisuals: async () => {},
});

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [savedCaptions, setSavedCaptions] = useState<SavedCaption[]>([]);
  const [calendarEntries, setCalendarEntries] = useState<CalendarEntry[]>([]);
  const [savedVisuals, setSavedVisuals] = useState<SavedVisual[]>([]);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(PROMPTS_KEY),
      AsyncStorage.getItem(CAPTIONS_KEY),
      AsyncStorage.getItem(CALENDAR_KEY),
      AsyncStorage.getItem(VISUALS_KEY),
    ]).then(([prompts, captions, calendar, visuals]) => {
      if (prompts) setSavedPrompts(JSON.parse(prompts));
      if (captions) setSavedCaptions(JSON.parse(captions));
      if (calendar) setCalendarEntries(JSON.parse(calendar));
      if (visuals) setSavedVisuals(JSON.parse(visuals));
    });
  }, []);

  // ── Prompts ──────────────────────────────────────────────────────────────

  const savePrompt = useCallback(async (prompt: SavedPrompt) => {
    setSavedPrompts((prev) => {
      const updated = [prompt, ...prev.filter((p) => p.id !== prompt.id)];
      AsyncStorage.setItem(PROMPTS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removePrompt = useCallback(async (id: string) => {
    setSavedPrompts((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      AsyncStorage.setItem(PROMPTS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearAllPrompts = useCallback(async () => {
    setSavedPrompts([]);
    await AsyncStorage.removeItem(PROMPTS_KEY);
  }, []);

  // ── Captions ─────────────────────────────────────────────────────────────

  const saveCaption = useCallback(async (caption: SavedCaption) => {
    setSavedCaptions((prev) => {
      const updated = [caption, ...prev.filter((c) => c.id !== caption.id)];
      AsyncStorage.setItem(CAPTIONS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeCaption = useCallback(async (id: string) => {
    setSavedCaptions((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      AsyncStorage.setItem(CAPTIONS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearAllCaptions = useCallback(async () => {
    setSavedCaptions([]);
    await AsyncStorage.removeItem(CAPTIONS_KEY);
  }, []);

  // ── Calendar ─────────────────────────────────────────────────────────────

  const addCalendarEntry = useCallback(async (entry: CalendarEntry) => {
    setCalendarEntries((prev) => {
      const updated = [...prev, entry].sort((a, b) => a.date.localeCompare(b.date));
      AsyncStorage.setItem(CALENDAR_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateCalendarEntry = useCallback(async (id: string, updates: Partial<CalendarEntry>) => {
    setCalendarEntries((prev) => {
      const updated = prev.map((e) => (e.id === id ? { ...e, ...updates } : e));
      AsyncStorage.setItem(CALENDAR_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeCalendarEntry = useCallback(async (id: string) => {
    setCalendarEntries((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      AsyncStorage.setItem(CALENDAR_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getEntriesForDate = useCallback((date: string) => {
    return calendarEntries.filter((e) => e.date === date);
  }, [calendarEntries]);

  // ── Visuals ──────────────────────────────────────────────────────────────

  const saveVisual = useCallback(async (visual: SavedVisual) => {
    setSavedVisuals((prev) => {
      const updated = [visual, ...prev.filter((v) => v.id !== visual.id)];
      AsyncStorage.setItem(VISUALS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeVisual = useCallback(async (id: string) => {
    setSavedVisuals((prev) => {
      const updated = prev.filter((v) => v.id !== id);
      AsyncStorage.setItem(VISUALS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearAllVisuals = useCallback(async () => {
    setSavedVisuals([]);
    await AsyncStorage.removeItem(VISUALS_KEY);
  }, []);

  return (
    <StorageContext.Provider
      value={{
        savedPrompts,
        savePrompt,
        removePrompt,
        clearAllPrompts,
        savedCaptions,
        saveCaption,
        removeCaption,
        clearAllCaptions,
        calendarEntries,
        addCalendarEntry,
        updateCalendarEntry,
        removeCalendarEntry,
        getEntriesForDate,
        savedVisuals,
        saveVisual,
        removeVisual,
        clearAllVisuals,
      }}
    >
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage() {
  return useContext(StorageContext);
}
