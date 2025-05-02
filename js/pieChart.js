/* pieChart.js -------------------------------------------------- */
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { createSVG, FSIZE } from "./utils.js";

export function drawPie(data){
  const size = 300;
  const radius = size / 2;

  /* SVG centred at (radius, radius) */
  const svg = createSVG({ sel:"#pieChart", w:size, h:size,
                          m:{ t:0, l:0, r:0, b:0 } })
              .attr("transform", `translate(${radius},${radius})`);

  /* data: With vs. Without Evaluation */
  const pieData = Array.from(
    d3.rollup(
      data,
      v => v.length,
      d => d.EVALUATION?.toLowerCase() === "true"
           ? "With Evaluation"
           : "Without Evaluation"
    ),
    ([key, value]) => ({ key, value })
  );

  /* muted distinct colours */
  const color = d3.scaleOrdinal()
                  .domain(pieData.map(d => d.key))
                  .range(d3.schemeSet2);          // gentle but distinct

  const pie = d3.pie().value(d => d.value);
  const arc = d3.arc().innerRadius(0).outerRadius(radius);

  /* slices */
  svg.selectAll("path")
     .data(pie(pieData))
     .join("path")
       .attr("d", arc)
       .attr("fill", d => color(d.data.key))
       .attr("stroke", "#fff")
       .style("stroke-width", "2px");

  /* labels */
  svg.selectAll("text")
     .data(pie(pieData))
     .join("text")
       .attr("transform", d => `translate(${arc.centroid(d)})`)
       .style("text-anchor", "middle")
       .style("font-size", FSIZE)
       .text(d => `${d.data.key}: ${d.data.value}`);
}