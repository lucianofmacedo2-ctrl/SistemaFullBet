import { DbState, Country, League, Team, Match, AppUser } from '../types';
import defaultDatabaseData from '../data/defaultDatabase.json';
import { sanitizeAndCleanDb } from '../utils/dbSanitizer';
import {
  saveDbToFirestore,
  fetchDbFromFirestore,
} from './firebaseDbService';

const STORAGE_KEY = 'football_db_v1';
const USERS_STORAGE_KEY = 'football_users_list_v1';

// Preloaded database built into client bundle (contains all 641+ matches, 22 leagues, 11 countries)
const SEED_DATABASE: DbState = defaultDatabaseData as unknown as DbState;

export async function fetchUsersList(): Promise<AppUser[]> {
  try {
    const res = await fetch('/api/users', {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (res.ok) {
      const users = await res.json();
      if (Array.isArray(users) && users.length > 0) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        return users;
      }
    }
  } catch (err) {
    console.warn('Could not fetch users from server', err);
  }

  const saved = localStorage.getItem(USERS_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  return [];
}

export async function saveUsersList(users: AppUser[]): Promise<boolean> {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users }),
    });
    return res.ok;
  } catch (err) {
    console.warn('Could not save users to server', err);
    return false;
  }
}

export async function fetchDatabaseState(): Promise<DbState> {
  let dbData: DbState | null = null;

  // 1. Try fetching from Firebase Firestore first (Primary Multi-Device Cloud)
  try {
    const firestoreData = await fetchDbFromFirestore();
    if (firestoreData && (firestoreData.matches?.length > 0 || firestoreData.countries?.length > 0)) {
      dbData = firestoreData;
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
      console.warn('Backend API not available, falling back to LocalStorage', err);
    }
  }

  // 3. Fallback to local storage if API failed or returned empty
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
  } else {
    // If dbData has missing countries or leagues compared to SEED_DATABASE, ensure base leagues exist
    if ((!dbData.countries || dbData.countries.length === 0) && SEED_DATABASE.countries?.length > 0) {
      dbData.countries = SEED_DATABASE.countries;
    }
    if ((!dbData.leagues || dbData.leagues.length === 0) && SEED_DATABASE.leagues?.length > 0) {
      dbData.leagues = SEED_DATABASE.leagues;
    }
    if ((!dbData.teams || dbData.teams.length === 0) && SEED_DATABASE.teams?.length > 0) {
      dbData.teams = SEED_DATABASE.teams;
    }
    if ((!dbData.matches || dbData.matches.length === 0) && SEED_DATABASE.matches?.length > 0) {
      dbData.matches = SEED_DATABASE.matches;
    }
  }

  const rawResult: DbState = {
    countries: dbData.countries || [],
    leagues: dbData.leagues || [],
    teams: dbData.teams || [],
    matches: dbData.matches || [],
    users: dbData.users || [],
  };

  // Sanitiza e corrige o banco de dados contra anomalias/duplicidades/ligas cruzadas
  const { cleanedDb, stats } = sanitizeAndCleanDb(rawResult);

  // If result has users, also sync local USERS_STORAGE_KEY
  if (Array.isArray(cleanedDb.users) && cleanedDb.users.length > 0) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(cleanedDb.users));
  } else {
    // Try fetching dedicated users
    const users = await fetchUsersList();
    if (users.length > 0) {
      cleanedDb.users = users;
    }
  }

  // Save to LocalStorage so future access is instantaneous
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedDb));

  // If corrections were made or initializing cloud for first time, sync back
  if (stats.foreignLeaguesRemoved > 0 || stats.teamsCleaned > 0 || stats.duplicatesRemoved > 0) {
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

export async function saveDatabaseState(state: DbState): Promise<boolean> {
  // Always update LocalStorage immediately for instant UX
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (Array.isArray(state.users)) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(state.users));
  }

  // 1. Save to Cloud Firestore in real-time (Multi-device instant replication)
  saveDbToFirestore(state).catch((err) => {
    console.warn('Non-blocking Firestore sync warning:', err);
  });

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

