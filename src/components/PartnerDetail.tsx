'use client';

import { useState } from 'react';
import { Partner, PipelineStatus } from '@/types';
import { useStore } from '@/lib/store';
import { PIPELINE_STAGES } from '@/lib/data';
import { TierBadge, StatusBadge, PriorityBadge } from './Dashboard';

interface Props {
  partner: Partner;
  onClose: () => void;
}

export default function PartnerDetail({ partner, onClose }: Props) {
  const { updatePartner, updateStatus, addActivity, activities } = useStore();
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(partner.notes);
  const [followup, setFollowup] = useState(partner.followup);
  const [newNote, setNewNote] = useState('');

  const partnerActivities = activities.filter((a) => a.partnerId === partner.id);

  const handleSaveNotes = () => {
    updatePartner(partner.id, { notes, followup });
    setEditing(false);
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    addActivity({ partnerId: partner.id, type: 'note', details: newNote });
    setNewNote('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TierBadge tier={partner.tier} />
                <PriorityBadge priority={partner.priority} />
              </div>
              <h2 className="text-xl font-bold text-white">{partner.name}</h2>
              <p className="text-sm text-gray-400">{partner.category} — {partner.zone}</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">&times;</button>
          </div>

          {/* Status Pipeline */}
          <div>
            <div className="text-xs text-gray-500 uppercase mb-2">Statut</div>
            <div className="flex flex-wrap gap-2">
              {PIPELINE_STAGES.map((stage) => (
                <button
                  key={stage}
                  onClick={() => updateStatus(partner.id, stage as PipelineStatus)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    partner.status === stage
                      ? 'bg-orange-500 border-orange-500 text-black font-bold'
                      : 'border-zinc-700 text-gray-400 hover:border-orange-500/50'
                  }`}
                >
                  {stage}
                </button>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-3">
            <InfoField label="Adresse" value={partner.address} />
            <InfoField label="Téléphone" value={partner.phone} link={`tel:${partner.phone}`} />
            <InfoField label="WhatsApp" value={partner.whatsapp} link={`https://wa.me/${partner.whatsapp.replace(/[^0-9+]/g, '')}`} />
            <InfoField label="Email" value={partner.email} link={`mailto:${partner.email}`} />
            <InfoField label="Site Web" value={partner.website} link={partner.website} />
            <InfoField label="Instagram" value={partner.instagram} />
          </div>

          {/* Financials */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-zinc-800 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-500">Prix Public</div>
              <div className="text-lg font-bold text-white">{partner.prixPublic} MAD</div>
            </div>
            <div className="bg-zinc-800 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-500">Payout</div>
              <div className="text-lg font-bold text-orange-400">{partner.payoutMAD} MAD</div>
            </div>
            <div className="bg-zinc-800 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-500">Payout %</div>
              <div className="text-lg font-bold text-orange-400">{partner.payoutPct}%</div>
            </div>
          </div>

          {/* Pitch */}
          <div className="bg-zinc-800/50 rounded-lg p-4 space-y-3">
            <div>
              <div className="text-xs text-orange-400 font-semibold uppercase mb-1">Pitch Angle</div>
              <p className="text-sm text-gray-300">{partner.pitchAngle}</p>
            </div>
            <div>
              <div className="text-xs text-red-400 font-semibold uppercase mb-1">Objection Probable</div>
              <p className="text-sm text-gray-300">{partner.objection}</p>
            </div>
            <div>
              <div className="text-xs text-green-400 font-semibold uppercase mb-1">Réponse</div>
              <p className="text-sm text-gray-300">{partner.reponse}</p>
            </div>
          </div>

          {/* Notes & Followup */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-gray-500 uppercase">Notes & Suivi</div>
              <button onClick={() => setEditing(!editing)} className="text-xs text-orange-400 hover:text-orange-300">
                {editing ? 'Annuler' : 'Modifier'}
              </button>
            </div>
            {editing ? (
              <div className="space-y-2">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                  rows={3}
                  placeholder="Notes..."
                />
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">Follow-up:</label>
                  <input
                    type="date"
                    value={followup}
                    onChange={(e) => setFollowup(e.target.value)}
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <button onClick={handleSaveNotes} className="px-4 py-1 bg-orange-500 text-black text-sm font-semibold rounded-lg hover:bg-orange-400">
                  Sauvegarder
                </button>
              </div>
            ) : (
              <div className="text-sm text-gray-300">
                {partner.notes || <span className="text-gray-600 italic">Aucune note</span>}
                {partner.followup && (
                  <div className="mt-1 text-xs text-yellow-400">Follow-up: {partner.followup}</div>
                )}
              </div>
            )}
          </div>

          {/* Quick Note */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ajouter une note rapide..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
            <button onClick={handleAddNote} className="px-4 py-2 bg-orange-500 text-black text-sm font-semibold rounded-lg hover:bg-orange-400">
              +
            </button>
          </div>

          {/* Activity Log */}
          {partnerActivities.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 uppercase mb-2">Historique</div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {partnerActivities.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 text-xs py-1 border-b border-zinc-800/50">
                    <span className="text-gray-600">{new Date(a.timestamp).toLocaleDateString('fr-FR')}</span>
                    <span className="text-gray-500">{a.type}</span>
                    <span className="text-gray-300 flex-1">{a.details}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value, link }: { label: string; value: string; link?: string }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-xs text-gray-600">{label}</div>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:text-blue-300 break-all">
          {value}
        </a>
      ) : (
        <div className="text-sm text-gray-300 break-all">{value}</div>
      )}
    </div>
  );
}
