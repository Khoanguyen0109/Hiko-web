import type { APIRoute } from 'astro';
import { proxyPublicOrder } from '@/lib/posOrderProxy';

export const prerender = false;

export const GET: APIRoute = async () => proxyPublicOrder('/stores', { method: 'GET' });
