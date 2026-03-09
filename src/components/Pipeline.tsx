'use client';

import { useStore } from '@/lib/store';
import { PIPELINE_STAGES } from '@/lib/data';
import { Partner, PipelineStatus } from '@/types';
import { TierBadge, PriorityBadge } from './Dashboard';
import { useState } from 'react';
import PartnerDetail from './PartnerDetail';

export default function Pipeline() {
  const { partners, updateStatus } = useStore();
  const [dragging, setDragging] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  const handleDragStart = (id: string) => setDragging(id);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (stage: string) => {
    if (dragging) {
      updateStatus(dragging, stage as PipelineStatus);
      setDragging(null);
    }
  };

  const stageColors: Record<string, string> = {
    'À contacter': 'border-gray-600',
    'WhatsApp envoyé': 'border-blue-600',
    'RDV pris': 'border-yellow-600',
    'Visite faite': 'border-purple-600',
    'Signé': 'border-green-600',
    'Refusé': 'border-red-600',
  };

  const getNextStage = (current: string): string | null => {
    const idx = PIPELINE_STAGES.indexOf(current);
    if (idx < 0 || idx >= PIPELINE_STAGES.length - 2) return null; // Don't auto-advance to Refusé
    return PIPELINE_STAGES[idx + 1];
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {PIPELINE_STAGES.map((stage) => {
        const stagePartners = partners.filter((p) => p.status === stage);
        return (
          <div
            key={stage}
            className={`flex-shrink-0 w-64 bg-zinc-900/50 rounded-xl border-t-2 ${stageColors[stage] || 'border-zinc-700'}`}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(stage)}
          >
            <div className="p-3 border-b border-zinc-800">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-300">{stage}</h3>
                <span className="text-xs text-gray-500 bg-zinc-800 px-2 py-0.5 rounded-full">{stagePartners.length}</span>
              </div>
            </div>
            <div className="p-2 space-y-2 min-h-[200px]">
              {stagePartners.map((p) => (
                <div
                  key={p.id}
                  draggable
                  onDragStart={() => handleDragStart(p.id)}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-orange-500/30 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <TierBadge tier={p.tier} />
                    <button onClick={() => setSelectedPartner(p)} className="text-sm font-medium text-white hover:text-orange-400 text-left flex-1 truncate">
                      {p.name}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{p.category}</span>
                    <PriorityBadge priority={p.priority} />
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{p.zone}</div>
                  {getNextStage(p.status) && (
                    <button
                      onClick={() => updateStatus(p.id, getNextStage(p.status) as PipelineStatus)}
                      className="mt-2 w-full py-1 text-xs bg-orange-500/10 text-orange-400 rounded hover:bg-orange-500/20 transition-colors"
                    >
                      → {getNextStage(p.status)}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {selectedPartner && (
        <PartnerDetail partner={selectedPartner} onClose={() => setSelectedPartner(null)} />
      )}
    </div>
  );
}
