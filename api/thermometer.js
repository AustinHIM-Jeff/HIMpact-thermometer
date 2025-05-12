const d3 = require('d3');
const { JSDOM } = require('jsdom');
const querystring = require('querystring');

// Vercel Serverless Function Handler
module.exports = async (req, res) => {
  // 1. Parse x-www-form-urlencoded body from Slack
  const bodyString = await new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => resolve(data));
    req.on('error', err => reject(err));
  });
  const body = querystring.parse(bodyString);

  // 2. Extract command text for total and goal
  const { text } = body;
  const [ totalStr, goalStr ] = (text || '').trim().split(' ');
  const total = parseInt(totalStr, 10) || 0;
  const goal = parseInt(goalStr, 10) || 10000;

  // 3. Compute dimensions and fill height
  const width = 100;
  const height = 300;
  const ratio = Math.max(0, Math.min(1, total / goal));
  const filledHeight = ratio * height;

  // 4. Create SVG via D3 + JSDOM
  const dom = new JSDOM(`<!DOCTYPE html><body></body>`);
  const bodySel = d3.select(dom.window.document).select('body');
  const svg = bodySel.append('svg')
    .attr('width', width)
    .attr('height', height);

  // Thermometer outline
  svg.append('rect')
    .attr('x', 20)
    .attr('y', 0)
    .attr('width', 60)
    .attr('height', height)
    .attr('fill', 'none')
    .attr('stroke', '#333');

  // Filled portion
  svg.append('rect')
    .attr('x', 20)
    .attr('y', height - filledHeight)
    .attr('width', 60)
    .attr('height', filledHeight)
    .attr('fill', '#4caf50');

  // 5. Encode SVG as Data URI
  const svgString = dom.window.document.querySelector('body').innerHTML;
  const svgDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;

  // 6. Construct Slack Block Kit Response
  const payload = {
    response_type: 'in_channel',
    blocks: [
      {
        type: 'image',
        image_url: svgDataUri,
        alt_text: `Raised $${total} of $${goal}`
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '💖 Donate Now'
            },
            url: 'https://www.zeffy.com/en-US/peer-to-peer/f3-austin-donates-to-austin-him-foundation-challenge',
            action_id: 'donate_button'
          }
        ]
      }
    ]
  };

  // 7. Send JSON response back to Slack
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;
  res.end(JSON.stringify(payload));
};
