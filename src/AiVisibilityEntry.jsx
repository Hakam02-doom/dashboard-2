import {aiFetch} from './ai-cloud';
import {aiCloud,loadCloudBusinesses,syncBusinessProfiles} from './ai-cloud';
import React, { useState,useEffect } from 'react';
import { Globe2, ArrowRight, Check, ArrowLeft, RefreshCw, Building2 } from 'lucide-react';
import { AiWorkspace } from './AiWorkspace';
import { BUSINESS_KEY, publicWebsite, validBusiness } from './ai-business';
import './ai-insights.css';

function readBusinesses() {
  try {
    const raw = localStorage.getItem(BUSINESS_KEY);
    if (!raw) return { active: '', profiles: {}, error: '' };
    const data = JSON.parse(raw);
    if (!data || typeof data.active !== 'string' || !data.profiles || typeof data.profiles !== 'object' || !Object.values(data.profiles).every(validBusiness)) throw Error();
    return { ...data, error: '' };
  } catch { return { active: '', profiles: {}, error: 'Saved business details could not be read. They have not been overwritten. Check browser storage access before saving.' }; }
}
export function AiVisibilityEntry(props) {
  const [initial] = useState(readBusinesses);
  const [businesses, setBusinesses] = useState(initial);
  const active = businesses.profiles[businesses.active];
  const [editing, setEditing] = useState(!active);
  const [url, setUrl] = useState(active?.url || '');
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initial.error);
  useEffect(()=>{let mounted=true;loadCloudBusinesses().then(rows=>{if(!mounted||!rows.length)return;setBusinesses(prev=>{const profiles={...prev.profiles};for(const row of rows)profiles[row.domain]=row.profile;const next={...prev,profiles,active:prev.active||rows[0].domain};try{localStorage.setItem(BUSINESS_KEY,JSON.stringify(next));}catch{}return next;});if(!initial.active)setEditing(false);}).catch(()=>{});return()=>{mounted=false;};},[]);

  async function analyze(event) {
    event.preventDefault(); setError(''); setDraft(null);
    let target; try { target = publicWebsite(url); } catch { setError('Enter a public HTTPS website, such as example.com.'); return; }
    setBusy(true);
    try {
      const response = await aiFetch('/api/ai/website', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: target.href }), signal: AbortSignal.timeout(35000) });
      const data = await response.json();
      if (!response.ok || !validBusiness(data.profile)) throw Error(data.error || 'The website returned incomplete details. Try another public page.');
      setDraft(data.profile);
    } catch (failure) { setError(failure.name === 'TimeoutError' ? 'The website took too long. Try again or enter details manually.' : failure.message.startsWith('Unexpected') ? 'The website reader is not available. Enter details manually or retry the local preview.' : failure.message); }
    finally { setBusy(false); }
  }
  function manual() {
    try { const target = publicWebsite(url); setDraft({ name: '', description: '', domain: target.hostname.replace(/^www\./, ''), url: target.href, headings: [], schemaTypes: [], source: 'manual', analyzedAt: null }); setError(''); }
    catch { setError('Enter the business website before adding details manually.'); }
  }
  async function save(event) {
    event.preventDefault();
    if (initial.error) { setError(initial.error); return; }
    const profile = { ...draft, name: draft.name.trim(), description: draft.description.trim() };
    if (!validBusiness(profile)) { setError('Add a business name and check the website.'); return; }
    const next = { active: profile.domain, profiles: { ...businesses.profiles, [profile.domain]: profile } };
    setBusy(true);
    try {
      localStorage.setItem(BUSINESS_KEY, JSON.stringify(next));
      await syncBusinessProfiles(next.profiles);
      const response=await aiFetch('/api/ai/searchapi',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'baseline',business:profile})});
      const data=await response.json();
      setBusinesses(next);setEditing(false);setDraft(null);setError('');
      props.onToast(response.ok&&data.report?.status==='complete'?'Your competitor report is ready.':data.error||data.report?.error||'Business saved. Continue the report from AI Insights.');
    }
    catch { setBusinesses(next);setEditing(false);setDraft(null);props.onToast('Business saved. Open AI Insights to resume collection.'); }
    finally {setBusy(false);}
  }
  if (editing) return <section className="cs-page ai-onboarding">
    <div className="cs-page-intro"><div><h2>Every insight starts with your business.</h2><p>Add your website so your questions, sources, and insights share the right context.</p></div>{active && <button className="cs-button" onClick={() => { setEditing(false); setDraft(null); setError(''); }} disabled={busy}><ArrowLeft size={16}/>Back to insights</button>}</div>
    <div className="aiv-intake-layout"><div className="panel aiv-intake">
      <span className="aiv-symbol"><Globe2 size={27}/></span><h3>Which website would you like to understand?</h3><p>We’ll read the public page and suggest a business profile for you to review.</p>
      <form onSubmit={analyze}><label htmlFor="business-website">Business website</label><div className="aiv-url-field"><Globe2 size={19}/><input id="business-website" autoComplete="url" inputMode="url" required maxLength={2048} placeholder="yourbusiness.com" value={url} onChange={e => { setUrl(e.target.value); setDraft(null); }} disabled={busy}/></div><p className="aiv-hint">Use your business website, not a private dashboard or social login. Query strings are omitted.</p><button className="cs-button filled" disabled={busy || !url.trim()}>{busy ? <><RefreshCw size={16} className="aiv-spin"/>Reading your website…</> : <>Analyze website<ArrowRight size={16}/></>}</button><button type="button" className="ai-text-button" onClick={manual} disabled={busy}>Enter details manually</button></form>
      {busy && <p role="status">Reading the page title, description, headings, and structured business information.</p>}
      {error && <p className="aiv-error" role="alert">{error}</p>}
      {draft && <p role="status">Website context is ready. Review the business details below.</p>}
      {draft && <form className="aiv-review" onSubmit={save}><div className="aiv-heading"><h3>Review your business</h3><span className="ai-tag">{draft.source === 'website' ? 'Website read' : 'Manual entry'}</span></div><p>Check these details before continuing. Then we’ll discover competitors and collect three shared buyer questions using ChatGPT Search. This uses up to four free search credits and the capped analysis budget.</p><label>Business name<input required maxLength={100} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}/></label><label>What your business offers<textarea rows={3} maxLength={600} value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })}/></label><div className="aiv-review-source"><Check size={16}/>{draft.domain}<span>{draft.headings.length} headings found</span></div><button className="cs-button filled" disabled={busy}>{busy?"Building your report…":"Build AI Insights"}<ArrowRight size={16}/></button></form>}
    </div><aside className="panel aiv-intake-aside"><h3>A clear path to AI visibility</h3><ol>{[['Understand your business','Review the name, website, and description we find.'],['Choose the right questions','Build a prompt library specific to your business.'],['Measure real answers','Connect a collector to track mentions, citations, and competitors.']].map(([title,copy]) => <li key={title}><Check size={17}/><div><strong>{title}</strong><p>{copy}</p></div></li>)}</ol><div className="aiv-aside-note"><Building2 size={20}/><p>Your existing dashboard content stays separate. Each website gets its own prompt library.</p></div><button className="ai-text-button" onClick={props.onSettings}>View required connections<ArrowRight size={15}/></button></aside></div>
  </section>;
  return <><div className="aiv-business-bar"><span className="aiv-symbol"><Globe2 size={20}/></span><div><strong>{active.name}</strong><span>{active.domain} · AI visibility business</span></div><button className="cs-button" onClick={() => { setUrl(active.url); setEditing(true); }}>Change website</button></div><AiWorkspace {...props} key={active.domain} business={active}/></>;
}
