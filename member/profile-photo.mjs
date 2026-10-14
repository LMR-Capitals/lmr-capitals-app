// Appearance only. Provider metadata is never used to decide workspace access.
export function safePhotoUrl(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return ((url.protocol === 'https:' && !url.username && !url.password) || url.protocol === 'blob:') ? url.href : null;
  } catch { return null; }
}
export function providerPhoto(user) {
  return safePhotoUrl(user?.user_metadata?.avatar_url) || safePhotoUrl(user?.user_metadata?.picture);
}
export function avatarSource(profile, user) {
  if (profile?.avatar_mode === 'initials') return null;
  if (profile?.avatar_mode === 'custom') return safePhotoUrl(profile.avatar_url);
  return providerPhoto(user);
}
