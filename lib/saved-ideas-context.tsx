import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ContentIdea } from "./types";

const SAVED_IDEAS_KEY = "@contentcraft_saved_ideas";

interface SavedIdeasContextType {
  savedIdeas: ContentIdea[];
  saveIdea: (idea: ContentIdea) => Promise<void>;
  removeIdea: (id: string) => Promise<void>;
  isIdeaSaved: (id: string) => boolean;
}

const SavedIdeasContext = createContext<SavedIdeasContextType>({
  savedIdeas: [],
  saveIdea: async () => {},
  removeIdea: async () => {},
  isIdeaSaved: () => false,
});

export function SavedIdeasProvider({ children }: { children: React.ReactNode }) {
  const [savedIdeas, setSavedIdeas] = useState<ContentIdea[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(SAVED_IDEAS_KEY).then((data) => {
      if (data) setSavedIdeas(JSON.parse(data));
    });
  }, []);

  const persist = async (ideas: ContentIdea[]) => {
    await AsyncStorage.setItem(SAVED_IDEAS_KEY, JSON.stringify(ideas));
  };

  const saveIdea = useCallback(async (idea: ContentIdea) => {
    setSavedIdeas((prev) => {
      const updated = [{ ...idea, saved: true }, ...prev.filter((i) => i.id !== idea.id)];
      persist(updated);
      return updated;
    });
  }, []);

  const removeIdea = useCallback(async (id: string) => {
    setSavedIdeas((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      persist(updated);
      return updated;
    });
  }, []);

  const isIdeaSaved = useCallback((id: string) => {
    return savedIdeas.some((i) => i.id === id);
  }, [savedIdeas]);

  return (
    <SavedIdeasContext.Provider value={{ savedIdeas, saveIdea, removeIdea, isIdeaSaved }}>
      {children}
    </SavedIdeasContext.Provider>
  );
}

export function useSavedIdeas() {
  return useContext(SavedIdeasContext);
}
