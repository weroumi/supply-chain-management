function renderOrderCountBarchart(data, yearsMap, currentCountry) {
  const categorySelect = d3.select('#category-select');
  const yearRange = document.getElementById('year_range')

  let currentCategory = categorySelect.node().value
  let currentYear = yearsMap.get(Number(yearRange.value))
  let currentBar = null;

  const n = 11;

  const topCountriesByMonth = new Map();

  data.delete("GGG")

    for (const [countryCode, monthMap] of data.entries()) {
      for (const [month, valueObj] of monthMap.entries()) {
        const count = valueObj.count || 0;

        if (!topCountriesByMonth.has(month)) {
          topCountriesByMonth.set(month, []);
        }

        topCountriesByMonth.get(month).push([countryCode, count]);
      }
    }

    // sort and add "Others" as 11th
    for (const [month, countryData] of topCountriesByMonth.entries()) {
      const sorted = countryData.sort((a, b) => b[1] - a[1]);

      const top10 = sorted.slice(0, 10);
      const others = sorted.slice(10);

      const othersTotal = others.reduce((sum, [, count]) => sum + count, 0);
      const othersAvg = others.length > 0 ? othersTotal / others.length : 0;

      top10.push(["Others", othersAvg]);

      topCountriesByMonth.set(month, top10);
    }

    const barHeight = 25;
    const marginTop = 10;
    const marginRight = 40;
    const marginBottom = 0;
    const marginLeft = 80;
    const width = 928;
    const height = Math.ceil((n + 0.1) * barHeight) + marginTop + marginBottom;

    let mouseover = function(event, d) {
      currentBar = d[0]

      d3.select(`.${d[0]}`).raise()
      .style("stroke", "red")
      .style("stroke-opacity", 1);

      d3.select(this)
      .style("stroke", "red")
      .style("stroke-opacity", 1)
      .style("stroke-width", 3);
    }

    let mouseleave = function(event, d) {
      currentBar = null

      d3.select(`.${d[0]}`)
      .style("stroke", null)
      .style("stroke-opacity", null)

      d3.select(this)
      .style("stroke", null)
      .style("stroke-opacity", null)
      .style("stroke-width", null);
    }

    // 3) scales — notice we use topNCountries instead of “alphabet”
    const x = d3.scaleLinear()
    .domain([0, d3.max(topCountriesByMonth.get(currentYear), d => d[1])])
    .nice()
    .range([marginLeft, width - marginRight]);

    const y = d3.scaleBand()
    .domain(topCountriesByMonth.get(currentYear).map(d => d[0]))
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
    .data(topCountriesByMonth.get(currentYear))
    .join("rect")
    .attr("x", x(0))
    .attr("y", d => y(d[0]))
    .attr("width", d => x(d[1]) - x(0))
    .attr("height", y.bandwidth())
    .attr("class", d => `tariff-${d[0]}`)
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
    .data(topCountriesByMonth.get(currentYear))
    .join("text")
    .attr("x", d => x(d[1]))
    .attr("y", d => y(d[0]) + y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("dx", -4)
    .text(d => d[1].toFixed(0))
    .call(text => text.filter(d => (x(d[1]) - x(0)) < 20)
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
    .text("Count of orders");
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

    svg.select(".tariff-Others")
        .attr("fill", "#898989")

    document.querySelector("#card-order-count").innerHTML = ''
    document.querySelector("#card-order-count").appendChild(svg.node())
}