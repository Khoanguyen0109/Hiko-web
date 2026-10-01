import { getPosApiUrl } from './posCampaignProxy';

function readOrderKey(): string {
  const fromProcess = process.env['HIKO_ORDER_KEY'];
  if (fromProcess) return fromProcess;
  return import.meta.env.HIKO_ORDER_KEY ?? '';
}

export function publicOrderHeaders(): Record<string, string> {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'x-hiko-order-key': readOrderKey(),
  };
}

export async function proxyPublicOrder(path: string, init?: RequestInit): Promise<Response> {
  const baseUrl = getPosApiUrl().replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/public${path}`, {
    ...init,
    headers: {
      ...publicOrderHeaders(),
      ...init?.headers,
    },
  });

  const body = await response.text();
  return new Response(body || '{}', {
    status: response.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
