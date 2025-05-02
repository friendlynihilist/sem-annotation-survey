// Refactored Visualization Dashboard Code with Bar, Pie, Sankey, and Heatmap

const loadCSV = path => d3.csv(path);
const FONT = "Lato", FONT_SIZE = "12px";

// Shared utility to create SVG canvas
const createSVG = (selector, width, height, margin) =>
  d3.select(selector).append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`)
    .style("font-family", FONT);

// Bar Chart
function drawBarChart(data) {
  const margin = { top: 20, right: 30, bottom: 40, left: 50 }, width = 400 - margin.left - margin.right, height = 200 - margin.top - margin.bottom;
  const svg = createSVG("#barChart", width, height, margin).style("text-anchor", "middle").style("font-size", FONT_SIZE);

  const formats = ["text", "image", "audiovisual", "3D"];
  const counts = formats.map(f => ({ format: f, count: data.filter(d => d[f].toLowerCase() === "true").length }));
  const x = d3.scaleBand().domain(formats).range([0, width]).padding(0.2);
  const y = d3.scaleLinear().domain([0, d3.max(counts, d => d.count)]).range([height, 0]);
  const color = d3.scaleOrdinal().domain(formats).range(d3.schemePastel1);

  svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
  svg.append("g").call(d3.axisLeft(y)).selectAll(".domain, text, line").remove();

  svg.selectAll(".bar").data(counts).enter().append("rect")
    .attr("x", d => x(d.format)).attr("y", d => y(d.count))
    .attr("width", x.bandwidth()).attr("height", d => height - y(d.count))
    .attr("fill", d => color(d.format));

  svg.selectAll(".label").data(counts).enter().append("text")
    .attr("x", d => x(d.format) + x.bandwidth() / 2).attr("y", d => y(d.count) - 5)
    .attr("text-anchor", "middle").text(d => d.count);
}

// Pie Chart
function drawPieChart(data) {
  const size = 200, radius = size / 2;
  const svg = createSVG("#pieChart", size, size, { top: 0, left: 0, right: 0, bottom: 0 })
    .attr("transform", `translate(${radius},${radius})`);

  const pieData = Array.from(
    d3.rollup(data, v => v.length, d => d.EVALUATION.toLowerCase() === "true" ? "With Evaluation" : "Without Evaluation"),
    ([key, value]) => ({ key, value })
  );

  const color = d3.scaleOrdinal().domain(pieData.map(d => d.key)).range(d3.schemePastel1);
  const pie = d3.pie().value(d => d.value);
  const arc = d3.arc().innerRadius(0).outerRadius(radius);

  svg.selectAll("path").data(pie(pieData)).enter().append("path")
    .attr("d", arc).attr("fill", d => color(d.data.key)).attr("stroke", "white").style("stroke-width", "2px");

  svg.selectAll("text").data(pie(pieData)).enter().append("text")
    .text(d => `${d.data.key}: ${d.data.value}`)
    .attr("transform", d => `translate(${arc.centroid(d)})`)
    .style("text-anchor", "middle").style("font-size", FONT_SIZE);
}

// Sankey Chart
function drawSankeyChart(data) {
  const margin = { top: 20, right: 20, bottom: 20, left: 20 }, width = 800 - margin.left - margin.right, height = 400 - margin.top - margin.bottom;
  const svg = createSVG("#sankeyChart", width, height, margin);

  const sankey = d3.sankey().nodeWidth(20).nodePadding(10).extent([[1, 1], [width - 1, height - 1]]);
  const links = [], nodes = new Set();

  data.forEach(row => {
    const targets = row.TARGET?.split(",").map(d => d.trim()) || [];
    const purposes = row.PURPOSES?.split(",").map(d => d.trim()) || [];
    const audiences = row.AUDIENCE?.split(",").map(d => d.trim()) || [];

    targets.forEach(target => {
      nodes.add(target);
      purposes.forEach(purpose => {
        nodes.add(purpose);
        links.push({ source: target, target: purpose, value: 1 });
        audiences.forEach(audience => {
          nodes.add(audience);
          links.push({ source: purpose, target: audience, value: 1 });
        });
      });
    });
  });

  const nodeArr = Array.from(nodes).map((name, index) => ({ name, index }));
  const nodeIdx = Object.fromEntries(nodeArr.map((d, i) => [d.name, i]));
  const sankeyLinks = links.map(link => ({
    source: nodeIdx[link.source],
    target: nodeIdx[link.target],
    value: link.value
  }));

  const sankeyData = { nodes: nodeArr, links: sankeyLinks };
  const graph = sankey(sankeyData);

  const color = d3.scaleOrdinal(d3.schemeTableau10);

  svg.append("g").selectAll("path").data(graph.links).join("path")
    .attr("d", d3.sankeyLinkHorizontal())
    .attr("fill", "none")
    .attr("stroke", d => color(graph.nodes[d.target].name))
    .attr("stroke-width", d => Math.max(1, d.width))
    .attr("stroke-opacity", 0.8);

  svg.append("g").selectAll("rect").data(graph.nodes).join("rect")
    .attr("x", d => d.x0).attr("y", d => d.y0)
    .attr("width", d => d.x1 - d.x0).attr("height", d => d.y1 - d.y0)
    .attr("fill", d => color(d.name)).attr("stroke", "#000");

  svg.append("g").selectAll("text").data(graph.nodes).join("text")
    .attr("x", d => (d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6))
    .attr("y", d => (d.y0 + d.y1) / 2)
    .attr("text-anchor", d => (d.x0 < width / 2 ? "start" : "end"))
    .attr("alignment-baseline", "middle")
    .text(d => d.name).style("font-family", FONT).style("font-size", FONT_SIZE);
}

// Heatmap
function drawHeatmap(data) {
  const margin = { top: 50, right: 20, bottom: 70, left: 200 }, width = 800 - margin.left - margin.right, height = 400 - margin.top - margin.bottom;
  const svg = createSVG("#heatmapChart", width, height, margin);
  const heatmapData = [];

  data.forEach(row => {
    const metadata = row.metadata?.split(",").map(d => d.trim()) || [];
    const ontology = row.ontology?.split(",").map(d => d.trim()) || [];
    const tools = row.TOOLS?.split(",").map(d => d.trim()) || [];
    metadata.forEach(meta => tools.forEach(tool => heatmapData.push({ category: meta, tool, type: "metadata", count: 1 })));
    ontology.forEach(ont => tools.forEach(tool => heatmapData.push({ category: ont, tool, type: "ontology", count: 1 })));
  });

  const aggregated = d3.rollups(heatmapData, v => d3.sum(v, d => d.count), d => d.category, d => d.tool);
  const formatted = [], categories = new Set(), tools = new Set();
  aggregated.forEach(([cat, entries]) => {
    categories.add(cat);
    entries.forEach(([tool, count]) => {
      tools.add(tool);
      formatted.push({ category: cat, tool, count });
    });
  });

  const cellSize = Math.min(width / tools.size, height / categories.size);
  const x = d3.scaleBand().domain(Array.from(tools)).range([0, cellSize * tools.size]).padding(0.05);
  const y = d3.scaleBand().domain(Array.from(categories)).range([0, cellSize * categories.size]).padding(0.05);
  const color = d3.scaleSequential().interpolator(d3.interpolateBlues).domain([0, d3.max(formatted, d => d.count)]);

  svg.append("g").attr("transform", `translate(0,${cellSize * categories.size})`).call(d3.axisBottom(x)).selectAll("text")
    .attr("transform", "rotate(-45)").style("text-anchor", "end").style("font-family", FONT).style("font-size", FONT_SIZE);

  const yAxis = svg.append("g").call(d3.axisLeft(y));
  yAxis.selectAll("text").style("fill", d => heatmapData.find(i => i.category === d)?.type === "metadata" ? "#2eaa70" : "#3082bc")
    .style("font-size", FONT_SIZE).style("font-family", FONT);

  svg.selectAll("rect").data(formatted).enter().append("rect")
    .attr("x", d => x(d.tool)).attr("y", d => y(d.category))
    .attr("width", cellSize).attr("height", cellSize).style("fill", d => color(d.count));

  svg.append("text").attr("x", width / 2).attr("y", -10).attr("text-anchor", "middle")
    .style("font-size", "16px").style("font-weight", "bold").text("Metadata/Ontology vs Tools");
}

function downloadSVG(svgElement, filename) {
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function addExportListeners() {
  ["BarChart", "PieChart", "SankeyChart", "HeatmapChart"].forEach(id => {
    document.getElementById(`save${id}`).addEventListener("click", () => {
      downloadSVG(document.querySelector(`#${id.toLowerCase()} svg`), id.toLowerCase());
    });
  });
}

loadCSV("./data/tabellaexport.csv").then(data => {
  drawBarChart(data);
  drawPieChart(data);
  drawSankeyChart(data);
  drawHeatmap(data);
  addExportListeners();
});