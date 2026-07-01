import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { SITE } from '@data/constants';

export const prerender = false;

const resend = new Resend(import.meta.env.RESEND_API_KEY);

function redirect(url: string, status = 303) {
  return new Response(null, {
    status,
    headers: { Location: url },
  });
}

export const POST: APIRoute = async ({ request, url }) => {
  const apiKey = import.meta.env.RESEND_API_KEY;
  const toEmail = import.meta.env.CONTACT_EMAIL;
  const fromEmail =
    import.meta.env.RESEND_FROM ?? `${SITE.title} <onboarding@resend.dev>`;

  if (!apiKey || !toEmail) {
    console.error('Missing RESEND_API_KEY or CONTACT_EMAIL');
    return redirect('/contact?error=config');
  }

  const formData = await request.formData();
  const honeypot = formData.get('website')?.toString().trim();

  if (honeypot) {
    return redirect('/contact?sent=1');
  }

  const name = formData.get('name')?.toString().trim();
  const email = formData.get('email')?.toString().trim();
  const phone = formData.get('phone')?.toString().trim();
  const message = formData.get('message')?.toString().trim();

  if (!name || !email || !message) {
    return redirect('/contact?error=missing');
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return redirect('/contact?error=email');
  }

  const subject = `[${SITE.title}] Tin nhắn mới từ ${name}`;
  const html = `
    <h2>Tin nhắn mới từ trang Liên hệ</h2>
    <p><strong>Họ tên:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Số điện thoại:</strong> ${escapeHtml(phone || 'Không cung cấp')}</p>
    <p><strong>Nội dung:</strong></p>
    <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
  `;

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: [toEmail],
    replyTo: email,
    subject,
    html,
  });

  if (error) {
    console.error('Resend error:', error);
    return redirect('/contact?error=send');
  }

  return redirect('/contact?sent=1');
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
