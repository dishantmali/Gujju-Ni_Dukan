import { useCallback, useState, useEffect } from 'react';

const STORAGE_KEY = 'gnd_recent_icons_v1';
const MAX_RECENT = 20;

export interface RecentIcon {
  value: string;
  type: string;
  label?: string;
  timestamp: number;
}

function readStorage(): RecentIcon[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentIcon[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeStorage(items: RecentIcon[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage errors (e.g. quota exceeded)
  }
}

export function useRecentIcons() {
  const [recent, setRecent] = useState<RecentIcon[]>(readStorage);

  useEffect(() => {
    setRecent(readStorage());
  }, []);

  const addRecent = useCallback((value: string, type: string, label?: string) => {
    if (!value) return;
    setRecent(prev => {
      const next = prev.filter(r => r.value !== value);
      next.unshift({
        value,
        type,
        label: label || value,
        timestamp: Date.now(),
      });
      if (next.length > MAX_RECENT) next.length = MAX_RECENT;
      writeStorage(next);
      return [...next];
    });
  }, []);

  const removeRecent = useCallback((value: string) => {
    setRecent(prev => {
      const next = prev.filter(r => r.value !== value);
      writeStorage(next);
      return [...next];
    });
  }, []);

  const clearRecent = useCallback(() => {
    writeStorage([]);
    setRecent([]);
  }, []);

  return { recent, addRecent, removeRecent, clearRecent };
}
