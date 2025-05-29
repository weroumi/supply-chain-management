function Swatches(color, {
  columns = null,
  format,
  unknown: formatUnknown,
  swatchSize = 15,
  swatchWidth = swatchSize,
  swatchHeight = swatchSize,
  marginLeft = 0
} = {}) {
  const id = `swatches-${Math.random().toString(16).slice(2)}`;
  const unknown = formatUnknown == null ? undefined : color.unknown();
  const unknowns = unknown == null || unknown === d3.scaleImplicit ? [] : [unknown];
  const domain = color.domain().concat(unknowns);

  if (format === undefined) {
    format = x => (x === unknown ? formatUnknown : x);
  }

  // Create the main container
  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.alignItems = "center";
  container.style.marginLeft = `${+marginLeft}px`;
  container.style.minHeight = "33px";
  container.style.font = "10px sans-serif";

  // Create style element
  const style = document.createElement("style");
  style.textContent = `
    .${id}-item {
      display: flex;
      align-items: center;
      padding-bottom: 1px;
    }
    .${id}-label {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: calc(100% - ${+swatchWidth}px - 0.5em);
    }
    .${id}-swatch {
      width: ${+swatchWidth}px;
      height: ${+swatchHeight}px;
      margin: 0 0.5em 0 0;
    }
  `;
  container.appendChild(style);

  // Create swatch items
  if (columns !== null) {
    const wrapper = document.createElement("div");
    wrapper.style.width = "100%";
    wrapper.style.columnCount = columns;

    domain.forEach(value => {
      const labelText = `${format(value)}`;

      const item = document.createElement("div");
      item.className = `${id}-item`;

      const swatch = document.createElement("div");
      swatch.className = `${id}-swatch`;
      swatch.style.background = color(value);

      const label = document.createElement("div");
      label.className = `${id}-label`;
      label.title = labelText;
      label.textContent = labelText;

      item.appendChild(swatch);
      item.appendChild(label);
      wrapper.appendChild(item);
    });

    container.appendChild(wrapper);
    return container;
  }

  // Create inline swatches
  domain.forEach(value => {
    const labelText = `${format(value)}`;

    const item = document.createElement("span");
    item.className = id;
    item.style.display = "inline-flex";
    item.style.alignItems = "center";
    item.style.marginRight = "1em";

    const swatch = document.createElement("span");
    swatch.style.content = '""';
    swatch.style.width = `${+swatchWidth}px`;
    swatch.style.height = `${+swatchHeight}px`;
    swatch.style.marginRight = "0.5em";
    swatch.style.background = color(value);

    const label = document.createElement("span");
    label.textContent = labelText;

    item.appendChild(swatch);
    item.appendChild(label);
    container.appendChild(item);
  });

  return container;
}
