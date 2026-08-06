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

  let body: { phone?: string; otp?: string };

  try {
    body = (await request.json()) as { phone?: string; otp?: string };
  } catch {
    return new Response(JSON.stringify({ message: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const phone = normalizePhone(body.phone ?? '');
  const otp = String(body.otp ?? '').trim();

  if (!phone) {
    return new Response(
      JSON.stringify({ message: 'Phone number must be a 10-digit number' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!/^\d{6}$/.test(otp)) {
    return new Response(JSON.stringify({ message: 'OTP must be a 6-digit code' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return proxyPosCampaign(slug, '/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ phone, otp }),
  });
};
