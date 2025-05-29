let cache = {}
let intervalId;

document.getElementById('selectDefaultDataset').addEventListener('click',
    (event) => {
      if(intervalId != null) {
          intervalId.stop();
        }
      // remove previous map
      d3.select("#geo-chart")
      .selectAll('svg')
      .filter(function () {
        return this.id !== "svg-loading-spinner";
      })
      .remove();
      // show loading animation
      d3.select("#loading-spinner").style("visibility", "visible");
      d3.select("#loading-spinner").style("display", "block");

      // reset layers checkboxes
      const layersCheckboxes = document.querySelectorAll(
          '#layersForm input[type="checkbox"]');
      layersCheckboxes.forEach(ch => {
        ch.checked = false;
      });

      let chosenDatasetName = "";
      const checkboxes = document.querySelectorAll(
          '#dataset-checkboxes input[type="checkbox"]');
      checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
          chosenDatasetName = checkbox.parentNode.textContent;
        }
      });

      let jsonData = JSON.stringify({datasetName: chosenDatasetName})

      fetch('/default-datasets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonData
      })
      .then(response => response.json())
      .then(data => {
        const worldmap = "https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_countries.geojson";

        Promise.all([d3.json(worldmap)])
        .then(([topo]) => {
          cache = {};
          cache['choropleth-data'] = data.data;
          cache['topo'] = topo;
          cache['tariffs_per_category_simple'] = data.tariffs_per_category_simple
          cache['tariffs_per_category_weighted'] = data.tariffs_per_category_weighted
          console.log(data)
          const yearsMap = renderMap(topo, data.data['-- All categories'], data.tariffs_per_category_simple);
        });
        // hide loading animation
        d3.select("#loading-spinner").style("visibility", "hidden")
      })
      .catch(error => console.error('Error:', error));
      closeNav();
      d3.select("#layers_div")
      .style("pointer-events", "all")
      .style("opacity", "1");
    });

document.getElementById('cooperationsCheckbox').addEventListener('click',
    (event) => {
      if (document.getElementById('geo-chart').childNodes.length === 0) {
        return;
      }
      intervalId.stop();
      if (event.target.checked) {
        if ('node-link-data' in cache) {
          renderNodeLink(cache['topo'], cache['node-link-data']);
          return;
        }
        // show loading animation
        d3.select("#loading-spinner").style("display", "block");
        const nodeLink = 'http://localhost:5000/node-link-data';
        Promise.all([d3.json(nodeLink)])
        .then(([nodeLinkData]) => {
          cache['node-link-data'] = nodeLinkData;
          renderNodeLink(cache['topo'], nodeLinkData);
        });
        return;
      }
      renderMap(cache['topo'], cache['choropleth-data']);
    });

document.getElementById('avg-type-select').addEventListener('change', (event) => {
    intervalId.stop();
    const currentCategory = document.getElementById('category-select').value
    renderMap(cache['topo'], cache['choropleth-data'][currentCategory], cache[`tariffs_per_category_${event.target.value}`])
})

document.getElementById('category-select').addEventListener('change', (event) => {
    intervalId.stop();
    const currentAvg = document.getElementById("avg-type-select").value
    console.log(event.target.value)
    renderMap(cache['topo'], cache['choropleth-data'][event.target.value], cache[`tariffs_per_category_${currentAvg}`])
})
