import { AppUser, UserRole, UserAccessDuration, UserStatus } from '../types';

const ACTIVE_USER_STORAGE_KEY = 'football_active_user_session_v1';

export const DEFAULT_MASTER_USER: AppUser = {
  id: 'USER-MASTER-001',
  name: 'Administrador Master',
  username: 'master',
  password: '123',
  role: 'MASTER',
  duration: 'LIFETIME',
  status: 'ACTIVE',
  createdAt: new Date().toISOString(),
  expiresAt: null,
  notes: 'Perfil Master Principal com Acesso Total',
};

/**
 * Calculates the expiration date ISO string based on duration option.
 */
export function calculateExpirationDate(
  duration: UserAccessDuration,
  baseDate: Date = new Date()
): string | null {
  if (duration === 'LIFETIME') return null;

  const target = new Date(baseDate);
  if (duration === '30_DAYS') {
    target.setDate(target.getDate() + 30);
  } else if (duration === '90_DAYS') {
    target.setDate(target.getDate() + 90);
  } else if (duration === '180_DAYS') {
    target.setDate(target.getDate() + 180);
  } else if (duration === '1_YEAR') {
    target.setDate(target.getDate() + 365);
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
  durationToAdd: UserAccessDuration
): { expiresAt: string | null; duration: UserAccessDuration } {
  if (durationToAdd === 'LIFETIME') {
    return { expiresAt: null, duration: 'LIFETIME' };
  }

  const now = new Date();
  let baseDate = now;

  if (currentUser.expiresAt) {
    const currentExp = new Date(currentUser.expiresAt);
    if (currentExp > now) {
      baseDate = currentExp;
    }
  }

  const newExpiresAt = calculateExpirationDate(durationToAdd, baseDate);
  return {
    expiresAt: newExpiresAt,
    duration: durationToAdd,
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
 * Ensures that the users list always has at least the default master administrator.
 */
export function ensureDefaultUsers(users?: AppUser[]): AppUser[] {
  if (!users || users.length === 0) {
    return [DEFAULT_MASTER_USER];
  }
  const hasMaster = users.some(u => u.role === 'MASTER');
  if (!hasMaster) {
    return [DEFAULT_MASTER_USER, ...users];
  }
  return users;
}

/**
 * Gets currently logged in user session from LocalStorage.
 */
export function getCurrentAuthUser(): AppUser | null {
  try {
    const raw = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Stores active user session in LocalStorage.
 */
export function setCurrentAuthUser(user: AppUser | null): void {
  try {
    if (!user) {
      localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
    } else {
      localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(user));
    }
  } catch (err) {
    console.error('Failed to save user session in storage', err);
  }
}

/**
 * Formats duration key into readable Portuguese text
 */
export function formatDurationLabel(duration: UserAccessDuration): string {
  switch (duration) {
    case '30_DAYS':
      return '30 Dias';
    case '90_DAYS':
      return '90 Dias (Trimestral)';
    case '180_DAYS':
      return '180 Dias (Semestral)';
    case '1_YEAR':
      return '1 Ano (Anual)';
    case 'LIFETIME':
      return 'Vitalício (Sem limite)';
    default:
      return duration;
  }
}
