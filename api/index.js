/**
 * Portfolio API - Cloudflare Workers Compatible
 * Handles portfolio CRUD with Cloudflare KV persistence
 */

const DEFAULT_ADMIN_USERNAME = 'admin';
const DEFAULT_ADMIN_PASSWORD = 'admin12345';
const DEFAULT_SESSION_TTL = 60 * 60 * 24 * 7;
const PORTFOLIO_KEY = 'portfolio:data';
const SESSION_PREFIX = 'session:';

const defaultData = {
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
        { id: '1', title: 'Photography', icon: 'iconoir-camera', description: 'Sit amet luctussd fav venenatis, lectus magna fringilla inis urna, porttitor asna rhoncus dolor purus non enim aberitin praesent in elementum sahas facilisis leo, vel fringilla est etisam dignissim.' },
        { id: '2', title: 'Web Designing', icon: 'iconoir-design-pencil', description: 'Sit amet luctussd fav venenatis, lectus magna fringilla inis urna, porttitor asna rhoncus dolor purus non enim aberitin praesent in elementum sahas facilisis leo, vel fringilla est etisam dignissim.' },
        { id: '3', title: 'Branding', icon: 'iconoir-color-filter', description: 'Sit amet luctussd fav venenatis, lectus magna fringilla inis urna, porttitor asna rhoncus dolor purus non enim aberitin praesent in elementum sahas facilisis leo, vel fringilla est etisam dignissim.' },
        { id: '4', title: 'Development', icon: 'iconoir-dev-mode-phone', description: 'Sit amet luctussd fav venenatis, lectus magna fringilla inis urna, porttitor asna rhoncus dolor purus non enim aberitin praesent in elementum sahas facilisis leo, vel fringilla est etisam dignissim.' }
    ],
    projects: [
        { id: '1', title: 'Dynamic', category: 'WEB DESIGNING', image: '/assets/images/project1.jpeg', link: '/work-details.html' },
        { id: '2', title: 'Diesel H1', category: 'PHOTOGRAPHY', image: '/assets/images/project2.jpeg', link: '/work-details.html' },
        { id: '3', title: 'Seven Studio', category: 'MOBILE DESIGNING', image: '/assets/images/project3.jpeg', link: '/work-details.html' },
        { id: '4', title: 'Raven Studio', category: 'Branding', image: '/assets/images/project4.jpeg', link: '/work-details.html' },
        { id: '5', title: 'Submarine', category: 'MOBILE DESIGNING', image: '/assets/images/project5.jpeg', link: '/work-details.html' },
        { id: '6', title: 'Hydra Merc', category: 'WEB DESIGNING', image: '/assets/images/project6.jpeg', link: '/work-details.html' }
    ],
    experience: [
        { id: '1', period: '2007 - 2017', title: 'Framer Designer & Developer', company: 'Bluebase Designs', description: 'Sit amet luctussd fav venenatis, lectus magna fringilla inis urna, porttitor rhoncus dolor purus non enim praesent in elementum sahas facilisis leo, vel fringilla est ullamcorper eget nulla facilisi etisam dignissim diam quis enim lobortis viverra orci sagittis eu volutpat odio facilisis mauris sit.' },
        { id: '2', period: '2017 - 2023', title: 'Front-End Developer', company: 'Larsen & Toubro', description: 'Sit amet luctussd fav venenatis, lectus magna fringilla inis urna, porttitor rhoncus dolor purus non enim praesent in elementum sahas facilisis leo, vel fringilla est ullamcorper eget nulla facilisi etisam dignissim diam quis enim lobortis viverra orci sagittis eu volutpat odio facilisis mauris sit.' }
    ],
    education: [
        { id: '1', period: '2004 - 2007', title: 'Bachelor Degree in Psychology', institution: 'University of California', description: 'Sit amet luctussd fav venenatis, lectus magna fringilla inis urna, porttitor rhoncus dolor purus non enim praesent in elementum sahas facilisis leo, vel fringilla est ullamcorper eget nulla facilisi etisam dignissim diam quis enim lobortis viverra orci sagittis eu volutpat odio facilisis mauris sit.' },
        { id: '2', period: '2007 - 2009', title: 'Master Degree in Designing', institution: 'University of Texas', description: 'Sit amet luctussd fav venenatis, lectus magna fringilla inis urna, porttitor rhoncus dolor purus non enim praesent in elementum sahas facilisis leo, vel fringilla est ullamcorper eget nulla facilisi etisam dignissim diam quis enim lobortis viverra orci sagittis eu volutpat odio facilisis mauris sit.' }
    ],
    skills: [
        { id: '1', name: 'JavaScript', percent: '85%', description: 'Non enim praesent' },
        { id: '2', name: 'Python', percent: '78%', description: 'Non enim praesent' },
        { id: '3', name: 'Figma', percent: '92%', description: 'Non enim praesent' },
        { id: '4', name: 'WordPress', percent: '90%', description: 'Non enim praesent' },
        { id: '5', name: 'React', percent: '81%', description: 'Non enim praesent' },
        { id: '6', name: 'Adobe XD', percent: '87%', description: 'Non enim praesent' }
    ],
    awards: [
        { id: '1', date: '14 May 2020', name: 'Bluebase', description: 'Non enim praesent' },
        { id: '2', date: '26 June 2018', name: 'Demble', description: 'Non enim praesent' }
    ],
    contact: {
        emails: ['info@bluebase.com', 'info@bluebase2.com'],
        phones: ['+1 504-899-8221', '+1 504-749-5456'],
        address: '22 Baker Street, Texas\nUnited States\nW1U 3BW'
    },
    blog: [
        { id: '1', title: 'Consulted admitting is power acuteness.', date: '25 March 2022', comments: 4, shares: 7, image: '/assets/images/blog1.jpeg', excerpt: 'Sit amet luctussd fav venenatis, lectus magna fringilla inis urna, porttitor rhoncus dolor purus non enim praesent in elementum sahas facilisis leo, vel fringilla est ullamcorper eget nulla facilisi etisam dignissim diam quis enim lobortis viverra orci sagittis eu volutpat odio facilisis mauris sit.', content: '' },
        { id: '2', title: 'Unsatiable entreaties may collecting Power.', date: '25 March 2022', comments: 4, shares: 7, image: '/assets/images/blog2.jpeg', excerpt: 'Sit amet luctussd fav venenatis, lectus magna fringilla inis urna, porttitor rhoncus dolor purus non enim praesent in elementum sahas facilisis leo, vel fringilla est ullamcorper eget nulla facilisi etisam dignissim diam quis enim lobortis viverra orci sagittis eu volutpat odio facilisis mauris sit.', content: '' },
        { id: '3', title: 'Discovery incommode earnestly he commanded', date: '25 March 2022', comments: 4, shares: 7, image: '/assets/images/blog1.jpeg', excerpt: 'Sit amet luctussd fav venenatis, lectus magna fringilla inis urna, porttitor rhoncus dolor purus non enim praesent in elementum sahas facilisis leo, vel fringilla est ullamcorper eget nulla facilisi etisam dignissim diam quis enim lobortis viverra orci sagittis eu volutpat odio facilisis mauris sit.', content: '' }
    ]
};

let memoryPortfolio = JSON.parse(JSON.stringify(defaultData));
const memorySessions = new Set();

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
    };
}

function jsonResponse(payload, status = 200) {
    return new Response(JSON.stringify(payload), { status, headers: corsHeaders() });
}

function getAuthToken(request) {
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    return null;
}

function getAdminCredentials(env) {
    return {
        username: (env && env.ADMIN_USERNAME) || DEFAULT_ADMIN_USERNAME,
        password: (env && env.ADMIN_PASSWORD) || DEFAULT_ADMIN_PASSWORD
    };
}

function getSessionTtl(env) {
    const raw = env && env.SESSION_TTL ? parseInt(env.SESSION_TTL, 10) : DEFAULT_SESSION_TTL;
    return Number.isFinite(raw) ? raw : DEFAULT_SESSION_TTL;
}

function getKv(env) {
    return env && env.PORTFOLIO_KV ? env.PORTFOLIO_KV : null;
}

async function getPortfolioData(env) {
    const kv = getKv(env);
    if (kv) {
        const data = await kv.get(PORTFOLIO_KEY, 'json');
        if (data) return data;
        await kv.put(PORTFOLIO_KEY, JSON.stringify(defaultData));
        return JSON.parse(JSON.stringify(defaultData));
    }
    return memoryPortfolio;
}

async function savePortfolioData(env, data) {
    const kv = getKv(env);
    if (kv) {
        await kv.put(PORTFOLIO_KEY, JSON.stringify(data));
        return;
    }
    memoryPortfolio = data;
}

function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function createSession(env) {
    const token = generateId();
    const kv = getKv(env);
    const ttl = getSessionTtl(env);
    if (kv) {
        await kv.put(`${SESSION_PREFIX}${token}`, '1', { expirationTtl: ttl });
    } else {
        memorySessions.add(token);
    }
    return { token, ttl };
}

async function isSessionValid(env, token) {
    if (!token) return false;
    const kv = getKv(env);
    if (kv) {
        const value = await kv.get(`${SESSION_PREFIX}${token}`);
        return Boolean(value);
    }
    return memorySessions.has(token);
}

async function deleteSession(env, token) {
    if (!token) return;
    const kv = getKv(env);
    if (kv) {
        await kv.delete(`${SESSION_PREFIX}${token}`);
    } else {
        memorySessions.delete(token);
    }
}

async function safeJson(request) {
    try {
        return await request.json();
    } catch (error) {
        return null;
    }
}

async function handleRequest(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders() });
    }

    if (path === '/api/portfolio' && method === 'GET') {
        const data = await getPortfolioData(env);
        return jsonResponse({ success: true, data });
    }

    if (path === '/api/admin/login' && method === 'POST') {
        const body = await safeJson(request);
        if (!body) {
            return jsonResponse({ success: false, message: 'Invalid request body' }, 400);
        }

        const { username, password } = body;
        const admin = getAdminCredentials(env);

        if (username === admin.username && password === admin.password) {
            const session = await createSession(env);
            return jsonResponse({ success: true, token: session.token, expiresIn: session.ttl });
        }

        return jsonResponse({ success: false, message: 'Invalid credentials' }, 401);
    }

    if (path === '/api/admin/logout' && method === 'POST') {
        const token = getAuthToken(request);
        await deleteSession(env, token);
        return jsonResponse({ success: true, message: 'Logged out' });
    }

    if (path === '/api/admin/verify' && method === 'GET') {
        const token = getAuthToken(request);
        const valid = await isSessionValid(env, token);
        if (!valid) {
            return jsonResponse({ success: false, valid: false }, 401);
        }
        return jsonResponse({ success: true, valid: true });
    }

    const token = getAuthToken(request);
    const isAuthorized = await isSessionValid(env, token);
    if (!isAuthorized) {
        return jsonResponse({ success: false, message: 'Unauthorized' }, 401);
    }

    if (path === '/api/admin/portfolio' && method === 'PUT') {
        const body = await safeJson(request);
        if (!body) {
            return jsonResponse({ success: false, message: 'Invalid data' }, 400);
        }
        const current = await getPortfolioData(env);
        const updated = { ...current, ...body };
        await savePortfolioData(env, updated);
        return jsonResponse({ success: true, data: updated });
    }

    const sectionMatch = path.match(/^\/api\/admin\/section\/([a-zA-Z]+)$/);
    if (sectionMatch) {
        const section = sectionMatch[1];
        const current = await getPortfolioData(env);
        if (!Object.prototype.hasOwnProperty.call(current, section)) {
            return jsonResponse({ success: false, message: 'Section not found' }, 404);
        }

        if (method === 'GET') {
            return jsonResponse({ success: true, data: current[section] });
        }

        if (method === 'PUT') {
            const body = await safeJson(request);
            if (!body) {
                return jsonResponse({ success: false, message: 'Invalid data' }, 400);
            }
            current[section] = body;
            await savePortfolioData(env, current);
            return jsonResponse({ success: true, data: current[section] });
        }
    }

    const listMatch = path.match(/^\/api\/admin\/([a-zA-Z]+)$/);
    if (listMatch && method === 'POST') {
        const section = listMatch[1];
        const validSections = ['projects', 'experience', 'education', 'skills', 'awards', 'blog', 'services', 'socialLinks', 'stats'];
        if (!validSections.includes(section)) {
            return jsonResponse({ success: false, message: 'Invalid section' }, 400);
        }

        const body = await safeJson(request);
        if (!body) {
            return jsonResponse({ success: false, message: 'Invalid data' }, 400);
        }

        const current = await getPortfolioData(env);
        if (!Array.isArray(current[section])) {
            current[section] = [];
        }

        const newItem = { id: generateId(), ...body };
        current[section].push(newItem);
        await savePortfolioData(env, current);
        return jsonResponse({ success: true, data: newItem });
    }

    const itemMatch = path.match(/^\/api\/admin\/([a-zA-Z]+)\/([^/]+)$/);
    if (itemMatch) {
        const section = itemMatch[1];
        const itemId = itemMatch[2];
        const validSections = ['projects', 'experience', 'education', 'skills', 'awards', 'blog', 'services', 'socialLinks', 'stats'];
        if (!validSections.includes(section)) {
            return jsonResponse({ success: false, message: 'Invalid section' }, 400);
        }

        const current = await getPortfolioData(env);
        const list = Array.isArray(current[section]) ? current[section] : [];
        const index = list.findIndex(item => String(item.id) === String(itemId));

        if (method === 'PUT') {
            const body = await safeJson(request);
            if (!body) {
                return jsonResponse({ success: false, message: 'Invalid data' }, 400);
            }
            if (index === -1) {
                return jsonResponse({ success: false, message: 'Item not found' }, 404);
            }
            list[index] = { ...list[index], ...body };
            current[section] = list;
            await savePortfolioData(env, current);
            return jsonResponse({ success: true, data: list[index] });
        }

        if (method === 'DELETE') {
            if (index === -1) {
                return jsonResponse({ success: false, message: 'Item not found' }, 404);
            }
            const deleted = list.splice(index, 1);
            current[section] = list;
            await savePortfolioData(env, current);
            return jsonResponse({ success: true, data: deleted[0] });
        }
    }

    if (path === '/api/admin/reset' && method === 'POST') {
        const resetData = JSON.parse(JSON.stringify(defaultData));
        await savePortfolioData(env, resetData);
        return jsonResponse({ success: true, message: 'Data reset to default' });
    }

    return jsonResponse({ success: false, message: 'Not found' }, 404);
}

export default {
    async fetch(request, env, ctx) {
        return handleRequest(request, env);
    }
};

if (typeof module !== 'undefined') {
    module.exports = { handleRequest, defaultData };
}
