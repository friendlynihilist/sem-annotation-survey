// Set dimensions for the SVG container
const margin = { top: 20, right: 30, bottom: 40, left: 50 };
const width = 400 - margin.left - margin.right;
const height = 200 - margin.top - margin.bottom;

// Append SVG to the chart div
const svgBar = d3
  .select("#barChart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`)
  .style("text-anchor", "middle")
  .style("font-size", "12px")
  .style("font-family", "Lato");

// Load the CSV file
d3.csv("./data/tabellaexport.csv").then((data) => {
  // Prepare data: count projects for each data format
  const formats = ["text", "image", "audiovisual", "3D"];
  const counts = formats.map((format) => ({
    format: format,
    count: data.filter((d) => d[format].toLowerCase() === "true").length,
  }));

  console.log("Counts for each format:", counts); // Debugging output

  // Create a color scale for pastel colors
  const colorScale = d3
    .scaleOrdinal()
    .domain(counts.map((d) => d.format))
    .range(d3.schemePastel1); // Pastel palette

  // Set up scales
  const x = d3
    .scaleBand()
    .domain(counts.map((d) => d.format))
    .range([0, width])
    .padding(0.2);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(counts, (d) => d.count)])
    .range([height, 0]);

  // Add X axis
  svgBar
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  // Add Y axis
//   svgBar.append("g").call(d3.axisLeft(y));

  // Add Y axis and hide its elements
const yAxis = svgBar.append("g").call(d3.axisLeft(y));

// Remove unwanted Y-axis elements
yAxis.select(".domain").remove(); // Remove axis line
yAxis.selectAll("text").remove(); // Remove labels
yAxis.selectAll("line").remove(); // Remove ticks

  // Draw bars
  svgBar
    .selectAll(".bar")
    .data(counts)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", (d) => x(d.format))
    .attr("y", (d) => y(d.count))
    .attr("width", x.bandwidth())
    .attr("height", (d) => height - y(d.count))
    .attr("fill", (d) => colorScale(d.format)); // Apply pastel color scale

  // Add labels
  svgBar
    .selectAll(".label")
    .data(counts)
    .enter()
    .append("text")
    .attr("x", (d) => x(d.format) + x.bandwidth() / 2)
    .attr("y", (d) => y(d.count) - 5)
    .attr("text-anchor", "middle")
    .text((d) => d.count);
});

// document.getElementById("saveAsPng").addEventListener("click", () => {
//   const svgBar = document.querySelector("svg");
//   saveSvgAsPng(svgBar, "visualization.png");
// });

// Prepare data for the pie chart
// Updated Pie Chart Code
d3.csv("./data/tabellaexport.csv").then(data => {
    // Count 'With Evaluation' and 'Without Evaluation'
    const evaluationCounts = d3.rollup(
      data,
      v => v.length,
      d => d.EVALUATION.toLowerCase() === "true" ? "With Evaluation" : "Without Evaluation"
    );
  
    // Convert the map to an array of objects
    const pieData = Array.from(evaluationCounts, ([key, value]) => ({ key, value }));
  
    // Set dimensions for the pie chart
    const width = 200;
    const height = 200;
    const radius = Math.min(width, height) / 2;
  
    // Append an SVG for the pie chart
    const svgPie = d3.select("#pieChart")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);
  
    // Create a pastel color scale
    const color = d3.scaleOrdinal()
      .domain(pieData.map(d => d.key))
      .range(d3.schemePastel1); // Use D3's built-in pastel palette
  
    // Generate the pie
    const pie = d3.pie()
      .value(d => d.value);
  
    // Generate the arcs
    const arc = d3.arc()
      .innerRadius(0) // Full pie
      .outerRadius(radius);
  
    // Draw the pie slices
    svgPie.selectAll("path")
      .data(pie(pieData))
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", d => color(d.data.key))
      .attr("stroke", "white")
      .style("stroke-width", "2px");
  
    // Add labels
    svgPie.selectAll("text")
      .data(pie(pieData))
      .enter()
      .append("text")
      .text(d => `${d.data.key}: ${d.data.value}`)
      .attr("transform", d => `translate(${arc.centroid(d)})`)
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-family", "Lato"); // Set font to Lato
  });


// Set up SVG container for the Sankey Diagram
// Define margins and dimensions
const marginSankey = { top: 20, right: 20, bottom: 20, left: 20 };
const widthSankey = 800 - marginSankey.left - marginSankey.right;
const heightSankey = 400 - marginSankey.top - marginSankey.bottom;

const svgSankey = d3
  .select("#sankeyChart")
  .append("svg")
  .attr("width", widthSankey + marginSankey.left + marginSankey.right)
  .attr("height", heightSankey + marginSankey.top + marginSankey.bottom)
  .append("g")
  .attr("transform", `translate(${marginSankey.left},${marginSankey.top})`);

// Set up Sankey diagram generator
const sankey = d3.sankey()
  .nodeWidth(20)
  .nodePadding(10)
  .extent([[1, 1], [widthSankey - 1, heightSankey - 1]]);

// Load the CSV file and process data
d3.csv("./data/tabellaexport.csv").then((data) => {
  const links = [];
  const nodes = new Set();

  // Process each row to generate links and nodes
  data.forEach((row) => {
    const targets = row.TARGET ? row.TARGET.split(",").map((d) => d.trim()) : [];
    const purposes = row.PURPOSES ? row.PURPOSES.split(",").map((d) => d.trim()) : [];
    const audiences = row.AUDIENCE ? row.AUDIENCE.split(",").map((d) => d.trim()) : [];

    targets.forEach((target) => {
      nodes.add(target);
      purposes.forEach((purpose) => {
        nodes.add(purpose);
        links.push({ source: target, target: purpose, value: 1 });

        audiences.forEach((audience) => {
          nodes.add(audience);
          links.push({ source: purpose, target: audience, value: 1 });
        });
      });
    });
  });

  // Convert nodes Set to array with indices
  const nodesArray = Array.from(nodes).map((name, index) => ({ name, index }));

  // Map node names to indices for Sankey
  const nodesIndex = Object.fromEntries(nodesArray.map((d) => [d.name, d.index]));

  // Update links with numeric indices
  const sankeyLinks = links.map((link) => ({
    source: nodesIndex[link.source],
    target: nodesIndex[link.target],
    value: link.value,
  }));

  // Define the Sankey graph structure
  const sankeyData = {
    nodes: nodesArray,
    links: sankeyLinks,
  };

  // Generate the Sankey diagram
  const graph = sankey(sankeyData);

  // Define color palettes
  const colorPalettes = {
    TARGET: d3.schemeGreens[5], // Sage green tones
    PURPOSES: d3.schemeBlues[5], // Light blue tones
    AUDIENCE: d3.schemeYlOrBr[5], // Yellowish tones
  };

  // Create a color map for unique colors per node
  const colorMap = {};
  let paletteCounters = { TARGET: 0, PURPOSES: 0, AUDIENCE: 0 };

  const getNodeColor = (node) => {
    if (!node || !node.name) return "#ccc"; // Default fallback color for undefined nodes
  
    if (!colorMap[node.name]) {
      const depth = graph.nodes.find((d) => d.name === node.name)?.depth;
      let palette, key;
  
      if (depth === 0) {
        palette = colorPalettes.TARGET;
        key = "TARGET";
      } else if (depth === 1) {
        palette = colorPalettes.PURPOSES;
        key = "PURPOSES";
      } else {
        palette = colorPalettes.AUDIENCE;
        key = "AUDIENCE";
      }
  
      // Assign a unique color within the palette
      colorMap[node.name] = palette[paletteCounters[key] % palette.length];
      paletteCounters[key]++;
    }
  
    return colorMap[node.name];
  };

// Draw the links
svgSankey
  .append("g")
  .selectAll("path")
  .data(graph.links)
  .join("path")
  .attr("d", d3.sankeyLinkHorizontal())
  .attr("fill", "none")
  .attr("stroke", (d) => getNodeColor(graph.nodes[d.target])) // Get the target node's color
  .attr("stroke-width", (d) => Math.max(1, d.width))
  .attr("stroke-opacity", 0.8); // Adjust opacity for clarity



  // Draw the nodes
  svgSankey
    .append("g")
    .selectAll("rect")
    .data(graph.nodes)
    .join("rect")
    .attr("x", (d) => d.x0)
    .attr("y", (d) => d.y0)
    .attr("width", (d) => d.x1 - d.x0)
    .attr("height", (d) => d.y1 - d.y0)
    .attr("fill", (d) => getNodeColor(d))
    .attr("stroke", "#000");

  // Add node labels
  svgSankey
    .append("g")
    .selectAll("text")
    .data(graph.nodes)
    .join("text")
    .attr("x", (d) => (d.x0 < widthSankey / 2 ? d.x1 + 6 : d.x0 - 6))
    .attr("y", (d) => (d.y0 + d.y1) / 2)
    .attr("text-anchor", (d) => (d.x0 < widthSankey / 2 ? "start" : "end"))
    .attr("alignment-baseline", "middle")
    .text((d) => d.name)
    .style("font-family", "Lato")
    .style("font-size", "12px");
});

// Define base dimensions
let marginHeatmap = { top: 50, right: 20, bottom: 70, left: 200 };
const widthHeatmap = 800 - marginHeatmap.left - marginHeatmap.right;
const heightHeatmap = 400 - marginHeatmap.top - marginHeatmap.bottom;

// Append SVG to the heatmap div
const svgHeatmap = d3
  .select("#heatmapChart")
  .append("svg")
  .attr("width", widthHeatmap + marginHeatmap.left + marginHeatmap.right)
  .attr("height", heightHeatmap + marginHeatmap.top + marginHeatmap.bottom)
  .append("g")
  .attr("transform", `translate(${marginHeatmap.left},${marginHeatmap.top})`)
  .style("font-family", "Lato"); // Apply Lato font to the entire SVG

// Load the CSV file
d3.csv("./data/tabellaexport.csv").then((data) => {
  const heatmapData = [];

  // Process data: count occurrences of TOOLS for metadata and ontology
  data.forEach((row) => {
    const metadata = row.metadata ? row.metadata.split(",").map((d) => d.trim()) : [];
    const ontology = row.ontology ? row.ontology.split(",").map((d) => d.trim()) : [];
    const tools = row.TOOLS ? row.TOOLS.split(",").map((d) => d.trim()) : [];

    metadata.forEach((meta) => {
      tools.forEach((tool) => {
        heatmapData.push({ category: meta, tool, type: "metadata", count: 1 });
      });
    });

    ontology.forEach((onto) => {
      tools.forEach((tool) => {
        heatmapData.push({ category: onto, tool, type: "ontology", count: 1 });
      });
    });
  });

  // Aggregate data by category and tool
  const aggregatedData = d3.rollups(
    heatmapData,
    (v) => d3.sum(v, (d) => d.count),
    (d) => d.category,
    (d) => d.tool
  );

  // Transform aggregated data into flat format for the heatmap
  const formattedData = [];
  const categories = new Set();
  const tools = new Set();

  aggregatedData.forEach(([category, toolsData]) => {
    categories.add(category);
    toolsData.forEach(([tool, count]) => {
      tools.add(tool);
      formattedData.push({ category, tool, count });
    });
  });

  // Calculate maximum label width for dynamic margin
  const yAxisMaxLabelWidth = Array.from(categories).reduce((max, label) => {
    const textWidth = label.length * 7; // Approximate width per character
    return Math.max(max, textWidth);
  }, 0);

  // Adjust margin and reconfigure SVG size
  marginHeatmap.left = Math.max(100, yAxisMaxLabelWidth + 20);
  svgHeatmap.attr(
    "transform",
    `translate(${marginHeatmap.left},${marginHeatmap.top})`
  );

  // Scales for the heatmap
  const cellSize = Math.min(widthHeatmap / tools.size, heightHeatmap / categories.size);
  const x = d3.scaleBand().domain(Array.from(tools)).range([0, cellSize * tools.size]).padding(0.05);
  const y = d3
    .scaleBand()
    .domain(Array.from(categories))
    .range([0, cellSize * categories.size])
    .padding(0.05);

  const color = d3
    .scaleSequential()
    .interpolator(d3.interpolateBlues)
    .domain([0, d3.max(formattedData, (d) => d.count)]);

 // Add axes
svgHeatmap
.append("g")
.attr("transform", `translate(0,${cellSize * categories.size})`)
.call(d3.axisBottom(x))
.selectAll("text")
.attr("transform", "rotate(-45)")
.style("text-anchor", "end")
.style("font-family", "Lato") // Apply Lato font to x-axis labels
.style("font-size", "12px") // Set font size for x-axis labels
.style("fill", "#555"); // Neutral gray color for x-axis labels

const yAxis = svgHeatmap.append("g").call(d3.axisLeft(y));

// Style y-axis labels with pastel colors
yAxis.selectAll("text")
.style("fill", (d) => {
  // Apply pastel colors based on type
  const type = heatmapData.find((item) => item.category === d)?.type;
  return type === "metadata" ? "#2eaa70" : "#3082bc"; // Pastel green for metadata, pastel orange for ontology
})
// .style("font-weight", "bold")
.style("font-size", "12px") // Font size for y-axis labels
.style("font-family", "Lato"); // Apply Lato font to y-axis labels


  // Draw the heatmap squares
  svgHeatmap
    .selectAll("rect")
    .data(formattedData)
    .enter()
    .append("rect")
    .attr("x", (d) => x(d.tool))
    .attr("y", (d) => y(d.category))
    .attr("width", cellSize)
    .attr("height", cellSize)
    .style("fill", (d) => color(d.count));

  // Add title
  svgHeatmap
    .append("text")
    .attr("x", widthHeatmap / 2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .style("font-family", "Lato") // Font for title
    // .text("Heatmap of Metadata/Ontology vs Tools");
});

// Save Bar Chart as PNG
document.getElementById("saveBarChart").addEventListener("click", () => {
    const svgBar = document.querySelector("#barChart svg");
    saveSvgAsPng(svgBar, "bar_chart.png");
  });
  
  // Save Pie Chart as PNG
  document.getElementById("savePieChart").addEventListener("click", () => {
    const svgPie = document.querySelector("#pieChart svg");
    saveSvgAsPng(svgPie, "pie_chart.png");
  });
  
  // Save Sankey Chart as PNG
  document.getElementById("saveSankeyChart").addEventListener("click", () => {
    const svgSankey = document.querySelector("#sankeyChart svg");
    saveSvgAsPng(svgSankey, "sankey_chart.png");
  });
  
  // Save Heatmap as PNG
  document.getElementById("saveHeatmapChart").addEventListener("click", () => {
    const svgHeatmap = document.querySelector("#heatmapChart svg");
    saveSvgAsPng(svgHeatmap, "heatmap.png");
  });

