import {PositionValue} from './PositionValue';
import React, { useRef, useState, useEffect } from 'react';
import { Activity, BarChart3, ChartBar, PieChart, Table2, Eye, Hash, Info, ArrowUpRight, X, Search, Smile, ChevronDown } from 'lucide-react';
import { reportMetrics, reportTimeline } from './ai-insights-data';
import './ai-visibility-report.css';
import { brandColor } from './brand-colors';
import { BrandLogo } from './BrandLogo';
import { resolveBrandDomain } from './brand-domains';

const pct = n => n == null ? '—' : `${n.toFixed(1)}%`;

function Brand({brand,color}) { return <span className="avr-brand"><BrandLogo name={brand.name} domain={brand.domain}/>{brand.name}{brand.own&&<small>You</small>}</span>; }
function Switch({label,value,onChange,options}) { return <div className="avr-switch" role="group" aria-label={label}>{options.map(([key,Icon,name])=><button key={key} type="button" aria-label={name} title={name} aria-pressed={value===key} onClick={()=>onChange(key)}><Icon size={15}/></button>)}</div>; }
function Card({title,Icon,note,controls,footer,children}) { return <section className="panel avr-card"><header><Icon size={17}/><h3>{title}</h3><Info size={13} className="avr-info" aria-hidden="true"/><span>{note}</span>{controls}</header><div className="avr-card-body">{children}</div><footer>{footer}</footer></section>; }
function Missing({position=false}) { return <div className="avr-missing">{position?'No position data available':'No measurements collected yet'}<span>{position?'Ranked answers will appear here.':'Connect monitoring or enable the sample preview.'}</span></div>; }
function Score({label,value}) { return <div className="avr-score"><span>{label}</span><strong>{value}</strong></div>; }
function Chart({rows,brands,selected,metric='visibility',compare=false,cadence='Daily',colorFor}) {
  const chartRef=useRef(null),[width,setWidth]=useState(635);
  useEffect(()=>{const el=chartRef.current;if(!el)return;const observer=new ResizeObserver(([entry])=>setWidth(Math.max(280,entry.contentRect.width)));observer.observe(el);return()=>observer.disconnect();},[]);
  const chosen=compare?brands:brands.filter(b=>b.name===selected);
  const {days,series}=reportTimeline(rows,brands.find(b=>b.own).name,chosen.map(b=>b.name),metric,cadence);
  const values=series.flatMap(s=>s.points.map(p=>p.value)).filter(v=>v!==null);
  if(!values.length)return <div ref={chartRef}><Missing position={metric==='position'}/></div>;
  if(days.length===1)return <div ref={chartRef}><Bars brands={chosen} colorFor={colorFor} metric={metric}/><p className="avr-single-date-note">{new Date(days[0]).toLocaleDateString(undefined,{month:'short',day:'numeric',timeZone:'UTC'})} · One measured date. Trends appear after another collection date.</p></div>;
  const max=metric==='position'?Math.max(5,Math.ceil(Math.max(...values))):Math.min(100,Math.max(10,Math.ceil(Math.max(...values)/10)*10));
  const y=v=>metric==='position'?24+(v-1)/Math.max(1,max-1)*145:169-v/max*145;
  const x=i=>45+i/Math.max(1,days.length-1)*(width-65);
  return <div ref={chartRef} className="avr-chart"><svg viewBox={`0 0 ${width} 210`} role="img" aria-label={`${metric} ${cadence.toLowerCase()} chart. ${series.map(s=>`${s.name}: ${s.points.map(p=>`${p.date} ${p.value===null?'not measured':p.value.toFixed(1)}`).join(', ')}`).join('; ')}`}>
    {(metric==='position'?[1,Math.ceil(max/2),max]:[max,max*.75,max*.5,max*.25,0]).map(v=><g key={v}><line x1="45" x2={width-20} y1={y(v)} y2={y(v)}/><text x="3" y={y(v)+4}>{metric==='position'?`#${v}`:`${v}%`}</text></g>)}
    {series.map(s=><g key={s.name} style={{color:colorFor(s.name)}}>{s.points.map((p,i)=>p.value===null?null:<React.Fragment key={p.date}>{i>0&&s.points[i-1].value!==null&&<line className="avr-series-line" x1={x(i-1)} y1={y(s.points[i-1].value)} x2={x(i)} y2={y(p.value)}/>}<circle cx={x(i)} cy={y(p.value)} r="3.5"><title>{s.name} · {p.date}: {metric==='position'?'#':''}{p.value.toFixed(1)}{metric==='position'?'':'%'}</title></circle></React.Fragment>)}</g>)}
    {days.map((day,i)=>(i===0||i===days.length-1||i%Math.max(1,Math.ceil(days.length/(width<420?2:6)))===0)&&<text key={day} x={x(i)} y="198" textAnchor={i===0?'start':i===days.length-1?'end':'middle'}>{new Date(day).toLocaleDateString(undefined,{month:'short',day:'numeric',timeZone:'UTC'})}</text>)}
  </svg>{compare&&<div className="avr-legend">{brands.map(b=><span key={b.name}><BrandLogo name={b.name} domain={b.domain}/>{b.name}</span>)}</div>}</div>;
}
function Bars({brands,colorFor,onSelect,metric='visibility',selected}) {
  if(!brands.some(b=>b[metric]!=null))return <Missing position={metric==='position'}/>;
  const shown=brands.length<=10?brands:brands.slice(0,9).some(b=>b.name===selected)?brands.slice(0,10):[...brands.slice(0,9),brands.find(b=>b.name===selected)||brands[9]];
  const max=metric==='position'?Math.max(5,...brands.map(b=>b[metric]||0)):100;
  const format=n=>n==null?'—':metric==='position'?`#${n.toFixed(1)}`:pct(n);
  const label=metric==='position'?'average position':metric==='sov'?'share of voice':'visibility';
  return <><div className="avr-bars"><div className="avr-bar-axis">{[max,max*.75,max*.5,max*.25,0].map(n=><span key={n}>{metric==='position'?n.toFixed(1):`${n}%`}</span>)}</div><div className="avr-bar-columns">{shown.map(b=><button key={b.name} onClick={()=>onSelect?.(b.name)} aria-label={`${b.name}, ${label} ${format(b[metric])}`}><span className="avr-bar-value">{format(b[metric])}</span><span className="avr-bar-space"><span className="avr-bar-fill" style={{height:`${(b[metric]||0)/max*100}%`,background:colorFor(b.name)}}/><span className="avr-bar-tip">{b.name}<strong>{format(b[metric])}</strong></span></span><span className="avr-bar-name"><BrandLogo name={b.name} domain={b.domain}/><span>{b.name}</span></span></button>)}</div></div>{brands.length>10&&<p className="avr-single-date-note">Showing 10 of {brands.length} brands. Rankings includes every measured brand.</p>}</>;
}
function HorizontalComparison({brands,colorFor,onSelect,selected}) {
 if(!brands.some(b=>b.visibility!=null))return <Missing/>;
 return <div className="avr-horizontal-comparison" aria-label="Brand visibility comparison">{brands.map(b=><button key={b.name} className="avr-horizontal-row" aria-pressed={selected===b.name} onClick={()=>onSelect(b.name)} aria-label={`${b.name}: ${pct(b.visibility)} visibility. View brand`}><span className="avr-horizontal-label"><BrandLogo name={b.name} domain={b.domain}/><span>{b.name}</span>{b.own&&<small>You</small>}</span><span className="avr-horizontal-track"><span style={{width:`${b.visibility||0}%`,background:colorFor(b.name)}}/></span><strong>{pct(b.visibility)}</strong></button>)}<div className="avr-horizontal-scale" aria-hidden="true"><span>0%</span><span>50%</span><span>100%</span></div></div>;
}
function BrandDonut({brands,colorFor,onSelect,onDetails}) {
 const [hovered,setHovered]=useState(null);
 let offset=0;
 const positive=brands.filter(b=>b.sov>0),other=positive.slice(7),otherShare=other.reduce((sum,b)=>sum+b.sov,0);
 const slices=[...positive.slice(0,7),...(otherShare?[{name:`Other ${other.length} brands`,sov:otherShare,other:true}]:[])].map(b=>{const start=offset;offset+=b.sov;return {...b,start,angle:(start+b.sov/2)/100*Math.PI*2-Math.PI/2};});
 return <div className="avr-orbit-chart">
  <svg viewBox="0 0 320 320" aria-label="Share of voice by brand" role="img"><circle className="avr-orbit-track" cx="160" cy="160" r="94"/>{slices.map(b=><circle key={b.name} className="avr-orbit-segment" cx="160" cy="160" r="94" pathLength="100" fill="none" stroke={b.other?'var(--d2-muted,#626d7c)':colorFor(b.name)} strokeDasharray={`${Math.max(0,b.sov-.35)} ${100-Math.max(0,b.sov-.35)}`} strokeDashoffset={-b.start} transform="rotate(-90 160 160)" onMouseEnter={()=>setHovered(b)} onMouseLeave={()=>setHovered(null)} onClick={()=>b.other?onDetails():onSelect(b.name)}><title>{b.name}: {pct(b.sov)}</title></circle>)}</svg>
  <button className="avr-orbit-center" onClick={onDetails} aria-label="Open share of voice details">{slices.length?<>Click for<br/>more details</>:<>Awaiting<br/>measurements</>}</button>
  {slices.filter(b=>!b.other).map(b=><button key={b.name} className="avr-orbit-logo" style={{left:`${50+Math.cos(b.angle)*42}%`,top:`${50+Math.sin(b.angle)*42}%`}} aria-label={`${b.name}: ${pct(b.sov)} share of voice. View competitor`} onFocus={()=>setHovered(b)} onBlur={()=>setHovered(null)} onMouseEnter={()=>setHovered(b)} onMouseLeave={()=>setHovered(null)} onClick={()=>onSelect(b.name)}><BrandLogo name={b.name} domain={b.domain}/></button>)}
  {hovered&&<div className="avr-orbit-tooltip" role="status">{hovered.other?<strong>{hovered.name}</strong>:<Brand brand={hovered}/>}<span>Share of voice <strong>{pct(hovered.sov)}</strong></span></div>}
 </div>;
}
function Rankings({brands,selected,onSelect,colorFor,query='',sort,setSort}) {
  const ordered=[...brands].filter(b=>b.name.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>{
    const av=a[sort.key],bv=b[sort.key]; if(av==null)return bv==null?0:1;if(bv==null)return -1;return (av-bv)*(sort.asc?1:-1);
  });
  return <div className="avr-rank-scroll" tabIndex={0} aria-label="Brand rankings, scroll for more columns"><table><thead><tr><th>#</th><th>Brand</th>{[['visibility','Visibility'],['sov','SOV'],['sentiment','Sentiment'],['position','Avg position']].map(([key,label])=><th key={key} aria-sort={sort.key===key?(sort.asc?'ascending':'descending'):'none'}><button onClick={()=>setSort({key,asc:sort.key===key?!sort.asc:key==='position'})}>{label}<ChevronDown size={12}/></button></th>)}</tr></thead><tbody>{ordered.map(b=><tr key={b.name} className={selected===b.name?'selected':''}><td>{brands.indexOf(b)+1}</td><td><button className="avr-brand-button" onClick={()=>onSelect(b.name)} aria-pressed={selected===b.name}><Brand brand={b} color={colorFor(b.name)}/></button></td><td title={`${b.mentions} mentions in ${b.sampleSize} answers where ${b.name} was measured`}>{pct(b.visibility)}</td><td>{pct(b.sov)}</td><td><span className="avr-sentiment-cell">{b.sentiment!==null&&<Smile size={14}/>} {b.sentiment===null?'—':Math.round(b.sentiment)}</span></td><td><PositionValue value={b.position} brand={b.name}/></td></tr>)}</tbody></table>{!ordered.length&&<p className="avr-no-results">No brands match your search.</p>}</div>;
}
export function AiVisibilityReport({rows,business,period,cadence,selected,setSelected,preview,search,report}) {
  const sources=[...(report?.discovery?.sources||[]),...rows.flatMap(r=>r.sources||[])];
  const brands=reportMetrics(rows,business.name).map(b=>({...b,domain:b.own?business.domain:resolveBrandDomain(b.name,sources,report?.suggestions)})), selectedBrand=brands.find(b=>b.name===selected)||brands.find(b=>b.own);
  const mixedLists=new Set(brands.map(b=>b.sampleSize)).size>1;
  const names=[business.name,...[...new Set(rows.flatMap(r=>r.trackedCompetitors||r.competitors||[]))].sort()];
  const colorFor=name=>brandColor(brands.find(b=>b.name===name)||{name});
  const [visibilityView,setVisibilityView]=useState('bars'),[positionView,setPositionView]=useState('chart'),[shareView,setShareView]=useState('donut'),[sort,setSort]=useState({key:'visibility',asc:false});
  const [drawer,setDrawer]=useState(false),[drawerQuery,setDrawerQuery]=useState('');
  const dialog=useRef(null),opener=useRef(null);
  useEffect(()=>{if(drawer&&!dialog.current.open)dialog.current.showModal();else if(!drawer)opener.current?.focus();},[drawer]);
  const openDetails=()=>{opener.current=document.activeElement;setDrawer(true);};
  const closeDetails=()=>{dialog.current?.close();setDrawer(false);};
  const footer=<span>{preview?'Sample data':rows.length?'Collected answers':'No live data'} · Last {period} days</span>;

  return <>
    {!selectedBrand.own&&<div className="avr-comparison-banner"><button onClick={()=>setSelected(business.name)}>← Return to {business.name}</button><span>Viewing <Brand brand={selectedBrand}/></span></div>}
    <div className="avr-grid">
      <Card title="Visibility" Icon={Eye} note={visibilityView==='bars'?'Percentage of answers mentioning each brand':'Brand comparison across collected answers'} controls={<Switch label="Visibility chart type" value={visibilityView} onChange={setVisibilityView} options={[["chart",ChartBar,"Horizontal visibility comparison"],["bars",BarChart3,"Visibility by brand"]]}/>} footer={footer}>
        <Score label="Visibility score" value={pct(selectedBrand.visibility)}/>{visibilityView==='bars'?<Bars brands={brands} colorFor={colorFor} onSelect={setSelected} selected={selectedBrand.name}/>:<HorizontalComparison brands={brands} selected={selectedBrand.name} colorFor={colorFor} onSelect={setSelected}/>}
      </Card>
      <Card title="Rankings" Icon={BarChart3} note="Click a brand to view as competitor" footer={<><span>{brands.length>1?`${brands.length} comparison brands`:'No tracked competitors in these results'}{mixedLists?' · Measured answer counts vary by brand':''}</span><span title="Positive = 100, neutral = 50, negative = 0. Average across assessed answers.">Sentiment score · 0–100</span></>}><Rankings brands={brands} selected={selectedBrand.name} onSelect={setSelected} colorFor={colorFor} query={search} sort={sort} setSort={setSort}/></Card>
      <Card title="Avg position" Icon={Hash} note="Your average position trend across AI engines" controls={<Switch label="Position view" value={positionView} onChange={setPositionView} options={[["chart",Activity,"Position trend"],["table",Table2,"Position table"]]}/>} footer={footer}>
        {selectedBrand.position!==null&&<Score label="Average position" value={`#${selectedBrand.position.toFixed(1)}`}/>}{positionView==='chart'?<Chart rows={rows} brands={brands} selected={selectedBrand.name} metric="position" cadence={cadence} colorFor={colorFor}/>:<div className="avr-position-table"><table><thead><tr><th>Brand</th><th>Average position</th></tr></thead><tbody>{brands.map(b=><tr key={b.name}><td><Brand brand={b} color={colorFor(b.name)}/></td><td><PositionValue value={b.position} brand={b.name}/></td></tr>)}</tbody></table></div>}
      </Card>
      <Card title="Share of voice" Icon={PieChart} note="Share within tracked brands" controls={<Switch label="Share of voice chart type" value={shareView} onChange={setShareView} options={[["donut",PieChart,"Share of voice donut"],["chart",Activity,"Share of voice trend"]]}/>} footer={<><span>{selectedBrand.sov===null?'Requires assessed competitor mentions':`${pct(selectedBrand.sov)} share of voice across ${brands.length} brands`}</span><button className="avr-detail-button" onClick={openDetails}>See details<ArrowUpRight size={13}/></button></>}>
        <Score label="Avg. share of voice" value={pct(selectedBrand.sov)}/>{shareView==='chart'?<Chart rows={rows} brands={brands} selected={selectedBrand.name} metric="sov" compare cadence={cadence} colorFor={colorFor}/>:<BrandDonut brands={brands} colorFor={colorFor} onSelect={setSelected} onDetails={openDetails}/>}

      </Card>
    </div>
    {drawer&&<dialog ref={dialog} className="avr-drawer" onCancel={closeDetails} onClick={e=>{if(e.target===dialog.current)closeDetails();}} aria-labelledby="avr-detail-title"><div className="avr-drawer-content"><header><span>AI Insights <span>/</span> Visibility <span>/</span> <strong id="avr-detail-title">Share of voice</strong></span><button className="cs-button" onClick={closeDetails} aria-label="Close share of voice details"><X size={18}/></button></header><p className="avr-detail-disclosure">{preview?'Synthetic sample data · These are not measured business results.':rows.length?rows.every(r=>r.comparisonAssessed)?'Share of mentions within your tracked brands · Review answer evidence for classification details.':'Collected answers · Competitor comparison has not been assessed.':'No collected results.'}</p><section className="panel avr-detail-summary"><span>Brand</span><Brand brand={selectedBrand} color={colorFor(selectedBrand.name)}/><div>{[['Share of voice',pct(selectedBrand.sov)],['Rank',selectedBrand.sov!==null?`#${brands.indexOf(selectedBrand)+1}`:'—'],['Competitors',selectedBrand.sov!==null?brands.length-1:'—']].map(([label,value])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></section><Card title="Share of voice" Icon={Activity} note="Brand mentions across AI platforms" footer={<span>{selectedBrand.name} vs comparison brands · {preview?'Sample':rows.length?'Collected answers':'No live data'}</span>}><Score label="Your share of voice" value={pct(selectedBrand.sov)}/><Chart rows={rows} brands={brands} selected={selectedBrand.name} metric="sov" compare cadence={cadence} colorFor={colorFor}/></Card><section className="panel avr-detail-competitors"><header><h3>All competitors</h3><label><Search size={15}/><input aria-label="Search comparison brands" placeholder="Search brands…" value={drawerQuery} onChange={e=>setDrawerQuery(e.target.value)}/></label></header><Rankings brands={brands} selected={selectedBrand.name} onSelect={setSelected} colorFor={colorFor} query={drawerQuery} sort={sort} setSort={setSort}/></section></div></dialog>}
  </>;
}
