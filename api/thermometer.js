// const d3 = require('d3'); // <<<< DELETE THIS LINE
const { JSDOM } = require('jsdom'); // Keep this one

module.exports = async (req, res) => { // Still async
    console.log("Function entered. Request Query:", req.query);

    try { // Wrap main logic in try...catch
        const d3 = await import('d3'); // <<<< ADD THIS LINE - Dynamic Import
        console.log("D3 module loaded dynamically.");

        // --- THE REST OF YOUR CODE ---
        // (parsing req.query, calculating values, using JSDOM, using d3.select, etc.)
        // ...

        const total = parseInt(req.query?.total) || 5000;
        const goal = parseInt(req.query?.goal) || 10000;
        console.log(`Parsed total: ${total}, goal: ${goal}`);

        const currentAmount = Math.max(0, total);
        const goalAmount = Math.max(1, goal);
        const percentage = Math.min(1, currentAmount / goalAmount);
        console.log(`Calculated percentage: ${percentage}`);

        const width = 100, height = 300, barWidth = 60, barX = (width - barWidth) / 2;
        const filledHeight = percentage * height;
        console.log("Dimensions calculated.");

        console.log("Initializing JSDOM...");
        const dom = new JSDOM(`<!DOCTYPE html><body></body>`);
        const body = d3.select(dom.window.document).select('body'); // d3 is now available
        const svg = body.append('svg')
            .attr('width', width).attr('height', height).attr('xmlns', 'http://www.w3.org/2000/svg');
        console.log("JSDOM initialized, SVG created.");

        // ... rest of SVG drawing, getting svgString, and sending response ...
        // Make sure the rest of the code inside the try block is present

        svg.append('rect').attr('x', barX).attr('y', 0).attr('width', barWidth).attr('height', height).attr('fill', '#e0e0e0').attr('stroke', '#333').attr('stroke-width', 1);
        svg.append('rect').attr('x', barX).attr('y', height - filledHeight).attr('width', barWidth).attr('height', filledHeight).attr('fill', '#4caf50');
        console.log("Drew rectangles.");

        // Add Labels...
        svg.append('text').attr('x', width / 2).attr('y', 15).attr('text-anchor', 'middle').attr('font-family', 'sans-serif').attr('font-size', '12px').attr('fill', '#333').text(`Goal: $${goalAmount.toLocaleString()}`);
        if (currentAmount > 0) {
            svg.append('text').attr('x', width / 2).attr('y', Math.max(20, height - filledHeight + 15)).attr('text-anchor', 'middle').attr('font-family', 'sans-serif').attr('font-size', '12px').attr('fill', filledHeight > 30 ? '#fff' : '#333').text(`$${currentAmount.toLocaleString()}`);
        }
        console.log("Added labels.");

        console.log("Selecting SVG for output...");
        const svgElement = dom.window.document.querySelector('svg');
        if (!svgElement) {
            throw new Error("Could not find SVG element after creation.");
        }
        const svgString = svgElement.outerHTML;
        console.log("SVG string generated. Length:", svgString.length);


        console.log("Setting headers and sending response...");
        res.setHeader('Content-Type', 'image/svg+xml');
        res.status(200).send(svgString);
        console.log("Response sent.");

    } catch (error) {
        console.error("!!! CRITICAL ERROR IN FUNCTION:", error.message, error.stack); // Log the full error
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
};
