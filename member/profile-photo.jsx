import React, {useEffect, useRef, useState} from 'react';
import Avatar from './avatar';
import {avatarSource, providerPhoto} from './profile-photo.mjs';
export default function ProfilePhotoEditor({profile, user, busy}) {
  const [mode, setMode] = useState(profile.avatar_mode || 'provider');
  const [local, setLocal] = useState(null);
  const [error, setError] = useState('');
  const input = useRef(null);
  useEffect(() => () => { if (local) URL.revokeObjectURL(local); }, [local]);
  const choose = next => { setMode(next); setLocal(null); setError(''); if(input.current) input.current.value = ''; };
  const photo = local || avatarSource({...profile, avatar_mode:mode}, user);
  const name = profile.display_name || user.user_metadata?.full_name || user.email || 'Member';
  return <div className="profile-photo-editor">
    <div className="profile-photo-preview"><Avatar src={photo} initials={name.slice(0,1).toUpperCase()} />
      <div><strong>Profile photo</strong><p>Your Google photo stays with your account when available. Choose a photo to make this space your own.</p></div>
    </div>
    <input type="hidden" name="avatar_mode" value={mode} />
    <label className="photo-file-label">Change photo
      <input ref={input} name="avatar" type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={event => {
        const file = event.target.files?.[0]; if(!file) return;
        if(!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 5*1024*1024) {
          setError('Choose a PNG, JPEG or WebP photo under 5 MB.'); event.target.value=''; return;
        }
        setError(''); setMode('custom'); setLocal(URL.createObjectURL(file));
      }} />
    </label>
    <div className="photo-options">
      {providerPhoto(user) && <button type="button" disabled={busy} onClick={() => choose('provider')}>Use Google photo</button>}
      <button type="button" disabled={busy} onClick={() => choose('initials')}>Use initials</button>
    </div>
    <p className="form-help">PNG, JPEG or WebP, up to 5 MB. Save your profile to apply changes.</p>
    {error && <p role="alert" className="error">{error}</p>}
  </div>;
}
