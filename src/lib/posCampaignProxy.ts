const DEFAULT_POS_API_URL = 'http://localhost:3000/api';
const PRODUCTION_POS_API_URL =
  'https://divine-nature-production-1489.up.railway.app/api';

export function getPosApiUrl(): string {
  if (import.meta.env.HIKO_POS_API_URL) {
    return import.meta.env.HIKO_POS_API_URL;
  }

  if (import.meta.env.PROD) {
    return PRODUCTION_POS_API_URL;
  }

  return DEFAULT_POS_API_URL;
}

export async function proxyPosCampaign(
  slug: string,
  path: string,
  init?: RequestInit
): Promise<Response> {
  const baseUrl = getPosApiUrl().replace(/\/$/, '');
  const url = `${baseUrl}/campaign/${encodeURIComponent(slug)}${path}`;

  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...init?.headers,
    },
  });

  const body = await response.text();
  let payload: unknown = {};

  if (body) {
    try {
      payload = JSON.parse(body);
    } catch {
      payload = { message: body };
    }
  }

  return new Response(JSON.stringify(payload), {
    status: response.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
