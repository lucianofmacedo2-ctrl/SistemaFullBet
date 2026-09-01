import { DbState, Country, League, Team, Match, AppUser } from '../types';
import defaultDatabaseData from '../data/defaultDatabase.json';
import { sanitizeAndCleanDb } from '../utils/dbSanitizer';
import { ensureCanonicalCountriesAndLeagues } from '../utils/countryLeagueHelper';
import {
  saveDbToFirestore,
  fetchDbFromFirestore,
  deleteUserFromFirestore,
  isFirestoreQuotaExhausted,
} from './firebaseDbService';

const STORAGE_KEY = 'football_db_v1';
const USERS_STORAGE_KEY = 'football_users_list_v1';
const USERS_BACKUP_STORAGE_KEY = 'football_users_backup_v1';

// Preloaded database built into client bundle (contains all 641+ matches, 22 leagues, 11 countries)
const SEED_DATABASE: DbState = defaultDatabaseData as unknown as DbState;

/**
 * Robustly merges multiple user lists, preserving all unique users by ID / username.
 */
export function mergeUsersLists(...lists: (AppUser[] | undefined | null)[]): AppUser[] {
  const userMap = new Map<string, AppUser>();

  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const u of list) {
      if (!u || (!u.id && !u.username)) continue;
      const key = (u.id || u.username).toLowerCase().trim();
      const existing = userMap.get(key);
      if (!existing) {
        userMap.set(key, { ...u });
      } else {
        // Merge preferring newer or non-empty fields
        userMap.set(key, {
          ...existing,
          ...u,
          password: u.password || existing.password,
          expiresAt: u.expiresAt !== undefined ? u.expiresAt : existing.expiresAt,
          duration: u.duration || existing.duration,
          status: u.status || existing.status,
          notes: u.notes || existing.notes,
        });
      }
    }
  }

  const merged = Array.from(userMap.values());
  // Backup merged users locally
  if (merged.length > 0) {
    try {
      localStorage.setItem(USERS_BACKUP_STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // ignore
    }
  }
  return merged;
}

export async function fetchUsersList(): Promise<AppUser[]> {
  let serverUsers: AppUser[] = [];
  try {
    const res = await fetch('/api/users', {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (res.ok) {
      const users = await res.json();
      if (Array.isArray(users)) {
        serverUsers = users;
      }
    }
  } catch (err) {
    console.warn('Could not fetch users from server', err);
  }

  let localUsers: AppUser[] = [];
  const saved = localStorage.getItem(USERS_STORAGE_KEY) || localStorage.getItem(USERS_BACKUP_STORAGE_KEY);
  if (saved) {
    try {
      localUsers = JSON.parse(saved);
    } catch {
      // ignore
    }
  }

  const merged = mergeUsersLists(localUsers, serverUsers);
  if (merged.length > 0) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(merged));
  }
  return merged;
}

export async function saveUsersList(users: AppUser[], isExplicitReplacement: boolean = false): Promise<boolean> {
  let usersToSave = users;
  if (!isExplicitReplacement) {
    // Merge with any cached users to never lose previously created users
    const existing = await fetchUsersList();
    usersToSave = mergeUsersLists(existing, users);
  }

  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(usersToSave));
  localStorage.setItem(USERS_BACKUP_STORAGE_KEY, JSON.stringify(usersToSave));

  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users: usersToSave, replaceAll: isExplicitReplacement }),
    });
    return res.ok;
  } catch (err) {
    console.warn('Could not save users to server', err);
    return false;
  }
}

export async function deleteUserPermanently(userId: string): Promise<boolean> {
  try {
    const current = await fetchUsersList();
    const filtered = current.filter(u => u.id !== userId && u.username.toLowerCase() !== userId.toLowerCase());
    await saveUsersList(filtered, true);

    deleteUserFromFirestore(userId).catch(() => {});

    await fetch('/api/users/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return true;
  } catch (err) {
    console.warn('Error deleting user:', err);
    return false;
  }
}

/**
 * Instantly retrieves the cached database state from LocalStorage or SEED_DATABASE (0ms latency).
 * Allows the entire user interface to render immediately without waiting for network roundtrips.
 */
export function getInstantCachedDatabaseState(): DbState {
  let dbData: DbState | null = null;
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.matches?.length > 0 || parsed.countries?.length > 0)) {
          dbData = parsed;
        }
      } catch {
        // ignore
      }
    }
  }

  if (!dbData || (!dbData.matches?.length && !dbData.countries?.length)) {
    dbData = {
      countries: SEED_DATABASE.countries || [],
      leagues: SEED_DATABASE.leagues || [],
      teams: SEED_DATABASE.teams || [],
      matches: SEED_DATABASE.matches || [],
      users: SEED_DATABASE.users || [],
    };
  }

  let localSavedUsers: AppUser[] = [];
  if (typeof localStorage !== 'undefined') {
    const localSavedUsersRaw = localStorage.getItem(USERS_STORAGE_KEY) || localStorage.getItem(USERS_BACKUP_STORAGE_KEY);
    if (localSavedUsersRaw) {
      try {
        localSavedUsers = JSON.parse(localSavedUsersRaw);
      } catch {
        // ignore
      }
    }
  }

  const mergedUsers = mergeUsersLists(dbData.users, localSavedUsers, SEED_DATABASE.users);
  dbData.users = mergedUsers;
  return dbData;
}

export async function fetchDatabaseState(): Promise<DbState> {
  let dbData: DbState | null = null;
  let firestoreUsers: AppUser[] = [];

  // 1. Try fetching from Firebase Firestore first (Primary Multi-Device Cloud with timeout)
  try {
    const firestorePromise = fetchDbFromFirestore();
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000));
    const firestoreData = await Promise.race([firestorePromise, timeoutPromise]);

    if (firestoreData) {
      if (firestoreData.matches?.length > 0 || firestoreData.countries?.length > 0) {
        dbData = firestoreData;
      }
      if (Array.isArray(firestoreData.users) && firestoreData.users.length > 0) {
        firestoreUsers = firestoreData.users;
      }
    }
  } catch (cloudErr) {
    console.warn('Firestore fetch encountered an issue, falling back to server API/local:', cloudErr);
  }

  // 2. Fallback to Server API if Firestore was empty or offline
  if (!dbData) {
    try {
      const response = await fetch('/api/db', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (response.ok) {
        const serverData = await response.json();
        if (serverData && (serverData.matches?.length > 0 || serverData.countries?.length > 0)) {
          dbData = serverData;
        }
      }
    } catch (err) {
      console.warn('Backend API not available, falling back to static /data/football_db.json or LocalStorage', err);
    }
  }

  // 2.5 Fallback to static public JSON (/data/football_db.json) for static deploys (e.g. Vercel)
  if (!dbData) {
    try {
      const response = await fetch('/data/football_db.json', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (response.ok) {
        const staticData = await response.json();
        if (staticData && (staticData.matches?.length > 0 || staticData.countries?.length > 0)) {
          dbData = staticData;
        }
      }
    } catch {
      // ignore
    }
  }

  // 3. Fallback to local storage if static fetch failed or returned empty
  if (!dbData) {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.matches?.length > 0 || parsed.countries?.length > 0)) {
          dbData = parsed;
        }
      } catch {
        // ignore
      }
    }
  }

  // 4. Fallback to preloaded built-in seed database if both cloud, server and localstorage were empty
  if (!dbData || (!dbData.matches?.length && !dbData.countries?.length)) {
    dbData = {
      countries: SEED_DATABASE.countries || [],
      leagues: SEED_DATABASE.leagues || [],
      teams: SEED_DATABASE.teams || [],
      matches: SEED_DATABASE.matches || [],
      users: SEED_DATABASE.users || [],
    };
  }

  // Resilient User Union across Firestore, LocalStorage, Server and Seed
  const localSavedUsersRaw = localStorage.getItem(USERS_STORAGE_KEY) || localStorage.getItem(USERS_BACKUP_STORAGE_KEY);
  let localSavedUsers: AppUser[] = [];
  if (localSavedUsersRaw) {
    try {
      localSavedUsers = JSON.parse(localSavedUsersRaw);
    } catch {
      // ignore
    }
  }

  const mergedUsers = mergeUsersLists(
    dbData.users,
    firestoreUsers,
    localSavedUsers,
    SEED_DATABASE.users
  );

  const rawResult: DbState = {
    countries: dbData.countries || [],
    leagues: dbData.leagues || [],
    teams: dbData.teams || [],
    matches: dbData.matches || [],
    users: mergedUsers,
  };

  // Garante que países canônicos (Islândia, Noruega, etc.), suas ligas e times padrão existam e estejam linkados
  const enrichedDb = ensureCanonicalCountriesAndLeagues(rawResult);

  // Sanitiza e corrige o banco de dados contra anomalias/duplicidades/ligas cruzadas
  const { cleanedDb, stats } = sanitizeAndCleanDb(enrichedDb);
  cleanedDb.users = mergedUsers;

  // Save to LocalStorage so future access is instantaneous
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedDb));
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(mergedUsers));
  localStorage.setItem(USERS_BACKUP_STORAGE_KEY, JSON.stringify(mergedUsers));

  // If corrections were made or initializing cloud for first time, sync back
  if (stats.foreignLeaguesRemoved > 0 || stats.teamsCleaned > 0 || stats.duplicatesRemoved > 0 || stats.matchesFixed > 0 || stats.details.length > 0) {
    saveDatabaseState(cleanedDb).catch(() => {});
  }

  return cleanedDb;
}

export async function syncDatabaseFromServer(): Promise<DbState> {
  // Try cloud sync first
  try {
    const cloudState = await fetchDbFromFirestore();
    if (cloudState && (cloudState.matches?.length > 0 || cloudState.countries?.length > 0)) {
      const { cleanedDb } = sanitizeAndCleanDb(cloudState);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedDb));
      return cleanedDb;
    }
  } catch (err) {
    console.warn('Sync from Firestore failed, trying server API:', err);
  }

  const response = await fetch('/api/db', {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' },
  });
  if (response.ok) {
    const data = await response.json();
    const { cleanedDb } = sanitizeAndCleanDb(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedDb));
    return cleanedDb;
  }
  throw new Error('Falha ao obter dados do servidor.');
}

let remoteSaveTimer: NodeJS.Timeout | null = null;
let pendingStateToSave: DbState | null = null;

async function flushPendingRemoteSave(): Promise<boolean> {
  if (!pendingStateToSave) return true;
  const state = pendingStateToSave;
  pendingStateToSave = null;

  // 1. Save to Cloud Firestore in real-time (Multi-device instant replication)
  if (!isFirestoreQuotaExhausted()) {
    saveDbToFirestore(state).catch(() => {});
  }

  // 2. Also persist to backend server
  try {
    const response = await fetch('/api/db/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });
    return response.ok;
  } catch (err) {
    console.warn('Failed to persist to backend server (Firestore saved)', err);
    return true; // Still true if local/firestore handled
  }
}

export async function saveDatabaseState(state: DbState, immediate: boolean = false): Promise<boolean> {
  // Always update LocalStorage immediately for instant UX
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (Array.isArray(state.users)) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(state.users));
    }
  } catch (err) {
    console.warn('LocalStorage quota or write issue:', err);
  }

  pendingStateToSave = state;

  if (immediate) {
    if (remoteSaveTimer) {
      clearTimeout(remoteSaveTimer);
      remoteSaveTimer = null;
    }
    return await flushPendingRemoteSave();
  }

  if (remoteSaveTimer) {
    clearTimeout(remoteSaveTimer);
  }

  remoteSaveTimer = setTimeout(() => {
    flushPendingRemoteSave().catch(() => {});
  }, 600);

  return true;
}

export async function clearDatabase(): Promise<DbState> {
  const empty: DbState = { countries: [], leagues: [], teams: [], matches: [], users: [] };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(empty));

  saveDbToFirestore(empty).catch(() => {});

  try {
    await fetch('/api/db/clear', { method: 'POST' });
  } catch (err) {
    console.warn('Failed to clear backend database', err);
  }

  return empty;
}

