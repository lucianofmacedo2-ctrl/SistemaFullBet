/**
 * Logo, Crest, Flag & Photo Persistent Registry
 *
 * Garante a preservação absoluta e perpétua de escudos de times, logos de ligas,
 * bandeiras de países e fotos de árbitros, impedindo qualquer regressão ou
 * perda durante sincronizações automáticas periódicas com GitHub ou recarregamento de página.
 */

import { DbState, Team, League, Country, Match, Referee } from '../types';
import { findOfficialTeamLogo, findOfficialLeagueLogo } from './officialLogosCatalog';

export interface PersistentLogosStore {
  teams: Record<string, string>; // chaves: id, norm(name), norm(country)::norm(name)
  leagues: Record<string, string>; // chaves: id, norm(name), norm(country)::norm(name)
  countries: Record<string, string>; // chaves: id, code, norm(name)
  referees: Record<string, string>; // chaves: id, norm(name)
  lastUpdated: number;
}

export const LOCAL_LOGOS_STORAGE_KEY = 'football_persistent_logos_registry';

/**
 * Normaliza qualquer nome para chave canônica de busca e associação.
 */
export function normalizeLogoKey(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Retorna as chaves de busca para um time.
 */
export function getTeamLookupKeys(team: { id?: string; name?: string; countryId?: string; countryName?: string }): string[] {
  const keys: string[] = [];
  if (team.id) keys.push(team.id.toUpperCase());

  const nameNorm = normalizeLogoKey(team.name || '');
  if (nameNorm) {
    keys.push(nameNorm);

    const countryNorm = normalizeLogoKey(team.countryName || team.countryId || '');
    if (countryNorm) {
      keys.push(`${countryNorm}::${nameNorm}`);
    }
  }

  return keys;
}

/**
 * Retorna as chaves de busca para uma liga.
 */
export function getLeagueLookupKeys(league: { id?: string; name?: string; countryId?: string; countryName?: string }): string[] {
  const keys: string[] = [];
  if (league.id) keys.push(league.id.toUpperCase());

  const nameNorm = normalizeLogoKey(league.name || '');
  if (nameNorm) {
    keys.push(nameNorm);

    const countryNorm = normalizeLogoKey(league.countryName || league.countryId || '');
    if (countryNorm) {
      keys.push(`${countryNorm}::${nameNorm}`);
    }
  }

  return keys;
}

/**
 * Retorna as chaves de busca para um país.
 */
export function getCountryLookupKeys(country: { id?: string; name?: string; code?: string }): string[] {
  const keys: string[] = [];
  if (country.id) keys.push(country.id.toUpperCase());
  if (country.code) keys.push(country.code.toUpperCase());

  const nameNorm = normalizeLogoKey(country.name || '');
  if (nameNorm) {
    keys.push(nameNorm);
  }

  return keys;
}

/**
 * Retorna as chaves de busca para um árbitro.
 */
export function getRefereeLookupKeys(refereeName: string, id?: string): string[] {
  const keys: string[] = [];
  if (id) keys.push(id.toUpperCase());

  const norm = normalizeLogoKey(refereeName);
  if (norm) {
    keys.push(norm);
  }

  return keys;
}

/**
 * In-memory cache for ultra fast synchronous lookups across browser and Node.js
 */
let inMemoryStore: PersistentLogosStore = {
  teams: {},
  leagues: {},
  countries: {},
  referees: {},
  lastUpdated: Date.now(),
};

/**
 * Carrega a loja persistente de logos (compatível com Browser e Node.js).
 */
export function loadPersistentLogosStore(): PersistentLogosStore {
  // 1. Browser context (LocalStorage)
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_LOGOS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          inMemoryStore = {
            teams: { ...(inMemoryStore.teams || {}), ...(parsed.teams || {}) },
            leagues: { ...(inMemoryStore.leagues || {}), ...(parsed.leagues || {}) },
            countries: { ...(inMemoryStore.countries || {}), ...(parsed.countries || {}) },
            referees: { ...(inMemoryStore.referees || {}), ...(parsed.referees || {}) },
            lastUpdated: parsed.lastUpdated || Date.now(),
          };
        }
      }
    } catch {
      // ignore
    }
  }

  // 2. Node.js server context (filesystem)
  if (typeof process !== 'undefined' && process.versions?.node) {
    try {
      // Dynamic require to avoid bundler issues in frontend
      const fs = require('fs');
      const path = require('path');
      const customLogosFile = path.join(process.cwd(), 'data', 'custom_logos.json');
      if (fs.existsSync(customLogosFile)) {
        const fileContent = fs.readFileSync(customLogosFile, 'utf8');
        const fileParsed = JSON.parse(fileContent);
        if (fileParsed && typeof fileParsed === 'object') {
          inMemoryStore = {
            teams: { ...(inMemoryStore.teams || {}), ...(fileParsed.teams || {}) },
            leagues: { ...(inMemoryStore.leagues || {}), ...(fileParsed.leagues || {}) },
            countries: { ...(inMemoryStore.countries || {}), ...(fileParsed.countries || {}) },
            referees: { ...(inMemoryStore.referees || {}), ...(fileParsed.referees || {}) },
            lastUpdated: fileParsed.lastUpdated || Date.now(),
          };
        }
      }
    } catch {
      // ignore in browser or if fs not available
    }
  }

  return inMemoryStore;
}

/**
 * Salva a loja persistente de logos tanto no LocalStorage quanto no disco (se Node.js).
 */
export function savePersistentLogosStore(store: PersistentLogosStore): void {
  inMemoryStore = store;
  store.lastUpdated = Date.now();

  // 1. Browser LocalStorage
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_LOGOS_STORAGE_KEY, JSON.stringify(store));
    } catch {
      // ignore
    }
  }

  // 2. Node.js Server Filesystem
  if (typeof process !== 'undefined' && process.versions?.node) {
    try {
      const fs = require('fs');
      const path = require('path');
      const dataDir = path.join(process.cwd(), 'data');
      const publicDataDir = path.join(process.cwd(), 'public', 'data');

      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      if (!fs.existsSync(publicDataDir)) fs.mkdirSync(publicDataDir, { recursive: true });

      const jsonStr = JSON.stringify(store, null, 2);
      fs.writeFileSync(path.join(dataDir, 'custom_logos.json'), jsonStr, 'utf8');
      fs.writeFileSync(path.join(publicDataDir, 'custom_logos.json'), jsonStr, 'utf8');
    } catch {
      // ignore
    }
  }
}

/**
 * Registra o escudo de um time no store persistente.
 */
export function recordTeamLogo(
  team: { id?: string; name: string; countryId?: string; countryName?: string },
  logoUrl: string
): void {
  if (!logoUrl || !logoUrl.trim().startsWith('http')) return;
  const store = loadPersistentLogosStore();
  const keys = getTeamLookupKeys(team);
  const cleanUrl = logoUrl.trim();

  keys.forEach(k => {
    store.teams[k] = cleanUrl;
  });

  savePersistentLogosStore(store);
}

/**
 * Registra a logo de uma liga no store persistente.
 */
export function recordLeagueLogo(
  league: { id?: string; name: string; countryId?: string; countryName?: string },
  logoUrl: string
): void {
  if (!logoUrl || !logoUrl.trim().startsWith('http')) return;
  const store = loadPersistentLogosStore();
  const keys = getLeagueLookupKeys(league);
  const cleanUrl = logoUrl.trim();

  keys.forEach(k => {
    store.leagues[k] = cleanUrl;
  });

  savePersistentLogosStore(store);
}

/**
 * Registra a bandeira de um país no store persistente.
 */
export function recordCountryFlag(
  country: { id?: string; name?: string; code?: string },
  flagUrl: string
): void {
  if (!flagUrl || !flagUrl.trim().startsWith('http')) return;
  const store = loadPersistentLogosStore();
  const keys = getCountryLookupKeys(country);
  const cleanUrl = flagUrl.trim();

  keys.forEach(k => {
    store.countries[k] = cleanUrl;
  });

  savePersistentLogosStore(store);
}

/**
 * Registra a foto de um árbitro no store persistente.
 */
export function recordRefereePhoto(refereeName: string, photoUrl: string, id?: string): void {
  if (!photoUrl || !photoUrl.trim().startsWith('http')) return;
  const store = loadPersistentLogosStore();
  const keys = getRefereeLookupKeys(refereeName, id);
  const cleanUrl = photoUrl.trim();

  keys.forEach(k => {
    store.referees[k] = cleanUrl;
  });

  savePersistentLogosStore(store);
}

/**
 * Extrai todos os logos válidos existentes em um DbState e salva na loja persistente.
 */
export function extractAndSaveAllLogos(db: DbState): PersistentLogosStore {
  const store = loadPersistentLogosStore();
  let updated = false;

  // 1. Teams
  (db.teams || []).forEach(t => {
    if (t.logoUrl && t.logoUrl.trim().startsWith('http')) {
      const clean = t.logoUrl.trim();
      const keys = getTeamLookupKeys(t);
      keys.forEach(k => {
        if (store.teams[k] !== clean) {
          store.teams[k] = clean;
          updated = true;
        }
      });
    }
  });

  // 2. Leagues
  (db.leagues || []).forEach(l => {
    if (l.logoUrl && l.logoUrl.trim().startsWith('http')) {
      const clean = l.logoUrl.trim();
      const keys = getLeagueLookupKeys(l);
      keys.forEach(k => {
        if (store.leagues[k] !== clean) {
          store.leagues[k] = clean;
          updated = true;
        }
      });
    }
  });

  // 3. Countries
  (db.countries || []).forEach(c => {
    if (c.flagUrl && c.flagUrl.trim().startsWith('http')) {
      const clean = c.flagUrl.trim();
      const keys = getCountryLookupKeys(c);
      keys.forEach(k => {
        if (store.countries[k] !== clean) {
          store.countries[k] = clean;
          updated = true;
        }
      });
    }
  });

  // 4. Referees
  (db.referees || []).forEach(r => {
    if (r.photoUrl && r.photoUrl.trim().startsWith('http')) {
      const clean = r.photoUrl.trim();
      const keys = getRefereeLookupKeys(r.name, r.id);
      keys.forEach(k => {
        if (store.referees[k] !== clean) {
          store.referees[k] = clean;
          updated = true;
        }
      });
    }
  });

  // 5. Matches (scan for any logos already attached to matches)
  (db.matches || []).forEach(m => {
    if (m.homeTeamLogoUrl && m.homeTeamLogoUrl.trim().startsWith('http')) {
      const clean = m.homeTeamLogoUrl.trim();
      const keys = getTeamLookupKeys({ id: m.homeTeamId, name: m.homeTeamName, countryId: m.countryId, countryName: m.countryName });
      keys.forEach(k => {
        if (!store.teams[k]) {
          store.teams[k] = clean;
          updated = true;
        }
      });
    }
    if (m.awayTeamLogoUrl && m.awayTeamLogoUrl.trim().startsWith('http')) {
      const clean = m.awayTeamLogoUrl.trim();
      const keys = getTeamLookupKeys({ id: m.awayTeamId, name: m.awayTeamName, countryId: m.countryId, countryName: m.countryName });
      keys.forEach(k => {
        if (!store.teams[k]) {
          store.teams[k] = clean;
          updated = true;
        }
      });
    }
    if (m.leagueLogoUrl && m.leagueLogoUrl.trim().startsWith('http')) {
      const clean = m.leagueLogoUrl.trim();
      const keys = getLeagueLookupKeys({ id: m.leagueId, name: m.leagueName, countryId: m.countryId, countryName: m.countryName });
      keys.forEach(k => {
        if (!store.leagues[k]) {
          store.leagues[k] = clean;
          updated = true;
        }
      });
    }
    if (m.countryFlagUrl && m.countryFlagUrl.trim().startsWith('http')) {
      const clean = m.countryFlagUrl.trim();
      const keys = getCountryLookupKeys({ id: m.countryId, name: m.countryName });
      keys.forEach(k => {
        if (!store.countries[k]) {
          store.countries[k] = clean;
          updated = true;
        }
      });
    }
    if (m.refereePhotoUrl && m.refereePhotoUrl.trim().startsWith('http') && m.referee) {
      const clean = m.refereePhotoUrl.trim();
      const keys = getRefereeLookupKeys(m.referee);
      keys.forEach(k => {
        if (!store.referees[k]) {
          store.referees[k] = clean;
          updated = true;
        }
      });
    }
  });

  if (updated) {
    savePersistentLogosStore(store);
  }

  return store;
}

/**
 * Busca o melhor logo disponível para um time.
 */
export function findRegisteredTeamLogo(
  team: { id?: string; name?: string; countryId?: string; countryName?: string },
  store: PersistentLogosStore = inMemoryStore
): string | undefined {
  const keys = getTeamLookupKeys(team);
  for (const k of keys) {
    if (store.teams[k]) return store.teams[k];
  }

  // Fallback to official catalog if present
  if (team.name) {
    const official = findOfficialTeamLogo(team.name);
    if (official) return official;
  }

  return undefined;
}

/**
 * Busca o melhor logo disponível para uma liga.
 */
export function findRegisteredLeagueLogo(
  league: { id?: string; name?: string; countryId?: string; countryName?: string },
  store: PersistentLogosStore = inMemoryStore
): string | undefined {
  const keys = getLeagueLookupKeys(league);
  for (const k of keys) {
    if (store.leagues[k]) return store.leagues[k];
  }

  if (league.name) {
    const official = findOfficialLeagueLogo(league.name);
    if (official) return official;
  }

  return undefined;
}

/**
 * Busca a bandeira para um país.
 */
export function findRegisteredCountryFlag(
  country: { id?: string; name?: string; code?: string },
  store: PersistentLogosStore = inMemoryStore
): string | undefined {
  const keys = getCountryLookupKeys(country);
  for (const k of keys) {
    if (store.countries[k]) return store.countries[k];
  }
  return undefined;
}

/**
 * Busca a foto de um árbitro.
 */
export function findRegisteredRefereePhoto(
  refereeName: string,
  id?: string,
  store: PersistentLogosStore = inMemoryStore
): string | undefined {
  const keys = getRefereeLookupKeys(refereeName, id);
  for (const k of keys) {
    if (store.referees[k]) return store.referees[k];
  }
  return undefined;
}

/**
 * Re-aplica e blinda todos os logos, escudos, bandeiras e fotos no banco de dados.
 * NUNCA permite que um escudo cadastrado seja sobrescrito com vazio ou nulo.
 */
export function reapplyLogosToDatabase(db: DbState, extraStore?: PersistentLogosStore): DbState {
  if (!db) return db;

  // Carrega e atualiza a loja com tudo que já temos
  const store = extraStore || extractAndSaveAllLogos(db);

  // Fast team logo map by ID and normalized name
  const teamLogoById = new Map<string, string>();
  const teamLogoByName = new Map<string, string>();

  // 1. Teams: Reaplicar e preservar escudos
  const enrichedTeams = (db.teams || []).map(t => {
    let logoUrl = t.logoUrl;
    if (!logoUrl || !logoUrl.trim().startsWith('http')) {
      const registered = findRegisteredTeamLogo(t, store);
      if (registered) {
        logoUrl = registered;
      }
    }

    if (logoUrl && logoUrl.trim().startsWith('http')) {
      const clean = logoUrl.trim();
      if (t.id) teamLogoById.set(t.id, clean);
      if (t.name) teamLogoByName.set(normalizeLogoKey(t.name), clean);
      const countryNorm = normalizeLogoKey(t.countryName || t.countryId || '');
      if (countryNorm && t.name) {
        teamLogoByName.set(`${countryNorm}::${normalizeLogoKey(t.name)}`, clean);
      }
      return { ...t, logoUrl: clean };
    }

    return t;
  });

  // Fast league logo map by ID and normalized name
  const leagueLogoById = new Map<string, string>();
  const leagueLogoByName = new Map<string, string>();

  // 2. Leagues: Reaplicar e preservar logos
  const enrichedLeagues = (db.leagues || []).map(l => {
    let logoUrl = l.logoUrl;
    if (!logoUrl || !logoUrl.trim().startsWith('http')) {
      const registered = findRegisteredLeagueLogo(l, store);
      if (registered) {
        logoUrl = registered;
      }
    }

    if (logoUrl && logoUrl.trim().startsWith('http')) {
      const clean = logoUrl.trim();
      if (l.id) leagueLogoById.set(l.id, clean);
      if (l.name) leagueLogoByName.set(normalizeLogoKey(l.name), clean);
      return { ...l, logoUrl: clean };
    }

    return l;
  });

  // Fast country flag map
  const countryFlagById = new Map<string, string>();
  const countryFlagByName = new Map<string, string>();

  // 3. Countries: Reaplicar bandeiras
  const enrichedCountries = (db.countries || []).map(c => {
    let flagUrl = c.flagUrl;
    if (!flagUrl || !flagUrl.trim().startsWith('http')) {
      const registered = findRegisteredCountryFlag(c, store);
      if (registered) {
        flagUrl = registered;
      }
    }

    if (flagUrl && flagUrl.trim().startsWith('http')) {
      const clean = flagUrl.trim();
      if (c.id) countryFlagById.set(c.id, clean);
      if (c.code) countryFlagById.set(c.code.toUpperCase(), clean);
      if (c.name) countryFlagByName.set(normalizeLogoKey(c.name), clean);
      return { ...c, flagUrl: clean };
    }

    return c;
  });

  // Fast referee photo map
  const refPhotoByName = new Map<string, string>();

  // 4. Referees: Reaplicar fotos
  const enrichedReferees = (db.referees || []).map(r => {
    let photoUrl = r.photoUrl;
    if (!photoUrl || !photoUrl.trim().startsWith('http')) {
      const registered = findRegisteredRefereePhoto(r.name, r.id, store);
      if (registered) {
        photoUrl = registered;
      }
    }

    if (photoUrl && photoUrl.trim().startsWith('http')) {
      const clean = photoUrl.trim();
      refPhotoByName.set(normalizeLogoKey(r.name), clean);
      return { ...r, photoUrl: clean };
    }

    return r;
  });

  // 5. Matches: Reaplicar escudos, logos e fotos em cada jogo
  const enrichedMatches = (db.matches || []).map(m => {
    let modified = false;
    let homeLogo = m.homeTeamLogoUrl;
    let awayLogo = m.awayTeamLogoUrl;
    let leagueLogo = m.leagueLogoUrl;
    let countryFlag = m.countryFlagUrl;
    let refPhoto = m.refereePhotoUrl;

    // Home Team Logo
    if (!homeLogo || !homeLogo.trim().startsWith('http')) {
      const found = (m.homeTeamId ? teamLogoById.get(m.homeTeamId) : null) ||
        (m.homeTeamName ? teamLogoByName.get(normalizeLogoKey(m.homeTeamName)) : null) ||
        findRegisteredTeamLogo({ id: m.homeTeamId, name: m.homeTeamName, countryId: m.countryId, countryName: m.countryName }, store);

      if (found) {
        homeLogo = found;
        modified = true;
      }
    }

    // Away Team Logo
    if (!awayLogo || !awayLogo.trim().startsWith('http')) {
      const found = (m.awayTeamId ? teamLogoById.get(m.awayTeamId) : null) ||
        (m.awayTeamName ? teamLogoByName.get(normalizeLogoKey(m.awayTeamName)) : null) ||
        findRegisteredTeamLogo({ id: m.awayTeamId, name: m.awayTeamName, countryId: m.countryId, countryName: m.countryName }, store);

      if (found) {
        awayLogo = found;
        modified = true;
      }
    }

    // League Logo
    if (!leagueLogo || !leagueLogo.trim().startsWith('http')) {
      const found = (m.leagueId ? leagueLogoById.get(m.leagueId) : null) ||
        (m.leagueName ? leagueLogoByName.get(normalizeLogoKey(m.leagueName)) : null) ||
        findRegisteredLeagueLogo({ id: m.leagueId, name: m.leagueName, countryId: m.countryId, countryName: m.countryName }, store);

      if (found) {
        leagueLogo = found;
        modified = true;
      }
    }

    // Country Flag
    if (!countryFlag || !countryFlag.trim().startsWith('http')) {
      const found = (m.countryId ? countryFlagById.get(m.countryId) : null) ||
        (m.countryName ? countryFlagByName.get(normalizeLogoKey(m.countryName)) : null) ||
        findRegisteredCountryFlag({ id: m.countryId, name: m.countryName }, store);

      if (found) {
        countryFlag = found;
        modified = true;
      }
    }

    // Referee Photo
    if (m.referee && (!refPhoto || !refPhoto.trim().startsWith('http'))) {
      const found = refPhotoByName.get(normalizeLogoKey(m.referee)) ||
        findRegisteredRefereePhoto(m.referee, undefined, store);

      if (found) {
        refPhoto = found;
        modified = true;
      }
    }

    if (modified) {
      return {
        ...m,
        homeTeamLogoUrl: homeLogo || undefined,
        awayTeamLogoUrl: awayLogo || undefined,
        leagueLogoUrl: leagueLogo || undefined,
        countryFlagUrl: countryFlag || undefined,
        refereePhotoUrl: refPhoto || undefined,
      };
    }

    return m;
  });

  return {
    ...db,
    teams: enrichedTeams,
    leagues: enrichedLeagues,
    countries: enrichedCountries,
    referees: enrichedReferees,
    matches: enrichedMatches,
  };
}
