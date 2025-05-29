function renderNodeLink(topo, graph) {
  // same as map
  let cardWidth = document.querySelector('#card-geo-chart').offsetWidth;
  let windowHeight = window.innerHeight;
  let svgWidth = cardWidth * 0.9; // 80% of card width
  let svgHeight = windowHeight * 0.67; // 80% of window height
  let isPlaying = true;
  let currentFocus = "";
  let world, countries;
  const yearsMap = new Map();
  const keys = Object.keys(graph);
  const minYear = 0;
  const maxYear = keys.length - 1;

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

  for (let i = 0; i < keys.length; ++i)  {
    yearsMap.set(i, keys[i]);
  }

  const svg = d3.select("#geo-chart")
      .append("svg")
      .attr('id', "map-svg")
      .attr('width', svgWidth)
      .attr('height', svgHeight)
      .style('background', 'white'),
      g = svg.append("g");

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

  const projection = d3.geoRobinson()
  .scale(130)
  .translate([svgWidth / 2, svgHeight / 2]);

  d3.select("#mapTitle").text("Supply chain network")
  function getCoordinates(countryCode) {
    const countryData = graph[keys[keys.length - 1]].nodes.find(d => d.id === countryCode);
    let lon = countryData ? countryData.longitude : 0;
    let lat = countryData ? countryData.latitude : 0;
    return [lon, lat];
  }

  function animateLines(nodeId) {
    links
    .style("display", function (d) {
      if (d.source !== nodeId || d.target !== nodeId) {
        return "none";
      }
    });
    selfLinks.style('display', function (d) {
      if (d.source !== nodeId) {
        return "none";
      }
    });

    let relatedLinks = links
    .filter(d => d.source === nodeId || d.target === nodeId);

    let relatedSelfLinks = selfLinks
    .filter(d => d.source === nodeId);

    let allRelatedLinks = d3.selectAll(
        relatedLinks.nodes().concat(relatedSelfLinks.nodes()));
    if (currentFocus === nodeId) {
      d3.selectAll(".Country")
      .attr("fill", (d, i, nodes) => {
        return d3.select(nodes[i]).attr("cooperations-fill")
      });

      allRelatedLinks
      .filter(d => d.source === nodeId || d.target === nodeId)
      .attr("stroke-dasharray", (d, i, nodes) => nodes[i].getTotalLength() + " "
          + nodes[i].getTotalLength())
      .attr("stroke-dashoffset", 0)
      .transition()
      .ease(d3.easeLinear)
      .attr("stroke-dashoffset", (d, i, nodes) => nodes[i].getTotalLength())
      .duration(1000)
      .on("end", function () {
        d3.select(this).style("display", "none");
      });
      currentFocus = "";
      // if (!topNodeIds.has(nodeId)) {
      //   d3.selectAll(`.${nodeId}`)
      //   .style("display", "none");
      //
      //   d3.selectAll(".Country")
      //   .attr("fill", (d, i, nodes) => {
      //     return d3.select(nodes[i]).attr("cooperations-fill")
      //   });
      // }
      return;
    }
    d3.selectAll(".Country")
    .attr('fill', "#838383");

    d3.selectAll(".Country")
    .filter(d => d.properties.iso_a3 === nodeId)
    .attr("fill", "#3182bd");

    currentFocus = nodeId;

    d3.selectAll(`.${nodeId}`)
    .style("display", "block");

    allRelatedLinks
    .filter(d => d.source === nodeId || d.target === nodeId)
    .style("display", "block")
    .attr("stroke-dasharray", (d, i, nodes) => nodes[i].getTotalLength() + " "
        + nodes[i].getTotalLength())
    .attr("stroke-dashoffset", (d, i, nodes) => nodes[i].getTotalLength())
    .transition()
    .ease(d3.easeLinear)
    .attr("stroke-dashoffset", 0)
    .duration(1000);

    const targetCountries = new Map();
    const targetExtent = d3.extent(graph.links.filter(d => {
      if (d.target == nodeId && d.source == nodeId) {
        return false;
      }
      if (d.source === nodeId || d.target === nodeId) {
        if (d.source === nodeId) {
          targetCountries.set(d.target, d.weight);
        } else {
          targetCountries.set(d.source, d.weight);
        }
      }
      return d.source === nodeId || d.target === nodeId
    }), d => d.weight);

    const targetDomainMin = Math.max(1e-8, targetExtent[0]);
    const targetDomainMax = targetExtent[1];

    const targetsColorScale = d3.scaleSequentialLog()
    .domain([targetDomainMin, targetDomainMax])
    .interpolator(d3.interpolateOranges);

    d3.selectAll(".Country")
    .filter(d => targetCountries.has(d.properties.iso_a3))
    .attr("fill", function (d) {
      let weight = targetCountries.get(d.properties.iso_a3);
      return weight > 0 ? targetsColorScale(weight) : "#838383";
    });

  }

  function pathGenerator(d, i, nodes) {
    const source = projection(getCoordinates(d.source));
    const target = projection(getCoordinates(d.target));
    const midPoint = [
      (source[0] + target[0]) / 2,
      (source[1] + target[1]) / 2 - 50
    ];
    return d3.line().curve(d3.curveBasis)([source, midPoint, target]);
  }
  function drawLinks(linksData) {
    const linksG = svg.select('.world').selectAll('.links')
      .data([null]);
    const linksEnter = linksG.enter().append('g')
      .classed('links', true)
      .classed('network', true);
    linksG.exit().remove();
    const links = linksG.merge(linksEnter).selectAll('path')
      .data(linksData);

    const linksEnterPath = links.enter().append('path')
    .attr('d', pathGenerator)
    // .each(function(d) {console.log("path for ", d)})
    .attr('stroke', d => {
      // return `rgba(0, 0, 0, ${linkOpacityScale(d.weight)})`
      return `rgba(0, 0, 0, 1)`
    })
    .attr('stroke-width', d => widthsScale(d.weight))
    .attr('fill', 'none')
    .style('z-index', 10)
    .style('stroke-linecap', 'round')
    .attr("stroke-dasharray", (d, i, nodes) => nodes[i].getTotalLength() + " " + nodes[i].getTotalLength())
    .attr("stroke-dashoffset", (d, i, nodes) => nodes[i].getTotalLength());

    linksEnterPath.merge(links)
    .transition()
    .ease(d3.easeLinear)
    .attr("stroke-dashoffset", d => {
      return 0
    })
    .duration(500);
        // svg.select('.world')
      // .append('g')
      // .classed('links', true)
      // .classed('network', true)
      // .selectAll('path')
      // .data(linksData)
      // .enter().append('path')
      // .attr("d", (d, i, nodes) => {
      //   const source = projection(getCoordinates(d.source));
      //   const target = projection(getCoordinates(d.target));
      //   const midPoint = [
      //     (source[0] + target[0]) / 2,
      //     (source[1] + target[1]) / 2 - 50
      //   ];
      //   return d3.line().curve(d3.curveBasis)([source, midPoint, target]);
      // })
      // .attr('stroke', d => `rgba(0, 0, 0, ${linkOpacityScale(d.weight)})`)
      // .attr('stroke-width', d => widthsScale(d.weight))
      // .attr('fill', 'none')
      // .style('z-index', 10)
      // .style("display", "none")
      // .style("display", "block")
      // .attr("stroke-dasharray", (d, i, nodes) => nodes[i].getTotalLength() + " "
      //   + nodes[i].getTotalLength())
      // .attr("stroke-dashoffset", (d, i, nodes) => nodes[i].getTotalLength())
      // .transition()
      // .ease(d3.easeLinear)
      // .attr("stroke-dashoffset", 0)
      // .duration(1000);

    links.exit().remove();
  }

  function updateMap(yearKey) {
    const year = yearsMap.get(yearKey);
    const date = new Date(year);

    currentYearSvg.text(
        date.toDateString().slice(4, 7) + date.toDateString().slice(10, 15));
    yearRange.node().value = yearKey;
    let relatedLinks = graph[year].reallinks.filter(l => {
      if(l.target === currentFocus) {
        let temp = l.target;
        l.target = l.source;
        l.source = temp;
      }
      return l.source === currentFocus || l.target === currentFocus
    });
    drawLinks(relatedLinks);
  }

  let mouseOver = function (event, d) {
    d3.selectAll(".Country")
    .transition()
    .duration(200)
    .style("opacity", .5)
    .style("stroke", "transparent");
    d3.select(this)
    .transition()
    .duration(200)
    .style("opacity", 1)
    .style("stroke", "black")
    .style("stroke-opacity", .7);

    d3.selectAll(".tooltip")
    .transition().duration(400)
    .style("opacity", 1)
    .text((tt) => {
      return `${d.properties.sovereignt}` // \nDegree: ${graph.nodes.filter(
         // node => node.id === d.properties.iso_a3)[0]?.size || 0}`
    });
  }

  let mouseLeave = function () {
    d3.selectAll(".Country")
    .transition()
    .duration(200)
    .style("opacity", 1)
    .style("stroke", "white");
    d3.select('.tooltip').transition().duration(300)
    .style("opacity", 0);
  }

  let mousemove = function (event, d) {
    tooltip
    .style("left", `${event.pageX + 50}px`)
    .style("top", `${event.pageY - 20}px`);
  }

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
  .style("stroke", "white")
  .attr("class", function (d) {
    return "Country"
  })
  .attr("id", function (d) {
    return d.country_name;
  })
  .style("opacity", 1)
  .attr('fill', "#838383")
  .style("pointer-events", "all")
  .on("mouseover", mouseOver)
  .on("mouseleave", mouseLeave)
  .on("mousemove", mousemove);

   for (let yearKey in graph) {
      let year = graph[yearKey];
      for (let node of year.nodes) {
          let pos = projection([node.longitude, node.latitude]);
          node['x'] = pos[0];
          node['y'] = pos[1];
      }
  }
  for (let yearKey in graph) {
    let year = graph[yearKey];
    year['reallinks'] = year.links.filter(link => link.source !== link.target);
    year['selflinks'] = year.links.filter(link => link.source === link.target);
  }

  // let topNodes = graph.nodes.sort((a, b) => b.size - a.size).slice(0, 5);
  // let topNodeIds = new Set(topNodes.map(d => d.id));

  const graphYearKeys = Object.keys(graph);
  const latestRealLinks = graph[graphYearKeys[graphYearKeys.length - 1]].reallinks;
  const widthsScale = d3.scaleSqrt()
  .domain([d3.min(latestRealLinks, d => d.weight),
    d3.max(latestRealLinks, d => d.weight)])
  .range([0.5, 5]);

  // let topCountries = d3.selectAll(".Country")
  // .classed('top-countries', true)
  // .filter((d) => topNodeIds.has(d.properties.iso_a3))
  // .style('z-index', 5)
  // .attr("stroke-width", "2px")
  // .style("stroke", "black");

  const linkOpacityScale = d3.scaleLog()
  .domain([d3.min(latestRealLinks, d => d.weight),
    d3.max(latestRealLinks, d => d.weight)])
  .range([0, 1]);

  svg.select('.world')
  .selectAll('.Country')
  .on("click", (e, d) => {
    stopAnimation();
    svg.selectAll('.links').remove();
    currentCountrySvg.text(d.properties.sovereignt);
    currentFocus = d.properties.iso_a3;
    startAnimation();
  })
  .on("mouseover", mouseOver)
  .on('mouseleave', mouseLeave);

  // color the countries
  function getDegreeByCountry(code_iso3) {
    const countryData = graph.nodes.find(d => d.id === code_iso3);
    return countryData ? countryData.size : 0;
  }

  // const colorScale = d3.scaleSequentialLog()
  // .domain([domainMin, domainMax])
  // .interpolator(d3.interpolateYlOrBr);

  // const arrayOfDegrees = [];

  // d3.selectAll(".Country")
  // .attr("fill", function (d) {
  //   d.cooperation_degree = getDegreeByCountry(d.properties.iso_a3);
  //   if (d.total !== 0) {
  //     arrayOfDegrees.push(d.cooperation_degree);
  //   }
  //   return d.cooperation_degree > 0 ? colorScale(d.cooperation_degree)
  //       : "#eeeeee";
  // })
  // .attr("cooperations-fill", function (d, i, nodes) {
  //   return d3.select(nodes[i]).style("fill");
  // });

  // legend
  // let ticksCount = 10;
  // let n = ticksCount - 1;
  // let tickValues = d3.range(ticksCount).map(i => {
  //   let num = d3.quantile(arrayOfDegrees, i / (ticksCount - 1));
  //   return Math.round(num);
  // });
  // const legend = Legend(colorScale, {
  //   title: "Supply degree of each country",
  //   marginLeft: 5,
  //   ticks: ticksCount + 100,
  //   tickValues: tickValues
  // });
  const tools = svg.append("g");
  // tools.append(() => legend);

  const currentYearSvg = tools.append("text")
    .text(new Date(yearsMap.get(minYear)).toDateString().slice(4, 15))
    .attr('x', 50)
    .attr('y', 100)
    .attr("id", "current_year")
    .classed('my-title', true)
    .style("font-size", "20px")
    .style("font-weight", "bold")
    .attr('fill', "#838383");
  const currentCountrySvg = tools.append("text")
    .text("")
    .attr('x', 50)
    .attr('y', 120)
    .attr("id", "current_year")
    .classed('my-title', true)
    .style("font-size", "16px")
    .attr('fill', "black");
  const [yearRange, playButton] = addNodeLinkTimelineElement(minYear, maxYear);

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

  let currentYear = minYear;
  updateMap(currentYear);

  function startAnimation() {
    intervalId = d3.interval(() => {
      currentYear = currentYear < maxYear ? currentYear + 1 : 0;
      updateMap(currentYear);
    }, 700);
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

  yearRange.on("input", () => {
    let chosenYear = Number(yearRange.node().value);
    stopAnimation();
    currentYearSvg.text(
        new Date(yearsMap.get(chosenYear)).toDateString().slice(4, 15));
    countries.attr('fill', "#838383");
    updateMap(chosenYear);
    currentYear = chosenYear;
    playButton.text("Play");
    isPlaying = !isPlaying;
  });

  // hide loading animation
  d3.select("#loading-spinner").style("display", "none");
}

function addNodeLinkTimelineElement(minYear, maxYear) {
  const element = document.querySelector("#current_year");
  const rect = element.getBoundingClientRect();

  const parent = d3.select("#choropleth-map-tools");

  const foreignObject = parent.append("div")
  .attr("width", 500)
  .attr("height", rect.height)
  // .attr("x", svgPoint.x + 15)
  // .attr("y", svgPoint.y + rect.height / 2);
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

  return [yearRange, playButton];
}