import React, { useState } from 'react';
import { brandLogoSources } from './brand-logo-sources.js';

export function BrandLogo({ name, domain }) {
  const [failed, setFailed] = useState([]);
  const src = brandLogoSources(name, domain).find(url => !failed.includes(url));
  return <span className="avr-brand-logo" aria-hidden="true">
    {src ? <img key={src} src={src} referrerPolicy="no-referrer" alt="" width="24" height="24"
      onError={() => setFailed(previous => [...previous, src])} />
      : <span>{name.trim().slice(0, 2).toUpperCase()}</span>}
  </span>;
}
