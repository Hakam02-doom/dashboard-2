import React, {useState} from 'react';
import { publicDomain } from './brand-domains';
const logos={
 'semrush':'semrush.png',ahrefs:'ahrefs.png',hubspot:'hubspot.png',buffer:'buffer.png',
 'search atlas':'search-atlas.ico','uplift ai':'uplift-ai.png',conductor:'conductor.png',outrank:'outrank.png',morningscore:'morningscore.png',
};
export function BrandLogo({name,domain}){
 const [failed,setFailed]=useState('');
 const host=publicDomain(domain||'');
 const file=logos[name.trim().toLowerCase()];
 const src=host?`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`:file?`/brands/${file}`:'';
 return <span className="avr-brand-logo" aria-hidden="true">{src&&failed!==src?<img key={src} src={src} referrerPolicy="no-referrer" alt="" width="24" height="24" onError={()=>setFailed(src)}/>:<span>{name.trim().slice(0,2).toUpperCase()}</span>}</span>;
}
