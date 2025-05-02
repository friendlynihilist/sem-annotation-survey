/* sankeyChart2.js  —  Tool → Metadata → Ontology → Domain  (muted unique colours) */
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { sankey, sankeyLinkHorizontal } from "https://cdn.jsdelivr.net/npm/d3-sankey@0.12/+esm";
import { createSVG, FSIZE } from "./utils.js";

export function drawSankey2(data){
  /* canvas */
  const cfg = { sel: "#sankeyChart2", m:{t:20,r:20,b:20,l:20}, w:1000, h:600 };
  const svg = createSVG(cfg);

  /* ------ helper maps to mark singletons ------ */
  const metaCnt=new Map(), ontoCnt=new Map();
  data.forEach(d=>{
    (d.metadata||"").split(";").map(s=>s.trim()).filter(Boolean)
      .forEach(m=>metaCnt.set(m,(metaCnt.get(m)||0)+1));
    (d.ontology||"").split(";").map(s=>s.trim()).filter(Boolean)
      .forEach(o=>ontoCnt.set(o,(ontoCnt.get(o)||0)+1));
  });

  /* ------ build raw link triples ------ */
  const raw=[];
  data.forEach(d=>{
    const tools=(d.TOOLS||"").split(";").map(s=>`tool::${s.trim()}`).filter(Boolean);
    const metasRaw=(d.metadata||"").split(";").map(s=>s.trim());
    const metas = metasRaw.filter(Boolean).length
        ? metasRaw.map(m=> metaCnt.get(m)===1?"meta::Custom":"meta::"+m)
        : ["meta::no metadata"];
    const ontsRaw=(d.ontology||"").split(";").map(s=>s.trim());
    const onts = ontsRaw.filter(Boolean).length
        ? ontsRaw.map(o=> ontoCnt.get(o)===1?"onto::Custom Ontology":"onto::"+o)
        : ["onto::no ontology"];
    const domain=d.DOMAIN?.trim()?`domain::${d.DOMAIN.trim()}`:null;
    if(!domain) return;
    tools.forEach(t=>metas.forEach(m=>onts.forEach(o=>{
      raw.push({s:t,t:m}); raw.push({s:m,t:o}); raw.push({s:o,t:domain});
    })));
  });

  /* ------ aggregate duplicates ------ */
  const linkMap=new Map();
  raw.forEach(l=>{
    const k=l.s+"|||"+l.t;
    linkMap.set(k,(linkMap.get(k)||0)+1);
  });
  const links=Array.from(linkMap,([k,v])=>{
    const [s,t]=k.split("|||"); return{source:s,target:t,value:v};
  });

  /* ------ node list ------ */
  const nodes=[...new Set(links.flatMap(l=>[l.source,l.target]))].map(n=>({name:n}));
  const idx=Object.fromEntries(nodes.map((d,i)=>[d.name,i]));
  const graph={
    nodes,
    links:links.map(l=>({source:idx[l.source],target:idx[l.target],value:l.value}))
  };

  /* ------ layout ------ */
  const sk=sankey().nodeWidth(15).nodePadding(12).extent([[1,1],[cfg.w-1,cfg.h-6]]);
  sk(graph);

  /* ------ pastel distinct colours (schemeSet2 cycling) ------ */
  const base=d3.schemeSet2;
  graph.nodes.sort((a,b)=>d3.ascending(a.name,b.name))
        .forEach((n,i)=>{ n.col = base[i % base.length]; });

  /* ------ render ------ */
  const g=svg.append("g");
  g.append("g").selectAll("path")
    .data(graph.links.sort((a,b)=>b.width-a.width))
    .join("path")
      .attr("d",sankeyLinkHorizontal())
      .attr("fill","none")
      .attr("stroke",d=>d.target.col)
      .attr("stroke-width",d=>Math.max(1,d.width))
      .attr("stroke-linecap","butt")
      .attr("stroke-opacity",0.75)
      .append("title")
      .text(d=>`${d.source.name.replace(/^.*::/,"")} → ${d.target.name.replace(/^.*::/,"")}: ${d.value}`);

  const n=g.append("g").selectAll("g")
           .data(graph.nodes).join("g")
           .attr("transform",d=>`translate(${d.x0},${d.y0})`);
  n.append("rect")
   .attr("width",sk.nodeWidth())
   .attr("height",d=>d.y1-d.y0)
   .attr("fill",d=>d.col)
   .attr("stroke","#000");
  n.append("text")
   .attr("x",d=>d.x0<cfg.w/2?sk.nodeWidth()+6:-6)
   .attr("y",d=>(d.y1-d.y0)/2)
   .attr("dy","0.35em")
   .attr("text-anchor",d=>d.x0<cfg.w/2?"start":"end")
   .style("font-size",FSIZE)
   .text(d=>d.name.replace(/^.*::/,""));
}
