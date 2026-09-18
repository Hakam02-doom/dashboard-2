import React, { useEffect, useRef, useState } from "react";
import { FileText, ShieldCheck, ChartNoAxesCombined, Link2, Search, Plus, ArrowDownToLine, ArrowUpDown, ArrowUpRight, X, Check, CircleCheck, Clock3, Sparkles, Globe2, MousePointer2, Eye, Target, TrendingUp } from "lucide-react";
import "./seo-workspace.css";
import { Stat } from "./ContentSections";
import { BacklinkPreview, OpportunityPreview } from "./SeoDiscovery";

const tabs = [["Content Library", FileText], ["SEO Audit", ShieldCheck], ["Search Console", ChartNoAxesCombined], ["Backlink Monitor", Link2], ["Opportunity Finder", Search]];
const statuses = ["All", "Published", "In review", "Scheduled", "Draft"];
const categories = ["AI visibility", "SEO fundamentals", "Content strategy", "Technical SEO", "Local SEO", "Social media", "Product guides"];
const storageKey = "uplift-dashboard-2-seo-articles";
const seed = [
  ["A practical guide to AI search visibility", "AI visibility", "Published", 96, 8],
  ["Build an SEO content calendar that keeps moving", "Content strategy", "Published", 94, 6],
  ["What makes a brand worth citing in ChatGPT?", "AI visibility", "In review", 92, 7],
  ["Your technical SEO audit checklist", "Technical SEO", "Published", 98, 9],
  ["Keyword research for small business growth", "SEO fundamentals", "Published", 95, 6],
  ["Turn one idea into a week of social content", "Social media", "In review", 91, 5],
  ["Google Business Profile optimization, step by step", "Local SEO", "Draft", 88, 8],
  ["How internal linking connects your content", "Technical SEO", "Published", 96, 6],
  ["Measure your share of voice in AI search", "AI visibility", "Scheduled", 93, 7],
  ["From keyword to published article with Uplift AI", "Product guides", "Scheduled", 97, 5],
  ["Find the content gaps your competitors miss", "Content strategy", "Draft", 86, 7],
  ["SEO and GEO: building a connected strategy", "AI visibility", "Published", 95, 8],
].map(([title, category, status, score, minutes], id) => ({ id, title, category, status, score, minutes, date: `2026-09-${14 + id}`, body: "" }));
const auditAreas = [["Technical SEO",94],["Structured data",100],["Local & GEO",100],["Sitemap",100],["International SEO",100],["Content & on-page",86],["Action plan",97]];
const checks = [
  ["Missing meta descriptions","Content & on-page","Warning","Write a unique summary for each priority page."],
  ["Heading hierarchy","Content & on-page","Warning","Use one clear H1 and descriptive subheadings."],
  ["Internal link coverage","Technical SEO","Warning","Connect related articles with useful anchor text."],
  ["HTTPS enabled","Technical SEO","Passed","No action required in this example."],
  ["XML sitemap","Sitemap","Passed","Keep published URLs current."],
  ["Organization schema","Structured data","Passed","Review business identity and website details."],
];
const queries = [["AI SEO automation","1,900","860"],["AI search visibility","1,300","745"],["generative engine optimization","2,400","620"],["automated content publishing","720","510"],["Google Business Profile SEO","880","420"]];
const pages = [["/blog/ai-search-visibility","1,840","24,500","7.5%"],["/blog/seo-content-calendar","1,320","18,200","7.3%"],["/blog/technical-seo-checklist","980","16,100","6.1%"],["/","850","14,300","5.9%"]];
const sampleBody = title => `${title}\n\nA strong content workflow starts with a useful question. Understand what your audience needs, create a clear answer, and make it easy to discover.\n\nStart with your audience\nReview the search intent behind your target topic. Look for the decisions people are trying to make and the details that would help them move forward.\n\nBuild a repeatable workflow\nBring keyword research, editorial review, and publishing into one plan. Use Uplift AI to organize the work, then verify the final details before publication.\n\nMeasure and improve\nTrack search performance and AI visibility over time. Use what you learn to refresh content and choose your next topics.`;

function Metrics({ rows }) {
  return <div className="cs-stats">{rows.map(([label,value,description,Icon], i) => <Stat key={label} label={label} value={value} description={description} icon={Icon} color={["purple","green","blue","gold"][i]} values={value === "—" || value === 0 ? [] : [3,5,4,7,6,8,10]} />)}</div>;
}
function Badge({ children }) { return <span className={`seo-badge seo-${String(children).toLowerCase().replaceAll(" ","-")}`}><i/>{children}</span>; }
function Intro({ title, description, children }) { return <div className="cs-page-intro"><div><h2>{title}</h2><p>{description}</p></div>{children}</div>; }
function DataTable({ headings, children }) { return <div className="seo-table-scroll" tabIndex={0} aria-label="Scrollable data table"><table className="seo-table"><thead><tr>{headings.map(h=><th scope="col" key={h}>{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div>; }
function Modal({ title, onClose, children }) {
  const ref = useRef(null);
  useEffect(()=>{ const dialog=ref.current; dialog.showModal(); return ()=>dialog.close(); },[]);
  return <dialog className="seo-dialog" ref={ref} aria-labelledby="seo-dialog-title" onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose();}}><div className="seo-dialog-inner"><div className="seo-card-heading"><h2 id="seo-dialog-title">{title}</h2><button type="button" className="cs-icon-button" aria-label="Close dialog" onClick={onClose}><X size={20}/></button></div>{children}</div></dialog>;
}
function ArticleEditor({ article, onClose, onSave }) {
  const [title,setTitle]=useState(article?.title||"");
  const [category,setCategory]=useState(article?.category||categories[0]);
  const [body,setBody]=useState(article ? article.body || sampleBody(article.title) : "");
  const [status,setStatus]=useState(article?.status||"Draft");
  return <Modal title={article ? "Edit article" : "Create content"} onClose={onClose}><p className="seo-muted">{article ? "Edit this preview article. Changes stay on this device." : "Start a draft and shape your next article."}</p>{article&&<div className="seo-editor-meta"><Badge>{article.status}</Badge><span>{article.minutes} min read</span><span>SEO score {article.score}/100</span></div>}<form onSubmit={e=>{e.preventDefault();if(title.trim())onSave({title:title.trim(),category,body,status});}}><label>Title<input autoFocus required maxLength={160} value={title} onChange={e=>setTitle(e.target.value)}/></label>{!article&&<label>Category<select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></label>}{article&&<><label>Content<textarea rows={12} value={body} onChange={e=>setBody(e.target.value)}/></label><label>Review status<select value={status} onChange={e=>setStatus(e.target.value)}>{statuses.slice(1).map(s=><option key={s}>{s}</option>)}</select></label></>}<p className="seo-muted">This does not publish to your website.</p><div className="seo-dialog-actions"><button type="button" className="cs-button" onClick={onClose}>Cancel</button><button className="cs-button filled">{article ? "Save draft changes" : "Create draft"}</button></div></form></Modal>;
}

export function SeoWorkspace({ onToast, onConnections, library }) {
  const [active,setActive]=useState(0), [filter,setFilter]=useState("All"), [search,setSearch]=useState(""), [newest,setNewest]=useState(true), [report,setReport]=useState(false), [modal,setModal]=useState(null);
  const tabRefs=useRef([]);
  const [articles,setArticles]=useState(()=>{try{const saved=JSON.parse(localStorage.getItem(storageKey));return Array.isArray(saved)&&saved.length&&saved.every(a=>typeof a.title==="string"&&typeof a.category==="string"&&Number.isFinite(a.id)&&Number.isFinite(a.score)&&statuses.includes(a.status))?saved:seed;}catch{return seed;}});
  function saveArticle(fields) {
    const editing=modal.article;
    const next=editing?articles.map(a=>a.id===editing.id?{...a,...fields}:a):[...articles,{...fields,id:Math.max(...articles.map(a=>a.id),-1)+1,score:0,minutes:0,date:new Date().toLocaleDateString("en-CA")}];
    setArticles(next); setModal(null);
    try { localStorage.setItem(storageKey,JSON.stringify(next));onToast(editing?"Preview article saved. Nothing was published.":"Draft created and saved on this device."); } catch { onToast("Changes are available this session, but device storage is unavailable."); }
  }
  function exportArticles() {
    const cell=v=>'"'+(/^[=+@\-\t\r]/.test(String(v))?"'":"")+String(v).replaceAll('"','""')+'"';
    const csv=[["Title","Category","Status","SEO score"],...articles.map(a=>[a.title,a.category,a.status,a.score])].map(row=>row.map(cell).join(",")).join("\r\n");
    const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"})); const link=document.createElement("a");link.href=url;link.download="uplift-seo-content.csv";link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);onToast(`${articles.length} articles exported.`);
  }
  const visible=articles.filter(a=>(filter==="All"||a.status===filter)&&`${a.title} ${a.category}`.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>newest?b.id-a.id:a.id-b.id);
  return <section className={active === 0 && library ? "seo-library-shell" : "cs-page seo-workspace"}>
    <div className="seo-navigation" role="tablist" aria-label="Content and SEO sections">{tabs.map(([label,Icon],i)=><button key={label} ref={el=>tabRefs.current[i]=el} id={`seo-tab-${i}`} role="tab" aria-selected={active===i} aria-controls="seo-tab-panel" tabIndex={active===i?0:-1} onClick={()=>setActive(i)} onKeyDown={e=>{let n;if(e.key==="ArrowRight")n=(i+1)%tabs.length;if(e.key==="ArrowLeft")n=(i+tabs.length-1)%tabs.length;if(e.key==="Home")n=0;if(e.key==="End")n=tabs.length-1;if(n!==undefined){e.preventDefault();setActive(n);tabRefs.current[n].focus();}}}><Icon size={17}/><span>{label}</span></button>)}</div>
    {active !== 0 && <div className="seo-preview-label"><span/>Preview data · September 2026</div>}
    <div role="tabpanel" id="seo-tab-panel" aria-labelledby={`seo-tab-${active}`}>
    {active===0 && library}
    {active===0&&!library&&<>
      <Intro title="Review, approve, and publish SEO content." description="Keep article quality, freshness, and publishing readiness in view."><button className="cs-button filled" onClick={()=>setModal({type:"article"})}><Plus size={16}/>Create content</button></Intro>
      <Metrics rows={[["Articles",articles.length,"Generated + managed content",FileText],["Published",articles.filter(a=>a.status==="Published").length,"Across your website",CircleCheck],["Average SEO score",Math.round(articles.reduce((n,a)=>n+a.score,0)/articles.length),"Out of 100",TrendingUp],["Waiting for review",articles.filter(a=>a.status==="In review").length,"Your next decisions",Clock3]]}/>
      <section className="panel seo-library-panel"><div className="seo-library-toolbar"><div className="seo-filters" role="group" aria-label="Filter by status">{statuses.map(s=><button key={s} aria-pressed={filter===s} onClick={()=>setFilter(s)}>{s}<span>{s==="All"?articles.length:articles.filter(a=>a.status===s).length}</span></button>)}</div><div className="seo-tools"><label className="seo-search"><Search size={17}/><input aria-label="Filter articles" placeholder="Find an article…" value={search} onChange={e=>setSearch(e.target.value)}/></label><button className="cs-button" onClick={()=>setNewest(!newest)}><ArrowUpDown size={15}/>{newest?"Newest first":"Oldest first"}</button><button className="cs-button" onClick={exportArticles}><ArrowDownToLine size={15}/>Export</button></div></div>
      <DataTable headings={["Title","Status","Reading time","SEO score","Updated"]}>{visible.map(a=><tr key={a.id}><td><button className="seo-article-title" onClick={()=>setModal({type:"article",article:a})}><span className="seo-file-icon"><FileText size={19}/></span><span>{a.title}<small>{a.category}</small></span></button></td><td><Badge>{a.status}</Badge></td><td className="seo-muted">{a.minutes} min</td><td><span className="seo-score">{a.score}<small>/100</small></span></td><td className="seo-muted">{new Date(`${a.date}T12:00:00`).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</td></tr>)}</DataTable>
      {!visible.length&&<div className="seo-empty"><Search size={28}/><h3>No matching articles</h3><p>Try another title or choose a different status.</p><button className="cs-button" onClick={()=>{setSearch("");setFilter("All");}}>Reset filters</button></div>}<div className="seo-table-footer">{visible.length} of {articles.length} articles<span>Changes stay on this device</span></div></section>
    </>}
    {active===1&&<>
      <Intro title="Know what’s holding your website back." description="Technical health, content quality, and a practical action plan."><button className="cs-button" onClick={()=>setModal({type:"audit"})}><ShieldCheck size={16}/>Audit details</button></Intro>
      <Metrics rows={[["SEO health","97/100","Illustrative audit result",ShieldCheck],["Warnings",54,"Areas to improve",Eye],["Checks passed",206,"Strong foundations",CircleCheck],["Information",20,"Useful observations",Sparkles]]}/>
      <div className="seo-report-tabs" role="group" aria-label="Audit view"><button aria-pressed={!report} onClick={()=>setReport(false)}>Overview</button><button aria-pressed={report} onClick={()=>setReport(true)}>Full report <span>54 issues</span></button></div>
      {report?<section className="panel seo-report"><div className="seo-card-heading"><h3>Audit findings</h3><span className="seo-muted">6 illustrative checks</span></div><DataTable headings={["Check","Area","Result","Recommended action"]}>{checks.map(([check,area,result,action])=><tr key={check}><td>{check}</td><td className="seo-muted">{area}</td><td><Badge>{result}</Badge></td><td>{action}</td></tr>)}</DataTable></section>:<div className="seo-audit-grid"><section className="panel seo-card"><div className="seo-card-heading"><h3>Audit health</h3><Badge>Completed</Badge></div><div className="seo-health-summary"><div className="seo-ring"><strong>97<small>/100</small></strong></div><div><h3>Excellent foundation</h3><p className="seo-muted">A preview of the areas that deserve a closer look.</p></div></div><div className="seo-audit-bars">{auditAreas.map(([name,score])=><div key={name}><div><span>{name}</span><strong>{score}<small>/100</small></strong></div><progress max={100} value={score} aria-label={`${name}: ${score} out of 100`}/></div>)}</div></section><section className="panel seo-card"><h3>Your next improvements</h3><div className="seo-improvements">{[["Strengthen content & on-page signals","Review missing descriptions, heading structure, and content depth.","Priority",()=>setActive(0)],["Keep your technical foundation healthy","Review crawlability, canonicals, and indexability.","Review",()=>setReport(true)],["Make your expertise easy to understand","Add author context and structured data.","Recommended",()=>setModal({type:"author"})]].map(([title,desc,badge,action])=><button key={title} onClick={action}><span><Badge>{badge}</Badge><strong>{title}</strong><p>{desc}</p></span><ArrowUpRight size={19}/></button>)}</div><p className="seo-notice">This is an illustrative audit. Connect upliftai.co to run a real website assessment.</p></section></div>}
    </>}
    {active===2&&<>
      <Intro title="Understand your search performance." description="Clicks, impressions, queries, and the pages people discover in search."/>
      <Metrics rows={[["Total clicks","8,500","Illustrative · September",MousePointer2],["Impressions","126,400","Across search results",Eye],["Average CTR","6.7%","Click-through rate",Target],["Average position","14.2","Across tracked queries",TrendingUp]]}/>
      <div className="seo-search-grid"><section className="panel seo-card"><div className="seo-card-heading"><h3>Search performance</h3><span className="seo-legend"><i/>Impressions</span></div><div className="seo-chart"><div className="seo-y-axis"><span>30k</span><span>20k</span><span>10k</span></div><svg viewBox="0 0 600 170" role="img" aria-label="Illustrative search performance rising through September"><defs><linearGradient id="seo-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="currentColor" stopOpacity=".25"/><stop offset="100%" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs>{[20,75,130].map(y=><line key={y} x1="0" x2="600" y1={y} y2={y} className="seo-gridline"/>)}<path d="M0 137C25 138 25 112 50 115S75 135 100 108S120 104 150 98S175 113 200 88S230 80 250 94S280 72 300 75S326 41 350 55S375 64 400 39S423 54 450 30S475 46 500 20S528 45 550 25S575 27 600 10L600 170H0Z" fill="url(#seo-area)"/><path d="M0 137C25 138 25 112 50 115S75 135 100 108S120 104 150 98S175 113 200 88S230 80 250 94S280 72 300 75S326 41 350 55S375 64 400 39S423 54 450 30S475 46 500 20S528 45 550 25S575 27 600 10" fill="none" stroke="currentColor" strokeWidth="3"/></svg><div className="seo-x-axis">{["01 Sep","07 Sep","14 Sep","21 Sep","28 Sep"].map(d=><span key={d}>{d}</span>)}</div></div><p className="seo-muted">Illustrative trend · September 2026</p></section><section className="panel seo-card seo-query-card"><h3>Top search queries</h3>{queries.map(([q,impressions,clicks])=><div className="seo-query" key={q}><div><strong>{q}</strong><small>{impressions} impressions</small></div><span>{clicks}<small>clicks</small></span></div>)}</section></div>
      <section className="panel seo-report"><div className="seo-card-heading"><h3>Top pages</h3><span className="seo-muted">Search traffic</span></div><DataTable headings={["Page","Clicks","Impressions","CTR"]}>{pages.map(row=><tr key={row[0]}>{row.map((value,i)=><td key={i}>{value}</td>)}</tr>)}</DataTable></section><div className="seo-connection-notice"><span>Search Console is not connected in this preview.</span><button className="cs-button" onClick={onConnections}>Review connections<ArrowUpRight size={15}/></button></div>
    </>}
    {active===3&&<BacklinkPreview/>}
    {active===4&&<OpportunityPreview onToast={onToast}/>}
    </div>
    {active !== 0 && <footer className="seo-footer">Uplift AI · Design preview<span>Illustrative metrics · Changes stay on this device</span></footer>}
    {modal?.type==="article"&&<ArticleEditor article={modal.article} onClose={()=>setModal(null)} onSave={saveArticle}/>}
    {modal?.type==="audit"&&<Modal title="SEO audit details" onClose={()=>setModal(null)}><p className="seo-muted">This report demonstrates how audit results fit into the new dashboard design. Scores and issues are illustrative.</p><dl><dt>Website</dt><dd>upliftai.co</dd><dt>Audit status</dt><dd>Preview report</dd></dl><a className="cs-button filled" href="https://dashboard.upliftai.co/dashboard/seo-audit" target="_blank" rel="noopener noreferrer">Run an audit in Uplift AI<ArrowUpRight size={16}/></a></Modal>}
    {modal?.type==="author"&&<Modal title="Add author context" onClose={()=>setModal(null)}><p className="seo-muted">Add a real author name, biography, and credentials to your articles. Review your publishing connection to configure author details on your website.</p><button className="cs-button filled" onClick={()=>{setModal(null);onConnections();}}>Review website integration<ArrowUpRight size={16}/></button></Modal>}
  </section>;
}
