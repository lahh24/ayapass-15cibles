'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Partner, Category, Tier, PipelineStatus } from '@/types';
import { TierBadge, StatusBadge, PriorityBadge } from './Dashboard';
import PartnerDetail from './PartnerDetail';

export default function PartnersTable() {
  const { partners } = useStore();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterJour, setFilterJour] = useState<string>('all');
  const [sortBy, setSortBy] = useState<keyof Partner>('id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  const filtered = partners
    .filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCategory !== 'all' && p.category !== filterCategory) return false;
      if (filterTier !== 'all' && p.tier !== filterTier) return false;
      if (filterStatus !== 'all' && p.status !== filterStatus) return false;
      if (filterJour !== 'all' && p.jourVisite !== filterJour) return false;
      return true;
    })
    .sort((a, b) => {
      const av = a[sortBy];
      const bv = b[sortBy];
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });

  const handleSort = (col: keyof Partner) => {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(col); setSortDir('asc'); }
  };

  const SortHeader = ({ col, label }: { col: keyof Partner; label: string }) => (
    <th
      className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-pointer hover:text-orange-400 select-none"
      onClick={() => handleSort(col)}
    >
      {label} {sortBy === col ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </th>
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 w-48"
        />
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-gray-300">
          <option value="all">Toutes catégories</option>
          {['Wellness', 'Food & Culinary', 'Adventure', 'Entertainment', 'Gardens', 'Social Impact', 'Family'].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={filterTier} onChange={(e) => setFilterTier(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-gray-300">
          <option value="all">Tous tiers</option>
          {['A', 'B', 'C'].map((t) => <option key={t} value={t}>Tier {t}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-gray-300">
          <option value="all">Tous statuts</option>
          {['À contacter', 'WhatsApp envoyé', 'RDV pris', 'Visite faite', 'Signé', 'Refusé'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={filterJour} onChange={(e) => setFilterJour(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-gray-300">
          <option value="all">Tous jours</option>
          {['Jour 1', 'Jour 2', 'Jour 3', 'Jour 4'].map((j) => <option key={j} value={j}>{j}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 border-b border-zinc-800">
            <tr>
              <SortHeader col="id" label="#" />
              <SortHeader col="name" label="Partenaire" />
              <SortHeader col="category" label="Catégorie" />
              <SortHeader col="zone" label="Zone" />
              <SortHeader col="tier" label="Tier" />
              <SortHeader col="prixPublic" label="Prix Public" />
              <SortHeader col="payoutPct" label="Payout %" />
              <SortHeader col="priority" label="Priorité" />
              <SortHeader col="status" label="Statut" />
              <SortHeader col="jourVisite" label="Jour" />
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors">
                <td className="px-3 py-2 text-gray-500">{p.id}</td>
                <td className="px-3 py-2">
                  <button onClick={() => setSelectedPartner(p)} className="text-orange-400 hover:text-orange-300 font-medium text-left">
                    {p.name}
                  </button>
                </td>
                <td className="px-3 py-2 text-gray-300">{p.category}</td>
                <td className="px-3 py-2 text-gray-400 text-xs">{p.zone}</td>
                <td className="px-3 py-2"><TierBadge tier={p.tier} /></td>
                <td className="px-3 py-2 text-gray-300">{p.prixPublic} MAD</td>
                <td className="px-3 py-2 text-gray-300">{p.payoutPct}</td>
                <td className="px-3 py-2"><PriorityBadge priority={p.priority} /></td>
                <td className="px-3 py-2"><StatusBadge status={p.status} /></td>
                <td className="px-3 py-2 text-gray-400 text-xs">{p.jourVisite}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    {p.whatsapp && <a href={`https://wa.me/${p.whatsapp.replace(/[\s+]/g, '')}`} target="_blank" title="WhatsApp" className="p-1 rounded hover:bg-green-500/20 text-green-400 text-xs">WA</a>}
                    {p.email && <a href={`mailto:${p.email}`} title="Email" className="p-1 rounded hover:bg-blue-500/20 text-blue-400 text-xs">@</a>}
                    <a href={`tel:${p.phone}`} title="Appeler" className="p-1 rounded hover:bg-purple-500/20 text-purple-400 text-xs">Tel</a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedPartner && (
        <PartnerDetail partner={selectedPartner} onClose={() => setSelectedPartner(null)} />
      )}
    </div>
  );
}
