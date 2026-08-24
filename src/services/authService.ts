import { AppUser, UserRole, UserAccessDuration, UserStatus } from '../types';

const ACTIVE_USER_STORAGE_KEY = 'football_active_user_session_v1';
const SESSION_EXPIRY_KEY = 'football_session_expires_at_v1';
const SESSION_DURATION_HOURS = 8;
const SESSION_DURATION_MS = SESSION_DURATION_HOURS * 60 * 60 * 1000;

export const DEFAULT_MASTER_USER: AppUser = {
  id: 'USER-MASTER-001',
  name: 'Administrador Master',
  username: '31882844890',
  password: 'Otavio@2010',
  role: 'MASTER',
  duration: 'LIFETIME',
  status: 'ACTIVE',
  createdAt: new Date().toISOString(),
  expiresAt: null,
  notes: 'Perfil Master Principal',
};

export const DEFAULT_CONSULTA_USER: AppUser = {
  id: 'USER-CONSULTA-001',
  name: 'User Teste',
  username: 'usuario.teste',
  password: '123456',
  role: 'CONSULTOR',
  duration: '30_DAYS',
  status: 'ACTIVE',
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000).toISOString(),
  notes: 'Perfil de Teste Consulta & Análise',
};

/**
 * Calculates the expiration date ISO string based on duration option.
 */
export function calculateExpirationDate(
  duration: UserAccessDuration,
  baseDate: Date = new Date(),
  customDays?: number | null
): string | null {
  if (duration === 'LIFETIME') return null;

  const target = new Date(baseDate);
  if (duration === '30_DAYS') {
    target.setDate(target.getDate() + 30);
  } else if (duration === '60_DAYS') {
    target.setDate(target.getDate() + 60);
  } else if (duration === '90_DAYS') {
    target.setDate(target.getDate() + 90);
  } else if (duration === '180_DAYS') {
    target.setDate(target.getDate() + 180);
  } else if (duration === '1_YEAR') {
    target.setDate(target.getDate() + 365);
  } else if (duration === 'CUSTOM') {
    const days = typeof customDays === 'number' && customDays > 0 ? customDays : 30;
    target.setDate(target.getDate() + days);
  }
  return target.toISOString();
}

/**
 * Extends the expiration date by a specific duration.
 * If user is already active with remaining time, adds to their current expiration date.
 * If expired, starts from today.
 */
export function extendUserAccess(
  currentUser: AppUser,
  durationToAdd: UserAccessDuration,
  customDays?: number | null
): { expiresAt: string | null; duration: UserAccessDuration; customDays?: number | null } {
  if (durationToAdd === 'LIFETIME') {
    return { expiresAt: null, duration: 'LIFETIME', customDays: null };
  }

  const now = new Date();
  let baseDate = now;

  if (currentUser.expiresAt) {
    const currentExp = new Date(currentUser.expiresAt);
    if (currentExp > now) {
      baseDate = currentExp;
    }
  }

  const newExpiresAt = calculateExpirationDate(durationToAdd, baseDate, customDays);
  return {
    expiresAt: newExpiresAt,
    duration: durationToAdd,
    customDays: durationToAdd === 'CUSTOM' ? (customDays ?? currentUser.customDays ?? 30) : null,
  };
}

/**
 * Returns the effective runtime status and human-readable time remaining for a user.
 */
export function getUserEffectiveStatus(user: AppUser): {
  status: UserStatus;
  isExpired: boolean;
  isBlocked: boolean;
  canAccess: boolean;
  daysRemaining: number | null;
  hoursRemaining: number | null;
  statusLabel: string;
  formattedExpiresAt: string;
} {
  if (user.status === 'BLOCKED') {
    return {
      status: 'BLOCKED',
      isExpired: false,
      isBlocked: true,
      canAccess: false,
      daysRemaining: null,
      hoursRemaining: null,
      statusLabel: 'Bloqueado',
      formattedExpiresAt: 'Acesso suspenso',
    };
  }

  if (user.role === 'MASTER' || user.expiresAt === null || user.duration === 'LIFETIME') {
    return {
      status: 'ACTIVE',
      isExpired: false,
      isBlocked: false,
      canAccess: true,
      daysRemaining: null,
      hoursRemaining: null,
      statusLabel: 'Ativo (Vitalício)',
      formattedExpiresAt: 'Acesso Vitalício',
    };
  }

  const nowMs = Date.now();
  const expMs = new Date(user.expiresAt).getTime();
  const diffMs = expMs - nowMs;

  const expDate = new Date(user.expiresAt);
  const formattedExp = expDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  if (diffMs <= 0) {
    return {
      status: 'EXPIRED',
      isExpired: true,
      isBlocked: false,
      canAccess: false,
      daysRemaining: 0,
      hoursRemaining: 0,
      statusLabel: 'Expirado',
      formattedExpiresAt: `Expirou em ${formattedExp}`,
    };
  }

  const daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hoursRemaining = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  let statusLabel = '';
  if (daysRemaining > 0) {
    statusLabel = `${daysRemaining} dia${daysRemaining > 1 ? 's' : ''} restante${daysRemaining > 1 ? 's' : ''}`;
  } else {
    statusLabel = `${hoursRemaining}h restantes`;
  }

  return {
    status: 'ACTIVE',
    isExpired: false,
    isBlocked: false,
    canAccess: true,
    daysRemaining,
    hoursRemaining,
    statusLabel: `Ativo (${statusLabel})`,
    formattedExpiresAt: `Válido até ${formattedExp}`,
  };
}

/**
 * Ensures that the users list always has at least the default master administrator and test consultation profile.
 */
export function ensureDefaultUsers(users?: AppUser[]): AppUser[] {
  let result: AppUser[] = Array.isArray(users) && users.length > 0 ? [...users] : [DEFAULT_MASTER_USER, DEFAULT_CONSULTA_USER];

  const masterIndex = result.findIndex(u => u.role === 'MASTER');
  if (masterIndex === -1) {
    result.unshift(DEFAULT_MASTER_USER);
  } else {
    const existingMaster = result[masterIndex];
    if (
      existingMaster.username === 'master' ||
      existingMaster.password === '123' ||
      !existingMaster.password
    ) {
      result[masterIndex] = {
        ...existingMaster,
        username: DEFAULT_MASTER_USER.username,
        password: DEFAULT_MASTER_USER.password,
      };
    }
  }

  // Ensure default consultation user exists for seamless cross-device testing
  const consultaIndex = result.findIndex(u => u.username.toLowerCase() === 'usuario.teste');
  if (consultaIndex === -1) {
    result.push(DEFAULT_CONSULTA_USER);
  }

  return result;
}

/**
 * Updates sliding window activity timestamp (extends 8-hour session window on user interaction).
 */
export function touchUserActivity(): void {
  try {
    const raw = localStorage.getItem(ACTIVE_USER_STORAGE_KEY) || sessionStorage.getItem(ACTIVE_USER_STORAGE_KEY);
    if (!raw) return;
    const now = Date.now();
    const expiry = now + SESSION_DURATION_MS;
    localStorage.setItem(SESSION_EXPIRY_KEY, expiry.toString());
    sessionStorage.setItem(SESSION_EXPIRY_KEY, expiry.toString());
  } catch {
    // ignore
  }
}

/**
 * Gets currently logged in user session from LocalStorage / SessionStorage with 8-hour validity check.
 */
export function getCurrentAuthUser(): AppUser | null {
  try {
    const expiryRaw = localStorage.getItem(SESSION_EXPIRY_KEY) || sessionStorage.getItem(SESSION_EXPIRY_KEY);
    const raw = localStorage.getItem(ACTIVE_USER_STORAGE_KEY) || sessionStorage.getItem(ACTIVE_USER_STORAGE_KEY);
    if (!raw) return null;

    if (expiryRaw) {
      const expiry = parseInt(expiryRaw, 10);
      if (!isNaN(expiry) && Date.now() > expiry) {
        // Session expired (older than 8h of inactivity)
        setCurrentAuthUser(null);
        return null;
      }
    }

    const user: AppUser = JSON.parse(raw);
    touchUserActivity(); // Extend on valid retrieval
    return user;
  } catch {
    return null;
  }
}

/**
 * Stores active user session in LocalStorage + SessionStorage with 8-hour expiration.
 */
export function setCurrentAuthUser(user: AppUser | null): void {
  try {
    if (!user) {
      localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
      localStorage.removeItem(SESSION_EXPIRY_KEY);
      sessionStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
      sessionStorage.removeItem(SESSION_EXPIRY_KEY);
    } else {
      const str = JSON.stringify(user);
      const expiry = (Date.now() + SESSION_DURATION_MS).toString();
      localStorage.setItem(ACTIVE_USER_STORAGE_KEY, str);
      localStorage.setItem(SESSION_EXPIRY_KEY, expiry);
      sessionStorage.setItem(ACTIVE_USER_STORAGE_KEY, str);
      sessionStorage.setItem(SESSION_EXPIRY_KEY, expiry);
    }
  } catch (err) {
    console.error('Failed to save user session in storage', err);
  }
}

/**
 * Gets remaining hours of active 8-hour session.
 */
export function getActiveSessionRemainingHours(): number {
  try {
    const expiryRaw = localStorage.getItem(SESSION_EXPIRY_KEY) || sessionStorage.getItem(SESSION_EXPIRY_KEY);
    if (!expiryRaw) return SESSION_DURATION_HOURS;
    const expiry = parseInt(expiryRaw, 10);
    if (isNaN(expiry)) return SESSION_DURATION_HOURS;
    const diff = expiry - Date.now();
    if (diff <= 0) return 0;
    return Math.round((diff / (1000 * 60 * 60)) * 10) / 10;
  } catch {
    return SESSION_DURATION_HOURS;
  }
}

/**
 * Formats duration key into readable Portuguese text
 */
export function formatDurationLabel(duration: UserAccessDuration, customDays?: number | null): string {
  switch (duration) {
    case '30_DAYS':
      return '30 Dias (1 Mês)';
    case '60_DAYS':
      return '60 Dias (Bimestral)';
    case '90_DAYS':
      return '90 Dias (Trimestral)';
    case '180_DAYS':
      return '180 Dias (Semestral)';
    case '1_YEAR':
      return '1 Ano (Anual)';
    case 'LIFETIME':
      return 'Vitalício (Sem limite)';
    case 'CUSTOM':
      return customDays ? `${customDays} Dias (Manual)` : 'Personalizado';
    default:
      return duration;
  }
}

/**
 * Encodes a user object into a safe URL token for instant cross-device sharing.
 */
export function encodeUserToToken(user: AppUser): string {
  try {
    const minified = {
      id: user.id,
      name: user.name,
      username: user.username,
      password: user.password,
      role: user.role,
      duration: user.duration,
      customDays: user.customDays,
      status: user.status,
      expiresAt: user.expiresAt,
      createdAt: user.createdAt,
      notes: user.notes,
    };
    return btoa(encodeURIComponent(JSON.stringify(minified)));
  } catch {
    return '';
  }
}

/**
 * Decodes a user object from a URL token.
 */
export function decodeUserFromToken(token: string): AppUser | null {
  try {
    const jsonStr = decodeURIComponent(atob(token));
    const parsed = JSON.parse(jsonStr);
    if (parsed && parsed.username && parsed.role) {
      return parsed as AppUser;
    }
  } catch {
    // ignore
  }
  return null;
}

