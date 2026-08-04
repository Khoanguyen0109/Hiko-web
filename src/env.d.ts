/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly HIKO_POS_API_URL?: string;
  readonly RESEND_API_KEY?: string;
  readonly CONTACT_EMAIL?: string;
  readonly RESEND_FROM?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
