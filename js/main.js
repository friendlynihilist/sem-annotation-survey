/* main.js */
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { CSV_PATH, downloadSVG } from "./utils.js";
import { drawBar } from "./barChart.js";
import { drawPie } from "./pieChart.js";
import { drawSankey } from "./sankeyChart.js";
import { drawHeatmap } from "./heatmapChart.js";
import { drawSankey2 } from "./sankeyChart2.js";
import { drawTimelines } from "./timelineChart.js";

d3.csv(CSV_PATH).then((data) => {
  drawBar(data);
  drawPie(data);
  drawSankey(data);
  drawHeatmap(data);
  drawSankey2(data);
  drawTimelines(data);

  /* Hook up export buttons */
  ["bar", "pie", "sankey", "heatmap", "sankey2", "timelines"].forEach((id) => {
    document.getElementById(`save${id}`).onclick = () =>
      downloadSVG(document.querySelector(`#${id}Chart svg`), id);
  });
});
