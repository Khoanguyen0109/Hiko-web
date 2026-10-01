import type { APIRoute } from 'astro';
import { proxyPublicOrder } from '@/lib/posOrderProxy';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const storeId = url.searchParams.get('storeId') || '';
  if (!storeId) {
    return new Response(JSON.stringify({ message: 'Cửa hàng không hợp lệ' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return proxyPublicOrder(`/stores/${encodeURIComponent(storeId)}/menu`, { method: 'GET' });
};
