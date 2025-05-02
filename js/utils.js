/* utils.js */
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
export const FONT = "Lato";
export const FSIZE = "12px";
export const CSV_PATH = "./data/adho2025_updated.csv";

export function createSVG({ sel, w, h, m }) {
  return d3.select(sel)
           .append("svg")
           .attr("width",  w + m.l + m.r)
           .attr("height", h + m.t + m.b)
           .append("g")
           .attr("transform", `translate(${m.l},${m.t})`)
           .style("font-family", FONT);
}

export function downloadSVG(svgEl, name) {
  const blob = new Blob(
    [new XMLSerializer().serializeToString(svgEl)],
    { type: "image/svg+xml" }
  );
  const url  = URL.createObjectURL(blob);
  Object.assign(document.createElement("a"), { href: url, download: `${name}.svg` }).click();
}