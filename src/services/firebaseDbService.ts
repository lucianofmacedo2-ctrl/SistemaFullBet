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
import { DbState, Country, League, Team, Match, AppUser } from '../types';

// Initialize Firebase App instance
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

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
          console.warn('Anonymous auth failed or delayed:', error);
          unsubscribe();
          resolve(null);
        }
      }
    });
  });

  return authPromise;
}

// Chunking helper to respect Firestore document size limit (1MB max per doc)
const CHUNK_SIZE = 400; // max items per chunk
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

/**
 * Saves the entire DbState to Firestore partitioned across sub-documents.
 */
export async function saveDbToFirestore(state: DbState): Promise<boolean> {
  try {
    await ensureFirebaseAuth();
    const batch = writeBatch(db);

    // 1. Countries
    const countriesDoc = doc(db, COLLECTION_NAME, 'countries');
    batch.set(countriesDoc, {
      list: state.countries || [],
      updatedAt: new Date().toISOString(),
    });

    // 2. Leagues
    const leaguesDoc = doc(db, COLLECTION_NAME, 'leagues');
    batch.set(leaguesDoc, {
      list: state.leagues || [],
      updatedAt: new Date().toISOString(),
    });

    // 3. Users
    const usersDoc = doc(db, COLLECTION_NAME, 'users');
    batch.set(usersDoc, {
      list: state.users || [],
      updatedAt: new Date().toISOString(),
    });

    // 4. Teams (Chunked if needed)
    const teams = state.teams || [];
    const teamChunks = Math.ceil(teams.length / CHUNK_SIZE) || 1;
    const teamsMetaDoc = doc(db, COLLECTION_NAME, 'teams_meta');
    batch.set(teamsMetaDoc, {
      total: teams.length,
      chunks: teamChunks,
      updatedAt: new Date().toISOString(),
    });

    for (let i = 0; i < teamChunks; i++) {
      const chunkTeams = teams.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      const teamChunkDoc = doc(db, COLLECTION_NAME, `teams_${i}`);
      batch.set(teamChunkDoc, { list: chunkTeams });
    }

    // 5. Matches (Chunked if needed)
    const matches = state.matches || [];
    const matchChunks = Math.ceil(matches.length / CHUNK_SIZE) || 1;
    const matchesMetaDoc = doc(db, COLLECTION_NAME, 'matches_meta');
    batch.set(matchesMetaDoc, {
      total: matches.length,
      chunks: matchChunks,
      updatedAt: new Date().toISOString(),
    });

    for (let i = 0; i < matchChunks; i++) {
      const chunkMatches = matches.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      const matchChunkDoc = doc(db, COLLECTION_NAME, `matches_${i}`);
      batch.set(matchChunkDoc, { list: chunkMatches });
    }

    // 6. Meta info
    const metaDoc = doc(db, COLLECTION_NAME, 'meta');
    batch.set(metaDoc, {
      lastUpdated: new Date().toISOString(),
      counts: {
        countries: state.countries?.length || 0,
        leagues: state.leagues?.length || 0,
        teams: state.teams?.length || 0,
        matches: state.matches?.length || 0,
        users: state.users?.length || 0,
      },
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error saving state to Firestore:', error);
    return false;
  }
}

/**
 * Fetches the complete DbState from Firestore.
 */
export async function fetchDbFromFirestore(): Promise<DbState | null> {
  try {
    await ensureFirebaseAuth();

    // 1. Countries
    const countriesSnap = await getDoc(doc(db, COLLECTION_NAME, 'countries'));
    const countries: Country[] = countriesSnap.exists() ? (countriesSnap.data().list || []) : [];

    // 2. Leagues
    const leaguesSnap = await getDoc(doc(db, COLLECTION_NAME, 'leagues'));
    const leagues: League[] = leaguesSnap.exists() ? (leaguesSnap.data().list || []) : [];

    // 3. Users
    const usersSnap = await getDoc(doc(db, COLLECTION_NAME, 'users'));
    const users: AppUser[] = usersSnap.exists() ? (usersSnap.data().list || []) : [];

    // 4. Teams
    const teamsMetaSnap = await getDoc(doc(db, COLLECTION_NAME, 'teams_meta'));
    let teams: Team[] = [];
    if (teamsMetaSnap.exists()) {
      const meta = teamsMetaSnap.data();
      const chunks = meta.chunks || 1;
      for (let i = 0; i < chunks; i++) {
        const cSnap = await getDoc(doc(db, COLLECTION_NAME, `teams_${i}`));
        if (cSnap.exists()) {
          teams = teams.concat(cSnap.data().list || []);
        }
      }
    }

    // 5. Matches
    const matchesMetaSnap = await getDoc(doc(db, COLLECTION_NAME, 'matches_meta'));
    let matches: Match[] = [];
    if (matchesMetaSnap.exists()) {
      const meta = matchesMetaSnap.data();
      const chunks = meta.chunks || 1;
      for (let i = 0; i < chunks; i++) {
        const cSnap = await getDoc(doc(db, COLLECTION_NAME, `matches_${i}`));
        if (cSnap.exists()) {
          matches = matches.concat(cSnap.data().list || []);
        }
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
    };
  } catch (error) {
    console.error('Error fetching state from Firestore:', error);
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
