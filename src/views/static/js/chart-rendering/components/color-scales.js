const colorSchemes = {
    "Viridis": { scale: d3.interpolateViridis, invert: true },
    "BuPu": { scale: d3.interpolateBuPu, invert: false },
    "YlOrRd": { scale: d3.interpolateYlOrRd, invert: false },
    "YlGn": { scale: d3.interpolateYlGn, invert: false },
    "CubehelixDefault": { scale: d3.interpolateCubehelixDefault, invert: true }
};

function getColorScale(name) {
    let { scale, invert } = colorSchemes[name] || {};
    return invert ? (t) => scale(1 - t) : scale;
}