const alertPlaceholder = document.getElementById('liveAlertPlaceholder')
const appendAlert = (message, type) => {
  const wrapper = document.createElement('div')
  wrapper.innerHTML = [
    `<div class="alert alert-${type} alert-dismissible fade show" role="alert">`,
    `   <div>${message}</div>`,
    '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
    '</div>'
  ].join('')

  alertPlaceholder.append(wrapper)
}


function saveSvgAsImage() {
    const svgElement = document.querySelector("#map-svg");
    if(svgElement == null){const wrapper = document.createElement('div')
          appendAlert('Cannot export. There is no diagram yet', 'danger');
    }

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);

    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = function () {
        const canvas = document.createElement("canvas");
        canvas.width = svgElement.clientWidth * 3;
        canvas.height = svgElement.clientHeight * 3;
        const ctx = canvas.getContext("2d");
        ctx.scale(3, 3)

        ctx.drawImage(img, 0, 0);

        const imgURL = canvas.toDataURL("image/png");

        const downloadLink = document.createElement("a");
        downloadLink.href = imgURL;
        downloadLink.download = "image.png";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        URL.revokeObjectURL(url);
    };

    img.src = url;
}
