import { policyDraftVersion } from "./guidelines.mjs";
// This acknowledgement is informational, never an access or role claim.
export function registrationDetails(form, legalVersion, now = new Date()) {
  const password = String(form.get("password") || "");
  if (password.length < 12) throw new Error("Use a password with at least 12 characters.");
  if (password !== String(form.get("confirm_password") || "")) throw new Error("Your passwords do not match. Please check both fields.");
  if (form.get("account_terms") !== "on" || form.get("risk_acknowledgement") !== "on") throw new Error("Confirm your age, account terms and trading risk acknowledgement before continuing.");
  if (!legalVersion || legalVersion === policyDraftVersion) throw new Error("Account policies are still awaiting approval.");
  return {
    email: String(form.get("email") || "").trim(), password,
    data: { display_name: String(form.get("name") || "").trim(), legal_version: legalVersion, legal_accepted_at: now.toISOString(), risk_acknowledged: true },
  };
}
export function authEmailReturn(origin) {
  // Keep the existing, allowlisted confirmation path; don't carry a requested role.
  return new URL("/member/index.html", origin).href;
}
export function onboardingKey(userId) {
  return `lmr:onboarding-dismissed:${userId}`;
}
export function enrollmentReadiness(config) {
  let policiesReady = false;
  try {
    policiesReady = !!config.legalVersion && config.legalVersion !== policyDraftVersion &&
      new URL(config.termsUrl).protocol === "https:" && new URL(config.privacyUrl).protocol === "https:";
  } catch { /* Missing policy URLs keep enrollment closed. */ }
  return {
    account: policiesReady && (config.accountPoliciesApproved === true || config.legalApproved === true),
    paid: policiesReady && config.legalApproved === true,
  };
}
