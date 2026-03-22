import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NICHE_KEY = "@contentcraft_niche";
const DEFAULT_NICHE = "Business & Entrepreneurship";

interface NicheContextType {
  niche: string;
  setNiche: (niche: string) => Promise<void>;
  isLoading: boolean;
}

const NicheContext = createContext<NicheContextType>({
  niche: DEFAULT_NICHE,
  setNiche: async () => {},
  isLoading: true,
});

export function NicheProvider({ children }: { children: React.ReactNode }) {
  const [niche, setNicheState] = useState(DEFAULT_NICHE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(NICHE_KEY).then((stored) => {
      if (stored) setNicheState(stored);
      setIsLoading(false);
    });
  }, []);

  const setNiche = useCallback(async (newNiche: string) => {
    setNicheState(newNiche);
    await AsyncStorage.setItem(NICHE_KEY, newNiche);
  }, []);

  return (
    <NicheContext.Provider value={{ niche, setNiche, isLoading }}>
      {children}
    </NicheContext.Provider>
  );
}

export function useNiche() {
  return useContext(NicheContext);
}
