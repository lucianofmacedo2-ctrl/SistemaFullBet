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
const MATCH_CHUNK_SIZE = 100; // max 100 matches per doc (~20-40 KB, well under 1MB limit)
const TEAM_CHUNK_SIZE = 200; // max 200 teams per doc (~50-80 KB, well under 1MB limit)
const COLLECTION_NAME = 'app_data';

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
 * Saves the entire DbState to Firestore partitioned across sub-documents in parallel.
 */
export async function saveDbToFirestore(state: DbState): Promise<SyncResult> {
  try {
    await ensureFirebaseAuth();

    const writeTasks: Promise<any>[] = [];

    // 1. Countries
    const cleanCountries = sanitizeForFirestore(state.countries || []);
    writeTasks.push(
      setDoc(doc(db, COLLECTION_NAME, 'countries'), {
        list: cleanCountries,
        updatedAt: new Date().toISOString(),
      })
    );

    // 2. Leagues
    const cleanLeagues = sanitizeForFirestore(state.leagues || []);
    writeTasks.push(
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
    writeTasks.push(
      setDoc(doc(db, COLLECTION_NAME, 'users'), {
        list: cleanUsers,
        updatedAt: new Date().toISOString(),
      })
    );

    // 4. Teams (Chunked in parallel)
    const teams = state.teams || [];
    const teamChunks = Math.ceil(teams.length / TEAM_CHUNK_SIZE) || 1;
    writeTasks.push(
      setDoc(doc(db, COLLECTION_NAME, 'teams_meta'), {
        total: teams.length,
        chunks: teamChunks,
        updatedAt: new Date().toISOString(),
      })
    );

    for (let i = 0; i < teamChunks; i++) {
      const chunkTeams = teams.slice(i * TEAM_CHUNK_SIZE, (i + 1) * TEAM_CHUNK_SIZE);
      const cleanChunk = sanitizeForFirestore(chunkTeams);
      writeTasks.push(setDoc(doc(db, COLLECTION_NAME, `teams_${i}`), { list: cleanChunk }));
    }

    // 5. Matches (Chunked in parallel)
    const matches = state.matches || [];
    const matchChunks = Math.ceil(matches.length / MATCH_CHUNK_SIZE) || 1;
    writeTasks.push(
      setDoc(doc(db, COLLECTION_NAME, 'matches_meta'), {
        total: matches.length,
        chunks: matchChunks,
        updatedAt: new Date().toISOString(),
      })
    );

    for (let i = 0; i < matchChunks; i++) {
      const chunkMatches = matches.slice(i * MATCH_CHUNK_SIZE, (i + 1) * MATCH_CHUNK_SIZE);
      const cleanChunk = sanitizeForFirestore(chunkMatches);
      writeTasks.push(setDoc(doc(db, COLLECTION_NAME, `matches_${i}`), { list: cleanChunk }));
    }

    // 6. Referees (if available)
    if (state.referees && state.referees.length > 0) {
      const cleanReferees = sanitizeForFirestore(state.referees);
      writeTasks.push(
        setDoc(doc(db, COLLECTION_NAME, 'referees'), {
          list: cleanReferees,
          updatedAt: new Date().toISOString(),
        })
      );
    }

    // 7. Meta info
    writeTasks.push(
      setDoc(doc(db, COLLECTION_NAME, 'meta'), {
        lastUpdated: new Date().toISOString(),
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

    // Execute all write operations concurrently in parallel
    await Promise.all(writeTasks);

    return { success: true, count: matches.length };
  } catch (error: any) {
    console.error('Error saving state to Firestore:', error);
    
    // Attempt fallback to default database if named database failed
    if (error?.message?.includes('not found') || error?.code === 'not-found') {
      try {
        db = getFirestore(app);
        return await saveDbToFirestore(state);
      } catch (fallbackErr: any) {
        return { success: false, error: fallbackErr?.message || String(fallbackErr) };
      }
    }

    return { success: false, error: error?.message || String(error) };
  }
}

/**
 * Fetches the complete DbState from Firestore with ultra-fast parallel document retrieval.
 */
export async function fetchDbFromFirestore(): Promise<DbState | null> {
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
    console.error('Error fetching state from Firestore:', error);
    if (error?.message?.includes('not found') || error?.code === 'not-found') {
      try {
        db = getFirestore(app);
        return await fetchDbFromFirestore();
      } catch (fallbackErr) {
        console.error('Fallback fetch also failed:', fallbackErr);
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

  ensureFirebaseAuth().then(() => {
    if (!isSubscribed) return;
    try {
      const metaDoc = doc(db, COLLECTION_NAME, 'meta');
      unsubscribeSnapshot = onSnapshot(metaDoc, async (snap) => {
        if (snap.exists()) {
          try {
            const freshData = await fetchDbFromFirestore();
            if (freshData && isSubscribed) {
              onRemoteChange(freshData);
            } else if (isSubscribed) {
              onRemoteChange();
            }
          } catch (e) {
            if (isSubscribed) onRemoteChange();
          }
        }
      }, (error) => {
        console.warn('Firestore subscription error (will retry automatically):', error);
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
      unsubscribeSnapshot();
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
  } catch (err) {
    console.warn('Could not delete user from Firestore:', err);
  }
}

