const HEADER_NAME = 'x-csrf-token';

let csrfToken: string | null = null;

export async function fetchCsrfToken(): Promise<string> {
  const res = await fetch('/api/auth/csrf-token', { credentials: 'include' });
  const data = await res.json();
  csrfToken = data.token as string;
  return csrfToken!;
}

export async function ensureCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  return fetchCsrfToken();
}

export async function getCsrfHeaders(): Promise<Record<string, string>> {
  const token = await ensureCsrfToken();
  return { [HEADER_NAME]: token };
}
