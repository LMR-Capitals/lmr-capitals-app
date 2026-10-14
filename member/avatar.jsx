import React, { useEffect, useState } from 'react';
export default function Avatar({src, initials = 'M', bare = false}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const content = src && !failed ? <img src={src} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} /> : initials;
  return bare ? content : <span className="avatar">{content}</span>;
}
