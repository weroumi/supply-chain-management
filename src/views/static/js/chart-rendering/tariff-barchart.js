function renderTariffBarchart(data, yearsMap, currentCountry, lowest=true) {
  const categorySelect = d3.select('#category-select');
  const yearRange = document.getElementById('year_range')

  let currentCategory = categorySelect.node().value
  let currentYear = Number(yearsMap.get(Number(yearRange.value)).slice(0, 4))
  let currentBar = null;

  let d3Entries = Object.entries(data[currentCategory][currentYear]).map(([key, value]) => ({ key, value }));
  if(lowest) {
    d3Entries.sort((a, b) => d3.ascending(a.value, b.value))
  } else {
    d3Entries.sort((a, b) => d3.descending(a.value, b.value))
  }
  const n = 10;
  let topNCountries = d3Entries.slice(0, 10);

    const barHeight = 25;
    const marginTop = 10;
    const marginRight = 40;
    const marginBottom = 0;
    const marginLeft = 80;
    const width = 928;
    const height = Math.ceil((n + 0.1) * barHeight) + marginTop + marginBottom;

    d3Entries.forEach(d => {
      d3.select(`.${d.key}`)
      .style('stroke', 'none')
      .style('stroke-opacity', 0);
    })

    let mouseover = function(event, d) {
      currentBar = d.key

      d3.select(`.${d.key}`)
      .raise()
      .style("stroke", "red")
      .style("stroke-opacity", 1);

      d3.select(this)
      .style("stroke", "red")
      .style("stroke-opacity", 1)
      .style("stroke-width", 3);
    }

    let mouseleave = function(event, d) {
      currentBar = null

      d3.select(`.${d.key}`)
      .style("stroke", null)
      .style("stroke-opacity", null)

      d3.select(this)
      .style("stroke", null)
      .style("stroke-opacity", null)
      .style("stroke-width", null);
    }

    // 3) scales — notice we use topNCountries instead of “alphabet”
    const x = d3.scaleLinear()
    .domain([0, d3.max(topNCountries, d => d.value)])
    .nice()
    .range([marginLeft, width - marginRight]);

    const y = d3.scaleBand()
    .domain(topNCountries.map(d => d.key))
    .range([marginTop, height - marginBottom])
    .padding(0.1);

    // 4) create svg
    const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height * 0.75)
    .attr("viewBox", [0, 0, width, height])
    .style("max-width", "100%")
    .style("font", "20px sans-serif");

    // 5) bars
    svg.append("g")
    .selectAll("rect")
    .data(topNCountries)
    .join("rect")
    .attr("x", x(0))
    .attr("y", d => y(d.key))
    .attr("width", d => x(d.value) - x(0))
    .attr("height", y.bandwidth())
    .attr("class", d => `tariff-${d.key}`)
    .on("mouseover", mouseover)
    .on("mouseleave", mouseleave)

    svg.select(`.tariff-${currentCountry}`)
    .style("stroke", "red")
    .style("stroke-opacity", 1)
    .style("stroke-width", 3);

    // 6) labels
    svg.append("g")
    .attr("fill", "black")
    .attr("text-anchor", "end")
    .selectAll("text")
    .data(topNCountries)
    .join("text")
    .attr("x", d => x(d.value))
    .attr("y", d => y(d.key) + y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("dx", -4)
    .text(d => d.value.toFixed(2) + "%")
    .call(text => text.filter(d => (x(d.value) - x(0)) < 20)
    .attr("dx", +4)
    .attr("fill", "black")
    .attr("text-anchor", "start"));
    // 7) axes
    svg.append("g")
    .attr("transform", `translate(0,${marginTop})`)
    .call(d3.axisTop(x).ticks(width / 80))
    .call(g => g.select(".domain").remove())

    // 8) axes labels
    svg.append("text")
    .attr("class", "x-axis-label")
    .attr("text-anchor", "middle")
    .attr("x", (width + marginLeft - marginRight) / 2)
    .attr("y", -25)
    .text("Tariff Rate (%)");
    svg.append("text")
    .attr("class", "y-axis-label")
    .attr("text-anchor", "middle")
    .attr("transform", `rotate(-90)`)
    .attr("x", -(height / 2))
    .attr("y", 15)
    .text("Country");

    svg.append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y).tickSizeOuter(0))

    svg.selectAll("text").style("font-size", "20px")

    if(lowest) {
      document.querySelector("#card-lowest-tariffs").innerHTML = ''
      document.querySelector("#card-lowest-tariffs").appendChild(svg.node())
    } else {
      document.querySelector("#card-highest-tariffs").innerHTML = ''
      document.querySelector("#card-highest-tariffs").appendChild(svg.node())
    }

    categorySelect.on("change", () => {
      renderTariffBarchart(data, yearsMap, lowest);
    })
}