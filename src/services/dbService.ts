import { DbState, Country, League, Team, Match } from '../types';

const STORAGE_KEY = 'football_db_v1';

export async function fetchDatabaseState(): Promise<DbState> {
  try {
    const response = await fetch('/api/db');
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('Backend API not available, falling back to LocalStorage', err);
  }

  // Fallback to local storage
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }

  // Initial state is strictly empty as requested by user
  return {
    countries: [],
    leagues: [],
    teams: [],
    matches: [],
  };
}

export async function saveDatabaseState(state: DbState): Promise<boolean> {
  // Always update LocalStorage immediately for instant UX
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

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
