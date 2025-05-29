function renderGroupedBarChart(value1, value2) {
    let cardWidth = document.querySelector('#card-kpi-chart').offsetWidth;
    let windowHeight = window.innerHeight;
    let svgWidth = cardWidth * 0.9; // 90% of card width
    let svgHeight = windowHeight * 0.5; // 50% of window height
    d3.select("#chart-container")
        .style('height', svgHeight)
        .style('width', svgWidth);

    let data = value1.map((real, index) => ({
        order: "Days for shipping",
        real: real,
        scheduled: value2[index]
    }));

    let margin = { top: 50, right: 30, bottom: 50, left: 50 },
        width = 400 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;

    let svg = d3.create("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // scales
    let x0 = d3.scaleBand()
        .domain(data.map(d => d.order))
        .range([0, width])
        .padding(0.2);

    let x1 = d3.scaleBand()
        .domain(["real", "scheduled"])
        .range([0, x0.bandwidth()])
        .padding(0.05);

    let y = d3.scaleLinear()
        .domain([0, d3.max([...value1, ...value2])])
        .nice()
        .range([height, 0]);

    // axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x0));

    svg.append("g")
        .call(d3.axisLeft(y));

    // colors
    let color = d3.scaleOrdinal()
        .domain(["real", "scheduled"])
        .range([d3.schemeCategory10[0], d3.schemeCategory10[2]]);

    // bars
    svg.selectAll("g.bar-group")
        .data(data)
        .enter().append("g")
        .attr("class", "bar-group")
        .attr("transform", d => `translate(${x0(d.order)},0)`)
        .selectAll("rect")
        .data(d => [
            { key: "real", value: d.real },
            { key: "scheduled", value: d.scheduled }
        ])
        .enter().append("rect")
        .attr("x", d => x1(d.key))
        .attr("y", d => y(d.value))
        .attr("width", x1.bandwidth())
        .attr("height", d => {
            return height - y(d.value)
        })
        .attr("fill", d => color(d.key));

    const legend = Swatches(d3.scaleOrdinal(['real, scheduled'], d3.schemeCategory10));
    // d3.select("#chart-container").append(legend);
    // d3.select("#chart-container").node().appendChild(legend);
    d3.select("#card-kpi-chart").append("div").attr('id', 'kpi-legend').append(() => legend);

    return svg.node();
}