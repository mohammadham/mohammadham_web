/**
 * Portfolio API - Cloudflare Workers Compatible
 * This API handles all CRUD operations for the portfolio
 * Uses localStorage simulation for development, replace with Cloudflare KV in production
 */

// Default Admin Credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'portfolio2024';
const JWT_SECRET = 'portfolio-secret-key-2024';

// Token storage (in production, use KV)
let authTokens = new Set();

// Default Portfolio Data
const defaultData = {
    siteSettings: {
        siteName: 'Gridx Portfolio',
        logo: './assets/images/logo.svg',
        copyright: 'All rights reserved by WordPress River'
    },
    hero: {
        name: 'David Henderson',
        title: 'A WEB DESIGNER',
        description: 'I am a Web Designer based in san francisco.',
        image: './assets/images/me.png',
        username: '@davidhenderson'
    },
    about: {
        summary: 'I am a San francisco-based product designer with a focus on web design, illustration, a visual development. I have a diverse range of experience having worked across various fields and industries.',
        detailedBio: 'Sit amet luctussd fav venenatis, lectus magna fringilla inis urna, porttitor rhoncus dolor purus non enim praesent in elementum sahas facilisis leo, vel fringilla est ullamcorper eget nulla facilisi etisam dignissim diam quis enim lobortis viverra orci sagittis eu volutpat odio facilisis mauris sit.\n\nScelerisque fermentum duisi faucibus in ornare quam sisd sit amet luctussd fav venenatis, lectus magna fringilla zac urna, porttitor rhoncus dolor purus non enim praesent cuz elementum sahas facilisis leot.'
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
        { id: 1, title: 'Photography', icon: 'iconoir-camera', description: 'Sit amet luctussd fav venenatis, lectus magna fringilla inis urna, porttitor asna rhoncus dolor purus non enim aberitin praesent in elementum sahas facilisis leo, vel fringilla est etisam dignissim.' },
        { id: 2, title: 'Web Designing', icon: 'iconoir-design-pencil', description: 'Sit amet luctussd fav venenatis, lectus magna fringilla inis urna, porttitor asna rhoncus dolor purus non enim aberitin praesent in elementum sahas facilisis leo, vel fringilla est etisam dignissim.' },
        { id: 3, title: 'Branding', icon: 'iconoir-color-filter', description: 'Sit amet luctussd fav venenatis, lectus magna fringilla inis urna, porttitor asna rhoncus dolor purus non enim aberitin praesent in elementum sahas facilisis leo, vel fringilla est etisam dignissim.' },
        { id: 4, title: 'Development', icon: 'iconoir-dev-mode-phone', description: 'Sit amet luctussd fav venenatis, lectus magna fringilla inis urna, porttitor asna rhoncus dolor purus non enim aberitin praesent in elementum sahas facilisis leo, vel fringilla est etisam dignissim.' }
    ],
    projects: [
        { id: 1, title: 'Dynamic', category: 'WEB DESIGNING', image: './assets/images/project1.jpeg', link: './work-details.html' },
        { id: 2, title: 'Diesel H1', category: 'PHOTOGRAPHY', image: './assets/images/project2.jpeg', link: './work-details.html' },
        { id: 3, title: 'Seven Studio', category: 'MOBILE DESIGNING', image: './assets/images/project3.jpeg', link: './work-details.html' },
        { id: 4, title: 'Raven Studio', category: 'Branding', image: './assets/images/project4.jpeg', link: './work-details.html' },
        { id: 5, title: 'Submarine', category: 'MOBILE DESIGNING', image: './assets/images/project5.jpeg', link: './work-details.html' },
        { id: 6, title: 'Hydra Merc', category: 'WEB DESIGNING', image: './assets/images/project6.jpeg', link: './work-details.html' }
    ],
    experience: [
        { id: 1, period: '2007 - 2017', title: 'Framer Designer & Developer', company: 'Bluebase Designs', description: 'Sit amet luctussd fav venenatis, lectus magna fringilla inis urna, porttitor rhoncus dolor purus non enim praesent in elementum sahas facilisis leo, vel fringilla est ullamcorper eget nulla facilisi etisam dignissim diam quis enim lobortis viverra orci sagittis eu volutpat odio facilisis mauris sit.' },
        { id: 2, period: '2017 - 2023', title: 'Front-End Developer', company: 'Larsen & Toubro', description: 'Sit amet luctussd fav venenatis, lectus magna fringilla inis urna, porttitor rhoncus dolor purus non enim praesent in elementum sahas facilisis leo, vel fringilla est ullamcorper eget nulla facilisi etisam dignissim diam quis enim lobortis viverra orci sagittis eu volutpat odio facilisis mauris sit.' }
    ],
    education: [
        { id: 1, period: '2004 - 2007', title: 'Bachelor Degree in Psychology', institution: 'University of California', description: 'Sit amet luctussd fav venenatis, lectus magna fringilla inis urna, porttitor rhoncus dolor purus non enim praesent in elementum sahas facilisis leo, vel fringilla est ullamcorper eget nulla facilisi etisam dignissim diam quis enim lobortis viverra orci sagittis eu volutpat odio facilisis mauris sit.' },
        { id: 2, period: '2007 - 2009', title: 'Master Degree in Designing', institution: 'University of Texas', description: 'Sit amet luctussd fav venenatis, lectus magna fringilla inis urna, porttitor rhoncus dolor purus non enim praesent in elementum sahas facilisis leo, vel fringilla est ullamcorper eget nulla facilisi etisam dignissim diam quis enim lobortis viverra orci sagittis eu volutpat odio facilisis mauris sit.' }
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
        { id: 1, title: 'Consulted admitting is power acuteness.', date: '25 March 2022', comments: 4, shares: 7, image: './assets/images/blog1.jpeg', excerpt: 'Sit amet luctussd fav venenatis, lectus magna fringilla inis urna, porttitor rhoncus dolor purus non enim praesent in elementum sahas facilisis leo, vel fringilla est ullamcorper eget nulla facilisi etisam dignissim diam quis enim lobortis viverra orci sagittis eu volutpat odio facilisis mauris sit.', content: '' },
        { id: 2, title: 'Unsatiable entreaties may collecting Power.', date: '25 March 2022', comments: 4, shares: 7, image: './assets/images/blog2.jpeg', excerpt: 'Sit amet luctussd fav venenatis, lectus magna fringilla inis urna, porttitor rhoncus dolor purus non enim praesent in elementum sahas facilisis leo, vel fringilla est ullamcorper eget nulla facilisi etisam dignissim diam quis enim lobortis viverra orci sagittis eu volutpat odio facilisis mauris sit.', content: '' },
        { id: 3, title: 'Discovery incommode earnestly he commanded', date: '25 March 2022', comments: 4, shares: 7, image: './assets/images/blog1.jpeg', excerpt: 'Sit amet luctussd fav venenatis, lectus magna fringilla inis urna, porttitor rhoncus dolor purus non enim praesent in elementum sahas facilisis leo, vel fringilla est ullamcorper eget nulla facilisi etisam dignissim diam quis enim lobortis viverra orci sagittis eu volutpat odio facilisis mauris sit.', content: '' }
    ]
};

// In-memory storage (replace with KV in Cloudflare Workers)
let portfolioData = JSON.parse(JSON.stringify(defaultData));

// Helper Functions
function generateToken() {
    return 'token_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
}

function verifyToken(token) {
    return authTokens.has(token);
}

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
    };
}

// API Handler (Cloudflare Workers Format)
async function handleRequest(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders() });
    }

    // Public Routes
    if (path === '/api/portfolio' && method === 'GET') {
        return new Response(JSON.stringify({ success: true, data: portfolioData }), {
            headers: corsHeaders()
        });
    }

    // Admin Login
    if (path === '/api/admin/login' && method === 'POST') {
        try {
            const body = await request.json();
            const { username, password } = body;

            if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
                const token = generateToken();
                authTokens.add(token);
                return new Response(JSON.stringify({ 
                    success: true, 
                    token,
                    message: 'Login successful'
                }), { headers: corsHeaders() });
            }

            return new Response(JSON.stringify({ 
                success: false, 
                message: 'Invalid credentials'
            }), { status: 401, headers: corsHeaders() });
        } catch (e) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'Invalid request body'
            }), { status: 400, headers: corsHeaders() });
        }
    }

    // Admin Logout
    if (path === '/api/admin/logout' && method === 'POST') {
        const authHeader = request.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            authTokens.delete(token);
        }
        return new Response(JSON.stringify({ success: true, message: 'Logged out' }), {
            headers: corsHeaders()
        });
    }

    // Admin Verify Token
    if (path === '/api/admin/verify' && method === 'GET') {
        const authHeader = request.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            if (verifyToken(token)) {
                return new Response(JSON.stringify({ success: true, valid: true }), {
                    headers: corsHeaders()
                });
            }
        }
        return new Response(JSON.stringify({ success: false, valid: false }), {
            status: 401, headers: corsHeaders()
        });
    }

    // Protected Admin Routes - Require Authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
            status: 401, headers: corsHeaders()
        });
    }

    const token = authHeader.substring(7);
    if (!verifyToken(token)) {
        return new Response(JSON.stringify({ success: false, message: 'Invalid token' }), {
            status: 401, headers: corsHeaders()
        });
    }

    // Admin: Update entire portfolio
    if (path === '/api/admin/portfolio' && method === 'PUT') {
        try {
            const body = await request.json();
            portfolioData = { ...portfolioData, ...body };
            return new Response(JSON.stringify({ success: true, data: portfolioData }), {
                headers: corsHeaders()
            });
        } catch (e) {
            return new Response(JSON.stringify({ success: false, message: 'Invalid data' }), {
                status: 400, headers: corsHeaders()
            });
        }
    }

    // Admin: Update specific section
    const sectionMatch = path.match(/^\/api\/admin\/section\/([a-zA-Z]+)$/);
    if (sectionMatch && method === 'PUT') {
        try {
            const section = sectionMatch[1];
            const body = await request.json();
            
            if (portfolioData.hasOwnProperty(section)) {
                portfolioData[section] = body;
                return new Response(JSON.stringify({ success: true, data: portfolioData[section] }), {
                    headers: corsHeaders()
                });
            }
            return new Response(JSON.stringify({ success: false, message: 'Section not found' }), {
                status: 404, headers: corsHeaders()
            });
        } catch (e) {
            return new Response(JSON.stringify({ success: false, message: 'Invalid data' }), {
                status: 400, headers: corsHeaders()
            });
        }
    }

    // Admin: Get specific section
    const getSectionMatch = path.match(/^\/api\/admin\/section\/([a-zA-Z]+)$/);
    if (getSectionMatch && method === 'GET') {
        const section = getSectionMatch[1];
        if (portfolioData.hasOwnProperty(section)) {
            return new Response(JSON.stringify({ success: true, data: portfolioData[section] }), {
                headers: corsHeaders()
            });
        }
        return new Response(JSON.stringify({ success: false, message: 'Section not found' }), {
            status: 404, headers: corsHeaders()
        });
    }

    // Admin: CRUD for list items (projects, experience, education, skills, awards, blog, services)
    const itemMatch = path.match(/^\/api\/admin\/([a-zA-Z]+)$/);
    if (itemMatch) {
        const section = itemMatch[1];
        const validSections = ['projects', 'experience', 'education', 'skills', 'awards', 'blog', 'services', 'socialLinks', 'stats'];
        
        if (!validSections.includes(section)) {
            return new Response(JSON.stringify({ success: false, message: 'Invalid section' }), {
                status: 400, headers: corsHeaders()
            });
        }

        if (method === 'POST') {
            // Add new item
            try {
                const body = await request.json();
                const newId = portfolioData[section].length > 0 
                    ? Math.max(...portfolioData[section].map(i => i.id || 0)) + 1 
                    : 1;
                const newItem = { id: newId, ...body };
                portfolioData[section].push(newItem);
                return new Response(JSON.stringify({ success: true, data: newItem }), {
                    headers: corsHeaders()
                });
            } catch (e) {
                return new Response(JSON.stringify({ success: false, message: 'Invalid data' }), {
                    status: 400, headers: corsHeaders()
                });
            }
        }
    }

    // Admin: Update/Delete specific item
    const itemIdMatch = path.match(/^\/api\/admin\/([a-zA-Z]+)\/([0-9]+)$/);
    if (itemIdMatch) {
        const section = itemIdMatch[1];
        const itemId = parseInt(itemIdMatch[2]);
        const validSections = ['projects', 'experience', 'education', 'skills', 'awards', 'blog', 'services', 'socialLinks', 'stats'];
        
        if (!validSections.includes(section)) {
            return new Response(JSON.stringify({ success: false, message: 'Invalid section' }), {
                status: 400, headers: corsHeaders()
            });
        }

        if (method === 'PUT') {
            try {
                const body = await request.json();
                const index = portfolioData[section].findIndex(i => i.id === itemId);
                if (index !== -1) {
                    portfolioData[section][index] = { ...portfolioData[section][index], ...body };
                    return new Response(JSON.stringify({ success: true, data: portfolioData[section][index] }), {
                        headers: corsHeaders()
                    });
                }
                return new Response(JSON.stringify({ success: false, message: 'Item not found' }), {
                    status: 404, headers: corsHeaders()
                });
            } catch (e) {
                return new Response(JSON.stringify({ success: false, message: 'Invalid data' }), {
                    status: 400, headers: corsHeaders()
                });
            }
        }

        if (method === 'DELETE') {
            const index = portfolioData[section].findIndex(i => i.id === itemId);
            if (index !== -1) {
                const deleted = portfolioData[section].splice(index, 1);
                return new Response(JSON.stringify({ success: true, data: deleted[0] }), {
                    headers: corsHeaders()
                });
            }
            return new Response(JSON.stringify({ success: false, message: 'Item not found' }), {
                status: 404, headers: corsHeaders()
            });
        }
    }

    // Reset to default (for development)
    if (path === '/api/admin/reset' && method === 'POST') {
        portfolioData = JSON.parse(JSON.stringify(defaultData));
        return new Response(JSON.stringify({ success: true, message: 'Data reset to default' }), {
            headers: corsHeaders()
        });
    }

    return new Response(JSON.stringify({ success: false, message: 'Not found' }), {
        status: 404, headers: corsHeaders()
    });
}

// Export for Cloudflare Workers
export default {
    async fetch(request, env, ctx) {
        return handleRequest(request, env);
    }
};

// For local Node.js development
if (typeof module !== 'undefined') {
    module.exports = { handleRequest, defaultData, portfolioData };
}
