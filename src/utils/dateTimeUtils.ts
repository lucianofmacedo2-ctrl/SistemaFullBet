/**
 * Timezone and Date Utility Module for Horário de Brasília (BRT / UTC-3)
 * 
 * Ensures all match schedules, daily game filters, calendars, and time displays
 * are strictly aligned with Horário Oficial de Brasília (America/Sao_Paulo).
 */

export const BRASILIA_TIMEZONE = 'America/Sao_Paulo';

/**
 * Normalizes any date input string to a valid Date object.
 * If an ISO string lacks timezone information (e.g., '2026-08-29T11:00:00'),
 * it is treated as UTC ('Z') so it converts to Brasília Time (-3h) as expected.
 */
export function parseDateToBrasilia(dateInput?: string | Date | null): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput;
  }

  const str = String(dateInput).trim();
  if (!str) return null;

  // If already an ISO string with explicit timezone Z or offset (+/-)
  if (str.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(str)) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  // If ISO without timezone e.g. "2026-08-29T11:00:00" or "2026-08-29 11:00:00"
  if (/^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}(:\d{2})?(\.\d+)?$/.test(str)) {
    const isoUtc = str.replace(' ', 'T') + 'Z';
    const d = new Date(isoUtc);
    if (!isNaN(d.getTime())) return d;
  }

  // If DD/MM/YYYY HH:mm:ss
  const dmyMatch = str.match(/^(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})([\sT](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10);
    const year = parseInt(dmyMatch[3], 10);
    const hours = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 12;
    const mins = dmyMatch[6] ? parseInt(dmyMatch[6], 10) : 0;
    const secs = dmyMatch[7] ? parseInt(dmyMatch[7], 10) : 0;

    // Treat European/UTC match times as UTC instant
    const d = new Date(Date.UTC(year, month - 1, day, hours, mins, secs));
    if (!isNaN(d.getTime())) return d;
  }

  // Fallback to standard parsing
  try {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

/**
 * Extracts and formats the time in Horário de Brasília (HH:mm)
 * Example: "2026-08-29T11:00:00.000Z" -> "08:00"
 */
export function formatMatchTimeBRT(dateInput?: string | Date | null): string {
  if (!dateInput) return '';
  const d = parseDateToBrasilia(dateInput);
  if (!d) return '';

  try {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: BRASILIA_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);
  } catch {
    return '';
  }
}

/**
 * Extracts the YYYY-MM-DD date key in Horário de Brasília timezone.
 * Example: "2026-08-29T01:00:00.000Z" (22:00 BRT on 28th) -> "2026-08-28"
 */
export function extractBrasiliaYMD(dateInput?: string | Date | null): string | null {
  if (!dateInput) return null;
  const d = parseDateToBrasilia(dateInput);
  if (!d) return null;

  try {
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: BRASILIA_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const parts = formatter.formatToParts(d);
    let year = '';
    let month = '';
    let day = '';

    for (const part of parts) {
      if (part.type === 'year') year = part.value;
      if (part.type === 'month') month = part.value;
      if (part.type === 'day') day = part.value;
    }

    if (year && month && day) {
      return `${year}-${month}-${day}`;
    }
  } catch {}

  // Fallback
  return formatDateToYMD(d);
}

/**
 * Formats a date into a friendly Portuguese display using Brasília timezone
 * Example: "2026-08-29" -> { title: "Sábado", subtitle: "29/08", fullDate: "29/08/2026" }
 */
export function formatBrasiliaFriendlyDate(ymdOrIso?: string | Date | null): { title: string; subtitle: string; fullDate: string } {
  if (!ymdOrIso) return { title: '', subtitle: '', fullDate: '' };

  let d: Date | null = null;
  if (typeof ymdOrIso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(ymdOrIso.trim())) {
    const [y, m, day] = ymdOrIso.trim().split('-').map(Number);
    d = new Date(y, m - 1, day, 12, 0, 0);
  } else {
    d = parseDateToBrasilia(ymdOrIso);
  }

  if (!d) return { title: String(ymdOrIso), subtitle: '', fullDate: String(ymdOrIso) };

  try {
    const dayOfWeek = d.toLocaleDateString('pt-BR', {
      timeZone: BRASILIA_TIMEZONE,
      weekday: 'long',
    });
    const capitalizedDay = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
    const formattedShort = d.toLocaleDateString('pt-BR', {
      timeZone: BRASILIA_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
    });
    const fullDate = d.toLocaleDateString('pt-BR', {
      timeZone: BRASILIA_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    return {
      title: capitalizedDay,
      subtitle: formattedShort,
      fullDate,
    };
  } catch {
    return { title: String(ymdOrIso), subtitle: '', fullDate: String(ymdOrIso) };
  }
}

/**
 * Formats date and time for table listings e.g. "29/08/2026 08:00"
 */
export function formatBrasiliaDateTime(dateInput?: string | Date | null): string {
  if (!dateInput) return '';
  const d = parseDateToBrasilia(dateInput);
  if (!d) return String(dateInput);

  try {
    return d.toLocaleDateString('pt-BR', {
      timeZone: BRASILIA_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return String(dateInput);
  }
}

/**
 * Formats date only e.g. "29/08/2026"
 */
export function formatBrasiliaDate(dateInput?: string | Date | null): string {
  if (!dateInput) return '';
  const d = parseDateToBrasilia(dateInput);
  if (!d) return String(dateInput);

  try {
    return d.toLocaleDateString('pt-BR', {
      timeZone: BRASILIA_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return String(dateInput);
  }
}

/**
 * Formats dot date for recent form badges e.g. "29.08."
 */
export function formatBrasiliaDotDate(dateInput?: string | Date | null): string {
  if (!dateInput) return '--.--.';
  const d = parseDateToBrasilia(dateInput);
  if (!d) return '--.--.';

  try {
    const day = d.toLocaleDateString('pt-BR', { timeZone: BRASILIA_TIMEZONE, day: '2-digit' });
    const month = d.toLocaleDateString('pt-BR', { timeZone: BRASILIA_TIMEZONE, month: '2-digit' });
    return `${day}.${month}.`;
  } catch {
    return '--.--.';
  }
}

/**
 * Helper to get standard YYYY-MM-DD from a Date object
 */
export function formatDateToYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns today's YYYY-MM-DD in Horário de Brasília
 */
export function getBrasiliaTodayYMD(): string {
  return extractBrasiliaYMD(new Date()) || formatDateToYMD(new Date());
}

/**
 * Returns yesterday's YYYY-MM-DD in Horário de Brasília
 */
export function getBrasiliaYesterdayYMD(): string {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  return extractBrasiliaYMD(now) || formatDateToYMD(now);
}

/**
 * Returns tomorrow's YYYY-MM-DD in Horário de Brasília
 */
export function getBrasiliaTomorrowYMD(): string {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  return extractBrasiliaYMD(now) || formatDateToYMD(now);
}

/**
 * Returns after tomorrow's YYYY-MM-DD in Horário de Brasília
 */
export function getBrasiliaAfterTomorrowYMD(): string {
  const now = new Date();
  now.setDate(now.getDate() + 2);
  return extractBrasiliaYMD(now) || formatDateToYMD(now);
}
