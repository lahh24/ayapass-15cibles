'use client';

import { useStore } from '@/lib/store';

const statusConfig = {
  synced: { color: 'bg-green-500', label: 'Synced' },
  syncing: { color: 'bg-yellow-500 animate-pulse', label: 'Syncing...' },
  error: { color: 'bg-red-500', label: 'Sync Error' },
  offline: { color: 'bg-gray-500', label: 'Offline' },
};

export default function SyncIndicator() {
  const { syncStatus } = useStore();
  const cfg = statusConfig[syncStatus];

  return (
    <div className="flex items-center gap-2 text-xs text-gray-400">
      <div className={`w-2 h-2 rounded-full ${cfg.color}`} />
      {cfg.label}
    </div>
  );
}
