const COOKIE_NAME = '__csrf';
const HEADER_NAME = 'x-csrf-token';

function getTokenFromCookie(): string | null {
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${COOKIE_NAME}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

export async function fetchCsrfToken(): Promise<string> {
  const res = await fetch('/api/auth/csrf-token', { credentials: 'include' });
  const data = await res.json();
  return data.token;
}

export async function ensureCsrfToken(): Promise<string> {
  const existing = getTokenFromCookie();
  if (existing) return existing;
  return fetchCsrfToken();
}

export async function getCsrfHeaders(): Promise<Record<string, string>> {
  const token = await ensureCsrfToken();
  return { [HEADER_NAME]: token };
}
