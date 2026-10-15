// Never rely on Supabase's default sign-out scope (global).
export async function signOutSession(client, scope = 'local') {
  if (!['local', 'global'].includes(scope)) throw new Error('Choose a valid sign-out option.');
  const { error } = await client.auth.signOut({ scope });
  if (error) throw error;
}

export const allDevicesConfirmation = 'Sign out all devices? You will need to sign in again on this browser and your other devices. Other devices finish signing out when their current access expires.';
