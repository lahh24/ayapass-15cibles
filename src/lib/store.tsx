'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Partner, Activity, SyncStatus, PipelineStatus } from '@/types';
import { loadInitialData, saveToLocal, pullMergePush, markPartnerDirty, addLocalActivity, queueSync } from './sync';

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

  // Pull-merge-push: saves locally, then queues a cloud sync that
  // fetches latest from cloud, merges, and pushes back
  const persistAll = useCallback(() => {
    saveToLocal(partnersRef.current, activitiesRef.current);
    queueSync(async () => {
      const result = await pullMergePush(
        partnersRef.current,
        activitiesRef.current,
        setSyncStatus,
      );
      // If merge returned updated data from cloud, update local state
      if (result) {
        partnersRef.current = result.mergedPartners;
        activitiesRef.current = result.mergedActivities;
        setPartners(result.mergedPartners);
        setActivities(result.mergedActivities);
        saveToLocal(result.mergedPartners, result.mergedActivities);
      }
    });
  }, []);

  const updatePartner = useCallback((id: string, updates: Partial<Partner>) => {
    markPartnerDirty(id);
    setPartners((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
      partnersRef.current = next;
      persistAll();
      return next;
    });
  }, [persistAll]);

  const updateStatus = useCallback((id: string, status: PipelineStatus) => {
    markPartnerDirty(id);
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
      addLocalActivity(newActivity);
      setActivities((prevA) => {
        const nextA = [newActivity, ...prevA];
        activitiesRef.current = nextA;
        persistAll();
        return nextA;
      });

      return next;
    });
  }, [persistAll]);

  const addActivityFn = useCallback((activity: Omit<Activity, 'id' | 'timestamp'>) => {
    const newActivity: Activity = {
      ...activity,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    addLocalActivity(newActivity);
    setActivities((prev) => {
      const next = [newActivity, ...prev];
      activitiesRef.current = next;
      persistAll();
      return next;
    });
  }, [persistAll]);

  return (
    <StoreContext.Provider value={{ partners, activities, syncStatus, updatePartner, updateStatus, addActivity: addActivityFn, loading }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be inside StoreProvider');
  return ctx;
}
