import { Partner, Activity, SyncStatus } from '@/types';
import { DEFAULT_PARTNERS } from './data';

const SYNC_API_URL = process.env.NEXT_PUBLIC_SYNC_API_URL || '';
const STORAGE_KEY_PARTNERS = 'ayapass_15cibles_partners';
const STORAGE_KEY_ACTIVITIES = 'ayapass_15cibles_activities';

let syncRunning = false;
let syncPending = false;

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
export async function fetchFromCloud(sheet: string): Promise<Record<string, unknown>[] | null> {
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

// Push data to cloud (raw POST, no merge)
async function pushToCloud(
  sheet: string,
  data: Record<string, unknown>[],
) {
  if (!SYNC_API_URL) return;
  await fetch(SYNC_API_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ sheet, action: 'sync', data: data.map(sanitizeForSheets) }),
  });
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

// ─── Pull-Merge-Push sync ───────────────────────────────────────────

// Track which partner IDs have been modified locally since last successful sync
const dirtyPartnerIds = new Set<string>();
const localNewActivities: Activity[] = [];

export function markPartnerDirty(id: string) {
  dirtyPartnerIds.add(id);
}

export function addLocalActivity(activity: Activity) {
  localNewActivities.push(activity);
}

/**
 * Pull-merge-push with mutex:
 * - Only one sync can run at a time
 * - If called while running, queues one follow-up run (coalesced)
 * - The follow-up will use the latest refs, so all batched changes are included
 */
export async function pullMergePush(
  getLocalPartners: () => Partner[],
  getLocalActivities: () => Activity[],
  onStatus: (s: SyncStatus) => void,
  onResult: (result: { mergedPartners: Partner[]; mergedActivities: Activity[] }) => void,
): Promise<void> {
  if (!SYNC_API_URL) {
    onStatus('offline');
    return;
  }

  // Mutex: if already running, mark pending and return
  if (syncRunning) {
    syncPending = true;
    console.log('[pullMergePush] Already running, queued follow-up');
    return;
  }

  syncRunning = true;

  try {
    await doPullMergePush(getLocalPartners(), getLocalActivities(), onStatus, onResult);
  } finally {
    syncRunning = false;

    // If another sync was requested while we were running, do one more pass
    if (syncPending) {
      syncPending = false;
      console.log('[pullMergePush] Running queued follow-up');
      await pullMergePush(getLocalPartners, getLocalActivities, onStatus, onResult);
    }
  }
}

async function doPullMergePush(
  localPartners: Partner[],
  localActivities: Activity[],
  onStatus: (s: SyncStatus) => void,
  onResult: (result: { mergedPartners: Partner[]; mergedActivities: Activity[] }) => void,
): Promise<void> {
  onStatus('syncing');
  console.log('[pullMergePush] Dirty partners:', [...dirtyPartnerIds]);
  console.log('[pullMergePush] New local activities:', localNewActivities.length);

  try {
    // Step 1: Pull latest from cloud
    const cloudPartnersRaw = await fetchFromCloud('Partners');
    const cloudActivitiesRaw = await fetchFromCloud('Activities');

    // Step 2: Merge partners — cloud is base, local dirty partners win
    let mergedPartners: Partner[];
    if (cloudPartnersRaw && cloudPartnersRaw.length > 0) {
      const cloudPartners = cloudPartnersRaw.map(mapToPartner).filter((p) => p.id && p.name);
      console.log('[pullMergePush] Cloud partners:', cloudPartners.length, '| dirty local:', dirtyPartnerIds.size);

      if (dirtyPartnerIds.size === 0) {
        mergedPartners = cloudPartners;
      } else {
        const partnerMap = new Map<string, Partner>();
        for (const p of cloudPartners) partnerMap.set(p.id, p);
        for (const p of localPartners) {
          if (dirtyPartnerIds.has(p.id)) {
            partnerMap.set(p.id, p);
          }
        }
        mergedPartners = Array.from(partnerMap.values());
      }
    } else {
      console.log('[pullMergePush] Cloud empty, using local partners');
      mergedPartners = localPartners;
    }

    // Step 3: Merge activities — union by ID
    const cloudActivities = (cloudActivitiesRaw || []).map(mapToActivity);
    const activityMap = new Map<string, Activity>();
    for (const a of cloudActivities) activityMap.set(a.id, a);
    for (const a of localActivities) activityMap.set(a.id, a);
    for (const a of localNewActivities) activityMap.set(a.id, a);
    const mergedActivities = Array.from(activityMap.values())
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    console.log('[pullMergePush] Merged activities:', mergedActivities.length,
      '(cloud:', cloudActivities.length, '+ local new:', localNewActivities.length, ')');

    // Step 4: Push merged data to cloud
    await pushToCloud('Partners', mergedPartners as unknown as Record<string, unknown>[]);
    await pushToCloud('Activities', mergedActivities as unknown as Record<string, unknown>[]);

    // Clear dirty tracking
    dirtyPartnerIds.clear();
    localNewActivities.length = 0;

    onStatus('synced');
    console.log('[pullMergePush] Sync complete — partners:', mergedPartners.length, '| activities:', mergedActivities.length);
    onResult({ mergedPartners, mergedActivities });
  } catch (e) {
    console.warn('[pullMergePush] Sync failed:', e);
    onStatus('error');
  }
}

// Initial load logic
export async function loadInitialData(
  onStatus: (s: SyncStatus) => void
): Promise<{ partners: Partner[]; activities: Activity[] }> {
  let partners: Partner[] = [];
  let activities: Activity[] = [];

  // Step 1: Try cloud (source of truth)
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

  // Step 2: Try localStorage (only if cloud failed/empty)
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

// Google Sheets can return numbers instead of strings — coerce everything
function str(val: unknown): string {
  if (val == null) return '';
  return String(val);
}

function mapToPartner(row: Record<string, unknown>): Partner {
  return {
    id: str(row.id),
    name: str(row.name),
    category: str(row.category) as Partner['category'],
    zone: str(row.zone),
    address: str(row.address),
    phone: str(row.phone),
    whatsapp: str(row.whatsapp),
    email: str(row.email),
    website: str(row.website),
    instagram: str(row.instagram),
    jourVisite: str(row.jourVisite) as Partner['jourVisite'],
    status: (str(row.status) as Partner['status']) || 'À contacter',
    notes: str(row.notes),
    tier: (str(row.tier) as Partner['tier']) || 'C',
    prixPublic: str(row.prixPublic),
    payoutMAD: str(row.payoutMAD),
    payoutPct: normalizePayoutPct(str(row.payoutPct)),
    priority: (str(row.priority) as Partner['priority']) || 'MOYENNE',
    pitchAngle: str(row.pitchAngle),
    objection: str(row.objection),
    reponse: str(row.reponse),
    followup: str(row.followup),
  };
}

function mapToActivity(row: Record<string, unknown>): Activity {
  return {
    id: str(row.id),
    partnerId: str(row.partnerId),
    type: (str(row.type) as Activity['type']) || 'note',
    details: str(row.details),
    timestamp: str(row.timestamp) || new Date().toISOString(),
  };
}

// Background poll: fetch latest from cloud without pushing anything
export async function pollCloudData(): Promise<{ partners: Partner[]; activities: Activity[] } | null> {
  try {
    const cloudPartners = await fetchFromCloud('Partners');
    const cloudActivities = await fetchFromCloud('Activities');
    if (!cloudPartners || cloudPartners.length === 0) return null;

    const partners = cloudPartners.map(mapToPartner).filter((p) => p.id && p.name);
    if (partners.length === 0) return null;

    const activities = (cloudActivities || []).map(mapToActivity);
    console.log('[poll] Fetched', partners.length, 'partners,', activities.length, 'activities from cloud');
    return { partners, activities };
  } catch {
    return null;
  }
}
