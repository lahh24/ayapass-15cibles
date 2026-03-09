'use client';

import { useState } from 'react';
import { StoreProvider } from '@/lib/store';
import SyncIndicator from '@/components/SyncIndicator';
import Dashboard from '@/components/Dashboard';
import PartnersTable from '@/components/PartnersTable';
import Pipeline from '@/components/Pipeline';
import RoutePlanner from '@/components/RoutePlanner';

type Tab = 'dashboard' | 'partners' | 'pipeline' | 'route';

const TABS: { id: Tab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'partners', label: 'Partenaires' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'route', label: 'Route' },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  return (
    <StoreProvider>
      <div className="min-h-screen bg-black">
        {/* Header */}
        <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-black font-bold text-sm">A</div>
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">15 Cibles Partenaires</h1>
                <p className="text-xs text-gray-500">Mission Control — Marrakech</p>
              </div>
            </div>
            <SyncIndicator />
          </div>

          {/* Tabs */}
          <div className="max-w-7xl mx-auto px-4">
            <nav className="flex gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-zinc-900 text-orange-400 border-b-2 border-orange-500'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-zinc-900/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-7xl mx-auto px-4 py-6">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'partners' && <PartnersTable />}
          {activeTab === 'pipeline' && <Pipeline />}
          {activeTab === 'route' && <RoutePlanner />}
        </main>
      </div>
    </StoreProvider>
  );
}
