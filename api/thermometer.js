const d3 = require('d3');
const { JSDOM } = require('jsdom');

module.exports = async (req, res) => {
  // 1. Parse fundraising total (e.g., from query or hardcoded for now)
  const total = parseInt(req.query.total) || 5000; // example
  const goal = parseInt(req.query.goal) || 10000;

  // 2. Set SVG dimensions
  const width = 100, height = 300;
  const filledHeight = (total / goal) * height;

  // 3. Initialize DOM & SVG
  const dom = new JSDOM(`<body></body>`);
  const body = d3.select(dom.window.document).select('body');
  const svg = body.append('svg')
    .attr('width', width)
    .attr('height', height);

  // 4. Draw thermometer outline
  svg.append('rect')
    .attr('x', 20).attr('y', 0)
    .attr('width', 60).attr('height', height)
    .attr('fill', 'none')
    .attr('stroke', '#333');

  // 5. Draw filled portion
  svg.append('rect')
    .attr('x', 20)
    .attr('y', height - filledHeight)
    .attr('width', 60)
    .attr('height', filledHeight)
    .attr('fill', '#4caf50');

  // 6. Return SVG
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(dom.window.document.querySelector('body').innerHTML);
};
