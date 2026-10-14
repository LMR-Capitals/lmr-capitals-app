import { enrollmentReadiness } from "./enrollment.mjs";
export const preview =
  new URLSearchParams(window.location.search).get("preview") === "1";
export const config = {
  supabaseUrl:
    import.meta.env.VITE_SUPABASE_URL ||
    "https://agrvylclhvxyevsmmexf.supabase.co",
  supabaseKey:
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    "sb_publishable_vUhBxc3efVrs41yc9WZmAA_SnhBIrDh",
  legalApproved: import.meta.env.VITE_MEMBER_LEGAL_APPROVED === "true",
  accountPoliciesApproved: import.meta.env.VITE_ACCOUNT_POLICIES_APPROVED === "true",
  legalVersion: import.meta.env.VITE_MEMBER_LEGAL_VERSION || "",
  termsUrl: import.meta.env.VITE_MEMBER_TERMS_URL || "",
  privacyUrl: import.meta.env.VITE_MEMBER_PRIVACY_URL || "",
};
export function safeHttps(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}
const readiness = enrollmentReadiness(config);
export const accountRegistrationReady = readiness.account;
export const enrollmentReady = readiness.paid;
export function safeEmbed(value) {
  try {
    const u = new URL(value);
    if (u.protocol !== "https:") return null;
    if (
      ["www.youtube.com", "www.youtube-nocookie.com"].includes(u.hostname) &&
      /^\/embed\/[\w-]+$/.test(u.pathname)
    )
      return u.href;
    if (u.hostname === "player.vimeo.com" && /^\/video\/\d+$/.test(u.pathname))
      return u.href;
    return null;
  } catch {
    return null;
  }
}
