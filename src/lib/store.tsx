'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Partner, Activity, SyncStatus, PipelineStatus } from '@/types';
import { loadInitialData, saveToLocal, syncToCloud, queueSync } from './sync';

interface StoreContextType {
  partners: Partner[];
  activities: Activity[];
  syncStatus: SyncStatus;
  updatePartner: (id: string, updates: Partial<Partner>) => void;
  updateStatus: (id: string, status: PipelineStatus) => void;
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void;
  loading: boolean;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('syncing');
  const [loading, setLoading] = useState(true);
  const partnersRef = useRef<Partner[]>([]);
  const activitiesRef = useRef<Activity[]>([]);

  useEffect(() => {
    loadInitialData(setSyncStatus).then(({ partners: p, activities: a }) => {
      console.log('[StoreProvider] Setting partners:', p.length, '| activities:', a.length);
      setPartners(p);
      setActivities(a);
      partnersRef.current = p;
      activitiesRef.current = a;
      setLoading(false);
    });
  }, []);

  const persistAll = useCallback((p: Partner[], a: Activity[]) => {
    saveToLocal(p, a);
    queueSync(() => syncToCloud('Partners', p as unknown as Record<string, unknown>[], setSyncStatus));
    queueSync(() => syncToCloud('Activities', a as unknown as Record<string, unknown>[], setSyncStatus));
  }, []);

  const updatePartner = useCallback((id: string, updates: Partial<Partner>) => {
    setPartners((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
      partnersRef.current = next;
      persistAll(next, activitiesRef.current);
      return next;
    });
  }, [persistAll]);

  const updateStatus = useCallback((id: string, status: PipelineStatus) => {
    setPartners((prev) => {
      const partner = prev.find((p) => p.id === id);
      const next = prev.map((p) => (p.id === id ? { ...p, status } : p));
      partnersRef.current = next;

      const newActivity: Activity = {
        id: Date.now().toString(),
        partnerId: id,
        type: 'status_change',
        details: `${partner?.status} → ${status}`,
        timestamp: new Date().toISOString(),
      };
      setActivities((prevA) => {
        const nextA = [newActivity, ...prevA];
        activitiesRef.current = nextA;
        persistAll(next, nextA);
        return nextA;
      });

      return next;
    });
  }, [persistAll]);

  const addActivity = useCallback((activity: Omit<Activity, 'id' | 'timestamp'>) => {
    const newActivity: Activity = {
      ...activity,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    setActivities((prev) => {
      const next = [newActivity, ...prev];
      activitiesRef.current = next;
      persistAll(partnersRef.current, next);
      return next;
    });
  }, [persistAll]);

  return (
    <StoreContext.Provider value={{ partners, activities, syncStatus, updatePartner, updateStatus, addActivity, loading }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be inside StoreProvider');
  return ctx;
}
