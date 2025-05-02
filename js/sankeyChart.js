/* flowSankeyChart.js  —  TARGET → PURPOSES → AUDIENCE Sankey (soft distinct colours) */
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { sankey, sankeyLinkHorizontal } from "https://cdn.jsdelivr.net/npm/d3-sankey@0.12/+esm";
import { createSVG, FSIZE } from "./utils.js";

export function drawSankey(data){
  /* canvas */
  const cfg = { sel: "#sankeyChart", m:{t:20,r:20,b:20,l:20}, w:800, h:400 };
  const svg = createSVG(cfg);

  /* collect links + node set */
  const rows = [], nodeSet = new Set();
  data.forEach(r=>{
    const targets = r.TARGET?.split(",").map(s=>s.trim()).filter(Boolean)||[];
    const purposes= r.PURPOSES?.split(",").map(s=>s.trim()).filter(Boolean)||[];
    const audiences= r.AUDIENCE?.split(",").map(s=>s.trim()).filter(Boolean)||[];
    targets.forEach(t=>{
      nodeSet.add(t);
      purposes.forEach(p=>{
        nodeSet.add(p); rows.push({s:t,t:p});
        audiences.forEach(a=>{ nodeSet.add(a); rows.push({s:p,t:a}); });
      });
    });
  });

  /* nodes array + index map */
  const nodes=[...nodeSet].map(n=>({name:n}));
  const idx=Object.fromEntries(nodes.map((d,i)=>[d.name,i]));
  const links=rows.map(l=>({source:idx[l.s],target:idx[l.t],value:1}));

  /* layout */
  const graph = sankey().nodeWidth(20).nodePadding(10)
                        .extent([[1,1],[cfg.w-1,cfg.h-1]])({nodes,links});

  /* pastel distinct colours cycling through schemeSet2 */
  const palette=d3.schemeSet2;
  graph.nodes.sort((a,b)=>d3.ascending(a.name,b.name))
            .forEach((n,i)=>{ n.col = palette[i % palette.length]; });

  /* render */
  const g = svg.append("g");

  g.append("g").selectAll("path")
    .data(graph.links.sort((a,b)=>b.width-a.width))
    .join("path")
      .attr("d", sankeyLinkHorizontal())
      .attr("fill","none")
      .attr("stroke", d=>d.target.col)
      .attr("stroke-width", d=>Math.max(1,d.width))
      .attr("stroke-linecap","butt")
      .attr("stroke-opacity",0.75)
      .append("title")
      .text(d=>`${d.source.name} → ${d.target.name}: ${d.value}`);

  const n = g.append("g").selectAll("g")
            .data(graph.nodes)
            .join("g")
            .attr("transform",d=>`translate(${d.x0},${d.y0})`);
  n.append("rect")
   .attr("width",d=>d.x1-d.x0)
   .attr("height",d=>d.y1-d.y0)
   .attr("fill",d=>d.col)
   .attr("stroke","#000");
  n.append("text")
   .attr("x",d=>d.x0<cfg.w/2?d.x1-d.x0+6:-6)
   .attr("y",d=>(d.y1-d.y0)/2)
   .attr("text-anchor",d=>d.x0<cfg.w/2?"start":"end")
   .attr("alignment-baseline","middle")
   .style("font-size",FSIZE)
   .text(d=>d.name);
}
