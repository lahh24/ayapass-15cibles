'use client';

import { useStore } from '@/lib/store';
import { TierBadge, PriorityBadge } from './Dashboard';

function formatWhatsApp(num: string): string {
  return num.replace(/[\s+]/g, '');
}

export default function PitchPrep() {
  const { partners } = useStore();

  // Sort by priority then tier
  const sorted = [...partners].sort((a, b) => {
    const pOrder = { 'TRÈS HAUTE': 0, 'HAUTE': 1, 'MOYENNE': 2, 'BASSE': 3 };
    const diff = (pOrder[a.priority] || 3) - (pOrder[b.priority] || 3);
    if (diff !== 0) return diff;
    const tOrder = { A: 0, B: 1, C: 2 };
    return (tOrder[a.tier] || 2) - (tOrder[b.tier] || 2);
  });

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide">Battle Cards — prêt pour le terrain</p>
      {sorted.map((p) => (
        <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-zinc-800 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TierBadge tier={p.tier} />
                <PriorityBadge priority={p.priority} />
                <span className="text-xs text-gray-600">{p.category}</span>
              </div>
              <h3 className="text-lg font-bold text-white">{p.name}</h3>
              <p className="text-sm text-gray-500">{p.zone}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              {p.whatsapp && (
                <a
                  href={`https://wa.me/${formatWhatsApp(p.whatsapp)}`}
                  target="_blank"
                  className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium hover:bg-green-500/30 transition-colors"
                >
                  WA
                </a>
              )}
              <a
                href={`tel:${p.phone}`}
                className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-500/30 transition-colors"
              >
                Tel
              </a>
              {p.email && (
                <a
                  href={`mailto:${p.email}`}
                  className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-500/30 transition-colors"
                >
                  @
                </a>
              )}
            </div>
          </div>

          {/* Battle Card Content */}
          <div className="p-5 space-y-4">
            {/* Pitch Angle */}
            <div>
              <div className="text-xs text-orange-400 font-bold uppercase tracking-wide mb-1">Pitch Angle</div>
              <p className="text-base text-white leading-relaxed">{p.pitchAngle}</p>
            </div>

            {/* Objection */}
            <div>
              <div className="text-xs text-red-400 font-bold uppercase tracking-wide mb-1">Objection Probable</div>
              <p className="text-base text-gray-300 leading-relaxed">{p.objection}</p>
            </div>

            {/* Response */}
            <div>
              <div className="text-xs text-green-400 font-bold uppercase tracking-wide mb-1">Réponse Objection</div>
              <p className="text-base text-white leading-relaxed">{p.reponse}</p>
            </div>

            {/* Quick Reference */}
            <div className="flex flex-wrap gap-3 pt-2 border-t border-zinc-800">
              <div className="bg-zinc-800 rounded-lg px-3 py-2">
                <div className="text-[10px] text-gray-500 uppercase">Prix Public</div>
                <div className="text-sm font-bold text-white">{p.prixPublic} MAD</div>
              </div>
              <div className="bg-zinc-800 rounded-lg px-3 py-2">
                <div className="text-[10px] text-gray-500 uppercase">Payout</div>
                <div className="text-sm font-bold text-orange-400">{p.payoutPct}</div>
              </div>
              <div className="bg-zinc-800 rounded-lg px-3 py-2">
                <div className="text-[10px] text-gray-500 uppercase">Payout MAD</div>
                <div className="text-sm font-bold text-orange-400">{p.payoutMAD}</div>
              </div>
              {p.notes && (
                <div className="bg-zinc-800 rounded-lg px-3 py-2 flex-1 min-w-[200px]">
                  <div className="text-[10px] text-gray-500 uppercase">Notes</div>
                  <div className="text-sm text-gray-300">{p.notes}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
