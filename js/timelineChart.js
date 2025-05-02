/* timelineCharts.js  —  three stacked‑bar timelines (Tools, Metadata, Ontology) */
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { createSVG, FSIZE } from "./utils.js";

export function drawTimelines(data){
  const fields=[
    {field:"TOOLS",     svg:"#tool-time",     legend:"#tool-legend"},
    {field:"metadata",  svg:"#metadata-time", legend:"#metadata-legend"},
    {field:"ontology",  svg:"#ontology-time", legend:"#ontology-legend"}
  ];

  /* helper to split semicolon list */
  const split = s => (s||"").split(";").map(t=>t.trim()).filter(Boolean);

  /* collect full span of years */
  const yearSet=new Set();
  data.forEach(d=>{
    const s=+d["START YEAR"], e=d["END YEAR"]?+d["END YEAR"]:2025;
    if(!s) return; for(let y=s;y<=e;y++) yearSet.add(y);
  });
  const allYears=[...yearSet].sort((a,b)=>a-b);

  /* pastel-ish palette cycling through schemeSet2 */
  const palette=d3.schemeSet2;

  /* draw each timeline */
  fields.forEach(({field,svg:svgSel,legend})=>{
    const list=[];
    data.forEach(d=>{
      const s=+d["START YEAR"], e=d["END YEAR"]?+d["END YEAR"]:2025;
      if(!s) return;
      const items=split(d[field]);
      const noLabel=`no ${field.toLowerCase()}`;
      const labels=items.length?items:[noLabel];
      labels.forEach(l=>{ for(let y=s;y<=e;y++) list.push({key:l,year:y}); });
    });

    /* aggregate counts */
    const map=new Map();
    list.forEach(({key,year})=>{
      if(!map.has(key)) map.set(key,new Map());
      const m=map.get(key); m.set(year,(m.get(year)||0)+1);
    });

    const keys=[...map.keys()];
    /* colour map cycling through palette */
    const colMap=new Map(keys.map((k,i)=>[k,palette[i%palette.length]]));

    /* stacked data rows */
    const rows=allYears.map(y=>{
      const r={year:y}; keys.forEach(k=>r[k]=map.get(k).get(y)||0); return r; });

    /* scales */
    const margin={t:30,r:10,b:30,l:120};
    const fullW=1000, fullH=300;
    const w=fullW-margin.l-margin.r, h=fullH-margin.t-margin.b;
    const svg=createSVG({sel:svgSel,w:h?fullW:fullW,h:fullH,m:margin});
    const x=d3.scaleBand().domain(allYears).range([0,w]).padding(0.1);
    const y=d3.scaleLinear().domain([0,d3.max(rows,r=>keys.reduce((s,k)=>s+r[k],0))]).nice().range([h,0]);

    /* draw */
    const stack=d3.stack().keys(keys)(rows);
    svg.append("g").selectAll("g").data(stack).join("g")
       .attr("fill",d=>colMap.get(d.key))
       .selectAll("rect").data(d=>d).join("rect")
         .attr("x",d=>x(d.data.year))
         .attr("y",d=>y(d[1]))
         .attr("height",d=>y(d[0])-y(d[1]))
         .attr("width",x.bandwidth())
         .append("title")
         .text(d=>`${d.data.year}: ${d[1]-d[0]} project(s)`);

    svg.append("g").attr("transform",`translate(0,${h})`).call(d3.axisBottom(x).tickFormat(d3.format("d")));
    svg.append("g").call(d3.axisLeft(y));

    /* legend centered below chart */
    const div=document.querySelector(legend);
    if(!div){ console.warn(`Legend container '${legend}' not found`); return; }
    div.innerHTML="";
    div.style.display="flex";
    div.style.justifyContent="center";
    div.style.alignItems="center";
    div.style.gap="10px";
    keys.forEach(k=>{
      const item=document.createElement("div");
      item.className="legend-item";
      item.innerHTML=`<span class='legend-color' style='background:${colMap.get(k)}'></span>${k}`;
      div.appendChild(item);
    });
  });
}
