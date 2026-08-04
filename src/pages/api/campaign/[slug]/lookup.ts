import type { APIRoute } from 'astro';
import { proxyPosCampaign } from '@/lib/posCampaignProxy';
import { normalizePhone } from '@/lib/spinUtils';

export const prerender = false;

export const POST: APIRoute = async ({ params, request }) => {
  const slug = params.slug;

  if (!slug) {
    return new Response(JSON.stringify({ message: 'Campaign slug is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { phone?: string };

  try {
    body = (await request.json()) as { phone?: string };
  } catch {
    return new Response(JSON.stringify({ message: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const phone = normalizePhone(body.phone ?? '');

  if (!phone) {
    return new Response(
      JSON.stringify({ message: 'Phone number must be a 10-digit number' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return proxyPosCampaign(slug, '/lookup', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
};
