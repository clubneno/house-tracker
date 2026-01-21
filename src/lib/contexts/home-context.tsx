'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Home } from '@/lib/db/schema';

interface HomeContextType {
  homes: Home[];
  selectedHomeId: string | null;
  selectedHome: Home | null;
  setSelectedHomeId: (id: string | null) => void;
  isLoading: boolean;
  refreshHomes: () => Promise<void>;
}

const HomeContext = createContext<HomeContextType | undefined>(undefined);

const STORAGE_KEY = 'house-tracker-selected-home';

export function HomeProvider({ children }: { children: React.ReactNode }) {
  const [homes, setHomes] = useState<Home[]>([]);
  const [selectedHomeId, setSelectedHomeIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load selected home from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedHomeId = localStorage.getItem(STORAGE_KEY);
      setSelectedHomeIdState(storedHomeId);
      setIsInitialized(true);
    }
  }, []);

  // Fetch homes from API
  const refreshHomes = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/homes');
      if (response.ok) {
        const data = await response.json();
        setHomes(data);
      }
    } catch (error) {
      console.error('Failed to fetch homes:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch homes on mount
  useEffect(() => {
    if (isInitialized) {
      refreshHomes();
    }
  }, [isInitialized, refreshHomes]);

  // Set selected home ID and persist to localStorage
  const setSelectedHomeId = useCallback((id: string | null) => {
    setSelectedHomeIdState(id);
    if (typeof window !== 'undefined') {
      if (id) {
        localStorage.setItem(STORAGE_KEY, id);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Get the selected home object
  const selectedHome = selectedHomeId
    ? homes.find(h => h.id === selectedHomeId) || null
    : null;

  // If selected home doesn't exist in homes list, clear selection
  useEffect(() => {
    if (selectedHomeId && homes.length > 0 && !homes.find(h => h.id === selectedHomeId)) {
      setSelectedHomeId(null);
    }
  }, [homes, selectedHomeId, setSelectedHomeId]);

  return (
    <HomeContext.Provider
      value={{
        homes,
        selectedHomeId,
        selectedHome,
        setSelectedHomeId,
        isLoading,
        refreshHomes,
      }}
    >
      {children}
    </HomeContext.Provider>
  );
}

export function useHome() {
  const context = useContext(HomeContext);
  if (context === undefined) {
    throw new Error('useHome must be used within a HomeProvider');
  }
  return context;
}
