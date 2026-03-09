import { Partner, Activity, SyncStatus } from '@/types';
import { DEFAULT_PARTNERS } from './data';

const SYNC_API_URL = process.env.NEXT_PUBLIC_SYNC_API_URL || '';
const STORAGE_KEY_PARTNERS = 'ayapass_15cibles_partners';
const STORAGE_KEY_ACTIVITIES = 'ayapass_15cibles_activities';

let syncQueue: (() => Promise<void>)[] = [];
let processing = false;

export function getSyncApiUrl(): string {
  return SYNC_API_URL;
}

// localStorage helpers
export function saveToLocal(partners: Partner[], activities: Activity[]) {
  try {
    localStorage.setItem(STORAGE_KEY_PARTNERS, JSON.stringify(partners));
    localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(activities));
  } catch {
    console.warn('localStorage save failed');
  }
}

export function loadFromLocal(): { partners: Partner[] | null; activities: Activity[] | null } {
  try {
    const p = localStorage.getItem(STORAGE_KEY_PARTNERS);
    const a = localStorage.getItem(STORAGE_KEY_ACTIVITIES);
    return {
      partners: p ? JSON.parse(p) : null,
      activities: a ? JSON.parse(a) : null,
    };
  } catch {
    return { partners: null, activities: null };
  }
}

// Cloud fetch
export async function fetchFromCloud(sheet: string): Promise<Record<string, string>[] | null> {
  if (!SYNC_API_URL) return null;
  try {
    const res = await fetch(`${SYNC_API_URL}?sheet=${sheet}`, { mode: 'cors', redirect: 'follow', cache: 'no-store' });
    const json = await res.json();
    if (json.success && json.data) return json.data;
    return null;
  } catch {
    return null;
  }
}

// Prefix phone/whatsapp values with apostrophe so Google Sheets treats them as text
function sanitizeForSheets(row: Record<string, unknown>): Record<string, unknown> {
  const result = { ...row };
  for (const key of ['phone', 'whatsapp']) {
    if (typeof result[key] === 'string' && result[key] && (result[key] as string).startsWith('+')) {
      result[key] = "'" + result[key];
    }
  }
  return result;
}

export async function syncToCloud(
  sheet: string,
  data: Record<string, unknown>[],
  onStatus: (s: SyncStatus) => void
) {
  if (!SYNC_API_URL) {
    onStatus('offline');
    return;
  }
  onStatus('syncing');
  try {
    await fetch(SYNC_API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ sheet, action: 'sync', data: data.map(sanitizeForSheets) }),
    });
    // no-cors returns opaque response — assume success if no error thrown
    onStatus('synced');
  } catch {
    onStatus('error');
  }
}

// Queue processor
export function queueSync(fn: () => Promise<void>) {
  syncQueue.push(fn);
  processQueue();
}

async function processQueue() {
  if (processing) return;
  processing = true;
  while (syncQueue.length > 0) {
    const task = syncQueue.shift()!;
    try {
      await task();
    } catch {
      // retry after 5s
      await new Promise((r) => setTimeout(r, 5000));
      syncQueue.unshift(task);
    }
  }
  processing = false;
}

// Initial load logic
export async function loadInitialData(
  onStatus: (s: SyncStatus) => void
): Promise<{ partners: Partner[]; activities: Activity[] }> {
  let partners: Partner[] = [];
  let activities: Activity[] = [];

  // Step 1: Try cloud
  onStatus('syncing');
  try {
    const cloudPartners = await fetchFromCloud('Partners');
    const cloudActivities = await fetchFromCloud('Activities');
    console.log('[loadInitialData] Cloud raw rows:', cloudPartners?.length ?? 'null');

    if (cloudPartners && cloudPartners.length > 0) {
      const mapped = cloudPartners.map(mapToPartner);
      const valid = mapped.filter((p) => p.id && p.name);
      console.log('[loadInitialData] Cloud valid partners:', valid.length);
      if (valid.length > 0) {
        partners = valid;
        activities = (cloudActivities || []).map(mapToActivity);
        onStatus('synced');
      }
    }
  } catch (e) {
    console.warn('[loadInitialData] Cloud fetch failed:', e);
  }

  // Step 2: Try localStorage
  if (partners.length === 0) {
    console.log('[loadInitialData] Cloud empty, trying localStorage...');
    try {
      const local = loadFromLocal();
      const localValid = (local.partners || []).filter((p) => p.id && p.name);
      console.log('[loadInitialData] localStorage valid partners:', localValid.length);
      if (localValid.length > 0) {
        partners = localValid;
        activities = local.activities || [];
        onStatus('offline');
      }
    } catch (e) {
      console.warn('[loadInitialData] localStorage failed:', e);
    }
  }

  // Step 3: ABSOLUTE LAST FALLBACK — hardcoded defaults, cannot fail
  if (partners.length === 0) {
    console.log('[loadInitialData] All sources empty — loading DEFAULT_PARTNERS (' + DEFAULT_PARTNERS.length + ')');
    partners = DEFAULT_PARTNERS;
    activities = [];
    onStatus('offline');
  }

  console.log('[loadInitialData] Final partner count:', partners.length);
  saveToLocal(partners, activities);
  return { partners, activities };
}

// Google Sheets returns percentages as decimals (0.6 instead of 60%)
function normalizePayoutPct(val: string): string {
  if (!val) return '';
  if (val.includes('%')) return val;
  const num = parseFloat(val);
  if (!isNaN(num) && num > 0 && num <= 1) return `${Math.round(num * 100)}%`;
  if (!isNaN(num) && num > 1) return `${Math.round(num)}%`;
  return val;
}

function mapToPartner(row: Record<string, string>): Partner {
  return {
    id: row.id || '',
    name: row.name || '',
    category: row.category as Partner['category'],
    zone: row.zone || '',
    address: row.address || '',
    phone: row.phone || '',
    whatsapp: row.whatsapp || '',
    email: row.email || '',
    website: row.website || '',
    instagram: row.instagram || '',
    jourVisite: row.jourVisite as Partner['jourVisite'],
    status: (row.status as Partner['status']) || 'À contacter',
    notes: row.notes || '',
    tier: (row.tier as Partner['tier']) || 'C',
    prixPublic: row.prixPublic || '',
    payoutMAD: row.payoutMAD || '',
    payoutPct: normalizePayoutPct(row.payoutPct || ''),
    priority: (row.priority as Partner['priority']) || 'MOYENNE',
    pitchAngle: row.pitchAngle || '',
    objection: row.objection || '',
    reponse: row.reponse || '',
    followup: row.followup || '',
  };
}

function mapToActivity(row: Record<string, string>): Activity {
  return {
    id: row.id || '',
    partnerId: row.partnerId || '',
    type: (row.type as Activity['type']) || 'note',
    details: row.details || '',
    timestamp: row.timestamp || new Date().toISOString(),
  };
}
