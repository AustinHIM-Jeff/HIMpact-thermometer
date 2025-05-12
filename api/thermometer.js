const { JSDOM } = require('jsdom');
const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
    console.log("Function entered. Request Query:", req.query);
    try {
        const d3 = await import('d3'); // Dynamic import for D3
        console.log("D3 module loaded dynamically.");

        // STEP 1: Fetch data from Zeffy with improved parsing
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

        // STEP 2: Create SVG with tree-themed design
        const width = 300;
        const height = 480; // Increased height to ensure text isn't cut off
        const padding = 30;
        const innerWidth = width - (padding * 2);
        const innerHeight = height - (padding * 2) - 40; // Additional space for text
        
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
            .attr('y', padding / 2 + 10)
            .attr('text-anchor', 'middle')
            .attr('font-family', 'Arial, sans-serif')
            .attr('font-weight', 'bold')
            .attr('font-size', '20px')
            .attr('fill', '#2E7D32') // Forest green
            .text('Fundraising Progress');
        
        // Create gradients for tree-themed colors
        const defs = svg.append('defs');
        
        // Trunk gradient (brown tones)
        const trunkGradient = defs.append('linearGradient')
            .attr('id', 'trunkGradient')
            .attr('gradientUnits', 'userSpaceOnUse')
            .attr('x1', '0%')
            .attr('y1', '100%')
            .attr('x2', '0%')
            .attr('y2', '0%');
            
        trunkGradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#8B4513'); // SaddleBrown
            
        trunkGradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#A0522D'); // Sienna

        // Foliage gradient (green tones)
        const foliageGradient = defs.append('linearGradient')
            .attr('id', 'foliageGradient')
            .attr('gradientUnits', 'userSpaceOnUse')
            .attr('x1', '0%')
            .attr('y1', '100%')
            .attr('x2', '0%')
            .attr('y2', '0%');
            
        foliageGradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#2E7D32'); // Dark green
            
        foliageGradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#4CAF50'); // Medium green
        
        // Create tree elements
        const treeBaseX = width / 2;
        const treeBaseY = height - padding - 80; // Base of the tree (bottom)
        const treeHeight = innerHeight - 40;
        const trunkWidth = 40;
        
        // ROOTS: Draw tree roots (decorative, always visible)
        drawTreeRoots(svg, treeBaseX, treeBaseY, trunkWidth * 1.5);
        
        // TRUNK: Background (empty trunk, light brown)
        svg.append('rect')
            .attr('x', treeBaseX - (trunkWidth / 2))
            .attr('y', treeBaseY - treeHeight)
            .attr('width', trunkWidth)
            .attr('height', treeHeight)
            .attr('rx', 5)
            .attr('ry', 5)
            .attr('fill', '#D2B48C') // Tan color for empty trunk
            .attr('stroke', '#8B4513') // SaddleBrown
            .attr('stroke-width', 1);
            
        // Growth markers (horizontal lines across trunk)
        for (let i = 0; i <= 10; i++) {
            const yPos = treeBaseY - (i * treeHeight / 10);
            const percentValue = i * 10;
            
            // Draw marker lines across trunk
            svg.append('line')
                .attr('x1', treeBaseX - (trunkWidth / 2) - 5)
                .attr('y1', yPos)
                .attr('x2', treeBaseX + (trunkWidth / 2) + 5)
                .attr('y2', yPos)
                .attr('stroke', '#8B4513') // SaddleBrown
                .attr('stroke-width', 0.5)
                .attr('stroke-dasharray', '2,2');
                
            // Add percentage markers on the side
            if (i % 2 === 0) { // Only show every 20%
                svg.append('text')
                    .attr('x', treeBaseX - (trunkWidth / 2) - 10)
                    .attr('y', yPos + 4)
                    .attr('text-anchor', 'end')
                    .attr('font-family', 'Arial, sans-serif')
                    .attr('font-size', '10px')
                    .attr('fill', '#8B4513')
                    .text(`${percentValue}%`);
            }
        }
        
        // Calculate filled height for trunk
        const filledHeight = percentage * treeHeight;
        
        // Create a clip path for the filled portion of trunk
        defs.append('clipPath')
            .attr('id', 'trunkClip')
            .append('rect')
                .attr('x', treeBaseX - (trunkWidth / 2))
                .attr('y', treeBaseY - filledHeight)
                .attr('width', trunkWidth)
                .attr('height', filledHeight)
                .attr('rx', 5)
                .attr('ry', 5);
        
        // Filled trunk with gradient and clip path
        svg.append('rect')
            .attr('x', treeBaseX - (trunkWidth / 2))
            .attr('y', treeBaseY - treeHeight)
            .attr('width', trunkWidth)
            .attr('height', treeHeight)
            .attr('rx', 5)
            .attr('ry', 5)
            .attr('clip-path', 'url(#trunkClip)')
            .attr('fill', 'url(#trunkGradient)');
        
        // FOLIAGE: Draw tree foliage based on percentage
        drawTreeFoliage(svg, treeBaseX, treeBaseY - treeHeight, percentage);
        
        // Add current percentage inside the trunk
        svg.append('text')
            .attr('x', treeBaseX)
            .attr('y', treeBaseY - filledHeight - 15)
            .attr('text-anchor', 'middle')
            .attr('font-family', 'Arial, sans-serif')
            .attr('font-weight', 'bold')
            .attr('font-size', '18px')
            .attr('fill', '#fff')
            .attr('stroke', '#2E7D32')
            .attr('stroke-width', 0.5)
            .text(`${Math.round(percentage * 100)}%`);

        // Display current amount raised with dollar sign
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height - 50)
            .attr('text-anchor', 'middle')
            .attr('font-family', 'Arial, sans-serif')
            .attr('font-weight', 'bold')
            .attr('font-size', '22px')
            .attr('fill', '#2E7D32')
            .text(`$${currentAmount.toLocaleString()}`);
            
        // Display out of total with goal amount
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height - 25)
            .attr('text-anchor', 'middle')
            .attr('font-family', 'Arial, sans-serif')
            .attr('font-size', '16px')
            .attr('fill', '#5D4037') // Brown text
            .text(`of $${goalAmount.toLocaleString()} goal`);

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

// Helper function to fetch data from Zeffy with improved parsing
async function fetchZeffyData() {
    try {
        const url = 'https://www.zeffy.com/en-US/peer-to-peer/f3-austin-donates-to-austin-him-foundation-challenge';
        console.log(`Fetching data from Zeffy campaign: ${url}`);
        
        const response = await axios.get(url);
        const html = response.data;
        
        // Use Cheerio for more reliable HTML parsing
        const $ = cheerio.load(html);
        
        // Strategy 1: Look for specific data elements with classes/IDs
        let totalRaised = 0;
        let fundraisingGoal = 0;
        
        // Look for fundraising stats in common formats
        $('.fundraising-stats, .campaign-stats, .stats, .progress-stats').each((i, el) => {
            const statsText = $(el).text();
            
            // Try to match "$X,XXX raised of $Y,YYY goal" pattern
            const fullPattern = /\$([0-9,.]+)(?:\s*raised|\s*donated)?\s*(?:of)?\s*\$([0-9,.]+)(?:\s*goal)?/i;
            const fullMatch = statsText.match(fullPattern);
            
            if (fullMatch && fullMatch[1] && fullMatch[2]) {
                totalRaised = parseFloat(fullMatch[1].replace(/,/g, ''));
                fundraisingGoal = parseFloat(fullMatch[2].replace(/,/g, ''));
                console.log(`Found via stats element: $${totalRaised} of $${fundraisingGoal}`);
                return false; // Break the loop if found
            }
        });
        
        // If not found through specific elements, try scanning all text for pattern
        if (!totalRaised || !fundraisingGoal) {
            // Search the entire body text
            const bodyText = $('body').text();
            
            // Look for "$X raised of $Y goal" pattern in the entire body
            const raisedGoalPattern = /\$([0-9,.]+)(?:\s*raised|\s*donated)(?:[^$]*)\$([0-9,.]+)(?:\s*goal)/i;
            const raisedGoalMatch = bodyText.match(raisedGoalPattern);
            
            if (raisedGoalMatch && raisedGoalMatch[1] && raisedGoalMatch[2]) {
                totalRaised = parseFloat(raisedGoalMatch[1].replace(/,/g, ''));
                fundraisingGoal = parseFloat(raisedGoalMatch[2].replace(/,/g, ''));
                console.log(`Found via body text pattern: $${totalRaised} of $${fundraisingGoal}`);
            }
        }
        
        // Strategy 2: Try to extract from progress bars
        if (!totalRaised || !fundraisingGoal) {
            // Look for progress bars with aria-valuenow and aria-valuemax
            $('div[role="progressbar"], .progress-bar, [class*="progress"]').each((i, el) => {
                const current = $(el).attr('aria-valuenow') || $(el).attr('data-current') || $(el).attr('value');
                const max = $(el).attr('aria-valuemax') || $(el).attr('data-max') || $(el).attr('max');
                
                if (current && max) {
                    totalRaised = parseFloat(current);
                    fundraisingGoal = parseFloat(max);
                    console.log(`Found via progress element: ${totalRaised} of ${fundraisingGoal}`);
                    return false; // Break the loop if found
                }
            });
        }
        
        // Strategy 3: Look for JSON data in the page scripts
        if (!totalRaised || !fundraisingGoal) {
            $('script').each((i, el) => {
                const scriptContent = $(el).html();
                if (!scriptContent) return;
                
                // Look for JSON data containing fundraising information
                try {
                    // Find content that looks like JSON
                    const jsonMatch = scriptContent.match(/window\.__INITIAL_STATE__\s*=\s*({.*})/);
                    if (jsonMatch && jsonMatch[1]) {
                        const jsonData = JSON.parse(jsonMatch[1]);
                        
                        // Navigate through potential paths in the data structure
                        const campaignData = 
                            jsonData?.campaign || 
                            jsonData?.fundraiser ||
                            jsonData?.pageProps?.campaign || 
                            jsonData?.pageProps?.fundraiser ||
                            jsonData?.pageProps?.initialState?.campaign ||
                            jsonData?.pageProps?.initialState?.fundraiser;
                        
                        if (campaignData) {
                            if (campaignData.amountRaised || campaignData.raised) {
                                totalRaised = parseFloat(campaignData.amountRaised || campaignData.raised);
                            }
                            
                            if (campaignData.goal || campaignData.fundraisingGoal) {
                                fundraisingGoal = parseFloat(campaignData.goal || campaignData.fundraisingGoal);
                            }
                            
                            console.log(`Found via JSON data: ${totalRaised} of ${fundraisingGoal}`);
                            return false; // Break the loop if found
                        }
                    }
                } catch (err) {
                    // Continue to next script if JSON parse fails
                }
            });
        }
        
        // If we still couldn't find the values, try more specific pattern matching
        if (!totalRaised || !fundraisingGoal) {
            // Find any element containing "$X raised"
            $('*').each((i, el) => {
                const text = $(el).text();
                if (text.includes('raised') || text.includes('donated')) {
                    const amountPattern = /\$([0-9,.]+)/;
                    const match = text.match(amountPattern);
                    
                    if (match && match[1]) {
                        totalRaised = parseFloat(match[1].replace(/,/g, ''));
                        console.log(`Found raised amount: ${totalRaised}`);
                    }
                }
                
                if (text.includes('goal')) {
                    const goalPattern = /\$([0-9,.]+)/;
                    const match = text.match(goalPattern);
                    
                    if (match && match[1]) {
                        fundraisingGoal = parseFloat(match[1].replace(/,/g, ''));
                        console.log(`Found goal amount: ${fundraisingGoal}`);
                    }
                }
            });
        }
        
        // Final fallback values if we couldn't extract the data
        if (!totalRaised) totalRaised = 5000;
        if (!fundraisingGoal) fundraisingGoal = 25000;
        
        console.log(`Final values - Total raised: ${totalRaised}, Goal: ${fundraisingGoal}`);
        return { total: totalRaised, goal: fundraisingGoal };
    } catch (error) {
        console.error("Error fetching Zeffy data:", error);
        throw error;
    }
}

// Helper function to draw tree roots
function drawTreeRoots(svg, centerX, baseY, width) {
    // Define root paths
    const rootPaths = [
        // Left main root
        `M ${centerX} ${baseY} Q ${centerX - width/2} ${baseY + 10}, ${centerX - width} ${baseY + 30}`,
        // Right main root
        `M ${centerX} ${baseY} Q ${centerX + width/2} ${baseY + 10}, ${centerX + width} ${baseY + 30}`,
        // Left small roots (from main root)
        `M ${centerX - width/2} ${baseY + 10} Q ${centerX - width/2 - 10} ${baseY + 20}, ${centerX - width/2 - 20} ${baseY + 15}`,
        `M ${centerX - width/2} ${baseY + 10} Q ${centerX - width/2 - 5} ${baseY + 25}, ${centerX - width/2 - 15} ${baseY + 35}`,
        // Right small roots (from main root)
        `M ${centerX + width/2} ${baseY + 10} Q ${centerX + width/2 + 10} ${baseY + 20}, ${centerX + width/2 + 20} ${baseY + 15}`,
        `M ${centerX + width/2} ${baseY + 10} Q ${centerX + width/2 + 5} ${baseY + 25}, ${centerX + width/2 + 15} ${baseY + 35}`
    ];
    
    // Draw each root path
    rootPaths.forEach((path, i) => {
        svg.append('path')
            .attr('d', path)
            .attr('fill', 'none')
            .attr('stroke', '#8B4513') // SaddleBrown
            .attr('stroke-width', i < 2 ? 6 : 3) // Thicker for main roots
            .attr('stroke-linecap', 'round');
    });
}

// Helper function to draw tree foliage based on progress percentage
function drawTreeFoliage(svg, centerX, topY, percentage) {
    // Only draw foliage if we're at least at 10% progress
    if (percentage < 0.1) return;
    
    // Calculate how much foliage to show based on percentage
    // At 10% we start showing small foliage, at 100% we show full foliage
    const foliageLevel = (percentage - 0.1) / 0.9; // Scale from 0 to 1 when percentage is 10% to 100%
    if (foliageLevel <= 0) return;
    
    // Define foliage as circles with increasing size as percentage increases
    const maxRadius = 60;
    const radius = Math.max(10, maxRadius * foliageLevel);
    
    // Create a group for all foliage elements
    const foliageGroup = svg.append('g')
        .attr('transform', `translate(${centerX}, ${topY})`);
    
    // Draw main foliage blob
    foliageGroup.append('circle')
        .attr('cx', 0)
        .attr('cy', -radius * 0.5)
        .attr('r', radius)
        .attr('fill', 'url(#foliageGradient)');
    
    // Draw additional foliage blobs based on percentage
    if (foliageLevel > 0.3) {
        // Left foliage
        foliageGroup.append('circle')
            .attr('cx', -radius * 0.6)
            .attr('cy', -radius * 0.3)
            .attr('r', radius * 0.7)
            .attr('fill', 'url(#foliageGradient)');
    }
    
    if (foliageLevel > 0.5) {
        // Right foliage
        foliageGroup.append('circle')
            .attr('cx', radius * 0.6)
            .attr('cy', -radius * 0.3)
            .attr('r', radius * 0.8)
            .attr('fill', 'url(#foliageGradient)');
    }
    
    if (foliageLevel > 0.7) {
        // Upper foliage
        foliageGroup.append('circle')
            .attr('cx', 0)
            .attr('cy', -radius * 1.1)
            .attr('r', radius * 0.6)
            .attr('fill', 'url(#foliageGradient)');
    }
    
    if (foliageLevel > 0.9) {
        // Extra foliage details for near completion
        foliageGroup.append('circle')
            .attr('cx', -radius * 0.3)
            .attr('cy', -radius * 0.8)
            .attr('r', radius * 0.4)
            .attr('fill', 'url(#foliageGradient)');
            
        foliageGroup.append('circle')
            .attr('cx', radius * 0.3)
            .attr('cy', -radius * 0.8)
            .attr('r', radius * 0.4)
            .attr('fill', 'url(#foliageGradient)');
    }
}
