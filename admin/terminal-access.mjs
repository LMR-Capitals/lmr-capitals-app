// Email is displayed for identity; authorization comes from the server registry.
export async function verifyTerminalAccess(client) {
  const identity = await client.auth.getUser();
  if (identity.error?.name === "AuthSessionMissingError")
    return { stage: "signin", user: null };
  if (identity.error) throw identity.error;
  const user = identity.data?.user;
  if (!user) return { stage: "signin", user: null };
  const registry = await client.rpc("is_admin");
  if (registry.error) throw registry.error;
  if (registry.data !== true) return { stage: "denied", user };
  const assurance = await client.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance.error) throw assurance.error;
  return {
    stage: assurance.data?.currentLevel === "aal2" ? "ready" : "verify",
    user,
  };
}
