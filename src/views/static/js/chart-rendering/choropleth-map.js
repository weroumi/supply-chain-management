function renderMap(topo, data, tariffs_per_category) {
  let cardWidth = document.querySelector('#card-geo-chart').offsetWidth;
  let windowHeight = window.innerHeight;
  let svgWidth = cardWidth * 0.9; // 80% of card width
  let svgHeight = windowHeight * 0.67; // 80% of window height

  let currentCountry = 'GGG';

  const regions = Array.from(
      new Set(topo.features.map(f => f.properties.continent))
    ).filter(d => d);
  const regionalColorScale = d3.scaleOrdinal()
  .domain(regions)
  .range(d3.schemePastel1);

  // add tools for tariffs
  addTariffChartTools(Object.keys(tariffs_per_category))

  // remove previous diagram
  d3.select("#geo-chart")
  .selectAll('svg')
  .filter(function () {
    return this.id !== "svg-loading-spinner";
  })
  .remove();
  // clear the tools div
  d3.select("#choropleth-map-tools").node().innerHTML = "";
  // remove old tooltip
  d3.selectAll('.tooltip').remove();

  const svg = d3.select("#geo-chart")
      .append("svg")
      .attr('id', "map-svg")
      .attr('width', svgWidth)
      .attr('height', svgHeight)
      .style('background', 'white'),
      g = svg.append("g");

  let world;

  const projection = d3.geoRobinson()
  .scale(130)
  .translate([svgWidth / 2, svgHeight / 2]);


  const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style('position', 'absolute')
  .style("opacity", 0);

  const zoom = d3.zoom()
  .scaleExtent([1, 20])
  .on("zoom", zoomed);

  svg.call(zoom);

  function zoomed(event) {
    const {transform} = event;
    g.attr("transform", transform);
    g.attr("stroke-width", 1 / transform.k);
  }


  d3.select("#mapTitle").text(
      "Countries shipping products for USA and Puerto Rico");
  let mouseOver = function (event, d) {
    currentCountry = d.properties.iso_a3;

    let tariffs_per_year_str = "\n\nTARIFFS:"

    Object.entries(tariffs_per_category['-- All categories']).forEach(([key, value]) => {
      tariffs_per_year_str += `\n${key}: ${value[d.properties.iso_a3] !== undefined ? value[d.properties.iso_a3] + '%' : 'no data'}`
    })

    d3.select(this)
    .raise()
    .transition()
    .duration(200)
    // .style("stroke", colorScale(colorScale.domain()[1]))
    .style("stroke", "red")
    .style("stroke-opacity", 1)
    .style("stroke-width", 1);
    tooltip
    .transition().duration(400)
    .style("opacity", 1)
    .text(`${d.properties.sovereignt} (${yearsMap.get(
        currentYear)})\n ${d.total} orders` + tariffs_per_year_str);

    d3.select(`.tariff-${currentCountry}`)
    .style("stroke", "red")
    .style("stroke-opacity", 1)
    .style("stroke-width", 3);
  }

  let mousemove = function (event, d) {
    tooltip
    .style("left", `${event.pageX + 50}px`)
    .style("top", `${event.pageY - 20}px`);
  }

  let mouseLeave = function (event, d) {
    currentCountry = null;
    d3.select(this)
    .transition()
    .duration(200)
    .style("stroke", "white")
    .style("stroke-width", 1)
    .style("stroke-opacity", 1)
    // .style("stroke-opacity", null);
    tooltip.transition().duration(300)
    .style("opacity", 0);

    d3.select(`.tariff-${d.properties.iso_a3}`)
    .style("stroke", null)
    .style("stroke-opacity", null);
  }

  let click = function (event, d) {
    document.getElementById("chart-container").innerHTML = "";
  }

  function getCountByCountryCode(countryCode) {
    const countryData = data.find(d => d.country_code === countryCode);
    return countryData ? countryData.count : 0;
  }

  function getNameByCountryCode(countryCode) {
    const countryData = data.find(d => d.country_code === countryCode);
    return countryData ? countryData.country_name : "";
  }

  function updateMap(yearKey) {
    renderTariffBarchart(tariffs_per_category, yearsMap, currentCountry, true);
    renderTariffBarchart(tariffs_per_category, yearsMap, currentCountry, false);
    renderOrderCountBarchart(dataMap, yearsMap, currentCountry);

    const year = yearsMap.get(yearKey);
    const date = new Date(year)
    // output mmm yyyy:
    currentYearSvg.text(
        date.toDateString().slice(4, 7) + date.toDateString().slice(10, 15));
    yearRange.node().value = yearKey;

    countries
    .attr("fill", d => {
      let value = dataMap.get(d.properties.iso_a3);
      if (!value) {
        return "#eeeeee";
      }
      value = dataMap.get(d.properties.iso_a3).get(year);
      d.total = value.count;
      d.days_for_shipping_real = value.days_for_shipping_real;
      d.days_for_shipping_scheduled = value.days_for_shipping_scheduled;
      let retVal = value.count != 0 ? colorScale(value.count) : "#eeeeee";
      if (colorSelect.node().value === "Regional" && value.count != 0) {
        retVal = regionalColorScale(d.properties.continent);
      }
      d3.selectAll(`.tariff-${d.properties.iso_a3}`)
          .attr("fill", retVal);
      return retVal;
    })
    .style("stroke", "white")
    .style("stroke-width", 1)
    .style("stroke-opacity", 1);

    d3.select(`.${ currentCountry }`).raise()
    .style("stroke", "red")
    .style("stroke-opacity", 1)
    .style("stroke-width", 1);
  }

  // structure of the map: {country_code: {year: count}}
  const [cumulatedResult, yearsMap, nonCumulatedResult] = generateMapOfCountriesAnnualCount(data);

  let dataMap = cumulatedResult;
  const countryNames = new Map();
  dataMap.forEach((values, key) => {
    countryNames.set(key, getNameByCountryCode(key));
  });
  // colors
  const extent = d3.extent(data, d => d.count);
  const domainMin = Math.max(1e-8, extent[0]);
  const domainMax = extent[1];

  let selectedColorScheme = "Viridis";
  let colorScale = d3.scaleSequentialLog(
      getColorScale(selectedColorScheme)).domain([domainMin, domainMax]);

  // speed
  const defaultSpeed = 300;
  let currentSpeed = defaultSpeed;

  const arrayOfCounts = [];

  topo.features = topo.features.filter(
      feature => feature.properties.name !== 'Antarctica');

  // Draw the map
  world = g.append("g")
  .attr("class", "world")
  .style("pointer-events", "all");
  countries = world.selectAll("path")
  .data(topo.features)
  .enter()
  .append("path")
  // draw each country
  .attr("d", d3.geoPath().projection(projection))
  .attr("data-name", function (d) {
    return d.properties.sovereignt;
  })
  .attr("fill", function (d) {
    d.total = getCountByCountryCode(d.properties.iso_a3);
    if (d.total !== 0) {
      arrayOfCounts.push(d.total);
    }
    return "#eeeeee";
  })
  .attr("backup-fill", function (d, i, nodes) {
    return d3.select(nodes[i]).style("fill");
  })
  .style("stroke", "white")
  .attr("class", function (d) {
    return "Country"
  })
  .attr("class", d => d.properties.iso_a3)
  .attr("id", function (d) {
    return d.country_name;
  })
  .style("stroke-width", 1)
  .style("stroke-opacity", 1)
  .style("pointer-events", "all")
  .on("mouseover", mouseOver)
  .on("mouseleave", mouseLeave)
  .on("mousemove", mousemove)
  .on("click", click);

  // legend
  let ticksCount = 10;
  let n = ticksCount - 1;
  let tickValues = d3.range(ticksCount).map(i => {
    let num = d3.quantile(arrayOfCounts, i / (ticksCount - 1));
    return Math.round(num);
  });
  const legend = Legend(colorScale, {
    title: "Count of orders",
    marginLeft: 5,
    ticks: ticksCount + 100,
    tickValues: tickValues
  });
  const tools = svg.append("g");
  tools.append(() => legend)
  .classed("count-of-publications-legend", true)
  .classed('choropleth', true);

  const legend_element = document.querySelector(
      ".count-of-publications-legend");
  const legend_rect = legend_element.getBoundingClientRect();

  const pt = svg.node().createSVGPoint();
  pt.x = legend_rect.right;
  pt.y = legend_rect.y;
  const svgPoint = pt.matrixTransform(svg.node().getScreenCTM().inverse());

  // timeline
  const minYear = 0;
  const maxYear = yearsMap.size - 1;
  const currentYearSvg = tools.append("text")
  .text(new Date(yearsMap.get(minYear)).toDateString().slice(4, 15))
  .attr('x', svgPoint.x + 15)
  .attr('y', svgPoint.y + legend_rect.height / 2)
  .attr("id", "current_year")
  .classed('my-title', true)
  .style("font-size", "20px")
  .style("font-weight", "bold")
  .attr('fill', "#838383")
  .classed('choropleth', true);

  const [yearRange, playButton, colorSelect, speedSelect, cumulationSelect] = addTimelineElement(
      svg, tools, minYear, maxYear);

  let currentYear = minYear;
  updateMap(currentYear);

  // animation control
  // let intervalId;
  let isPlaying = true;

  function startAnimation() {
    intervalId = d3.interval(() => {
      currentYear = currentYear < maxYear ? currentYear + 1 : 0;
      updateMap(currentYear);
    }, currentSpeed);
  }

  function stopAnimation() {
    if (intervalId) {
      intervalId.stop();
      yearRange.attr("value", currentYear);
      const date = new Date(yearsMap.get(currentYear));
      currentYearSvg.text(
          date.toDateString().slice(4, 7) + date.toDateString().slice(10, 15));
    }
  }

  playButton.on("click", () => {
    if (isPlaying) {
      stopAnimation();
      playButton.text("Play");
    } else {
      startAnimation();
      playButton.text("Pause");
    }
    isPlaying = !isPlaying;
  });
  yearRange.on("input", () => {
    let chosenYear = Number(yearRange.node().value);
    stopAnimation();
    currentYearSvg.text(
        new Date(yearsMap.get(chosenYear)).toDateString().slice(4, 15));
    countries.attr("fill", "#eeeeee");
    updateMap(chosenYear);
    currentYear = chosenYear;
    playButton.text("Play");
    isPlaying = !isPlaying;
  });
  colorSelect.on("change", () => {
    selectedColorScheme = colorSelect.node().value;
    if(selectedColorScheme !== "Regional") {
      colorScale = d3.scaleSequentialLog(
        getColorScale(selectedColorScheme)).domain([domainMin, domainMax]);
    }
    updateMap(currentYear);

    let newLegend = null
    if(selectedColorScheme === "Regional") {
      newLegend = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
      newLegend.setAttribute("x", "0");
      newLegend.setAttribute("y", "0");
      newLegend.setAttribute("width", "320");  // or whatever fits your layout
      newLegend.setAttribute("height", "100");
      const swatches = Swatches(regionalColorScale, {
        columns: 4,
        marginLeft: 5,
        swatchSize: 10
      });

      newLegend.appendChild(swatches);
    } else {
      newLegend = Legend(colorScale, {
        title: "Count of orders",
        marginLeft: 1,
        ticks: ticksCount + 100,
        tickValues: tickValues
      });
    }
    console.log(newLegend)
    newLegend.classList.add("count-of-publications-legend");
    newLegend.classList.add("choropleth")
    document.querySelector(".count-of-publications-legend").replaceWith(
        newLegend);
  });
  speedSelect.on("change", () => {
    currentSpeed = defaultSpeed / Number(speedSelect.node().value);
    if (isPlaying) {
      stopAnimation();
      startAnimation();
    }
  });
  cumulationSelect.on('change', () => {
    if(cumulationSelect.node().value === "Non-cumulated") {
      dataMap = nonCumulatedResult;
      return;
    }
    dataMap = cumulatedResult;
  });
  startAnimation();

  return yearsMap;
}

function generateMapOfCountriesAnnualCount(data) {
  const years = [];
  console.log(data)
  data.forEach(d => {
    if (!years.includes(d.year)) {
      years.push(d.year);
    }
  });

  years.sort();

  const resultMap = new Map();
  const nonCumulatedResult = new Map();
  const groupedData = d3.group(data, d => d.country_code);
  data.sort((x, y) => {
    return d3.ascending(x.year, y.year);
  })
  const groupedDataByYear = d3.group(data, d => d.year);
  // code GGG
  const generalizedData = new Map();
  groupedDataByYear.forEach((values, key) => {
    let mean_days_for_shipping_real = d3.mean(values, d => d.days_for_shipping_real).toFixed(2);
    let mean_days_for_shipping_scheduled = d3.mean(values, d => d.days_for_shipping_scheduled).toFixed(2);
    let mean_count = d3.mean(values, d => d.count).toFixed(2);
    generalizedData.set(key, { 'count':mean_count,
      'days_for_shipping_real':mean_days_for_shipping_real,
      'days_for_shipping_scheduled':mean_days_for_shipping_scheduled })
  });

  groupedData.forEach((values, key) => {
    let yearCounts = new Map();
    let nonCumulatedYearsCount = new Map();

    // set up all years
    // count, days_for_shipping_real, days_for_shipping_scheduled
    years.forEach(year => yearCounts.set(year, { 'count':0, 'days_for_shipping_real':0, 'days_for_shipping_scheduled':0 }));
    years.forEach(year => nonCumulatedYearsCount.set(year, { 'count':0, 'days_for_shipping_real':0, 'days_for_shipping_scheduled':0 }));
    let daysForShippingRealSum = 0;
    let daysForShippingScheduledSum = 0;
    let i = 1;
    values.forEach(entry => {
      const currentCount = yearCounts.get(entry.year).count;

      let cumulatedCount = currentCount > entry.count ? currentCount : entry.count;
      daysForShippingRealSum += entry.days_for_shipping_real;
      daysForShippingScheduledSum += entry.days_for_shipping_scheduled;
      let cumulatedDaysForShippingRealMean = daysForShippingRealSum / i;
      cumulatedDaysForShippingRealMean = cumulatedDaysForShippingRealMean.toFixed(2);
      let cumulatedDaysForShippingScheduledMean = daysForShippingScheduledSum / i;
      cumulatedDaysForShippingScheduledMean = cumulatedDaysForShippingScheduledMean.toFixed(2)

      yearCounts.set(entry.year, { 'count':cumulatedCount, 'days_for_shipping_real':cumulatedDaysForShippingRealMean, 'days_for_shipping_scheduled':cumulatedDaysForShippingScheduledMean });
      nonCumulatedYearsCount.set(entry.year, { 'count':entry.count, 'days_for_shipping_real':entry.days_for_shipping_real, 'days_for_shipping_scheduled':entry.days_for_shipping_scheduled });
      i++;
    });
    nonCumulatedResult.set(key, nonCumulatedYearsCount);
    let lastCount = 0;
    years.forEach(year => {
      const count = yearCounts.get(year).count;
      lastCount = Math.max(lastCount, count);
      let updValue = yearCounts.get(year);
      updValue.count = lastCount;
      yearCounts.set(year, updValue);
    });

    resultMap.set(key, yearCounts);
  });

  const yearsMap = new Map();
  for (let i = 0; i < years.length; ++i) {
    yearsMap.set(i, years[i]);
  }

  resultMap.set('GGG', generalizedData);

  console.log("resultMap")
  console.log(resultMap)
  console.log("nonCumulatedResult")
  console.log(nonCumulatedResult)

  return [resultMap, yearsMap, nonCumulatedResult];
}

function addTimelineElement(svg, g, minYear, maxYear) {
  const element = document.querySelector("#current_year");
  const rect = element.getBoundingClientRect();
  const pt = svg.node().createSVGPoint();
  pt.x = rect.right;
  pt.y = rect.y;
  const svgPoint = pt.matrixTransform(svg.node().getScreenCTM().inverse());

  const parent = d3.select("#choropleth-map-tools");

  const foreignObject = parent.append("div")
  .attr("width", 500)
  .attr("height", rect.height)
  .attr("x", svgPoint.x + 15)
  .attr("y", svgPoint.y + rect.height / 2);
  const div = foreignObject.append(
      "xhtml:div") // xhtml namespace for compatibility
  .attr("xmlns", "http://www.w3.org/1999/xhtml")
  .style("display", "flex")
  .style("align-items", "center")
  .style("justify-content", "center")
  .style("gap", "10%")
  .style('flex-wrap', 'true')
  .classed('mt-1', true)
  .style("width", "100%")
  .style("height", "100%")
  .attr("id", "timeline_box")
  .classed('choropleth', true);
  const ribbon_div = div.append('div')
  .style('display', 'flex')
  .style('flex-direction', 'row')
  .style('gap', '5%');
  const playButton = ribbon_div.append("button").attr("width", 500)
  .attr("height", 20).text("Pause")
  .attr("class", "play_button")
  .attr("id", "play_button")
  .classed('button-67', true);
  const label = ribbon_div.append("label");
  const yearRange = label.append("input")
  .attr("type", "range")
  .attr("step", 1)
  .attr("min", minYear)
  .attr("max", maxYear)
  .attr("value", minYear)
  .attr("id", "year_range");
  const colorSelect = div.append("select");
  Object.entries(colorSchemes).forEach(([name, {scale}]) => {
    colorSelect.append("option")
    .text(name)
    .attr("value", name);
  });
  colorSelect.append("option").text("Regional").attr("value", "Regional")
  const speedSelect = div.append("select");
  speedSelect.append("option").text("×0.1").attr("value", "0.1");
  speedSelect.append("option").text("×0.2").attr("value", "0.2");
  speedSelect.append("option").text("×0.5").attr("value", "0.5");
  speedSelect.append("option").text("×1").attr("value", "1");
  speedSelect.append("option").text("×1.2").attr("value", "1.2");
  speedSelect.append("option").text("×1.5").attr("value", "1.5");
  speedSelect.append("option").text("×1.7").attr("value", "1.7");
  speedSelect.append("option").text("×2").attr("value", "2");
  speedSelect.node().value = '1';

  const cumulationSelect = div.append('select');
  cumulationSelect.append('option').text('Cumulated').attr('value', 'Cumulated');
  cumulationSelect.append('option').text('Non-cumulated').attr('value', 'Non-cumulated');

  return [yearRange, playButton, colorSelect, speedSelect, cumulationSelect];
}

