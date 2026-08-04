import type { APIRoute } from 'astro';
import { proxyPosCampaign } from '@/lib/posCampaignProxy';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug;

  if (!slug) {
    return new Response(JSON.stringify({ message: 'Campaign slug is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return proxyPosCampaign(slug, '/public', { method: 'GET' });
};
