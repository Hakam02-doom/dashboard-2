import {AiSignInGate} from './AiSignInGate';
import {aiFetch} from './ai-cloud';
import {aiCloud,loadCloudBusinesses,syncBusinessProfiles} from './ai-cloud';
import React, { useState,useEffect,useRef } from 'react';
import { Globe2, ArrowRight, Check, ArrowLeft, RefreshCw, Building2 } from 'lucide-react';
import { AiWorkspace } from './AiWorkspace';
import { BUSINESS_KEY,businessStorageKey, publicWebsite, validBusiness } from './ai-business';
import './ai-insights.css';

function originalProfile({onboarding,market,...profile}) { return profile; }
function readBusinesses(userId) {
  try {
    const raw = localStorage.getItem(businessStorageKey(userId));
    if (!raw) return { active: '', profiles: {}, error: '' };
    const data = JSON.parse(raw);
    if (!data || typeof data.active !== 'string' || !data.profiles || typeof data.profiles !== 'object' || !Object.values(data.profiles).every(validBusiness)) throw Error();
    return { ...data, profiles:Object.fromEntries(Object.entries(data.profiles).map(([key,value])=>[key,originalProfile(value)])), error: '' };
  } catch { return { active: '', profiles: {}, error: 'Saved business details could not be read. They have not been overwritten. Check browser storage access before saving.' }; }
}
export function AiVisibilityEntry(props) {
 return <AiSignInGate onExit={props.onExit}>{(user,switchAccount)=><AiVisibilityContent {...props} key={user.id} userId={user.id} onSwitchAccount={switchAccount}/>}</AiSignInGate>;
}
function AiVisibilityContent(props) {
  const storageKey=businessStorageKey(props.userId);
  const [initial] = useState(()=>readBusinesses(props.userId));
  const [businesses, setBusinesses] = useState(initial);
  const active = businesses.profiles[businesses.active];
  const [editing, setEditing] = useState(!active);
  const [url, setUrl] = useState(active?.url || '');
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initial.error);
  const [cloudConnection,setCloudConnection]=useState('connecting');
  const connecting=useRef(false);
  async function connectMonitoring(){
    if(connecting.current)return;
    connecting.current=true;setCloudConnection('connecting');
    try{
      const response=await aiFetch('/api/ai/connections',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'claim'}),signal:AbortSignal.timeout(65000)});
      if(!response.ok)throw Error('Monitoring storage is unavailable.');
      const result=await response.json();
      if(result.legacyOwner&&!localStorage.getItem(storageKey)){
        try{const legacy=JSON.parse(localStorage.getItem(BUSINESS_KEY)||'null');if(legacy&&typeof legacy.active==='string'&&legacy.profiles&&Object.values(legacy.profiles).every(validBusiness)){
          localStorage.setItem(storageKey,JSON.stringify(legacy));setBusinesses(legacy);if(legacy.profiles[legacy.active])setEditing(false);
        }}catch{}
      }
      setCloudConnection('ready');
      const saved=readBusinesses(props.userId);if(!saved.error)void syncBusinessProfiles(saved.profiles).catch(()=>{});
    }catch{setCloudConnection('unavailable');}
    finally{connecting.current=false;}
  }
  useEffect(()=>{void connectMonitoring();},[props.userId]);
  useEffect(()=>{if(cloudConnection!=='ready')return;let mounted=true;loadCloudBusinesses().then(rows=>{if(!mounted||!rows.length)return;setBusinesses(prev=>{const profiles={...prev.profiles};for(const row of rows)profiles[row.domain]=originalProfile(row.profile);const next={...prev,profiles,active:prev.active||rows[0].domain};try{localStorage.setItem(storageKey,JSON.stringify(next));}catch{}return next;});if(!initial.active)setEditing(false);}).catch(()=>{if(mounted)setCloudConnection('unavailable');});return()=>{mounted=false;};},[storageKey,cloudConnection]);
  const connectionNotice=cloudConnection!=='ready'&&<div className="panel aiv-cloud-notice" role={cloudConnection==='unavailable'?'alert':'status'}><div><strong>{cloudConnection==='connecting'?'Connecting monitoring…':'Monitoring is temporarily unavailable'}</strong><p>{cloudConnection==='connecting'?'Your saved business details are available while we connect.':'You are signed in. Your saved browser results remain available; live scans will resume when monitoring reconnects.'}</p></div>{cloudConnection==='unavailable'&&<button className="cs-button" type="button" onClick={connectMonitoring}>Retry connection</button>}</div>;

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
  function openSaved(domain) {
    const profile=businesses.profiles[domain];
    if (!profile) return;
    const next={...businesses,active:domain};
    try {localStorage.setItem(storageKey,JSON.stringify(next));}
    catch {setError('Could not save the selected website in this browser. Check browser storage access.');return;}
    setBusinesses(next);setUrl(profile.url);setDraft(null);setError('');setEditing(false);
  }
  async function save(event) {
    event.preventDefault();
    if (initial.error) { setError(initial.error); return; }
    const profile = { ...draft, name: draft.name.trim(), description: draft.description.trim() };
    if (!validBusiness(profile)) { setError('Add a business name and check the website.'); return; }
    const next = { active: profile.domain, profiles: { ...businesses.profiles, [profile.domain]: profile } };
    const returningToSavedBusiness = Boolean(businesses.profiles[profile.domain]);
    setBusy(true);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      await syncBusinessProfiles(next.profiles);
      if (returningToSavedBusiness) {
        setBusinesses(next);setEditing(false);setDraft(null);setError('');
        props.onToast('Saved AI Insights restored for this website.');
        return;
      }
      const response=await aiFetch('/api/ai/searchapi',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'baseline',business:profile})});
      const data=await response.json();
      setBusinesses(next);setEditing(false);setDraft(null);setError('');
      props.onToast(response.ok&&data.report?.status==='complete'?'Your competitor report is ready.':data.error||data.report?.error||'Business saved. Continue the report from AI Insights.');
    }
    catch { setBusinesses(next);setEditing(false);setDraft(null);props.onToast('Business saved. Open AI Insights to resume collection.'); }
    finally {setBusy(false);}
  }
  if (editing) return <section className="cs-page ai-onboarding">{connectionNotice}
    <div className="cs-page-intro"><div><h2>Every insight starts with your business.</h2><p>Add your website so your questions, sources, and insights share the right context.</p></div><div className="pr-top-actions">{active && <button className="cs-button" onClick={() => { setEditing(false); setDraft(null); setError(''); }} disabled={busy}><ArrowLeft size={16}/>Back to insights</button>}<button className="cs-button" onClick={()=>props.onSwitchAccount().catch(e=>props.onToast(e.message||'Could not switch accounts.'))}>Switch account</button></div></div>
    <div className="aiv-intake-layout"><div className="panel aiv-intake">
      {Object.keys(businesses.profiles).length>0&&<section className="aiv-saved-sites" aria-label="Saved websites"><h3>Your saved websites</h3><p>Open an existing report without running another scan.</p><div>{Object.values(businesses.profiles).map(profile=><button type="button" key={profile.domain} className="cs-button" aria-current={profile.domain===businesses.active?'true':undefined} onClick={()=>openSaved(profile.domain)} disabled={busy}><strong>{profile.name}</strong><span>{profile.domain}</span><ArrowRight size={15}/></button>)}</div></section>}
      <span className="aiv-symbol"><Globe2 size={27}/></span><h3>Which website would you like to understand?</h3><p>We’ll read the public page and suggest a business profile for you to review.</p>
      <form onSubmit={analyze}><label htmlFor="business-website">Business website</label><div className="aiv-url-field"><Globe2 size={19}/><input id="business-website" autoComplete="url" inputMode="url" required maxLength={2048} placeholder="yourbusiness.com" value={url} onChange={e => { setUrl(e.target.value); setDraft(null); }} disabled={busy}/></div><p className="aiv-hint">Use your business website, not a private dashboard or social login. Query strings are omitted.</p><button className="cs-button filled" disabled={busy || !url.trim()}>{busy ? <><RefreshCw size={16} className="aiv-spin"/>Reading your website…</> : <>Analyze website<ArrowRight size={16}/></>}</button><button type="button" className="ai-text-button" onClick={manual} disabled={busy}>Enter details manually</button></form>
      {busy && <p role="status">Reading the public website or indexed search snippets.</p>}
      {error && <p className="aiv-error" role="alert">{error}</p>}
      {draft && <p role="status">Website context is ready. Review the business details below.</p>}
      {draft && <form className="aiv-review" onSubmit={save}><div className="aiv-heading"><h3>Review your business</h3><span className="ai-tag">{draft.source === 'website' ? 'Website read' : draft.source === 'search-results' ? 'Search snippets' : 'Manual entry'}</span></div><p>{draft.source==='search-results'?'This site blocked automated reading. These details came from indexed search snippets, so confirm them before continuing. ':''}Check these details before continuing. Then we’ll discover competitors and collect three shared buyer questions using ChatGPT Search. This uses up to four free search credits and the capped analysis budget.</p><label>Business name<input required maxLength={100} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}/></label><label>What your business offers<textarea rows={3} maxLength={600} value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })}/></label><div className="aiv-review-source"><Check size={16}/>{draft.domain}<span>{draft.source==='search-results'?'Indexed snippets only':`${draft.headings.length} headings found`}</span></div><button className="cs-button filled" disabled={busy}>{busy?"Building your report…":"Build AI Insights"}<ArrowRight size={16}/></button></form>}
    </div><aside className="panel aiv-intake-aside"><h3>A clear path to AI visibility</h3><ol>{[['Understand your business','Review the name, website, and description we find.'],['Choose the right questions','Build a prompt library specific to your business.'],['Measure real answers','Connect a collector to track mentions, citations, and competitors.']].map(([title,copy]) => <li key={title}><Check size={17}/><div><strong>{title}</strong><p>{copy}</p></div></li>)}</ol><div className="aiv-aside-note"><Building2 size={20}/><p>Your existing dashboard content stays separate. Each website gets its own prompt library.</p></div><button className="ai-text-button" onClick={props.onSettings}>View required connections<ArrowRight size={15}/></button></aside></div>
  </section>;
  return <>{connectionNotice}<div className="aiv-business-bar"><span className="aiv-symbol"><Globe2 size={20}/></span><div><strong>{active.name}</strong><span>{active.domain} · AI visibility business</span></div><div className="aiv-business-actions"><button className="cs-button" onClick={() => { setUrl(active.url); setEditing(true); }}>Change website</button><button className="cs-button" onClick={()=>props.onSwitchAccount().catch(e=>props.onToast(e.message||'Could not switch accounts.'))}>Switch account</button></div></div><AiWorkspace {...props} key={active.domain} business={active}/></>;
}
