// Preserved dots variant, available for reuse or restoring the previous design.
import React from 'react';
import { Instagram, Facebook, Linkedin, MessageCircle } from 'lucide-react';
import { socialDotScale } from './social-dot-scale';
import './social-workspace.css';
const platforms=['Instagram','Facebook','LinkedIn','X'];
const icons=[Instagram,Facebook,Linkedin,MessageCircle];
export function SocialDotsOverview({topicCount,channelCounts,platform,onSelect}) {
 const outputCount=channelCounts.reduce((sum,count)=>sum+count,0);
 const dotScale=socialDotScale(topicCount,0);
 return ( <section className="panel sw-output-overview" aria-label="Social content overview">
  <div className="sw-output-count"><strong>{topicCount}</strong><span>Topic ideas</span></div>
  <div className="sw-output-count"><strong>{outputCount}</strong><span>Sample outputs</span></div>
  <div className="sw-channel-dots">{platforms.map((p,i)=>{const Icon=icons[i];return <button key={p} className={`sw-dot-channel sw-flow-color-${i}`} aria-pressed={platform===p} aria-label={`${p}, ${channelCounts[i]} sample outputs across ${topicCount} topics. Preview channel`} onClick={()=>onSelect(p,i)}><span className="sw-dot-label"><Icon size={16}/>{p}<strong>{channelCounts[i]}</strong></span><span className="sw-dot-track" aria-hidden="true">{socialDotScale(topicCount,channelCounts[i]).fills.map((fill,n)=><i key={n}><b style={{width:`${fill*100}%`}}/></i>)}</span></button>})}<p>{topicCount===0?'Add a topic to start your channel overview.':dotScale.unit===1?'Each dot = 1 topic · Filled dots = sample outputs':`Each dot groups up to ${dotScale.unit} topics · Fill shows sample outputs`} · New ideas remain drafts</p></div>
 </section>);
}
