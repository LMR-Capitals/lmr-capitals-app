import { studioSections } from "./studio-model.mjs";
// Administrator identity takes precedence over subscription status.
export function workspaceRole(access) {
  if (!access) return null;
  if (access.admin === true) return "administrator";
  return access.paid === true && access.entitled === true ? "paid" : "free";
}
export const administratorRoutes = ["admin-hub", "admin", "application", "profile", "settings", "notifications", ...studioSections.map(section => section.route)];
export function administratorEntry(access, route) {
  if (workspaceRole(access) !== "administrator") return null;
  if (!access.adminVerified) return "/admin?next=circle";
  if (!administratorRoutes.includes(route)) return "/inner-circle#admin";
  return null;
}
export async function resolveWorkspaceAccess(client, user) {
  const identity = await client.auth.getUser();
  if (identity.error) throw identity.error;
  if (!identity.data?.user || identity.data.user.id !== user?.id) throw new Error("Sign in again to verify your account.");
  const registry = await client.rpc("is_admin");
  if (registry.error) throw registry.error;
  if (registry.data === true) {
    const assurance = await client.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assurance.error) throw assurance.error;
    const verified = assurance.data?.currentLevel === "aal2";
    return { admin: true, adminVerified: verified, entitled: verified, paid: false, subscription: null };
  }
  const [entitled, paid, subscription] = await Promise.all([
    client.rpc("circle_can_access"), client.rpc("circle_is_paid"),
    client.from("subscriptions").select("status,current_period_end,cancel_at_period_end,price_id").eq("user_id", user.id).maybeSingle(),
  ]);
  for (const result of [entitled, paid, subscription]) if (result.error) throw result.error;
  return { admin: false, adminVerified: false, entitled: entitled.data === true && paid.data === true, paid: paid.data === true, subscription: subscription.data };
}
