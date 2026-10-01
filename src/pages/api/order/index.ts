import type { APIRoute } from 'astro';
import { proxyPublicOrder } from '@/lib/posOrderProxy';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const body = await request.text();
  return proxyPublicOrder('/orders', { method: 'POST', body });
};
