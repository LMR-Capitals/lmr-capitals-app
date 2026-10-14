import React from 'react';
import {Button} from './ui';
export default function ObservationComposer({busy, onCreate, open, onToggle}) {
  return <section className="observation-composer">
    <Button icon={open?'close':'plus'} onClick={() => onToggle(!open)}>{open?'Use a saved Journal observation':'Create an observation in both workspaces'}</Button>
    {open && <form className="form-stack spaced" onSubmit={onCreate}>
      <h2>One observation. Both workspaces.</h2><p>Save your original to the Journal, then choose whether members can see its linked copy.</p>
      <label>Observation title<input name="title" required maxLength="160" /></label>
      <label>Your observation and conditions<textarea name="body" required maxLength="12000" placeholder="Describe the context, what you observed and what would change your view." /></label>
      <label>Session<select name="session_tag"><option value="">No session</option><option>Asia</option><option>London</option><option>NY AM</option><option>NY PM</option></select></label>
      <label>Chart image (optional)<input name="image" type="file" accept="image/png,image/jpeg,image/webp" /><small>PNG, JPEG or WebP, up to 5 MB. The chart is saved with the observation in both workspaces.</small></label>
      <label>Visibility<select name="status" defaultValue="draft"><option value="draft">Save to Journal & keep Studio draft private</option><option value="published">Publish to paid members & notify them</option></select></label>
      <label className="check-label"><input type="checkbox" required /><span>I have reviewed the observation for accuracy, privacy and trading risk.</span></label>
      <Button gold type="submit" disabled={busy}>{busy?'Saving…':'Save observation to both'}</Button>
    </form>}
  </section>;
}
