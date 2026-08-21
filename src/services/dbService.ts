import { DbState, Country, League, Team, Match, AppUser } from '../types';

const STORAGE_KEY = 'football_db_v1';
const USERS_STORAGE_KEY = 'football_users_list_v1';

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
  try {
    const response = await fetch('/api/db', {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (response.ok) {
      dbData = await response.json();
    }
  } catch (err) {
    console.warn('Backend API not available, falling back to LocalStorage', err);
  }

  // Fallback to local storage if API failed
  if (!dbData) {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        dbData = JSON.parse(saved);
      } catch {
        // ignore
      }
    }
  }

  const result: DbState = dbData || {
    countries: [],
    leagues: [],
    teams: [],
    matches: [],
    users: [],
  };

  // If result has users, also sync local USERS_STORAGE_KEY
  if (Array.isArray(result.users) && result.users.length > 0) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(result.users));
  } else {
    // Try fetching dedicated users
    const users = await fetchUsersList();
    if (users.length > 0) {
      result.users = users;
    }
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  return result;
}

export async function syncDatabaseFromServer(): Promise<DbState> {
  const response = await fetch('/api/db', {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' },
  });
  if (response.ok) {
    const data = await response.json();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  }
  throw new Error('Falha ao obter dados do servidor.');
}

export async function saveDatabaseState(state: DbState): Promise<boolean> {
  // Always update LocalStorage immediately for instant UX
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (Array.isArray(state.users)) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(state.users));
  }

  try {
    const response = await fetch('/api/db/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });
    return response.ok;
  } catch (err) {
    console.warn('Failed to persist to backend server', err);
    return false;
  }
}

export async function clearDatabase(): Promise<DbState> {
  const empty: DbState = { countries: [], leagues: [], teams: [], matches: [] };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(empty));

  try {
    await fetch('/api/db/clear', { method: 'POST' });
  } catch (err) {
    console.warn('Failed to clear backend database', err);
  }

  return empty;
}
