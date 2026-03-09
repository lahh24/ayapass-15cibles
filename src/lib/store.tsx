'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Partner, Activity, SyncStatus, PipelineStatus } from '@/types';
import { loadInitialData, saveToLocal, pullMergePush, pollCloudData, markPartnerDirty, addLocalActivity } from './sync';

const POLL_INTERVAL = 30_000; // 30 seconds
const DEBOUNCE_MS = 5_000;   // 5 seconds debounce before syncing

interface StoreContextType {
  partners: Partner[];
  activities: Activity[];
  syncStatus: SyncStatus;
  polling: boolean;
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
  const [polling, setPolling] = useState(false);
  const partnersRef = useRef<Partner[]>([]);
  const activitiesRef = useRef<Activity[]>([]);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Apply merged result from cloud to local state
  const applyMergedResult = useCallback((result: { mergedPartners: Partner[]; mergedActivities: Activity[] }) => {
    partnersRef.current = result.mergedPartners;
    activitiesRef.current = result.mergedActivities;
    setPartners(result.mergedPartners);
    setActivities(result.mergedActivities);
    saveToLocal(result.mergedPartners, result.mergedActivities);
  }, []);

  // Initial load
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

  // Background polling every 30s
  useEffect(() => {
    if (loading) return;

    const poll = async () => {
      setPolling(true);
      try {
        const result = await pollCloudData();
        if (result) {
          const cloudMap = new Map(result.partners.map((p) => [p.id, p]));
          for (const p of partnersRef.current) {
            if (!cloudMap.has(p.id)) cloudMap.set(p.id, p);
          }
          const merged = Array.from(cloudMap.values());

          const actMap = new Map<string, Activity>();
          for (const a of result.activities) actMap.set(a.id, a);
          for (const a of activitiesRef.current) actMap.set(a.id, a);
          const mergedAct = Array.from(actMap.values())
            .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

          partnersRef.current = merged;
          activitiesRef.current = mergedAct;
          setPartners(merged);
          setActivities(mergedAct);
          saveToLocal(merged, mergedAct);
          setSyncStatus('synced');
        }
      } catch {
        // Silent fail
      }
      setPolling(false);
    };

    const interval = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [loading]);

  // Debounced cloud sync: waits 5s after last change, then does pull-merge-push.
  // Multiple rapid changes reset the timer — only one sync fires.
  const scheduleSync = useCallback(() => {
    // Save to localStorage immediately (no debounce for offline backup)
    saveToLocal(partnersRef.current, activitiesRef.current);

    // Debounce the cloud sync
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      debounceTimer.current = null;
      console.log('[scheduleSync] Debounce expired, starting pull-merge-push');
      pullMergePush(
        () => partnersRef.current,
        () => activitiesRef.current,
        setSyncStatus,
        applyMergedResult,
      );
    }, DEBOUNCE_MS);
  }, [applyMergedResult]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const updatePartner = useCallback((id: string, updates: Partial<Partner>) => {
    markPartnerDirty(id);
    setPartners((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
      partnersRef.current = next;
      scheduleSync();
      return next;
    });
  }, [scheduleSync]);

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
        scheduleSync();
        return nextA;
      });

      return next;
    });
  }, [scheduleSync]);

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
      scheduleSync();
      return next;
    });
  }, [scheduleSync]);

  return (
    <StoreContext.Provider value={{ partners, activities, syncStatus, polling, updatePartner, updateStatus, addActivity: addActivityFn, loading }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be inside StoreProvider');
  return ctx;
}
