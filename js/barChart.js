/* barChart.js -------------------------------------------------- */
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { createSVG, FSIZE } from "./utils.js";

export function drawBar(data){
  /* layout */
  const cfg = { sel:"#barChart", m:{t:20,r:30,b:40,l:50}, w:400, h:200 };
  const svg = createSVG(cfg);
  const formats = ["text","image","audiovisual","3D"];

  /* counts */
  const counts = formats.map(f => ({
    f,
    c: data.filter(d => d[f]?.toLowerCase() === "true").length
  }));

  /* scales */
  const x = d3.scaleBand().domain(formats).range([0,cfg.w]).padding(0.2);
  const y = d3.scaleLinear()
              .domain([0, d3.max(counts, d => d.c)])
              .range([cfg.h, 0]);

  /* muted distinct colours */
  const color = d3.scaleOrdinal()
                  .domain(formats)
                  .range(d3.schemeSet2);   // 8 gentle, clearly different colours

  /* axes */
  svg.append("g")
     .attr("transform", `translate(0,${cfg.h})`)
     .call(d3.axisBottom(x));
  svg.append("g")
     .call(d3.axisLeft(y))
     .selectAll(".domain,text,line")
     .remove();

  /* bars */
  svg.selectAll("rect")
     .data(counts)
     .join("rect")
       .attr("x", d => x(d.f))
       .attr("y", d => y(d.c))
       .attr("width", x.bandwidth())
       .attr("height", d => cfg.h - y(d.c))
       .attr("fill", d => color(d.f));

  /* labels */
  svg.selectAll("text.label")
     .data(counts)
     .join("text")
       .attr("x", d => x(d.f) + x.bandwidth() / 2)
       .attr("y", d => y(d.c) - 5)
       .attr("text-anchor", "middle")
       .style("font-size", FSIZE)
       .text(d => d.c);
}