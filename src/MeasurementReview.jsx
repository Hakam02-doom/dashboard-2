import {aiFetch} from './ai-cloud';
import React,{useRef,useEffect,useState} from 'react';
import {X} from 'lucide-react';
import {measurementQuality} from './measurement-quality';
export function MeasurementReview({rows,business,profile,names,onSave,onClose}){
 const ref=useRef(null),[aliases,setAliases]=useState(profile?.aliases||{}),[confirmed,setConfirmed]=useState(false),[saving,setSaving]=useState(false),[notice,setNotice]=useState('');
 useEffect(()=>{ref.current?.showModal();},[]);
 const q=measurementQuality(rows,business),pct=n=>n==null?'Not assessed':`${n.toFixed(1)}%`;
 async function save(e){e.preventDefault();setSaving(true);setNotice('');try{await onSave({reviewed:confirmed,aliases});setNotice('Identity review saved. It applies to future collections; historical evidence is preserved.');}catch(e){setNotice(e.message);}finally{setSaving(false);}}
 return <dialog ref={ref} className="aiv-tracking-dialog measurement-review" aria-labelledby="measurement-title" onCancel={onClose}>
 <header><div><h2 id="measurement-title">Measurement quality</h2><p>{business.name} · Current report filters</p></div><button className="cs-button" onClick={onClose} aria-label="Close measurement quality"><X size={18}/></button></header>
 <p>{q.total} distinct observations · {q.prompts} questions · {q.days} collection {q.days===1?'day':'days'} · {q.paired} answers with shared competitor coverage.</p>
 <div className="ai-table-scroll"><table><thead><tr><th>Engine</th><th>Answers</th><th>Questions</th><th>Days</th></tr></thead><tbody>{q.engines.map(e=><tr key={e.name}><td>{e.name}</td><td>{e.answers}</td><td>{e.prompts}</td><td>{e.days}</td></tr>)}</tbody></table></div>
 <h3>What this sample tells us</h3><ul>{q.warnings.map(w=><li key={w}>{w}</li>)}</ul>
 <p>Recommendation rate: <strong>{pct(q.recommendationRate)}</strong> ({q.recommendationAssessed} assessed answers). Citation rate: <strong>{pct(q.citationRate)}</strong>. Recommendations require supporting answer evidence; older unassessed answers are excluded.</p>
 {q.mentionInterval&&<p>Indicative 95% mention-rate interval: {pct(q.mentionInterval[0])}–{pct(q.mentionInterval[1])}. This assumes independent observations; repeated or similar prompts can make it too narrow. It does not measure all AI conversations or correct question-selection bias.</p>}
 <h3>Head-to-head mentions</h3><div className="ai-table-scroll" tabIndex={0} aria-label="Head-to-head comparison"><table><thead><tr><th>Competitor</th><th>You only</th><th>Competitor only</th><th>Both</th><th>Neither</th><th>Answers</th></tr></thead><tbody>{q.headToHead.map(b=><tr key={b.name}><td>{b.name}</td><td>{b.ownOnly}</td><td>{b.competitorOnly}</td><td>{b.both}</td><td>{b.neither}</td><td>{b.total}</td></tr>)}</tbody></table></div>
 <details><summary>Review business identities</summary><p>Confirm direct competitors and add distinctive aliases (comma-separated). Avoid generic words. Names stay separate from website citations. Change the competitor list in Manage tracking.</p><form onSubmit={save}>{names.map(name=><label className="measurement-alias" key={name}>{name}<input maxLength={485} value={(aliases[name]||[]).join(',')} onChange={e=>setAliases({...aliases,[name]:e.target.value.split(',')})} placeholder="Alternative brand or product names"/></label>)}<label className="measurement-confirm"><input type="checkbox" required checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>I reviewed these business identities and competitors.</label><button className="cs-button filled" disabled={saving||!confirmed}>{saving?'Saving…':'Save identity review'}</button><p role="status">{notice}</p></form></details>
 <p>Use Research to review, edit and activate buyer questions. Repeat the same set on later days. Model, market and language coverage must match before comparing results.</p>
 </dialog>;
}
