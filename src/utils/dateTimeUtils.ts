/**
 * Timezone and Date Utility Module for Horário de Brasília (BRT / UTC-3)
 * 
 * Ensures all match schedules, daily game filters, calendars, and time displays
 * are strictly aligned with Horário Oficial de Brasília (America/Sao_Paulo).
 */

export const BRASILIA_TIMEZONE = 'America/Sao_Paulo';

/**
 * Normalizes any date input string to a valid Date object without timezone shifting.
 */
export function parseDateToBrasilia(dateInput?: string | Date | null): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput;
  }

  const str = String(dateInput).trim();
  if (!str) return null;

  // If ISO YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
  const isoMatch = str.match(/^(\d{4})[-\/](\d{2})[-\/](\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    const hours = isoMatch[4] !== undefined ? parseInt(isoMatch[4], 10) : 12;
    const mins = isoMatch[5] !== undefined ? parseInt(isoMatch[5], 10) : 0;
    const secs = isoMatch[6] !== undefined ? parseInt(isoMatch[6], 10) : 0;
    return new Date(year, month - 1, day, hours, mins, secs);
  }

  // If DD/MM/YYYY or DD/MM/YYYY HH:mm:ss
  const dmyMatch = str.match(/^(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})(?:[\sT](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10);
    const year = parseInt(dmyMatch[3], 10);
    const hours = dmyMatch[4] !== undefined ? parseInt(dmyMatch[4], 10) : 12;
    const mins = dmyMatch[5] !== undefined ? parseInt(dmyMatch[5], 10) : 0;
    const secs = dmyMatch[6] !== undefined ? parseInt(dmyMatch[6], 10) : 0;
    return new Date(year, month - 1, day, hours, mins, secs);
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
 * Example: "2026-08-29T09:30:00" -> "09:30"
 * Example: "2026-08-29T09:30:00.000Z" -> "09:30"
 */
export function formatMatchTimeBRT(dateInput?: string | Date | null): string {
  if (!dateInput) return '';

  if (typeof dateInput === 'string') {
    const str = dateInput.trim();
    const timeMatch = str.match(/[T\s](\d{1,2}):(\d{2})/);
    if (timeMatch) {
      const hh = timeMatch[1].padStart(2, '0');
      const mm = timeMatch[2];
      return `${hh}:${mm}`;
    }
    if (/^\d{1,2}:\d{2}$/.test(str)) {
      const parts = str.split(':');
      return `${parts[0].padStart(2, '0')}:${parts[1]}`;
    }
  }

  const d = parseDateToBrasilia(dateInput);
  if (!d) return '';

  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Extracts the YYYY-MM-DD date key in Horário de Brasília timezone.
 * Example: "2026-08-29T09:30:00.000Z" -> "2026-08-29"
 */
export function extractBrasiliaYMD(dateInput?: string | Date | null): string | null {
  if (!dateInput) return null;

  if (typeof dateInput === 'string') {
    const str = dateInput.trim();
    // YYYY-MM-DD
    const isoMatch = str.match(/^(\d{4})[-\/](\d{2})[-\/](\d{2})/);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    }
    // DD/MM/YYYY
    const dmyMatch = str.match(/^(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/);
    if (dmyMatch) {
      return `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
    }
  }

  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return null;
    return formatDateToYMD(dateInput);
  }

  const d = parseDateToBrasilia(dateInput);
  if (!d) return null;
  return formatDateToYMD(d);
}

/**
 * Formats a date into a friendly Portuguese display using Brasília timezone
 * Example: "2026-08-29" -> { title: "Sábado", subtitle: "29/08", fullDate: "29/08/2026" }
 */
export function formatBrasiliaFriendlyDate(ymdOrIso?: string | Date | null): { title: string; subtitle: string; fullDate: string } {
  if (!ymdOrIso) return { title: '', subtitle: '', fullDate: '' };

  const ymd = extractBrasiliaYMD(ymdOrIso);
  if (!ymd) return { title: String(ymdOrIso), subtitle: '', fullDate: String(ymdOrIso) };

  const [y, m, day] = ymd.split('-').map(Number);
  const d = new Date(y, m - 1, day, 12, 0, 0);

  const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const dayOfWeek = dayNames[d.getDay()] || '';
  const dayStr = String(day).padStart(2, '0');
  const monthStr = String(m).padStart(2, '0');

  return {
    title: dayOfWeek,
    subtitle: `${dayStr}/${monthStr}`,
    fullDate: `${dayStr}/${monthStr}/${y}`,
  };
}

/**
 * Formats date and time for table listings e.g. "29/08/2026 09:30"
 */
export function formatBrasiliaDateTime(dateInput?: string | Date | null): string {
  if (!dateInput) return '';
  const ymd = extractBrasiliaYMD(dateInput);
  const time = formatMatchTimeBRT(dateInput);
  if (ymd) {
    const [y, m, d] = ymd.split('-');
    const dateFormatted = `${d}/${m}/${y}`;
    return time ? `${dateFormatted} ${time}` : dateFormatted;
  }
  return String(dateInput);
}

/**
 * Formats date only e.g. "29/08/2026"
 */
export function formatBrasiliaDate(dateInput?: string | Date | null): string {
  if (!dateInput) return '';
  const ymd = extractBrasiliaYMD(dateInput);
  if (ymd) {
    const [y, m, d] = ymd.split('-');
    return `${d}/${m}/${y}`;
  }
  return String(dateInput);
}

/**
 * Formats dot date for recent form badges e.g. "29.08."
 */
export function formatBrasiliaDotDate(dateInput?: string | Date | null): string {
  if (!dateInput) return '--.--.';
  const ymd = extractBrasiliaYMD(dateInput);
  if (ymd) {
    const [, m, d] = ymd.split('-');
    return `${d}.${m}.`;
  }
  return '--.--.';
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
  const now = new Date();
  return formatDateToYMD(now);
}

/**
 * Returns yesterday's YYYY-MM-DD in Horário de Brasília
 */
export function getBrasiliaYesterdayYMD(): string {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  return formatDateToYMD(now);
}

/**
 * Returns tomorrow's YYYY-MM-DD in Horário de Brasília
 */
export function getBrasiliaTomorrowYMD(): string {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  return formatDateToYMD(now);
}

/**
 * Returns after tomorrow's YYYY-MM-DD in Horário de Brasília
 */
export function getBrasiliaAfterTomorrowYMD(): string {
  const now = new Date();
  now.setDate(now.getDate() + 2);
  return formatDateToYMD(now);
}

