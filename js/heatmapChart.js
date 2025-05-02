/* heatmapChart.js -------------------------------------------------- */
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { createSVG, FSIZE } from "./utils.js";

export function drawHeatmap(data){
  /* bigger canvas & extra right margin for legend */
  const cfg = {
    sel:"#heatmapChart",
    m:{ t:50, r:120, b:70, l:200 },
    w:1000,
    h:600
  };
  const svg = createSVG(cfg);

  /* ---------- flatten rows -> {category,tool,type,count} ---------- */
  const rows=[];
  data.forEach(r=>{
    const meta = r.metadata?.split(",").map(s=>s.trim()).filter(Boolean)||[];
    const onto = r.ontology?.split(",").map(s=>s.trim()).filter(Boolean)||[];
    const tools= r.TOOLS   ?.split(",").map(s=>s.trim()).filter(Boolean)||[];
    meta.forEach(m => tools.forEach(t => rows.push({c:m,t,type:"meta"})));
    onto.forEach(o=> tools.forEach(t => rows.push({c:o,t,type:"onto"})));
  });

  /* ---------- aggregate counts ---------- */
  const agg = d3.rollups(rows,v=>v.length,d=>d.c,d=>d.t);
  const cats=new Set(), tools=new Set(), cells=[];
  agg.forEach(([c,arr])=>{
    cats.add(c);
    arr.forEach(([t,v])=>{ tools.add(t); cells.push({c,t,v}); });
  });
  if(!cats.size || !tools.size) return;   // nothing to draw

  /* ---------- scales ---------- */
  const cell = Math.min(cfg.w/tools.size, cfg.h/cats.size);
  const x = d3.scaleBand().domain([...tools])
               .range([0, cell*tools.size]).padding(0.05);
  const y = d3.scaleBand().domain([...cats])
               .range([0, cell*cats.size]).padding(0.05);
  const col = d3.scaleSequential(d3.interpolateBlues)
                .domain([0, d3.max(cells,d=>d.v)]);

  /* ---------- axes ---------- */
  svg.append("g")
     .attr("transform",`translate(0,${cell*cats.size})`)
     .call(d3.axisBottom(x))
     .selectAll("text")
       .attr("transform","rotate(-45)")
       .style("text-anchor","end")
       .style("font-size",FSIZE);

  svg.append("g").call(d3.axisLeft(y))
     .selectAll("text")
       .style("fill",d=> rows.find(i=>i.c===d).type==="meta" ? "#2eaa70" : "#3082bc")
       .style("font-size",FSIZE);

  /* ---------- cells ---------- */
  svg.selectAll("rect")
     .data(cells)
     .join("rect")
       .attr("x",d=>x(d.t)).attr("y",d=>y(d.c))
       .attr("width",cell).attr("height",cell)
       .attr("fill",d=>col(d.v));

  /* ---------- title ---------- */
  svg.append("text")
     .attr("x",cfg.w/2).attr("y",-10).attr("text-anchor","middle")
     .style("font-size","18px").style("font-weight","bold")
     .text("Metadata / Ontology vs. Tools");

  /* ---------- right‑side legend ---------- */
  const legendX = cell*tools.size + 20;
  const legend  = svg.append("g")
                     .attr("transform",`translate(${legendX},0)`)
                     .style("font-size",FSIZE);

  const items=[{label:"metadata", col:"#2eaa70"},
               {label:"ontology", col:"#3082bc"}];
  const spacing = 70;

  items.forEach((d,i)=>{
    legend.append("rect")
          .attr("x",0).attr("y",i*spacing)
          .attr("width",12).attr("height",12)
          .attr("fill",d.col);
    legend.append("text")
          .attr("x",18).attr("y",i*spacing+6)
          .attr("transform",`rotate(90,18,${i*spacing+6})`)
          .attr("alignment-baseline","middle")
          .text(d.label);
  });
}