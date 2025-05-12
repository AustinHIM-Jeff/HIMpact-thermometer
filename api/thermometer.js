const d3 = require('d3');
const { JSDOM } = require('jsdom');

module.exports = async (req, res) => {
    // 1. Get total and goal from query parameters (for browser testing)
    // Default values if not provided
    const total = parseInt(req.query.total) || 5000;
    const goal = parseInt(req.query.goal) || 10000;

    // Basic validation
    const currentAmount = Math.max(0, total); // Ensure non-negative
    const goalAmount = Math.max(1, goal); // Ensure goal is at least 1 to avoid division by zero
    const percentage = Math.min(1, currentAmount / goalAmount); // Cap percentage at 100%

    // 2. Set SVG dimensions
    const width = 100;
    const height = 300;
    const barWidth = 60;
    const barX = (width - barWidth) / 2; // Center the bar
    const filledHeight = percentage * height;

    // 3. Initialize virtual DOM & SVG using jsdom
    const dom = new JSDOM(`<!DOCTYPE html><body></body>`);
    const body = d3.select(dom.window.document).select('body');
    const svg = body.append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('xmlns', 'http://www.w3.org/2000/svg'); // Add xmlns attribute

    // 4. Draw thermometer outline (background)
    svg.append('rect')
        .attr('x', barX)
        .attr('y', 0)
        .attr('width', barWidth)
        .attr('height', height)
        .attr('fill', '#e0e0e0') // Light grey background
        .attr('stroke', '#333')
        .attr('stroke-width', 1);

    // 5. Draw filled portion (the "mercury")
    svg.append('rect')
        .attr('x', barX)
        .attr('y', height - filledHeight) // Y position starts from the bottom up
        .attr('width', barWidth)
        .attr('height', filledHeight)
        .attr('fill', '#4caf50'); // Green fill

    // --- Optional: Add Text Labels ---
    // Goal Label
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', 15) // Position near the top
        .attr('text-anchor', 'middle')
        .attr('font-family', 'sans-serif')
        .attr('font-size', '12px')
        .attr('fill', '#333')
        .text(`Goal: $${goalAmount.toLocaleString()}`);

    // Current Amount Label (only if > 0)
     if (currentAmount > 0) {
         svg.append('text')
             .attr('x', width / 2)
             .attr('y', height - filledHeight + 15) // Position inside the filled part
             .attr('text-anchor', 'middle')
             .attr('font-family', 'sans-serif')
             .attr('font-size', '12px')
             .attr('fill', filledHeight > 20 ? '#fff' : '#333') // White text if enough space, else black
             .text(`$${currentAmount.toLocaleString()}`);
     }
    // --- End Optional Labels ---

    // 6. Get the SVG markup as a string
    const svgString = dom.window.document.querySelector('svg').outerHTML;

    // 7. Send the SVG as the response
    res.setHeader('Content-Type', 'image/svg+xml');
    res.status(200).send(svgString);
};
