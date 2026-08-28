import { doc, getDoc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db, ensureFirebaseAuth } from './firebaseDbService';
import { AppUser } from '../types';

const SESSION_STORAGE_KEY = 'football_active_session_token_v1';
const SESSIONS_DOC_PATH = 'active_sessions';
const COLLECTION_NAME = 'app_data';

export interface ActiveSessionRecord {
  sessionId: string;
  userId: string;
  username: string;
  updatedAt: string;
  lastHeartbeat: number; // timestamp ms
  clientInfo?: string;
}

/**
 * Generates a cryptographically-random unique session identifier.
 */
export function generateSessionId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 10);
  const cryptoRand = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).substring(2, 8);
  return `sess_${ts}_${rand}_${cryptoRand}`;
}

/**
 * Gets the current active session ID stored on this client.
 */
export function getLocalSessionId(): string | null {
  try {
    return localStorage.getItem(SESSION_STORAGE_KEY) || sessionStorage.getItem(SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Stores the local session ID.
 */
export function setLocalSessionId(sessionId: string): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  } catch {
    // ignore
  }
}

/**
 * Clears the local session ID.
 */
export function clearLocalSessionId(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Retrieves the stored client session ID or generates a new one.
 */
export function getOrCreateClientSessionId(forceNew: boolean = false): string {
  if (!forceNew) {
    const existing = getLocalSessionId();
    if (existing) return existing;
  }
  const fresh = generateSessionId();
  setLocalSessionId(fresh);
  return fresh;
}

/**
 * Helper to get user client environment summary (e.g. Chrome / Mobile / Screen)
 */
function getClientSummary(): string {
  if (typeof window === 'undefined') return 'Servidor';
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const device = isMobile ? 'Celular/Tablet' : 'Computador/Desktop';
  return `${device} (${window.innerWidth}x${window.innerHeight})`;
}

/**
 * Registers an active session for the given user in Firestore and the backend API.
 * Any other device currently connected with this user ID will be invalidated.
 */
export async function registerActiveSession(user: AppUser, preferredSessionId?: string): Promise<string> {
  const newSessionId = preferredSessionId || generateSessionId();
  setLocalSessionId(newSessionId);

  const sessionRecord: ActiveSessionRecord = {
    sessionId: newSessionId,
    userId: user.id,
    username: user.username,
    updatedAt: new Date().toISOString(),
    lastHeartbeat: Date.now(),
    clientInfo: getClientSummary(),
  };

  // 1. Write to Firestore in real-time
  try {
    await ensureFirebaseAuth();
    const sessionDocRef = doc(db, COLLECTION_NAME, SESSIONS_DOC_PATH);
    const snap = await getDoc(sessionDocRef);
    const existing = snap.exists() ? snap.data() : {};
    
    await setDoc(sessionDocRef, {
      ...existing,
      [user.id]: sessionRecord,
      [`user_${user.username.toLowerCase().replace(/[^a-z0-9]/g, '_')}`]: sessionRecord,
      lastGlobalUpdate: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore session register warning:', err);
  }

  // 2. Write to backend API as redundant backup
  try {
    await fetch('/api/sessions/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionRecord),
    });
  } catch (err) {
    console.warn('Server session register warning:', err);
  }

  return newSessionId;
}

/**
 * Sends a periodic heartbeat to indicate that this session is actively in use.
 */
export async function sendSessionHeartbeat(user: AppUser, sessionId: string): Promise<void> {
  if (!sessionId || !user) return;

  // Lightweight server heartbeat notification without triggering Firestore document writes
  try {
    await fetch('/api/sessions/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, sessionId, timestamp: Date.now() }),
    });
  } catch {
    // non-fatal
  }
}

/**
 * Checks if the current local session is still valid (not superseded by another login).
 */
export async function checkSessionValidity(
  user: AppUser,
  localSessionId: string
): Promise<{ isValid: boolean; remoteInfo?: ActiveSessionRecord }> {
  if (!user || !localSessionId) return { isValid: true };

  // 1. Check Firestore
  try {
    await ensureFirebaseAuth();
    const snap = await getDoc(doc(db, COLLECTION_NAME, SESSIONS_DOC_PATH));
    if (snap.exists()) {
      const data = snap.data();
      const userKey = user.id;
      const aliasKey = `user_${user.username.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const record = (data[userKey] || data[aliasKey]) as ActiveSessionRecord | undefined;

      if (record && record.sessionId && record.sessionId !== localSessionId) {
        return { isValid: false, remoteInfo: record };
      }
    }
  } catch (err) {
    console.warn('Firestore session check fallback:', err);
  }

  // 2. Check Server API fallback
  try {
    const res = await fetch(`/api/sessions/status/${encodeURIComponent(user.id)}?sessionId=${encodeURIComponent(localSessionId)}`);
    if (res.ok) {
      const result = await res.json();
      if (result && result.isValid === false) {
        return { isValid: false, remoteInfo: result.remoteInfo };
      }
    }
  } catch {
    // ignore
  }

  return { isValid: true };
}

/**
 * Subscribes to real-time session updates for the logged in user.
 * If another login is detected anywhere with the same user credentials,
 * the `onRevoked` callback is immediately called.
 */
export function subscribeToUserSession(
  user: AppUser,
  localSessionId: string,
  onRevoked: (remoteInfo?: ActiveSessionRecord) => void
): () => void {
  // Only enforce anti-simultaneous access for CONSULTOR users or if user is set
  if (!user || user.role === 'MASTER' || !localSessionId) {
    return () => {};
  }

  let isSubscribed = true;
  let unsubscribeFirestore: Unsubscribe | null = null;

  // 1. Realtime Firestore listener
  ensureFirebaseAuth().then(() => {
    if (!isSubscribed) return;
    try {
      const sessionDocRef = doc(db, COLLECTION_NAME, SESSIONS_DOC_PATH);
      unsubscribeFirestore = onSnapshot(sessionDocRef, (snap) => {
        if (!isSubscribed || !snap.exists()) return;
        const data = snap.data();
        const userKey = user.id;
        const aliasKey = `user_${user.username.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        const record = (data[userKey] || data[aliasKey]) as ActiveSessionRecord | undefined;

        if (record && record.sessionId && record.sessionId !== localSessionId) {
          console.warn(`[Anti-Concurrent] Session revoked for ${user.username}. Superseded by new session: ${record.sessionId}`);
          onRevoked(record);
        }
      }, (error) => {
        console.warn('Firestore session listener note:', error);
      });
    } catch (e) {
      console.warn('Could not establish Firestore session listener', e);
    }
  });

  // 2. Periodic Heartbeat & Fallback Poll every 60 seconds
  const intervalId = setInterval(async () => {
    if (!isSubscribed) return;

    // Send heartbeat
    sendSessionHeartbeat(user, localSessionId).catch(() => {});

    // Polling verification fallback
    const { isValid, remoteInfo } = await checkSessionValidity(user, localSessionId);
    if (!isValid && isSubscribed) {
      console.warn(`[Anti-Concurrent] Polling detected session invalidation for ${user.username}`);
      onRevoked(remoteInfo);
    }
  }, 60000);

  return () => {
    isSubscribed = false;
    clearInterval(intervalId);
    if (unsubscribeFirestore) {
      unsubscribeFirestore();
    }
  };
}

/**
 * Revokes and clears the active session on user explicit logout.
 */
export async function clearUserSession(user: AppUser): Promise<void> {
  clearLocalSessionId();
  if (!user) return;

  try {
    await ensureFirebaseAuth();
    const sessionDocRef = doc(db, COLLECTION_NAME, SESSIONS_DOC_PATH);
    const snap = await getDoc(sessionDocRef);
    if (snap.exists()) {
      const data = snap.data();
      delete data[user.id];
      delete data[`user_${user.username.toLowerCase().replace(/[^a-z0-9]/g, '_')}`];
      await setDoc(sessionDocRef, data);
    }
  } catch {
    // ignore
  }

  try {
    await fetch('/api/sessions/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    });
  } catch {
    // ignore
  }
}

export const clearActiveSession = clearUserSession;

