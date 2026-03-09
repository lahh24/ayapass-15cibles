'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { PIPELINE_STAGES, PRICING_TIERS } from '@/lib/data';

function KPICard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

function FunnelBar({ stage, count, total }: { stage: string; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  const colors: Record<string, string> = {
    'À contacter': 'bg-gray-500',
    'WhatsApp envoyé': 'bg-blue-500',
    'RDV pris': 'bg-yellow-500',
    'Visite faite': 'bg-purple-500',
    'Signé': 'bg-green-500',
    'Refusé': 'bg-red-500',
  };
  return (
    <div className="flex items-center gap-3">
      <div className="w-36 text-xs text-gray-400 text-right shrink-0">{stage}</div>
      <div className="flex-1 bg-zinc-800 rounded-full h-6 overflow-hidden">
        <div className={`h-full ${colors[stage] || 'bg-orange-500'} rounded-full transition-all`} style={{ width: `${Math.max(pct, count > 0 ? 8 : 0)}%` }} />
      </div>
      <div className="w-8 text-sm text-white font-semibold">{count}</div>
    </div>
  );
}

export default function Dashboard() {
  const { partners, activities } = useStore();
  const [showPricing, setShowPricing] = useState(false);

  const byStatus = (s: string) => partners.filter((p) => p.status === s).length;
  const byTier = (t: string) => partners.filter((p) => p.tier === t).length;
  const byCategory = (c: string) => partners.filter((p) => p.category === c).length;

  const visited = byStatus('Visite faite') + byStatus('Signé');
  const signed = byStatus('Signé');
  const conversionRate = visited > 0 ? Math.round((signed / visited) * 100) : 0;

  // Overdue follow-ups
  const overdue = partners.filter((p) => {
    if (!p.followup) return false;
    return new Date(p.followup) < new Date();
  });

  // Next actions
  const nextActions = partners
    .filter((p) => p.status !== 'Signé' && p.status !== 'Refusé')
    .sort((a, b) => {
      const priorityOrder = { 'TRÈS HAUTE': 0, 'HAUTE': 1, 'MOYENNE': 2, 'BASSE': 3 };
      return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
    })
    .slice(0, 5);

  const categories = ['Wellness', 'Food & Culinary', 'Adventure', 'Entertainment', 'Gardens', 'Social Impact', 'Family'];

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Total Cibles" value={partners.length} />
        <KPICard label="Signés" value={signed} sub={`sur ${partners.length}`} />
        <KPICard label="Conversion" value={`${conversionRate}%`} sub="Visités -> Signés" />
        <KPICard label="Activités" value={activities.length} />
      </div>

      {/* Funnel */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wide">Pipeline</h3>
        <div className="space-y-2">
          {PIPELINE_STAGES.map((stage) => (
            <FunnelBar key={stage} stage={stage} count={byStatus(stage)} total={partners.length} />
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Tier Breakdown */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">Par Tier</h3>
          <div className="flex gap-4">
            {['A', 'B', 'C'].map((t) => (
              <div key={t} className="flex-1 text-center">
                <div className={`text-2xl font-bold ${t === 'A' ? 'text-amber-400' : t === 'B' ? 'text-blue-400' : 'text-green-400'}`}>
                  {byTier(t)}
                </div>
                <div className="text-xs text-gray-500">Tier {t}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">Par Catégorie</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <span key={c} className="px-2 py-1 bg-zinc-800 rounded text-xs text-gray-300">
                {c}: {byCategory(c)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Next Actions */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
          Prochaines Actions {overdue.length > 0 && <span className="text-red-400 ml-2">({overdue.length} en retard)</span>}
        </h3>
        <div className="space-y-2">
          {nextActions.map((p) => (
            <div key={p.id} className="flex items-center gap-3 py-2 border-b border-zinc-800 last:border-0">
              <TierBadge tier={p.tier} />
              <span className="text-white text-sm font-medium flex-1">{p.name}</span>
              <StatusBadge status={p.status} />
              <PriorityBadge priority={p.priority} />
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Model Reference (collapsible) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowPricing(!showPricing)}
          className="w-full px-5 py-3 flex items-center justify-between text-sm font-semibold text-gray-300 uppercase tracking-wide hover:bg-zinc-800/50 transition-colors"
        >
          <span>Modèle de Pricing (Référence)</span>
          <span className="text-gray-500">{showPricing ? '−' : '+'}</span>
        </button>
        {showPricing && (
          <div className="px-5 pb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-700">
                  <th className="text-left py-2 text-gray-500 font-medium">Tier</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Définition</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Payout</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Exemples</th>
                </tr>
              </thead>
              <tbody>
                {PRICING_TIERS.map((t) => (
                  <tr key={t.tier} className="border-b border-zinc-800 last:border-0">
                    <td className="py-2">
                      <TierBadge tier={t.tier} />
                      <span className="ml-2 text-gray-300">{t.name}</span>
                    </td>
                    <td className="py-2 text-gray-400">{t.definition}</td>
                    <td className="py-2 text-orange-400 font-medium">{t.payout}</td>
                    <td className="py-2 text-gray-500 text-xs">{t.examples}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function TierBadge({ tier }: { tier: string }) {
  const colors = { A: 'bg-amber-500/20 text-amber-400 border-amber-500/30', B: 'bg-blue-500/20 text-blue-400 border-blue-500/30', C: 'bg-green-500/20 text-green-400 border-green-500/30' };
  return <span className={`px-2 py-0.5 text-xs font-bold rounded border ${colors[tier as keyof typeof colors] || colors.C}`}>{tier}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    'À contacter': 'bg-gray-500/20 text-gray-400',
    'WhatsApp envoyé': 'bg-blue-500/20 text-blue-400',
    'RDV pris': 'bg-yellow-500/20 text-yellow-400',
    'Visite faite': 'bg-purple-500/20 text-purple-400',
    'Signé': 'bg-green-500/20 text-green-400',
    'Refusé': 'bg-red-500/20 text-red-400',
  };
  return <span className={`px-2 py-0.5 text-xs rounded ${colors[status] || 'bg-zinc-700 text-gray-300'}`}>{status}</span>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    'TRÈS HAUTE': 'text-red-400',
    'HAUTE': 'text-orange-400',
    'MOYENNE': 'text-yellow-400',
    'BASSE': 'text-gray-400',
  };
  return <span className={`text-xs font-semibold ${colors[priority] || 'text-gray-400'}`}>{priority}</span>;
}
