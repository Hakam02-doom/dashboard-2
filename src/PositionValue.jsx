import React,{useState,useRef,useId,useEffect} from 'react';
import {createPortal} from 'react-dom';
import {Info} from 'lucide-react';
import './position-value.css';
export function PositionValue({value,brand='This business'}){
 const [anchor,setAnchor]=useState(null),button=useRef(null),id=useId();
 const close=()=>setAnchor(null);
 function show(){const r=button.current.getBoundingClientRect();const width=Math.min(240,window.innerWidth-24);setAnchor({left:Math.max(12,Math.min(r.right-width,window.innerWidth-width-12)),top:r.top,bottom:r.bottom,width,above:r.top>120});}
 useEffect(()=>{if(!anchor)return;window.addEventListener('scroll',close,true);window.addEventListener('resize',close);return()=>{window.removeEventListener('scroll',close,true);window.removeEventListener('resize',close);};},[anchor]);
 return <span className="position-value"><span>{value==null?'Not ranked':`#${value.toFixed(1)}`}</span>
  <button ref={button} type="button" aria-label={`Average position details for ${brand}`} aria-describedby={anchor?id:undefined} onMouseEnter={show} onMouseLeave={close} onFocus={show} onBlur={close} onClick={()=>anchor?close():show()} onKeyDown={e=>{if(e.key==='Escape')close();}}><Info size={13}/></button>
  {anchor&&createPortal(<span id={id} className="position-explanation" role="tooltip" style={{left:anchor.left,width:anchor.width,top:anchor.above?anchor.top-8:anchor.bottom+8,transform:anchor.above?'translateY(-100%)':undefined}}>{value==null?`${brand} has no explicit rank in the collected answers. Unranked comparisons are excluded.`:'Average explicit rank across collected answers. Answers without a rank are excluded.'}</span>,document.body)}
 </span>;
}
