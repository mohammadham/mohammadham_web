/**
 * Local Development Server for Portfolio API
 * Run with: node server.js
 * Serves ONLY the API (uses the Cloudflare Worker `index.js` logic).
 */

const http = require('http');

// The Worker file uses `export default { fetch }`. Node loads it as an
// ES module exposing `.default`. Use that object's `fetch` as the handler.
const apiModule = require('./index.js');
const worker = apiModule.default || apiModule;

const PORT = process.env.PORT || 3001;

const server = http.createServer(async (req, res) => {
    let body = '';
    if (req.method === 'POST' || req.method === 'PUT') {
        for await (const chunk of req) body += chunk;
    }

    const protocol = 'http';
    const host = req.headers.host || `localhost:${PORT}`;

    // Build an object compatible with what the Worker's `handleRequest` expects.
    const mockRequest = {
        url: `${protocol}://${host}${req.url}`,
        method: req.method,
        headers: { get: (name) => req.headers[name.toLowerCase()] || null },
        json: async () => JSON.parse(body || '{}')
    };

    try {
        const response = await worker.fetch(mockRequest, {});
        const responseBody = await response.text();

        const headers = {};
        response.headers.forEach((value, key) => { headers[key] = value; });
        res.writeHead(response.status || 200, headers);
        res.end(responseBody);
    } catch (error) {
        console.error('Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Internal server error' }));
    }
});

server.listen(PORT, () => {
    console.log(`Portfolio API Server running on http://localhost:${PORT}`);
    console.log('\nAvailable Endpoints:');
    console.log('  GET  /api/portfolio         - Get all portfolio data (public)');
    console.log('  POST /api/admin/login       - Admin login');
    console.log('  POST /api/admin/logout      - Admin logout');
    console.log('  GET  /api/admin/verify      - Verify token');
    console.log('  PUT  /api/admin/portfolio   - Update entire portfolio');
    console.log('  PUT  /api/admin/section/:section - Update specific section');
    console.log('  POST /api/admin/:section    - Add item to section');
    console.log('  PUT  /api/admin/:section/:id - Update item');
    console.log('  DELETE /api/admin/:section/:id - Delete item');
    console.log('\nDefault Admin Credentials:');
    console.log('  Username: admin');
    console.log('  Password: admin12345');
});