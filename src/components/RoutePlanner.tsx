'use client';

import { useStore } from '@/lib/store';
import { ROUTE_DAYS } from '@/lib/data';
import { TierBadge, StatusBadge } from './Dashboard';
import { useState } from 'react';
import PartnerDetail from './PartnerDetail';
import { Partner } from '@/types';

export default function RoutePlanner() {
  const { partners } = useStore();
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  const getPartner = (id: string) => partners.find((p) => p.id === id);

  return (
    <div className="space-y-6">
      {ROUTE_DAYS.map((day) => (
        <div key={day.jour} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="bg-orange-500/10 border-b border-orange-500/20 px-5 py-3">
            <h3 className="text-orange-400 font-bold">{day.jour}</h3>
            <p className="text-sm text-gray-400">{day.title}</p>
          </div>
          <div className="divide-y divide-zinc-800">
            {day.partnerIds.map((id, idx) => {
              const p = getPartner(id);
              if (!p) return null;
              return (
                <div key={id} className="px-5 py-3 flex items-center gap-4 hover:bg-zinc-800/30 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-sm font-bold shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <TierBadge tier={p.tier} />
                      <button
                        onClick={() => setSelectedPartner(p)}
                        className="text-white font-medium hover:text-orange-400 truncate"
                      >
                        {p.name}
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{p.address}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={p.status} />
                    <div className="flex gap-1">
                      <a href={`https://wa.me/${p.whatsapp.replace(/[^0-9+]/g, '')}`} target="_blank" className="p-1.5 rounded-lg hover:bg-green-500/20 text-green-400 text-xs font-medium">WA</a>
                      <a href={`tel:${p.phone}`} className="p-1.5 rounded-lg hover:bg-purple-500/20 text-purple-400 text-xs font-medium">Tel</a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {selectedPartner && (
        <PartnerDetail partner={selectedPartner} onClose={() => setSelectedPartner(null)} />
      )}
    </div>
  );
}
