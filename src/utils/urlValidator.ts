/**
 * URL and Image Validation Helper
 * Ensures provided URLs are syntactically and functionally valid URLs starting with http://, https:// or data:image/
 */

export function isValidUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  // Accept data URIs
  if (trimmed.startsWith('data:image/')) {
    return true;
  }

  // Must start with http:// or https://
  if (!/^https?:\/\//i.test(trimmed)) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    return Boolean(parsed.hostname && parsed.hostname.includes('.'));
  } catch {
    return false;
  }
}

export function sanitizeImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  return isValidUrl(trimmed) ? trimmed : undefined;
}
