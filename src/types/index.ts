export type Category = 'Wellness' | 'Food & Culinary' | 'Adventure' | 'Entertainment' | 'Gardens' | 'Social Impact' | 'Family';
export type Tier = 'A' | 'B' | 'C';
export type Priority = 'TRÈS HAUTE' | 'HAUTE' | 'MOYENNE' | 'BASSE';
export type PipelineStatus = 'À contacter' | 'WhatsApp envoyé' | 'RDV pris' | 'Visite faite' | 'Signé' | 'Refusé';
export type JourVisite = 'Jour 1' | 'Jour 2' | 'Jour 3' | 'Jour 4';

export interface Partner {
  id: string;
  name: string;
  category: Category;
  zone: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  instagram: string;
  jourVisite: JourVisite;
  status: PipelineStatus;
  notes: string;
  tier: Tier;
  prixPublic: string;
  payoutMAD: string;
  payoutPct: string;
  priority: Priority;
  pitchAngle: string;
  objection: string;
  reponse: string;
  followup: string;
}

export interface Activity {
  id: string;
  partnerId: string;
  type: 'status_change' | 'note' | 'call' | 'whatsapp' | 'email' | 'visit' | 'edit';
  details: string;
  timestamp: string;
}

export type SyncStatus = 'synced' | 'syncing' | 'error' | 'offline';
