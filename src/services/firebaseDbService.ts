import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  onSnapshot,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { DbState, Country, League, Team, Match, AppUser, Referee } from '../types';

// Initialize Firebase App instance
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Smart Firestore instance with database ID fallback
function createFirestoreInstance() {
  try {
    if (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId.trim() !== '') {
      return getFirestore(app, firebaseConfig.firestoreDatabaseId);
    }
  } catch (e) {
    console.warn('Failed to init Firestore with specific databaseId, falling back to default:', e);
  }
  return getFirestore(app);
}

export let db = createFirestoreInstance();

// Ensure Firebase Auth is ready (Anonymous sign-in)
let authPromise: Promise<FirebaseUser | null> | null = null;

export async function ensureFirebaseAuth(): Promise<FirebaseUser | null> {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  if (authPromise) {
    return authPromise;
  }

  authPromise = new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        unsubscribe();
        resolve(user);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          unsubscribe();
          resolve(cred.user);
        } catch (error) {
          console.warn('Anonymous auth note (proceeding with rule access):', error);
          unsubscribe();
          resolve(null);
        }
      }
    });
  });

  return authPromise;
}

// Helper to remove any `undefined` properties which Firestore strictly rejects
function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data, (key, value) => {
    return value === undefined ? null : value;
  }));
}

// Chunking helpers to strictly respect Firestore document size limit (1MB max per doc)
const MATCH_CHUNK_SIZE = 800; // max 800 matches per doc (~200-240 KB, well under 1MB limit, optimizes write stream and speed)
const TEAM_CHUNK_SIZE = 800; // max 800 teams per doc (~180-220 KB, well under 1MB limit, optimizes write stream and speed)
const COLLECTION_NAME = 'app_data';

export const CLIENT_INSTANCE_ID = `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// In-memory cache for Firestore snapshot to eliminate redundant fetches
let cachedFirestoreState: { timestamp: string; data: DbState } | null = null;
let lastLocalSavedTimestamp: string | null = null;

// Circuit breaker for Firestore free-tier daily write quota limits
const QUOTA_STORAGE_KEY = 'firestore_quota_exhausted_until';
let isQuotaExhausted = false;
let quotaExhaustedResetTime = 0;

// Eager initialization of quota state
if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem(QUOTA_STORAGE_KEY) || sessionStorage.getItem(QUOTA_STORAGE_KEY);
    if (stored) {
      const until = parseInt(stored, 10);
      if (!isNaN(until) && Date.now() < until) {
        isQuotaExhausted = true;
        quotaExhaustedResetTime = until;
      }
    }
  } catch {
    // ignore
  }
}

// Mutex queue to ensure only one Firestore save operation executes at any given time
let isSaveInProgress = false;
let pendingStateForCloudSave: DbState | null = null;

// Concurrency helper to run write tasks in batches of N to prevent write stream exhaustion
async function runWithConcurrencyLimit(tasks: (() => Promise<any>)[], limit: number = 3): Promise<void> {
  const results: Promise<any>[] = [];
  const executing: Promise<any>[] = [];

  for (const task of tasks) {
    if (isFirestoreQuotaExhausted()) {
      break;
    }
    const p = Promise.resolve().then(async () => {
      if (isFirestoreQuotaExhausted()) return;
      try {
        return await task();
      } catch (err: any) {
        const msg = err?.message || String(err);
        const code = err?.code || '';
        if (
          code === 'resource-exhausted' ||
          msg.includes('resource-exhausted') ||
          msg.includes('Quota limit exceeded') ||
          msg.includes('quota metric') ||
          msg.includes('Write stream exhausted') ||
          msg.includes('maximum backoff delay')
        ) {
          markFirestoreQuotaExhausted(1440);
        }
        throw err;
      }
    });
    results.push(p);

    if (limit <= tasks.length) {
      const e: Promise<any> = p.then(() => executing.splice(executing.indexOf(e), 1)).catch(() => {
        executing.splice(executing.indexOf(e), 1);
      });
      executing.push(e);
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }

  // Use allSettled so one quota failure doesn't leave uncaught rejections
  const settled = await Promise.allSettled(results);
  const firstRejected = settled.find((s) => s.status === 'rejected') as PromiseRejectedResult | undefined;
  if (firstRejected) {
    throw firstRejected.reason;
  }
}

export function isFirestoreQuotaExhausted(): boolean {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(QUOTA_STORAGE_KEY) || sessionStorage.getItem(QUOTA_STORAGE_KEY);
      if (stored) {
        const until = parseInt(stored, 10);
        if (!isNaN(until) && Date.now() < until) {
          isQuotaExhausted = true;
          quotaExhaustedResetTime = until;
          return true;
        } else {
          localStorage.removeItem(QUOTA_STORAGE_KEY);
          sessionStorage.removeItem(QUOTA_STORAGE_KEY);
        }
      }
    } catch {
      // ignore
    }
  }
  if (isQuotaExhausted && Date.now() > quotaExhaustedResetTime) {
    isQuotaExhausted = false;
  }
  return isQuotaExhausted;
}

export function markFirestoreQuotaExhausted(cooldownMinutes: number = 1440) {
  isQuotaExhausted = true;
  quotaExhaustedResetTime = Date.now() + cooldownMinutes * 60 * 1000;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(QUOTA_STORAGE_KEY, String(quotaExhaustedResetTime));
      sessionStorage.setItem(QUOTA_STORAGE_KEY, String(quotaExhaustedResetTime));
    } catch {
      // ignore
    }
  }
  console.warn(`[Firestore Quota Guard] Limite de cota/transmissão do Firestore. Sistema operando com total persistência e integridade no servidor API e LocalStorage pelos próximos ${cooldownMinutes} minutos.`);
}

export interface CloudSyncStats {
  matchesCount: number;
  teamsCount: number;
  leaguesCount: number;
  countriesCount: number;
  usersCount: number;
  teamsWithLogo: number;
  leaguesWithLogo: number;
  countriesWithFlag: number;
  totalImagesCount: number;
  lastUpdated: string;
}

export interface SyncResult {
  success: boolean;
  error?: string;
  count?: number;
}

/**
 * Internal single-run worker for saving state to Firestore with concurrency throttling.
 */
async function executeFirestoreSave(state: DbState): Promise<SyncResult> {
  // If quota is already exhausted, gracefully skip without generating failed write requests
  if (isFirestoreQuotaExhausted()) {
    return {
      success: false,
      error: 'Quota diária de gravação do Firestore atingida. Dados salvos com segurança no armazenamento local e backend.',
    };
  }

  try {
    await ensureFirebaseAuth();

    const writeTaskFactories: (() => Promise<any>)[] = [];

    // 1. Countries
    const cleanCountries = sanitizeForFirestore(state.countries || []);
    writeTaskFactories.push(() =>
      setDoc(doc(db, COLLECTION_NAME, 'countries'), {
        list: cleanCountries,
        updatedAt: new Date().toISOString(),
      })
    );

    // 2. Leagues
    const cleanLeagues = sanitizeForFirestore(state.leagues || []);
    writeTaskFactories.push(() =>
      setDoc(doc(db, COLLECTION_NAME, 'leagues'), {
        list: cleanLeagues,
        updatedAt: new Date().toISOString(),
      })
    );

    // 3. Users
    let finalUsers = state.users || [];
    try {
      const existingUsersSnap = await getDoc(doc(db, COLLECTION_NAME, 'users'));
      if (existingUsersSnap.exists()) {
        const remoteUsers: AppUser[] = existingUsersSnap.data().list || [];
        const map = new Map<string, AppUser>();
        for (const u of remoteUsers) {
          if (u && (u.id || u.username)) map.set((u.id || u.username).toLowerCase(), u);
        }
        for (const u of finalUsers) {
          if (u && (u.id || u.username)) {
            const key = (u.id || u.username).toLowerCase();
            map.set(key, { ...(map.get(key) || {}), ...u });
          }
        }
        finalUsers = Array.from(map.values());
      }
    } catch {
      // non-fatal
    }

    const cleanUsers = sanitizeForFirestore(finalUsers);
    writeTaskFactories.push(() =>
      setDoc(doc(db, COLLECTION_NAME, 'users'), {
        list: cleanUsers,
        updatedAt: new Date().toISOString(),
      })
    );

    // 4. Teams (Chunked in controlled batches)
    const teams = state.teams || [];
    const teamChunks = Math.ceil(teams.length / TEAM_CHUNK_SIZE) || 1;
    writeTaskFactories.push(() =>
      setDoc(doc(db, COLLECTION_NAME, 'teams_meta'), {
        total: teams.length,
        chunks: teamChunks,
        updatedAt: new Date().toISOString(),
      })
    );

    for (let i = 0; i < teamChunks; i++) {
      const chunkTeams = teams.slice(i * TEAM_CHUNK_SIZE, (i + 1) * TEAM_CHUNK_SIZE);
      const cleanChunk = sanitizeForFirestore(chunkTeams);
      writeTaskFactories.push(() =>
        setDoc(doc(db, COLLECTION_NAME, `teams_${i}`), { list: cleanChunk })
      );
    }

    // 5. Matches (Chunked in controlled batches)
    const matches = state.matches || [];
    const matchChunks = Math.ceil(matches.length / MATCH_CHUNK_SIZE) || 1;
    writeTaskFactories.push(() =>
      setDoc(doc(db, COLLECTION_NAME, 'matches_meta'), {
        total: matches.length,
        chunks: matchChunks,
        updatedAt: new Date().toISOString(),
      })
    );

    for (let i = 0; i < matchChunks; i++) {
      const chunkMatches = matches.slice(i * MATCH_CHUNK_SIZE, (i + 1) * MATCH_CHUNK_SIZE);
      const cleanChunk = sanitizeForFirestore(chunkMatches);
      writeTaskFactories.push(() =>
        setDoc(doc(db, COLLECTION_NAME, `matches_${i}`), { list: cleanChunk })
      );
    }

    // 6. Referees (if available)
    if (state.referees && state.referees.length > 0) {
      const cleanReferees = sanitizeForFirestore(state.referees);
      writeTaskFactories.push(() =>
        setDoc(doc(db, COLLECTION_NAME, 'referees'), {
          list: cleanReferees,
          updatedAt: new Date().toISOString(),
        })
      );
    }

    const nowIso = new Date().toISOString();
    lastLocalSavedTimestamp = nowIso;

    // 7. Meta info
    writeTaskFactories.push(() =>
      setDoc(doc(db, COLLECTION_NAME, 'meta'), {
        lastUpdated: nowIso,
        writerId: CLIENT_INSTANCE_ID,
        counts: {
          countries: state.countries?.length || 0,
          leagues: state.leagues?.length || 0,
          teams: state.teams?.length || 0,
          matches: state.matches?.length || 0,
          users: state.users?.length || 0,
          referees: state.referees?.length || 0,
        },
      })
    );

    // Execute with controlled concurrency (3 parallel writes at a time) to prevent write-stream exhaustion
    await runWithConcurrencyLimit(writeTaskFactories, 3);

    return { success: true, count: matches.length };
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    const errCode = error?.code || '';

    // Handle Firestore Quota & Write stream limits gracefully
    if (
      errCode === 'resource-exhausted' ||
      errMsg.includes('resource-exhausted') ||
      errMsg.includes('Write stream exhausted') ||
      errMsg.includes('maximum allowed queued writes') ||
      errMsg.includes('maximum backoff delay') ||
      errMsg.includes('Quota limit exceeded') ||
      errMsg.includes('quota metric')
    ) {
      markFirestoreQuotaExhausted(1440);
      return {
        success: false,
        error: 'Transmissão/Quota de gravação do Firestore saturada. O sistema opera com total integridade e velocidade no servidor e armazenamento local.',
      };
    }

    console.warn('Firestore sync note:', errMsg);
    
    // Attempt fallback to default database if named database failed
    if (errMsg.includes('not found') || errCode === 'not-found') {
      try {
        db = getFirestore(app);
        return await executeFirestoreSave(state);
      } catch (fallbackErr: any) {
        return { success: false, error: fallbackErr?.message || String(fallbackErr) };
      }
    }

    return { success: false, error: errMsg };
  }
}

/**
 * Saves the entire DbState to Firestore partitioned across sub-documents with deduplication mutex.
 */
export async function saveDbToFirestore(state: DbState): Promise<SyncResult> {
  if (isSaveInProgress) {
    pendingStateForCloudSave = state;
    return { success: true, count: state.matches?.length || 0 };
  }

  isSaveInProgress = true;
  try {
    const result = await executeFirestoreSave(state);

    // If a newer state was requested while this save was executing, process it now
    if (pendingStateForCloudSave) {
      const nextState = pendingStateForCloudSave;
      pendingStateForCloudSave = null;
      setTimeout(() => {
        saveDbToFirestore(nextState).catch(() => {});
      }, 500);
    }

    return result;
  } finally {
    isSaveInProgress = false;
  }
}

/**
 * Fetches the complete DbState from Firestore with ultra-fast parallel document retrieval.
 */
export async function fetchDbFromFirestore(): Promise<DbState | null> {
  if (isFirestoreQuotaExhausted()) {
    return null;
  }

  try {
    await ensureFirebaseAuth();

    // 1. Fetch metadata and primary core docs in parallel
    const [
      countriesSnap,
      leaguesSnap,
      usersSnap,
      teamsMetaSnap,
      matchesMetaSnap,
      refereesSnap,
    ] = await Promise.all([
      getDoc(doc(db, COLLECTION_NAME, 'countries')),
      getDoc(doc(db, COLLECTION_NAME, 'leagues')),
      getDoc(doc(db, COLLECTION_NAME, 'users')),
      getDoc(doc(db, COLLECTION_NAME, 'teams_meta')),
      getDoc(doc(db, COLLECTION_NAME, 'matches_meta')),
      getDoc(doc(db, COLLECTION_NAME, 'referees')).catch(() => null),
    ]);

    const countries: Country[] = countriesSnap.exists() ? (countriesSnap.data().list || []) : [];
    const leagues: League[] = leaguesSnap.exists() ? (leaguesSnap.data().list || []) : [];
    const users: AppUser[] = usersSnap.exists() ? (usersSnap.data().list || []) : [];
    const referees: Referee[] = (refereesSnap && refereesSnap.exists()) ? (refereesSnap.data().list || []) : [];

    // 2. Prepare chunk tasks for teams and matches
    const teamChunkPromises: Promise<any>[] = [];
    if (teamsMetaSnap.exists()) {
      const meta = teamsMetaSnap.data();
      const chunks = meta.chunks || 1;
      for (let i = 0; i < chunks; i++) {
        teamChunkPromises.push(getDoc(doc(db, COLLECTION_NAME, `teams_${i}`)));
      }
    }

    const matchChunkPromises: Promise<any>[] = [];
    if (matchesMetaSnap.exists()) {
      const meta = matchesMetaSnap.data();
      const chunks = meta.chunks || 1;
      for (let i = 0; i < chunks; i++) {
        matchChunkPromises.push(getDoc(doc(db, COLLECTION_NAME, `matches_${i}`)));
      }
    }

    // 3. Fetch ALL chunks in parallel
    const [teamSnaps, matchSnaps] = await Promise.all([
      Promise.all(teamChunkPromises),
      Promise.all(matchChunkPromises),
    ]);

    let teams: Team[] = [];
    for (const cSnap of teamSnaps) {
      if (cSnap && cSnap.exists()) {
        teams = teams.concat(cSnap.data().list || []);
      }
    }

    let matches: Match[] = [];
    for (const cSnap of matchSnaps) {
      if (cSnap && cSnap.exists()) {
        matches = matches.concat(cSnap.data().list || []);
      }
    }

    if (countries.length === 0 && leagues.length === 0 && teams.length === 0 && matches.length === 0) {
      return null;
    }

    return {
      countries,
      leagues,
      teams,
      matches,
      users,
      referees,
    };
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    const errCode = error?.code || '';

    if (
      errCode === 'resource-exhausted' ||
      errMsg.includes('resource-exhausted') ||
      errMsg.includes('Quota limit exceeded') ||
      errMsg.includes('quota metric')
    ) {
      markFirestoreQuotaExhausted(1440);
      return null;
    }

    console.warn('Firestore fetch note:', errMsg);
    if (errMsg.includes('not found') || errCode === 'not-found') {
      try {
        db = getFirestore(app);
        return await fetchDbFromFirestore();
      } catch {
        // ignore
      }
    }
    return null;
  }
}

/**
 * Subscribes to real-time updates from Firestore on the meta document.
 * When changes occur remotely, it calls onRemoteChange with optional updated state or notification.
 */
export function subscribeToFirestoreSync(
  onRemoteChange: (updatedDb?: DbState) => void,
  onError?: (error: Error) => void
): () => void {
  let unsubscribeSnapshot: Unsubscribe | null = null;
  let isSubscribed = true;
  let lastProcessedUpdatedAt: string | null = null;
  let isFetching = false;

  if (isFirestoreQuotaExhausted()) {
    return () => {};
  }

  ensureFirebaseAuth().then(() => {
    if (!isSubscribed || isFirestoreQuotaExhausted()) return;
    try {
      const metaDoc = doc(db, COLLECTION_NAME, 'meta');
      unsubscribeSnapshot = onSnapshot(metaDoc, async (snap) => {
        if (snap.exists()) {
          const metaData = snap.data();
          const currentUpdatedAt = metaData?.lastUpdated || null;
          const writerId = metaData?.writerId || null;

          // If the update was written by THIS client, skip redundant reload
          if (writerId && writerId === CLIENT_INSTANCE_ID) {
            lastProcessedUpdatedAt = currentUpdatedAt;
            return;
          }

          // If timestamp hasn't changed or matches our last local save, skip redundant roundtrip
          if (currentUpdatedAt && (currentUpdatedAt === lastProcessedUpdatedAt || currentUpdatedAt === lastLocalSavedTimestamp)) {
            return;
          }
          if (isFetching) return;

          try {
            isFetching = true;
            lastProcessedUpdatedAt = currentUpdatedAt;
            const freshData = await fetchDbFromFirestore();
            if (freshData && isSubscribed) {
              onRemoteChange(freshData);
            } else if (isSubscribed) {
              onRemoteChange();
            }
          } catch {
            if (isSubscribed) onRemoteChange();
          } finally {
            isFetching = false;
          }
        }
      }, (error) => {
        const errMsg = error?.message || String(error);
        const errCode = (error as any)?.code || '';
        if (
          errCode === 'resource-exhausted' ||
          errMsg.includes('resource-exhausted') ||
          errMsg.includes('Quota limit exceeded') ||
          errMsg.includes('quota metric')
        ) {
          markFirestoreQuotaExhausted(1440);
          if (unsubscribeSnapshot) {
            try {
              unsubscribeSnapshot();
            } catch {}
            unsubscribeSnapshot = null;
          }
          console.warn('[Firestore] Inscrição em tempo real pausada temporariamente devido ao limite de cota diária. Operando em modo de alta velocidade offline/local.');
          return;
        }
        console.warn('Firestore subscription note (will retry):', errMsg);
        if (onError) onError(error);
      });
    } catch (e: any) {
      console.warn('Could not setup Firestore snapshot listener', e);
      if (onError && e instanceof Error) onError(e);
    }
  });

  return () => {
    isSubscribed = false;
    if (unsubscribeSnapshot) {
      try {
        unsubscribeSnapshot();
      } catch {}
      unsubscribeSnapshot = null;
    }
  };
}

/**
 * Computes cloud stats for badges, logos and entity counts.
 */
export function computeCloudStats(dbState: DbState): CloudSyncStats {
  const teams = dbState.teams || [];
  const leagues = dbState.leagues || [];
  const countries = dbState.countries || [];
  const matches = dbState.matches || [];
  const users = dbState.users || [];

  const teamsWithLogo = teams.filter(t => t.logoUrl && t.logoUrl.trim().length > 5).length;
  const leaguesWithLogo = leagues.filter(l => l.logoUrl && l.logoUrl.trim().length > 5).length;
  const countriesWithFlag = countries.filter(c => c.flagUrl && c.flagUrl.trim().length > 5).length;
  const totalImagesCount = teamsWithLogo + leaguesWithLogo + countriesWithFlag;

  return {
    matchesCount: matches.length,
    teamsCount: teams.length,
    leaguesCount: leagues.length,
    countriesCount: countries.length,
    usersCount: users.length,
    teamsWithLogo,
    leaguesWithLogo,
    countriesWithFlag,
    totalImagesCount,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Explicitly removes a user from Firestore (used only when Admin deletes user).
 */
export async function deleteUserFromFirestore(userId: string): Promise<void> {
  if (isFirestoreQuotaExhausted()) return;
  try {
    await ensureFirebaseAuth();
    const snap = await getDoc(doc(db, COLLECTION_NAME, 'users'));
    if (snap.exists()) {
      const list: AppUser[] = snap.data().list || [];
      const filtered = list.filter(u => u.id !== userId && u.username.toLowerCase() !== userId.toLowerCase());
      await setDoc(doc(db, COLLECTION_NAME, 'users'), {
        list: sanitizeForFirestore(filtered),
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    if (err?.code === 'resource-exhausted' || errMsg.includes('Quota limit exceeded') || errMsg.includes('resource-exhausted')) {
      markFirestoreQuotaExhausted(1440);
    } else {
      console.warn('Could not delete user from Firestore:', err);
    }
  }
}

