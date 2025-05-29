// const { divide } = require("mathjs");

/* Set the width of the side navigation to 250px and the left margin of the page content to 250px and add a black background color to body */
function openNav() {
  document.getElementById("mySidenav").style.width = "auto";
  document.getElementById("main").style.marginLeft = "250px";
  document.getElementById("menuButton").style.display = "none";
}

/* Set the width of the side navigation to 0 and the left margin of the page content to 0, and the background color of body to white */
function closeNav() {
  document.getElementById("mySidenav").style.width = "0";
  document.getElementById("main").style.marginLeft = "0";
  document.getElementById("menuButton").style.display = "flex";
}

document.getElementById('uploadForm').addEventListener('submit',
    function (event) {
      event.preventDefault();
      const formData = new FormData();
      formData.append('file', document.getElementById('fileInput').files[0]);

      fetch('/upload', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        // Call function to visualize data using D3.js
        renderMap();
        // hide loading animation
        d3.select("#loading-spinner").style("visibility", "hidden")
      })
      .catch(error => console.error('Error:', error));
      closeNav()
    });

function visualizeData(data) {

  // Print a message to the console to check if the code reaches this part
  // console.log(data);
  console.log('ddd');

  updateVisualization(data.nodes, data.links);
  closeNav();
  // D3.js code to visualize data
  // This function will receive data from the server and create a node-link diagram
  // Example:
  // d3.select("#visualization").append("svg").attr("width", 500).attr("height", 500)
  //     .append("circle").attr("cx", 50).attr("cy", 50).attr("r", data.radius).style("fill", "red");
}

document.addEventListener('DOMContentLoaded', () => {
  closeNav();
  fetch('/default-datasets')
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    let i = 0;
    data.forEach(fileName => {
      addCheckboxWithLabel(fileName, i);
      i++;
    });
  })
  .catch(error => console.error('Error fetching data:', error));
});

function addCheckboxWithLabel(labelText, n) {
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.name = 'dataset';
  checkbox.id = 'checkbox' + n;
  // checkbox.classList.add('form-check-input');
  checkbox.classList.add('m-1');
  checkbox.classList.add('check');
  checkbox.value = labelText;
  checkbox.onclick = function () {
    onlyOne(this);
  };

  const label = document.createElement('label');
  // label.textContent = labelText;
  label.htmlFor = checkbox.id;
  label.innerHTML = "<svg width=\"45\" height=\"45\" viewbox=\"0 0 95 95\">\n"
      + "      <rect x=\"30\" y=\"20\" width=\"50\" height=\"50\" stroke=\"black\" fill=\"none\" />\n"
      + "      <g transform=\"translate(0,-952.36222)\">\n"
      + "        <path d=\"m 56,963 c -102,122 6,9 7,9 17,-5 -66,69 -38,52 122,-77 -7,14 18,4 29,-11 45,-43 23,-4 \" stroke=\"rgba(0, 101, 24, 0.99)\" stroke-width=\"3\" fill=\"none\" class=\"path1\" />\n"
      + "      </g>\n"
      + "    </svg>\n"
      + `<span>${labelText}</span>`;
  label.classList.add('label');


  const div = document.createElement('div');
  div.appendChild(checkbox);
  div.appendChild(label);
  div.classList.add('checkbox-wrapper-61');
  document.getElementById('dataset-checkboxes').appendChild(div);
}

function onlyOne(chb) {
  let checkboxes = document.getElementsByName(chb.name)
  checkboxes.forEach((item) => {
    if (item !== chb) {
      item.checked = false
    }
  })
}

