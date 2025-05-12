const { JSDOM } = require('jsdom');
const axios = require('axios'); // Add axios for HTTP requests
const cheerio = require('cheerio'); // Add cheerio for HTML parsing

module.exports = async (req, res) => {
    console.log("Function entered. Request Query:", req.query);
    try {
        const d3 = await import('d3'); // Dynamic import for D3
        console.log("D3 module loaded dynamically.");

        // STEP 1: Fetch data from Zeffy (you'll need to replace with your campaign URL)
        let total, goal;
        try {
            // Always try to fetch from the specified Zeffy campaign first
            const zeffyData = await fetchZeffyData();
            total = zeffyData.total;
            goal = zeffyData.goal;
            console.log(`Fetched from Zeffy - total: ${total}, goal: ${goal}`);
        } catch (fetchError) {
            console.warn("Could not fetch from Zeffy, using fallback values:", fetchError.message);
            // Fallback to query parameters or default values
            total = parseInt(req.query?.total) || 5000;
            goal = parseInt(req.query?.goal) || 10000;
        }

        console.log(`Using total: ${total}, goal: ${goal}`);
        const currentAmount = Math.max(0, total);
        const goalAmount = Math.max(1, goal);
        const percentage = Math.min(1, currentAmount / goalAmount);
        console.log(`Calculated percentage: ${percentage * 100}%`);

        // STEP 2: Create SVG with modern design
        const width = 300;           // Wider for a more modern look
        const height = 400;          // Taller for better visualization
        const padding = 40;          // Padding around the visualization
        const innerWidth = width - (padding * 2);
        const innerHeight = height - (padding * 2);
        
        // Initialize JSDOM
        console.log("Initializing JSDOM...");
        const dom = new JSDOM(`<!DOCTYPE html><body></body>`);
        const body = d3.select(dom.window.document).select('body');
        
        // Create SVG
        const svg = body.append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('xmlns', 'http://www.w3.org/2000/svg')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('style', 'background-color: #ffffff; border-radius: 8px;');
            
        // Add title
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', padding / 2)
            .attr('text-anchor', 'middle')
            .attr('font-family', 'Arial, sans-serif')
            .attr('font-weight', 'bold')
            .attr('font-size', '20px')
            .attr('fill', '#333')
            .text('Fundraising Progress');
        
        // Create gradient for thermometer
        const defs = svg.append('defs');
        const gradient = defs.append('linearGradient')
            .attr('id', 'thermGradient')
            .attr('gradientUnits', 'userSpaceOnUse')
            .attr('x1', '0%')
            .attr('y1', '100%')
            .attr('x2', '0%')
            .attr('y2', '0%');
            
        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#4facfe');
            
        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#00f2fe');
            
        // Container for thermometer (rounded rectangle)
        const thermX = width / 2 - 30;
        const thermY = padding + 20;
        const thermWidth = 60;
        const thermHeight = innerHeight - 40;
        
        // Background (empty thermometer)
        svg.append('rect')
            .attr('x', thermX)
            .attr('y', thermY)
            .attr('width', thermWidth)
            .attr('height', thermHeight)
            .attr('rx', thermWidth / 2)
            .attr('ry', thermWidth / 2)
            .attr('fill', '#f0f0f0')
            .attr('stroke', '#e0e0e0')
            .attr('stroke-width', 1);
            
        // Calculate filled height
        const filledHeight = percentage * thermHeight;
        
        // Create a clip path for the filled portion
        defs.append('clipPath')
            .attr('id', 'thermClip')
            .append('rect')
                .attr('x', thermX)
                .attr('y', thermY + thermHeight - filledHeight)
                .attr('width', thermWidth)
                .attr('height', filledHeight)
                .attr('rx', thermWidth / 2)
                .attr('ry', thermWidth / 2);
        
        // Filled thermometer with gradient and clip path
        svg.append('rect')
            .attr('x', thermX)
            .attr('y', thermY)
            .attr('width', thermWidth)
            .attr('height', thermHeight)
            .attr('clip-path', 'url(#thermClip)')
            .attr('fill', 'url(#thermGradient)');

        // Add gloss effect (subtle white overlay on the left side)
        svg.append('rect')
            .attr('x', thermX + 5)
            .attr('y', thermY)
            .attr('width', thermWidth / 4)
            .attr('height', thermHeight)
            .attr('fill', 'white')
            .attr('opacity', 0.2)
            .attr('rx', 5)
            .attr('ry', 5);
            
        // Add circular bulb at bottom
        const bulbRadius = (thermWidth / 2) + 10;
        const bulbCenterX = thermX + (thermWidth / 2);
        const bulbCenterY = thermY + thermHeight;
        
        // Bulb background
        svg.append('circle')
            .attr('cx', bulbCenterX)
            .attr('cy', bulbCenterY)
            .attr('r', bulbRadius)
            .attr('fill', '#f0f0f0')
            .attr('stroke', '#e0e0e0')
            .attr('stroke-width', 1);
            
        // Clip path for filled bulb
        if (percentage > 0) {
            const bulbClip = defs.append('clipPath')
                .attr('id', 'bulbClip');
                
            // Calculate how much of the bulb to fill based on percentage
            // Only fill the bulb proportionally if percentage is low
            const bulbFillHeight = percentage < 0.1 ? 
                (percentage * 10) * (bulbRadius * 2) : bulbRadius * 2;
                
            bulbClip.append('circle')
                .attr('cx', bulbCenterX)
                .attr('cy', bulbCenterY)
                .attr('r', bulbRadius);
                
            // Filled bulb with gradient
            svg.append('circle')
                .attr('cx', bulbCenterX)
                .attr('cy', bulbCenterY)
                .attr('r', bulbRadius)
                .attr('clip-path', 'url(#bulbClip)')
                .attr('fill', 'url(#thermGradient)');
        }
        
        // Add percentage text inside the thermometer
        svg.append('text')
            .attr('x', thermX + (thermWidth / 2))
            .attr('y', thermY + thermHeight / 2)
            .attr('text-anchor', 'middle')
            .attr('font-family', 'Arial, sans-serif')
            .attr('font-weight', 'bold')
            .attr('font-size', '18px')
            .attr('fill', '#333')
            .text(`${Math.round(percentage * 100)}%`);

        // Display current amount raised
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', thermY + thermHeight + bulbRadius + 30)
            .attr('text-anchor', 'middle')
            .attr('font-family', 'Arial, sans-serif')
            .attr('font-weight', 'bold')
            .attr('font-size', '22px')
            .attr('fill', '#333')
            .text(`$${currentAmount.toLocaleString()}`);
            
        // Display out of total
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', thermY + thermHeight + bulbRadius + 55)
            .attr('text-anchor', 'middle')
            .attr('font-family', 'Arial, sans-serif')
            .attr('font-size', '16px')
            .attr('fill', '#666')
            .text(`of $${goalAmount.toLocaleString()} goal`);
            
        // Add decorative elements: wavy line at the bottom
        const waveData = createWavePath(0, height - 20, width, 10, 10);
        svg.append('path')
            .attr('d', waveData)
            .attr('fill', 'none')
            .attr('stroke', '#E1F5FE')
            .attr('stroke-width', 2)
            .attr('opacity', 0.8);
            
        // Add subtle dots in the background
        addBackgroundDots(svg, width, height);

        // Generate and send the SVG
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
        console.error("!!! CRITICAL ERROR IN FUNCTION:", error.message, error.stack);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
};

// Helper function to fetch data from Zeffy
async function fetchZeffyData(campaignId) {
    try {
        // Use the specific Zeffy campaign URL provided
        const url = 'https://www.zeffy.com/en-US/peer-to-peer/f3-austin-donates-to-austin-him-foundation-challenge';
        console.log(`Fetching data from Zeffy campaign: ${url}`);
        
        const response = await axios.get(url);
        const html = response.data;
        
        // Using regex to extract campaign data from the HTML
        // For fundraising amounts, typically looking for patterns like "$X,XXX" or "X%"
        
        // Find current amount raised pattern
        let totalRaised = 0;
        const raisedPattern = /\$([0-9,]+)\s*raised/i;
        const raisedMatch = html.match(raisedPattern);
        if (raisedMatch && raisedMatch[1]) {
            totalRaised = parseInt(raisedMatch[1].replace(/,/g, ''));
            console.log(`Found total raised: ${totalRaised}`);
        }
        
        // Find fundraising goal pattern
        let fundraisingGoal = 0;
        const goalPattern = /of\s*\$([0-9,]+)\s*goal/i;
        const goalMatch = html.match(goalPattern);
        if (goalMatch && goalMatch[1]) {
            fundraisingGoal = parseInt(goalMatch[1].replace(/,/g, ''));
            console.log(`Found goal amount: ${fundraisingGoal}`);
        }
        
        // If we couldn't find both values, try alternative patterns
        if (!totalRaised || !fundraisingGoal) {
            // Try to find JSON data in the page
            const jsonPattern = /<script\s+type="application\/json"\s+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i;
            const jsonMatch = html.match(jsonPattern);
            
            if (jsonMatch && jsonMatch[1]) {
                try {
                    const jsonData = JSON.parse(jsonMatch[1]);
                    // Navigate through the JSON structure to find fundraising data
                    // This path may need adjusting based on Zeffy's actual structure
                    const pageProps = jsonData?.props?.pageProps;
                    
                    if (pageProps) {
                        // Try to find campaign data in various possible locations
                        const campaignData = pageProps.campaign || 
                                            pageProps.fundraiser || 
                                            pageProps.initialState?.campaign ||
                                            pageProps.initialState?.fundraiser;
                                            
                        if (campaignData) {
                            // Extract raised amount and goal
                            if (!totalRaised && campaignData.raised) {
                                totalRaised = parseInt(campaignData.raised);
                                console.log(`Found total raised in JSON: ${totalRaised}`);
                            }
                            
                            if (!fundraisingGoal && campaignData.goal) {
                                fundraisingGoal = parseInt(campaignData.goal);
                                console.log(`Found goal amount in JSON: ${fundraisingGoal}`);
                            }
                        }
                    }
                } catch (err) {
                    console.warn("Error parsing JSON data from page:", err.message);
                }
            }
        }
        
        // If we still couldn't find the values, try one more set of patterns
        if (!totalRaised) {
            const altRaisedPattern = /data-amount="([0-9.]+)"/i;
            const altRaisedMatch = html.match(altRaisedPattern);
            if (altRaisedMatch && altRaisedMatch[1]) {
                totalRaised = parseFloat(altRaisedMatch[1]);
                console.log(`Found alternative total raised: ${totalRaised}`);
            }
        }
        
        if (!fundraisingGoal) {
            const altGoalPattern = /data-goal="([0-9.]+)"/i;
            const altGoalMatch = html.match(altGoalPattern);
            if (altGoalMatch && altGoalMatch[1]) {
                fundraisingGoal = parseFloat(altGoalMatch[1]);
                console.log(`Found alternative goal amount: ${fundraisingGoal}`);
            }
        }
        
        // Final fallback values if we couldn't extract the data
        if (!totalRaised) totalRaised = 0;
        if (!fundraisingGoal) fundraisingGoal = 25000;
        
        console.log(`Final values - Total raised: ${totalRaised}, Goal: ${fundraisingGoal}`);
        return { total: totalRaised, goal: fundraisingGoal };
    } catch (error) {
        console.error("Error fetching Zeffy data:", error);
        throw error;
    }
}

// Helper function to create a wavy line path
function createWavePath(startX, startY, width, amplitude, frequency) {
    let path = `M ${startX} ${startY}`;
    for (let x = 0; x <= width; x += 10) {
        const y = startY + Math.sin(x * frequency * 0.01) * amplitude;
        path += ` L ${x} ${y}`;
    }
    return path;
}

// Helper function to add decorative dots in the background
function addBackgroundDots(svg, width, height) {
    const numDots = 50;
    for (let i = 0; i < numDots; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = 1 + Math.random() * 3;
        
        svg.append('circle')
            .attr('cx', x)
            .attr('cy', y)
            .attr('r', size)
            .attr('fill', '#E1F5FE')
            .attr('opacity', 0.5);
    }
}
