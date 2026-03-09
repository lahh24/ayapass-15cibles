'use client';

import { useStore } from '@/lib/store';
import { ROUTE_DAYS } from '@/lib/data';
import { TierBadge, StatusBadge } from './Dashboard';
import { useState } from 'react';
import PartnerDetail from './PartnerDetail';
import { Partner } from '@/types';

function formatWhatsApp(num: string): string {
  return num.replace(/[\s+]/g, '');
}

export default function RoutePlanner() {
  const { partners } = useStore();
  const [expandedDay, setExpandedDay] = useState<string | null>('Jour 1');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  const getPartner = (id: string) => partners.find((p) => p.id === id);

  const toggleDay = (jour: string) => {
    setExpandedDay((prev) => (prev === jour ? null : jour));
  };

  return (
    <div className="space-y-4">
      {ROUTE_DAYS.map((day) => {
        const isExpanded = expandedDay === day.jour;
        const dayPartners = day.partnerIds.map(getPartner).filter(Boolean) as Partner[];
        const signedCount = dayPartners.filter((p) => p.status === 'Signé').length;

        return (
          <div key={day.jour} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            {/* Day Header (clickable) */}
            <button
              onClick={() => toggleDay(day.jour)}
              className="w-full bg-orange-500/10 border-b border-orange-500/20 px-5 py-4 flex items-center justify-between hover:bg-orange-500/15 transition-colors"
            >
              <div className="text-left">
                <h3 className="text-orange-400 font-bold text-lg">{day.jour}</h3>
                <p className="text-sm text-gray-400">{day.title}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-gray-500">{dayPartners.length} partenaires{signedCount > 0 ? ` · ${signedCount} signé${signedCount > 1 ? 's' : ''}` : ''}</span>
                <span className="text-gray-500 text-lg">{isExpanded ? '−' : '+'}</span>
              </div>
            </button>

            {/* Expanded Partner Cards */}
            {isExpanded && (
              <div className="divide-y divide-zinc-800">
                {day.partnerIds.map((id, idx) => {
                  const p = getPartner(id);
                  if (!p) return null;
                  return (
                    <div key={id} className="px-5 py-4 hover:bg-zinc-800/30 transition-colors">
                      {/* Top Row: number, name, tier, status */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-7 h-7 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs font-bold shrink-0">
                          {idx + 1}
                        </div>
                        <TierBadge tier={p.tier} />
                        <button
                          onClick={() => setSelectedPartner(p)}
                          className="text-white font-semibold hover:text-orange-400 text-left flex-1 min-w-0 truncate"
                        >
                          {p.name}
                        </button>
                        <StatusBadge status={p.status} />
                      </div>

                      {/* Details Grid */}
                      <div className="ml-10 space-y-2">
                        {/* Address */}
                        <div className="flex items-start gap-2">
                          <span className="text-[10px] text-gray-600 uppercase w-16 shrink-0 pt-0.5">Adresse</span>
                          <span className="text-sm text-gray-300">{p.address}</span>
                        </div>

                        {/* Contact Row */}
                        <div className="flex flex-wrap gap-2">
                          <a
                            href={`tel:${p.phone}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400 text-sm hover:bg-purple-500/20 transition-colors"
                          >
                            <span className="text-[10px] font-bold uppercase">Tel</span>
                            <span>{p.phone}</span>
                          </a>
                          {p.whatsapp && (
                            <a
                              href={`https://wa.me/${formatWhatsApp(p.whatsapp)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm hover:bg-green-500/20 transition-colors"
                            >
                              <span className="text-[10px] font-bold uppercase">WA</span>
                              <span>{p.whatsapp}</span>
                            </a>
                          )}
                          {p.email && (
                            <a
                              href={`mailto:${p.email}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-sm hover:bg-blue-500/20 transition-colors"
                            >
                              <span className="text-[10px] font-bold uppercase">Email</span>
                              <span className="truncate max-w-[200px]">{p.email}</span>
                            </a>
                          )}
                        </div>

                        {/* Notes */}
                        {p.notes && (
                          <div className="flex items-start gap-2">
                            <span className="text-[10px] text-gray-600 uppercase w-16 shrink-0 pt-0.5">Notes</span>
                            <span className="text-sm text-yellow-400/80 italic">{p.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      {selectedPartner && (
        <PartnerDetail partner={selectedPartner} onClose={() => setSelectedPartner(null)} />
      )}
    </div>
  );
}
