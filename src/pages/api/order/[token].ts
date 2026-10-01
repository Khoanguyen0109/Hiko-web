import type { APIRoute } from 'astro';
import { proxyPublicOrder } from '@/lib/posOrderProxy';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const token = params.token || '';
  if (!token) {
    return new Response(JSON.stringify({ message: 'Không tìm thấy đơn' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return proxyPublicOrder(`/orders/${encodeURIComponent(token)}`, { method: 'GET' });
};
