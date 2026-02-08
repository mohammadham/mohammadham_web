/**
 * Simple Development Server
 * Serves static files and API endpoints
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8001;
const ROOT_DIR = path.join(__dirname, '..');

// Import API logic
let apiHandler;
try {
    const { handleRequest } = require('./index.js');
    apiHandler = handleRequest;
} catch (e) {
    console.log('API module not loaded, using mock');
    apiHandler = null;
}

// MIME types
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

// In-memory portfolio data for development
let portfolioData = {
    siteSettings: {
        siteName: 'Gridx Portfolio',
        logo: '/assets/images/logo.svg',
        copyright: 'All rights reserved by WordPress River'
    },
    hero: {
        name: 'David Henderson',
        title: 'A WEB DESIGNER',
        description: 'I am a Web Designer based in san francisco.',
        image: '/assets/images/me.png',
        username: '@davidhenderson'
    },
    about: {
        summary: 'I am a San francisco-based product designer with a focus on web design, illustration, a visual development. I have a diverse range of experience having worked across various fields and industries.',
        detailedBio: 'Sit amet luctussd fav venenatis, lectus magna fringilla inis urna, porttitor rhoncus dolor purus non enim praesent in elementum sahas facilisis leo, vel fringilla est ullamcorper eget nulla facilisi etisam dignissim diam quis enim lobortis viverra orci sagittis eu volutpat odio facilisis mauris sit.'
    },
    stats: [
        { value: '07', label: 'Years', sublabel: 'Experience' },
        { value: '+125', label: 'CLIENTS', sublabel: 'WORLDWIDE' },
        { value: '+210', label: 'Total', sublabel: 'Projects' }
    ],
    socialLinks: [
        { platform: 'dribbble', url: '#', icon: 'iconoir-dribbble' },
        { platform: 'twitter', url: '#', icon: 'iconoir-twitter' },
        { platform: 'instagram', url: '#', icon: 'iconoir-instagram' },
        { platform: 'facebook', url: '#', icon: 'iconoir-facebook-tag' }
    ],
    services: [
        { id: 1, title: 'Photography', icon: 'iconoir-camera', description: 'Sit amet luctussd fav venenatis, lectus magna fringilla inis urna.' },
        { id: 2, title: 'Web Designing', icon: 'iconoir-design-pencil', description: 'Sit amet luctussd fav venenatis, lectus magna fringilla inis urna.' },
        { id: 3, title: 'Branding', icon: 'iconoir-color-filter', description: 'Sit amet luctussd fav venenatis, lectus magna fringilla inis urna.' },
        { id: 4, title: 'Development', icon: 'iconoir-dev-mode-phone', description: 'Sit amet luctussd fav venenatis, lectus magna fringilla inis urna.' }
    ],
    projects: [
        { id: 1, title: 'Dynamic', category: 'WEB DESIGNING', image: '/assets/images/project1.jpeg', link: '/work-details.html' },
        { id: 2, title: 'Diesel H1', category: 'PHOTOGRAPHY', image: '/assets/images/project2.jpeg', link: '/work-details.html' },
        { id: 3, title: 'Seven Studio', category: 'MOBILE DESIGNING', image: '/assets/images/project3.jpeg', link: '/work-details.html' },
        { id: 4, title: 'Raven Studio', category: 'Branding', image: '/assets/images/project4.jpeg', link: '/work-details.html' },
        { id: 5, title: 'Submarine', category: 'MOBILE DESIGNING', image: '/assets/images/project5.jpeg', link: '/work-details.html' },
        { id: 6, title: 'Hydra Merc', category: 'WEB DESIGNING', image: '/assets/images/project6.jpeg', link: '/work-details.html' }
    ],
    experience: [
        { id: 1, period: '2007 - 2017', title: 'Framer Designer & Developer', company: 'Bluebase Designs', description: 'Sit amet luctussd fav venenatis.' },
        { id: 2, period: '2017 - 2023', title: 'Front-End Developer', company: 'Larsen & Toubro', description: 'Sit amet luctussd fav venenatis.' }
    ],
    education: [
        { id: 1, period: '2004 - 2007', title: 'Bachelor Degree in Psychology', institution: 'University of California', description: 'Sit amet luctussd fav venenatis.' },
        { id: 2, period: '2007 - 2009', title: 'Master Degree in Designing', institution: 'University of Texas', description: 'Sit amet luctussd fav venenatis.' }
    ],
    skills: [
        { id: 1, name: 'JavaScript', percent: '85%', description: 'Non enim praesent' },
        { id: 2, name: 'Python', percent: '78%', description: 'Non enim praesent' },
        { id: 3, name: 'Figma', percent: '92%', description: 'Non enim praesent' },
        { id: 4, name: 'WordPress', percent: '90%', description: 'Non enim praesent' },
        { id: 5, name: 'React', percent: '81%', description: 'Non enim praesent' },
        { id: 6, name: 'Adobe XD', percent: '87%', description: 'Non enim praesent' }
    ],
    awards: [
        { id: 1, date: '14 May 2020', name: 'Bluebase', description: 'Non enim praesent' },
        { id: 2, date: '26 June 2018', name: 'Demble', description: 'Non enim praesent' }
    ],
    contact: {
        emails: ['info@bluebase.com', 'info@bluebase2.com'],
        phones: ['+1 504-899-8221', '+1 504-749-5456'],
        address: '22 Baker Street, Texas\nUnited States\nW1U 3BW'
    },
    blog: [
        { id: 1, title: 'Consulted admitting is power acuteness.', date: '25 March 2022', comments: 4, shares: 7, image: '/assets/images/blog1.jpeg', excerpt: 'Sit amet luctussd fav venenatis.' },
        { id: 2, title: 'Unsatiable entreaties may collecting Power.', date: '25 March 2022', comments: 4, shares: 7, image: '/assets/images/blog2.jpeg', excerpt: 'Sit amet luctussd fav venenatis.' },
        { id: 3, title: 'Discovery incommode earnestly he commanded', date: '25 March 2022', comments: 4, shares: 7, image: '/assets/images/blog1.jpeg', excerpt: 'Sit amet luctussd fav venenatis.' }
    ]
};

// Auth tokens
let authTokens = new Set();
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin12345';

function generateToken() {
    return 'token_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
}

function verifyToken(token) {
    return authTokens.has(token);
}

// Handle API requests
async function handleAPI(req, res, pathname, body) {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    // CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200, headers);
        res.end();
        return;
    }

    // Public: Get portfolio
    if (pathname === '/api/portfolio' && req.method === 'GET') {
        res.writeHead(200, headers);
        res.end(JSON.stringify({ success: true, data: portfolioData }));
        return;
    }

    // Admin: Login
    if (pathname === '/api/admin/login' && req.method === 'POST') {
        try {
            const { username, password } = JSON.parse(body);
            if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
                const token = generateToken();
                authTokens.add(token);
                res.writeHead(200, headers);
                res.end(JSON.stringify({ success: true, token, message: 'Login successful' }));
            } else {
                res.writeHead(401, headers);
                res.end(JSON.stringify({ success: false, message: 'Invalid credentials' }));
            }
        } catch (e) {
            res.writeHead(400, headers);
            res.end(JSON.stringify({ success: false, message: 'Invalid request' }));
        }
        return;
    }

    // Admin: Verify token
    if (pathname === '/api/admin/verify' && req.method === 'GET') {
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            if (verifyToken(token)) {
                res.writeHead(200, headers);
                res.end(JSON.stringify({ success: true, valid: true }));
                return;
            }
        }
        res.writeHead(401, headers);
        res.end(JSON.stringify({ success: false, valid: false }));
        return;
    }

    // Admin: Logout
    if (pathname === '/api/admin/logout' && req.method === 'POST') {
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            authTokens.delete(token);
        }
        res.writeHead(200, headers);
        res.end(JSON.stringify({ success: true, message: 'Logged out' }));
        return;
    }

    // Protected routes - check auth
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.writeHead(401, headers);
        res.end(JSON.stringify({ success: false, message: 'Unauthorized' }));
        return;
    }

    const token = authHeader.substring(7);
    if (!verifyToken(token)) {
        res.writeHead(401, headers);
        res.end(JSON.stringify({ success: false, message: 'Invalid token' }));
        return;
    }

    // Admin: Update portfolio
    if (pathname === '/api/admin/portfolio' && req.method === 'PUT') {
        try {
            const data = JSON.parse(body);
            portfolioData = { ...portfolioData, ...data };
            res.writeHead(200, headers);
            res.end(JSON.stringify({ success: true, data: portfolioData }));
        } catch (e) {
            res.writeHead(400, headers);
            res.end(JSON.stringify({ success: false, message: 'Invalid data' }));
        }
        return;
    }

    // Not found
    res.writeHead(404, headers);
    res.end(JSON.stringify({ success: false, message: 'Not found' }));
}

// Handle static files
function serveStatic(req, res, pathname) {
    let filePath = path.join(ROOT_DIR, pathname);
    
    // Default to index.html for directory
    if (pathname === '/' || pathname === '') {
        filePath = path.join(ROOT_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // Try with .html extension
                if (!ext) {
                    fs.readFile(filePath + '.html', (err2, content2) => {
                        if (err2) {
                            res.writeHead(404);
                            res.end('Not Found');
                        } else {
                            res.writeHead(200, { 'Content-Type': 'text/html' });
                            res.end(content2);
                        }
                    });
                } else {
                    res.writeHead(404);
                    res.end('Not Found');
                }
            } else {
                res.writeHead(500);
                res.end('Server Error');
            }
        } else {
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*'
            });
            res.end(content);
        }
    });
}

// Main server
const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = decodeURIComponent(url.pathname);

    // Handle API routes
    if (pathname.startsWith('/api/')) {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            handleAPI(req, res, pathname, body);
        });
        return;
    }

    // Serve static files
    serveStatic(req, res, pathname);
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`\\n===================================`);
    console.log(`  Portfolio Server running!`);
    console.log(`===================================`);
    console.log(`  URL: http://localhost:${PORT}`);
    console.log(`  Admin: http://localhost:${PORT}/admin/`);
    console.log(`===================================`);
    console.log(`  Admin Credentials:`);
    console.log(`  Username: admin`);
    console.log(`  Password: admin12345`);
    console.log(`===================================\\n`);
});
