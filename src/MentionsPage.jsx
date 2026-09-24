import React, { useMemo, useState } from "react";
import {
  Activity, BarChart3, Download, Eye, Filter, Hash, Link2, Search,
} from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { resolveBrandDomain } from "./brand-domains";
import { reportMetrics } from "./ai-insights-data";
import { brandRows, bucketRows, domainOf, pct, unique } from "./insight-pages-data";
import "./mentions-page.css";

const STAGES = [
  ["Learn", "TOFU", "Researching options, comparing features, reading reviews"],
  ["Consider", "MOFU", "Narrowing choices, comparing specific products and pricing"],
  ["Purchase", "BOFU", "Ready to buy, looking for best price, deals, timing"],
];
const STATUS = [
  "All Responses", "Mentioned", "Cited", "Mentioned & Cited",
  "Mentioned, Not Cited", "Cited, Not Mentioned", "Not Mentioned",
];
const timeLabel = (date) => new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
const dateLabel = (date) => new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
const positionFor = (row, name, own) => name === own
  ? row.position
  : row.brandAssessment?.[name]?.position ?? row.competitorMetrics?.[name]?.position;
const isMentioned = (row, name, own) => name === own ? !!row.mentioned : !!row.competitors?.includes(name);
const listBrands = (row, own) => unique([
  ...(row.mentioned ? [own] : []), ...(row.competitors || []),
]);
const engineDomain = (name = "") => /perplexity/i.test(name) ? "perplexity.ai"
  : /google|overview/i.test(name) ? "google.com" : /chatgpt|openai/i.test(name) ? "openai.com" : "";

function BrandMark({ name, business, rows = [] }) {
  const sources = rows.flatMap((row) => row.sources || []);
  return <span className="mp-brand">
    <BrandLogo name={name} domain={name === business.name ? business.domain : resolveBrandDomain(name, sources)} />
    <span>{name === business.name ? "You" : name}</span>
  </span>;
}

function Card({ title, subtitle, icon: Icon, actions, footer, className = "", children }) {
  return <section className={`mp-card ${className}`}>
    <header className="mp-card-header">
      <Icon size={16} aria-hidden="true" />
      <h3>{title}</h3>
      <span className="mp-info" title={subtitle} aria-label={subtitle}>i</span>
      <span className="mp-subtitle">· {subtitle}</span>
      {actions && <div className="mp-card-actions">{actions}</div>}
    </header>
    <div className="mp-card-content">{children}</div>
    {footer && <footer className="mp-card-footer">{footer}</footer>}
  </section>;
}

function ViewSwitch({ value, onChange, label }) {
  return <div className="mp-view-switch" role="group" aria-label={label}>
    <button type="button" aria-label={`${label} line chart`} aria-pressed={value === "line"} onClick={() => onChange("line")}><Activity size={15}/></button>
    <button type="button" aria-label={`${label} bar chart`} aria-pressed={value === "bar"} onClick={() => onChange("bar")}><BarChart3 size={15}/></button>
  </div>;
}

function TrendChart({ series, mode }) {
  const dates = unique(series.flatMap((item) => item.points.map(([date]) => date))).sort();
  if (!dates.length) return <div className="mp-chart-empty">No measurements in this period.</div>;
  const max = Math.max(1, ...series.flatMap((item) => item.points.map(([, count]) => count)));
  const ceiling = Math.ceil(max / (max > 20 ? 20 : max > 5 ? 5 : 1)) * (max > 20 ? 20 : max > 5 ? 5 : 1);
  const ticks = ceiling <= 4 ? Array.from({length:ceiling+1},(_,i)=>i) : [0,.25,.5,.75,1].map((fraction)=>ceiling*fraction);
  const x = (i) => 55 + (dates.length === 1 ? 245 : i / (dates.length - 1) * 490);
  const y = (n) => 194 - n / ceiling * 158;
  return <div className="mp-chart">
    <svg viewBox="0 0 600 228" role="img" aria-label={series.map((item) => `${item.name}: ${item.points.map(([d,n]) => `${d} ${n}`).join(", ")}`).join("; ")}>
      {ticks.map((tick) => <g key={tick}>
        <line x1="52" x2="570" y1={y(tick)} y2={y(tick)} className="mp-gridline"/>
        <text x="40" y={y(tick)+4} textAnchor="end">{tick % 1 ? tick.toFixed(1) : tick}</text>
      </g>)}
      {series.map((item, index) => {
        const points = item.points.map(([d,n]) => [x(dates.indexOf(d)), y(n), d, n]);
        return <g key={item.name} className={item.name === "Citations" ? "mp-citation-series" : "mp-mention-series"}>
          {mode === "line" && points.length > 1 && <polyline points={points.map(([px,py]) => `${px},${py}`).join(" ")} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>}
          {points.map(([px,py,d,n]) => mode === "bar"
            ? <rect key={d} x={px-12+index*14} y={py} width={series.length > 1 ? 13 : 24} height={194-py} rx="3" fill="currentColor"><title>{`${item.name} · ${dateLabel(d)}: ${n}`}</title></rect>
            : <circle key={d} cx={px} cy={py} r="4" fill="currentColor"><title>{`${item.name} · ${dateLabel(d)}: ${n}`}</title></circle>)}
        </g>;
      })}
      {dates.filter((_,i) => dates.length <= 7 || i === 0 || i === dates.length-1 || i === Math.floor(dates.length/2)).map((d) => <text key={d} x={x(dates.indexOf(d))} y="218" textAnchor="middle">{timeLabel(d)}</text>)}
    </svg>
    {series.length > 1 && <div className="mp-chart-legend">{series.map((item,index) => <span key={item.name}><i className={index ? "citation" : "mention"}/>{item.name}</span>)}</div>}
  </div>;
}

function downloadResponses(rows) {
  const columns = ["Prompt","Model","Answer","Mentioned","Cited","Position","Mentions","Sources","Created"];
  const safe = (value) => {
    const text = String(value ?? "");
    const escaped = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
    return `"${escaped.replaceAll('"','""')}"`;
  };
  const lines = [columns.join(","), ...rows.map((row) => [
    row.prompt,row.engine,row.answer,row.mentioned ? "Yes":"No",row.cited == null ? "Unknown":row.cited ? "Yes":"No",
    row.position || "",listBrands(row,row.ownName).join("; "), (row.sources || []).join("; "),row.at,
  ].map(safe).join(","))];
  const href = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = href; link.download = "ai-responses.csv"; link.click();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

function PromptDetail({ prompt, rows, business, onAnswer }) {
  const metrics = reportMetrics(rows, business.name).slice(0, 10);
  const sources = unique(rows.flatMap((r) => r.sources || [])).filter(domainOf);
  return <div className="mp-prompt-detail">
    <p>{prompt}</p>
    <p>{rows.length} measured {rows.length === 1 ? "response":"responses"} · {unique(rows.map((r) => r.engine)).join(", ")}</p>
    <h3>Rankings for this prompt</h3>
    <div className="mp-detail-rankings">{metrics.map((item) => <div key={item.name}><BrandMark name={item.name} business={business} rows={rows}/><strong>{pct(item.visibility)}</strong></div>)}</div>
    <h3>Cited sources</h3>
    <div className="mp-detail-sources">{sources.length ? sources.map((url) => <a key={url} href={url} target="_blank" rel="noopener noreferrer">{domainOf(url)} ↗</a>) : "No cited sources recorded."}</div>
    <h3>Response history</h3>
    {rows.map((row) => <button className="mp-detail-answer" key={row.id} onClick={() => onAnswer(row)}><span>{row.engine} · {dateLabel(row.at)}</span><span>{row.answer}</span></button>)}
  </div>;
}

function ResponseTable({ rows, business, brand, onAnswer, onDetail }) {
  const [search,setSearch] = useState("");
  const [group,setGroup] = useState("Prompt");
  const [filter,setFilter] = useState("All Responses");
  const [sort,setSort] = useState("Created");
  const [descending,setDescending] = useState(true);
  const [limit,setLimit] = useState(25);
  const own = business.name;
  const list = useMemo(() => rows.filter((row) => {
    const mentioned = isMentioned(row,brand,own);
    const cited = brand === own ? row.cited : null;
    const match = `${row.prompt} ${row.answer} ${row.engine}`.toLowerCase().includes(search.toLowerCase());
    return match && (filter === "All Responses"
      || filter === "Mentioned" && mentioned
      || filter === "Cited" && cited
      || filter === "Mentioned & Cited" && mentioned && cited
      || filter === "Mentioned, Not Cited" && mentioned && cited === false
      || filter === "Cited, Not Mentioned" && !mentioned && cited
      || filter === "Not Mentioned" && !mentioned);
  }).sort((a,b) => {
    const value = (r) => sort === "Created" ? Date.parse(r.at) : sort === "Position" ? positionFor(r,brand,own) ?? Infinity : sort === "Mentions" ? listBrands(r,own).length : sort === "Sources" ? unique(r.sources || []).length : sort === "Mentioned?" ? +isMentioned(r,brand,own) : +(r.cited || 0);
    return (descending ? -1 : 1) * (value(a)-value(b));
  }),[rows,search,filter,sort,descending,brand,own]);
  const visible = list.slice(0,limit);
  const groups = group === "Responses" ? [["",visible]] : unique(visible.map((r) => group === "Topic" ? r.topic || "Unclassified" : r.prompt)).map((name) => [name,visible.filter((r) => (group === "Topic" ? r.topic || "Unclassified" : r.prompt) === name)]);
  const changeSort = (name) => { setDescending(sort === name ? !descending : true); setSort(name); };
  return <Card title="All Responses" subtitle="Every AI response across all prompts" icon={BarChart3} className="mp-responses"
    actions={<span className="mp-count">{list.length} responses</span>}>
    <div className="mp-table-controls">
      <label className="mp-search"><Search size={15}/><input aria-label="Search prompts" placeholder="Search prompts" value={search} onChange={(e)=>{setSearch(e.target.value);setLimit(25);}}/></label>
      <label><span className="mp-sr-only">Group responses</span><select aria-label="Group responses" value={group} onChange={(e)=>{setGroup(e.target.value);setLimit(25);}}>{["Responses","Prompt","Topic"].map((v)=><option key={v} value={v}>Group: {v}</option>)}</select></label>
      <label><span className="mp-sr-only">Filter responses</span><select aria-label="Filter responses" value={filter} onChange={(e)=>{setFilter(e.target.value);setLimit(25);}}>{STATUS.map((v)=><option key={v}>{v}</option>)}</select></label>
      <button className="mp-export" onClick={()=>downloadResponses(list.map((row)=>({...row,ownName:own})))}><Download size={14}/> Export</button>
    </div>
    <div className="mp-table-scroll" role="region" aria-label="AI responses" tabIndex={0}><table className="mp-response-table">
      <thead><tr><th className="mp-model-heading" aria-label="Model"></th><th>AI Response</th>{["Mentioned?","Cited?","Position","Mentions","Sources","Created"].map((name)=><th key={name}><button onClick={()=>changeSort(name)} aria-label={`Sort by ${name}`}>{name} <span aria-hidden="true">{sort===name ? descending ? "↓":"↑":"↕"}</span></button></th>)}</tr></thead>
      {groups.map(([heading,items])=><tbody key={heading || "all"}>
        {heading && <tr className="mp-group-row"><td colSpan="8"><div><strong>{heading}</strong><span>{dateLabel(items[0].at)} · {items.length} {items.length===1 ? "response":"responses"}</span><button onClick={()=>onDetail({title:heading,content:<PromptDetail prompt={heading} rows={rows.filter((r)=>(group === "Topic" ? r.topic || "Unclassified" : r.prompt)===heading)} business={business} onAnswer={onAnswer}/>})}>Details</button></div></td></tr>}
        {items.map((row)=>{
          const mentioned = isMentioned(row,brand,own);
          const brands = listBrands(row,own);
          const sources = unique(row.sources || []).filter(domainOf);
          const position = positionFor(row,brand,own);
          return <tr key={row.id} className="mp-response-row" onClick={()=>onAnswer(row)}>
            <td><span className="mp-model" title={row.engine}><BrandLogo name={row.engine || "AI"} domain={engineDomain(row.engine)}/></span></td>
            <td><button className="mp-answer-cell" onClick={(e)=>{e.stopPropagation();onAnswer(row);}}>{row.answer}</button></td>
            <td><span className={mentioned ? "mp-yes":"mp-no"}>{mentioned?"Yes":"No"}</span></td>
            <td><span className={row.cited ? "mp-yes":"mp-no"}>{brand!==own || row.cited==null ? "—":row.cited?"Yes":"No"}</span></td>
            <td>{Number.isFinite(position) ? `#${position}`:"—"}</td>
            <td><div className="mp-mark-stack">{brands.slice(0,3).map((name)=><BrandLogo key={name} name={name} domain={name===own ? business.domain:resolveBrandDomain(name,row.sources || [])}/>)}{brands.length>3&&<span>+{brands.length-3}</span>}{!brands.length&&"—"}</div></td>
            <td><div className="mp-mark-stack">{sources.slice(0,3).map((url)=><BrandLogo key={url} name={domainOf(url)} domain={domainOf(url)}/>)}{sources.length>3&&<span>+{sources.length-3}</span>}{!sources.length&&"—"}</div></td>
            <td>{dateLabel(row.at)}</td>
          </tr>;
        })}
      </tbody>)}
    </table></div>
    {!list.length && <div className="mp-table-empty">No measured responses match these filters.</div>}
    <div className="mp-load-more"><span>{visible.length} of {list.length} responses loaded</span>{visible.length<list.length&&<button onClick={()=>setLimit((n)=>n+25)}>Load more</button>}</div>
  </Card>;
}

export function MentionsPage({ rows, prior = [], business, brand, cadence, plan, annotations = {}, onDetail, onAnswer }) {
  const [mentionMode,setMentionMode] = useState("line");
  const [citationMode,setCitationMode] = useState("line");
  const [merged,setMerged] = useState(false);
  const [heatmap,setHeatmap] = useState("percentage");
  const own = brandRows(rows,brand,business.name);
  const before = brandRows(prior,brand,business.name);
  const counts = bucketRows(own,cadence);
  const series = (field,name) => ({name,points:counts.map(([date,items])=>[date,items.filter((r)=>r[field]).length])});
  const mentions = own.filter((r)=>r.mentioned).length;
  const citations = brand===business.name ? own.filter((r)=>r.cited).length : null;
  const delta = (field) => before.length ? own.filter((r)=>r[field]).length-before.filter((r)=>r[field]).length : null;
  const top = reportMetrics(rows,business.name).slice(0,10).map((item)=>item.name);
  if (!top.includes(business.name)) top.push(business.name);
  const intentByPrompt = new Map((plan?.questions || []).map((q)=>[q.id,q.intent]));
  const stageOf = (row) => annotations[row.id]?.stage ||
    ({Discovery:"Learn",Comparison:"Consider","Buying decisions":"Purchase"})[intentByPrompt.get(row.promptId)];
  const stages = STAGES.map(([name,abbr,description])=>{
    const items = own.filter((r)=>stageOf(r)===name);
    const rate=items.length ? items.filter((r)=>r.mentioned).length/items.length*100:null;
    return {name,abbr,description,items,rate};
  });
  const coverage = stages.reduce((n,stage)=>n+stage.items.length,0);
  const days = unique(own.map((r)=>r.at?.slice(0,10))).length;
  return <div className="mp-page">
    <div className="mp-grid">
      <Card title="Mentions" icon={Eye} subtitle="Your brand’s mention trend over time across LLMs" className={merged ? "mp-wide":""}
        actions={<ViewSwitch label="Mentions" value={mentionMode} onChange={setMentionMode}/>}
        footer={<><span>{days ? `Showing collected data for ${days} ${days===1?"day":"days"}`:"No collected dates"}</span>{merged&&<button onClick={()=>setMerged(false)}>Split charts</button>}</>}>
        <div className="mp-stat"><span>Total Mentions</span><div><strong>{mentions}</strong>{delta("mentioned")!==null&&<small className={delta("mentioned")>=0 ? "up":"down"}>{delta("mentioned")>0?"+":""}{delta("mentioned")} vs previous period</small>}</div></div>
        <TrendChart mode={mentionMode} series={merged ? [series("mentioned","Mentions"),series("cited","Citations")] : [series("mentioned","Mentions")]}/>
      </Card>
      {!merged&&<Card title="Citations" icon={Link2} subtitle="Linked sources in AI responses across LLMs"
        actions={<ViewSwitch label="Citations" value={citationMode} onChange={setCitationMode}/>}
        footer={<><span>{brand===business.name ? `Showing collected data for ${days} ${days===1?"day":"days"}`:"Citation attribution is available for your brand"}</span>{brand===business.name&&<button onClick={()=>setMerged(true)}>Merge with Mentions</button>}</>}>
        <div className="mp-stat"><span>Total Citations</span><div><strong>{citations===null?"—":citations}</strong>{brand===business.name&&delta("cited")!==null&&<small className={delta("cited")>=0 ? "up":"down"}>{delta("cited")>0?"+":""}{delta("cited")} vs previous period</small>}</div></div>
        {brand===business.name ? <TrendChart mode={citationMode} series={[series("cited","Citations")]}/> : <div className="mp-chart-empty">The saved answers do not identify competitor-owned citations.</div>}
      </Card>}
      <Card title="Decision Journey" icon={Filter} subtitle="Mention rate by funnel stage across LLMs" footer={<><span>{coverage} of {own.length} responses classified</span><span>Weak → Strong</span></>}>
        <div className="mp-journey">
          <div className="mp-funnel">{stages.map((stage,index)=><button key={stage.name} className={`mp-funnel-slice mp-slice-${index}`} onClick={()=>onDetail({title:`${stage.name} · buyer journey`,content:<PromptDetail prompt={stage.name} rows={stage.items} business={business} onAnswer={onAnswer}/>})}><strong>{pct(stage.rate)}</strong><span>View details →</span></button>)}<span className="mp-funnel-caption">Revenue at stake ↑</span></div>
          <div className="mp-stage-list">{stages.map((stage)=><button key={stage.name} onClick={()=>onDetail({title:`${stage.name} · buyer journey`,content:<PromptDetail prompt={stage.name} rows={stage.items} business={business} onAnswer={onAnswer}/>})}><strong>{stage.name} <small>({stage.abbr})</small></strong><span className="mp-stage-rating">{stage.rate===null?"Not measured":stage.rate<5?"Not mentioned":stage.rate<15?"Critical":stage.rate<35?"Weak":"Strong"}</span><p>{stage.description}</p><small>{stage.items.length} classified responses</small></button>)}</div>
        </div>
        {!coverage&&<p className="mp-measurement-note">Buyer stages appear when prompts have a measured intent or a reviewed stage classification.</p>}
      </Card>
      <Card title="Position Distribution" icon={Hash} subtitle="Where brands appear in AI responses"
        actions={<label className="mp-heat-select"><span className="mp-sr-only">Heatmap measure</span><select aria-label="Heatmap measure" value={heatmap} onChange={(e)=>setHeatmap(e.target.value)}><option value="percentage">Percent</option><option value="count">Count</option></select></label>}
        footer={<><span>Only explicitly ranked answers</span><span className="mp-heat-legend">Low <i/> High</span></>}>
        <div className="mp-heat-scroll" role="region" tabIndex={0} aria-label="Position distribution"><table><thead><tr>{["Brand","#1","#2","#3","#4","#5","#5+"].map((h)=><th key={h}>{h}</th>)}</tr></thead><tbody>{top.map((name)=>{
          const ranked=rows.filter((r)=>Number.isFinite(positionFor(r,name,business.name))&&positionFor(r,name,business.name)>0);
          return <tr key={name}><th><BrandMark name={name} business={business} rows={rows}/></th>{[1,2,3,4,5,6].map((n)=>{
            const found=ranked.filter((r)=>n===6 ? positionFor(r,name,business.name)>5 : positionFor(r,name,business.name)===n);
            const amount=ranked.length ? found.length/ranked.length*100:null;
            return <td key={n}><button className="mp-heat-cell" data-level={amount===null ? "none":amount>=50 ? "high":amount>=25 ? "mid":"low"} onClick={()=>onDetail({title:`${name} · position ${n===6?"5+":n}`,content:<PromptDetail prompt={`Position ${n===6?"5+":n}`} rows={found} business={business} onAnswer={onAnswer}/>})}>{amount===null||!found.length?"—":heatmap==="count"?found.length:`${Math.round(amount)}%`}</button></td>;
          })}</tr>;
        })}</tbody></table></div>
      </Card>
    </div>
    <ResponseTable rows={rows} business={business} brand={brand} onAnswer={onAnswer} onDetail={onDetail}/>
  </div>;
}
