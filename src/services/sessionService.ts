import { doc, getDoc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db, ensureFirebaseAuth, isFirestoreQuotaExhausted, markFirestoreQuotaExhausted } from './firebaseDbService';
import { AppUser } from '../types';

const SESSION_STORAGE_KEY = 'football_active_session_token_v2';
const SESSIONS_DOC_PATH = 'active_sessions_v2';
const COLLECTION_NAME = 'app_data';

export interface ActiveSessionRecord {
  sessionId: string;
  userId: string;
  username: string;
  name?: string;
  role?: string;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
  deviceModel?: string;
  os: string;
  browser: string;
  screenResolution: string;
  timezone: string;
  ip?: string;
  loginTime: string;
  updatedAt: string;
  lastHeartbeat: number; // timestamp ms
  clientInfo?: string;
  status?: 'ONLINE' | 'IDLE' | 'OFFLINE';
  isRevoked?: boolean;
  simultaneousCountForUser?: number;
  timeSinceHeartbeatMs?: number;
}

export interface SessionDashboardData {
  totalSessions: number;
  onlineCount: number;
  idleCount: number;
  uniqueUsersOnline: number;
  sessions: ActiveSessionRecord[];
}

/**
 * Generates a cryptographically-random unique session identifier for this device/window.
 */
export function generateSessionId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 10);
  const cryptoRand =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).substring(2, 8);
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
 * Detects rich client hardware, OS, and browser environment.
 */
export function detectClientEnvironment(): {
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
  deviceModel: string;
  os: string;
  browser: string;
  screenResolution: string;
  timezone: string;
  clientInfo: string;
} {
  if (typeof window === 'undefined' || !navigator) {
    return {
      deviceType: 'Desktop',
      deviceModel: 'Servidor',
      os: 'Desconhecido',
      browser: 'Navegador Web',
      screenResolution: '1920x1080',
      timezone: 'UTC',
      clientInfo: 'Sessão Web',
    };
  }

  const ua = navigator.userAgent || '';

  // 1. Device Type
  let deviceType: 'Desktop' | 'Mobile' | 'Tablet' = 'Desktop';
  if (/iPad/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) {
    deviceType = 'Tablet';
  } else if (/iPhone|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    deviceType = 'Mobile';
  }

  // 2. OS Detection
  let os = 'Outro Sistema';
  if (/Windows NT 10.0/i.test(ua)) os = 'Windows 10/11';
  else if (/Windows NT 6.3/i.test(ua)) os = 'Windows 8.1';
  else if (/Windows NT 6.1/i.test(ua)) os = 'Windows 7';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/iPhone/i.test(ua)) os = 'iOS (iPhone)';
  else if (/iPad/i.test(ua)) os = 'iPadOS (iPad)';
  else if (/Mac OS X/i.test(ua)) os = 'macOS (Apple)';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/CrOS/i.test(ua)) os = 'Chrome OS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  // 3. Browser Detection
  let browser = 'Navegador';
  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) browser = 'Opera';
  else if (/SamsungBrowser/i.test(ua)) browser = 'Samsung Internet';
  else if (/Chrome\//i.test(ua)) browser = 'Google Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Mozilla Firefox';
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = 'Apple Safari';

  // 4. Screen resolution
  const width = window.screen?.width || window.innerWidth || 1920;
  const height = window.screen?.height || window.innerHeight || 1080;
  const screenResolution = `${width}x${height}`;

  // 5. Timezone
  let timezone = 'America/Sao_Paulo';
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
  } catch {
    // ignore
  }

  // 6. Device Model Summary
  let deviceModel = deviceType === 'Mobile' ? 'Smartphone' : deviceType === 'Tablet' ? 'Tablet' : 'Computador / PC';
  if (/iPhone/i.test(ua)) deviceModel = 'Apple iPhone';
  if (/iPad/i.test(ua)) deviceModel = 'Apple iPad';
  if (/Macintosh/i.test(ua)) deviceModel = 'Apple Mac';

  const clientInfo = `${deviceType}: ${browser} no ${os} (${screenResolution})`;

  return {
    deviceType,
    deviceModel,
    os,
    browser,
    screenResolution,
    timezone,
    clientInfo,
  };
}

/**
 * Registers an active session for the given user in Firestore and the backend API.
 * SIMULTANEOUS LOGIN IS ALLOWED: No previous session is deleted or invalidated.
 */
export async function registerActiveSession(user: AppUser, preferredSessionId?: string): Promise<string> {
  const sessionId = preferredSessionId || getOrCreateClientSessionId();
  setLocalSessionId(sessionId);

  const env = detectClientEnvironment();
  const nowIso = new Date().toISOString();

  const sessionRecord: ActiveSessionRecord = {
    sessionId,
    userId: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    deviceType: env.deviceType,
    deviceModel: env.deviceModel,
    os: env.os,
    browser: env.browser,
    screenResolution: env.screenResolution,
    timezone: env.timezone,
    loginTime: nowIso,
    updatedAt: nowIso,
    lastHeartbeat: Date.now(),
    clientInfo: env.clientInfo,
    status: 'ONLINE',
    isRevoked: false,
  };

  // 1. Write to backend API
  try {
    await fetch('/api/sessions/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionRecord),
    });
  } catch (err) {
    console.warn('Server session register note:', err);
  }

  // 2. Write to Firestore in real-time if quota available
  if (!isFirestoreQuotaExhausted()) {
    try {
      await ensureFirebaseAuth();
      const sessionDocRef = doc(db, COLLECTION_NAME, SESSIONS_DOC_PATH);
      await setDoc(
        sessionDocRef,
        {
          [sessionId]: sessionRecord,
          lastGlobalUpdate: nowIso,
        },
        { merge: true }
      );
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      if (
        err?.code === 'resource-exhausted' ||
        errMsg.includes('Quota limit exceeded') ||
        errMsg.includes('resource-exhausted')
      ) {
        markFirestoreQuotaExhausted(1440);
      }
    }
  }

  return sessionId;
}

/**
 * Sends a periodic heartbeat to indicate that this session is actively in use.
 */
export async function sendSessionHeartbeat(user: AppUser, sessionId: string): Promise<void> {
  if (!sessionId || !user) return;

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
 * Subscribes to user session state and manages periodic heartbeats.
 * NOTE: Multi-device logins are fully permitted without kicking users out!
 * Only triggers callback if Master explicitly revoked THIS specific session.
 */
export function startActiveSessionKeepalive(
  user: AppUser,
  localSessionId: string,
  onSessionRevokedByMaster?: () => void
): () => void {
  if (!user || !localSessionId) {
    return () => {};
  }

  let isActive = true;

  // Immediate registration
  registerActiveSession(user, localSessionId).catch(() => {});

  // Periodic heartbeat every 40 seconds
  const intervalId = setInterval(async () => {
    if (!isActive) return;

    try {
      const res = await fetch(`/api/sessions/status/${encodeURIComponent(localSessionId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.isRevoked === true && onSessionRevokedByMaster) {
          console.warn(`[Session] This session was remotely disconnected by the Master.`);
          onSessionRevokedByMaster();
          return;
        }
      }
    } catch {
      // non-fatal
    }

    sendSessionHeartbeat(user, localSessionId).catch(() => {});
  }, 40000);

  return () => {
    isActive = false;
    clearInterval(intervalId);
  };
}

/**
 * Legacy alias for backwards compatibility
 */
export const subscribeToUserSession = (
  user: AppUser,
  localSessionId: string,
  onRevoked: (remoteInfo?: any) => void
) => {
  return startActiveSessionKeepalive(user, localSessionId, () => {
    onRevoked({ sessionId: localSessionId, username: user.username });
  });
};

/**
 * Revokes and clears the active session on user explicit logout from this device.
 */
export async function clearUserSession(user: AppUser, sessionId?: string): Promise<void> {
  const targetSessionId = sessionId || getLocalSessionId();
  clearLocalSessionId();
  if (!user) return;

  try {
    await fetch('/api/sessions/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, sessionId: targetSessionId }),
    });
  } catch {
    // ignore
  }

  if (targetSessionId && !isFirestoreQuotaExhausted()) {
    try {
      await ensureFirebaseAuth();
      const sessionDocRef = doc(db, COLLECTION_NAME, SESSIONS_DOC_PATH);
      const snap = await getDoc(sessionDocRef);
      if (snap.exists()) {
        const data = snap.data();
        delete data[targetSessionId];
        await setDoc(sessionDocRef, data);
      }
    } catch {
      // ignore
    }
  }
}

export const clearActiveSession = clearUserSession;

/**
 * MASTER PANEL API: Fetches all currently active sessions across all profiles.
 */
export async function fetchAllActiveSessions(): Promise<SessionDashboardData> {
  try {
    const res = await fetch('/api/sessions/all');
    if (res.ok) {
      const data = await res.json();
      return {
        totalSessions: data.totalSessions || 0,
        onlineCount: data.onlineCount || 0,
        idleCount: data.idleCount || 0,
        uniqueUsersOnline: data.uniqueUsersOnline || 0,
        sessions: data.sessions || [],
      };
    }
  } catch (err) {
    console.warn('Could not fetch sessions from server API:', err);
  }

  // Fallback to Firestore if server fetch failed and quota allows
  if (!isFirestoreQuotaExhausted()) {
    try {
      await ensureFirebaseAuth();
      const snap = await getDoc(doc(db, COLLECTION_NAME, SESSIONS_DOC_PATH));
      if (snap.exists()) {
        const data = snap.data();
        const now = Date.now();
        const list: ActiveSessionRecord[] = [];

        for (const [key, val] of Object.entries(data)) {
          if (key === 'lastGlobalUpdate' || typeof val !== 'object' || !val) continue;
          const s = val as ActiveSessionRecord;
          if (s.sessionId && !s.isRevoked) {
            const timeSince = now - (s.lastHeartbeat || 0);
            let status: 'ONLINE' | 'IDLE' | 'OFFLINE' = 'ONLINE';
            if (timeSince > 5 * 60 * 1000) status = 'OFFLINE';
            else if (timeSince > 90 * 1000) status = 'IDLE';

            list.push({ ...s, status, timeSinceHeartbeatMs: timeSince });
          }
        }

        list.sort((a, b) => (b.lastHeartbeat || 0) - (a.lastHeartbeat || 0));
        const onlineCount = list.filter(s => s.status === 'ONLINE').length;
        const idleCount = list.filter(s => s.status === 'IDLE').length;
        const uniqueUsersOnline = new Set(list.filter(s => s.status !== 'OFFLINE').map(s => s.username || s.userId)).size;

        return {
          totalSessions: list.length,
          onlineCount,
          idleCount,
          uniqueUsersOnline,
          sessions: list,
        };
      }
    } catch {
      // ignore
    }
  }

  return {
    totalSessions: 0,
    onlineCount: 0,
    idleCount: 0,
    uniqueUsersOnline: 0,
    sessions: [],
  };
}

/**
 * MASTER ACTION: Remotely disconnects a specific session.
 */
export async function disconnectSessionRemote(sessionId: string): Promise<boolean> {
  try {
    const res = await fetch('/api/sessions/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    return res.ok;
  } catch (err) {
    console.error('Error disconnecting session:', err);
    return false;
  }
}

/**
 * MASTER ACTION: Remotely disconnects all sessions for a user.
 */
export async function disconnectAllUserSessionsRemote(userId: string, username?: string): Promise<boolean> {
  try {
    const res = await fetch('/api/sessions/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, username }),
    });
    return res.ok;
  } catch (err) {
    console.error('Error disconnecting all sessions for user:', err);
    return false;
  }
}
