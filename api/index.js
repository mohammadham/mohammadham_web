/**
 * Portfolio API - Cloudflare Workers Compatible
 * Handles portfolio CRUD with Cloudflare KV persistence
 */

const DEFAULT_ADMIN_USERNAME = 'admin';
const DEFAULT_ADMIN_PASSWORD = 'admin12345';
const DEFAULT_SESSION_TTL = 60 * 60 * 24 * 7;
const PORTFOLIO_KEY = 'portfolio:data';
const SESSION_PREFIX = 'session:';
const LOGIN_RATE_PREFIX = 'login_rate:';
const CSRF_PREFIX = 'csrf:';
const LOGIN_RATE_LIMIT = 5; // Max failed attempts
const LOGIN_RATE_WINDOW_SECONDS = 300; // 5 minutes
const CONTACT_RATE_LIMIT = 10; // Max contact submissions
const CONTACT_RATE_WINDOW_SECONDS = 3600; // 1 hour
const CONTACT_RATE_PREFIX = 'contact_rate:';

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
        { 
            id: '1', 
            title: 'Dynamic', 
            category: 'WEB DESIGNING', 
            image: '/assets/images/project1.jpeg', 
            link: '/work-details.html?id=1',
            client: 'Raven Studio',
            year: '2023',
            description: 'Sit amet luctussd fav venenatis, lectus magna fringilla inis urna, porttitor rhoncus dolor purus non enim praesent in elementum sahas facilisis leo, vel fringilla est ullamcorper eget nulla facilisi etisam dignissim diam quis enim lobortis viverra orci sagittis eu volutpat odio facilisis mauris sit.',
            details: 'Scelerisque fermentum duisi faucibus in ornare quam sisd sit amet luctussd fav venenatis, lectus magna fringilla zac urna.',
            gallery: ['/assets/images/project-dt-1.jpeg', '/assets/images/project3.jpeg', '/assets/images/project4.jpeg']
        },
        { 
            id: '2', 
            title: 'Diesel H1', 
            category: 'PHOTOGRAPHY', 
            image: '/assets/images/project2.jpeg', 
            link: '/work-details.html?id=2',
            client: 'Diesel',
            year: '2022',
            description: 'Photography project for Diesel H1 campaign.',
            details: '',
            gallery: []
        },
        { id: '3', title: 'Seven Studio', category: 'MOBILE DESIGNING', image: '/assets/images/project3.jpeg', link: '/work-details.html?id=3' },
        { id: '4', title: 'Raven Studio', category: 'Branding', image: '/assets/images/project4.jpeg', link: '/work-details.html?id=4' },
        { id: '5', title: 'Submarine', category: 'MOBILE DESIGNING', image: '/assets/images/project5.jpeg', link: '/work-details.html?id=5' },
        { id: '6', title: 'Hydra Merc', category: 'WEB DESIGNING', image: '/assets/images/project6.jpeg', link: '/work-details.html?id=6' }
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
let memoryLoginAttempts = new Map();
const memoryCsrfTokens = new Set();
let memoryAdminHash = null;

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
        'Content-Type': 'application/json'
    };
}

function getClientIp(request) {
    const cfConnectingIp = request.headers.get('CF-Connecting-IP');
    if (cfConnectingIp) return cfConnectingIp;
    const xForwardedFor = request.headers.get('X-Forwarded-For');
    if (xForwardedFor) return xForwardedFor.split(',')[0].trim();
    return 'unknown';
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

// ─── PASSWORD HASHING (SHA-256 + salt) ───────────────
async function hashPassword(password, salt) {
    const data = `${salt}:${password}`;
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        const encoder = new TextEncoder();
        const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // Fallback for environments without WebCrypto
    return `${salt}:${password}`;
}

async function getAdminHashEntry(env) {
    const admin = getAdminCredentials(env);
    const kv = getKv(env);
    if (kv) {
        const stored = await kv.get('admin:hash');
        if (stored) return JSON.parse(stored);
    }
    if (memoryAdminHash) return memoryAdminHash;

    // Generate hash entry
    const salt = generateId();
    const hash = await hashPassword(admin.password, salt);
    const entry = { username: admin.username, salt, hash };

    if (kv) {
        await kv.put('admin:hash', JSON.stringify(entry));
    } else {
        memoryAdminHash = entry;
    }
    return entry;
}

// ─── RATE LIMITING ───────────────────────────────────
async function checkLoginRateLimit(env, ip) {
    const key = `${LOGIN_RATE_PREFIX}${ip}`;
    const kv = getKv(env);
    const now = Date.now();

    if (kv) {
        const raw = await kv.get(key, 'json');
        if (raw && raw.count >= LOGIN_RATE_LIMIT && (now - raw.firstAttempt) < LOGIN_RATE_WINDOW_SECONDS * 1000) {
            return { limited: true, retryAfter: Math.ceil((LOGIN_RATE_WINDOW_SECONDS * 1000 - (now - raw.firstAttempt)) / 1000) };
        }
    } else {
        const record = memoryLoginAttempts.get(key);
        if (record && record.count >= LOGIN_RATE_LIMIT && (now - record.firstAttempt) < LOGIN_RATE_WINDOW_SECONDS * 1000) {
            return { limited: true, retryAfter: Math.ceil((LOGIN_RATE_WINDOW_SECONDS * 1000 - (now - record.firstAttempt)) / 1000) };
        }
    }
    return { limited: false };
}

async function incrementLoginRate(env, ip) {
    const key = `${LOGIN_RATE_PREFIX}${ip}`;
    const kv = getKv(env);
    const now = Date.now();

    if (kv) {
        const raw = await kv.get(key, 'json');
        const count = (raw && (now - raw.firstAttempt) < LOGIN_RATE_WINDOW_SECONDS * 1000) ? raw.count + 1 : 1;
        const firstAttempt = (raw && (now - raw.firstAttempt) < LOGIN_RATE_WINDOW_SECONDS * 1000) ? raw.firstAttempt : now;
        await kv.put(key, JSON.stringify({ count, firstAttempt }), { expirationTtl: LOGIN_RATE_WINDOW_SECONDS });
    } else {
        const record = memoryLoginAttempts.get(key);
        const count = (record && (now - record.firstAttempt) < LOGIN_RATE_WINDOW_SECONDS * 1000) ? record.count + 1 : 1;
        const firstAttempt = (record && (now - record.firstAttempt) < LOGIN_RATE_WINDOW_SECONDS * 1000) ? record.firstAttempt : now;
        memoryLoginAttempts.set(key, { count, firstAttempt });
    }
}

async function resetLoginRate(env, ip) {
    const key = `${LOGIN_RATE_PREFIX}${ip}`;
    const kv = getKv(env);
    if (kv) {
        await kv.delete(key);
    } else {
        memoryLoginAttempts.delete(key);
    }
}

// ─── CSRF TOKEN ──────────────────────────────────────
function generateCsrfToken() {
    return generateId() + generateId();
}

async function issueCsrfToken(env) {
    const token = generateCsrfToken();
    const kv = getKv(env);
    if (kv) {
        await kv.put(`${CSRF_PREFIX}${token}`, '1', { expirationTtl: 3600 });
    } else {
        memoryCsrfTokens.add(token);
    }
    return token;
}

async function verifyCsrfToken(env, token) {
    if (!token) return false;
    const kv = getKv(env);
    if (kv) {
        const value = await kv.get(`${CSRF_PREFIX}${token}`);
        if (value) {
            await kv.delete(`${CSRF_PREFIX}${token}`);
            return true;
        }
        return false;
    }
    return memoryCsrfTokens.has(token);
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

    // Sitemap.xml endpoint
    if (path === '/sitemap.xml' && method === 'GET') {
        const data = await getPortfolioData(env);
        const baseUrl = new URL(request.url).origin;
        const pages = [
            { url: '/', lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: '1.0' },
            { url: '/about.html', lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.8' },
            { url: '/works.html', lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.8' },
            { url: '/service.html', lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.8' },
            { url: '/blog.html', lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.7' },
            { url: '/contact.html', lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: '0.6' },
            { url: '/credentials.html', lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: '0.6' }
        ];
        
        // Add project pages
        if (data.projects && Array.isArray(data.projects)) {
            data.projects.forEach(project => {
                pages.push({
                    url: `/work-details.html?id=${project.id}`,
                    lastmod: new Date().toISOString().split('T')[0],
                    changefreq: 'monthly',
                    priority: '0.7'
                });
            });
        }
        
        // Add blog pages
        if (data.blog && Array.isArray(data.blog)) {
            data.blog.forEach(post => {
                pages.push({
                    url: `/blog-details.html?id=${post.id}`,
                    lastmod: new Date().toISOString().split('T')[0],
                    changefreq: 'monthly',
                    priority: '0.6'
                });
            });
        }

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

        return new Response(sitemap, {
            status: 200,
            headers: {
                'Content-Type': 'application/xml',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }

    // robots.txt endpoint
    if (path === '/robots.txt' && method === 'GET') {
        const baseUrl = new URL(request.url).origin;
        const robots = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/admin/

Sitemap: ${baseUrl}/sitemap.xml`;

        return new Response(robots, {
            status: 200,
            headers: {
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }

    if (path === '/api/contact' && method === 'POST') {
        const body = await safeJson(request);
        if (!body) {
            return jsonResponse({ success: false, message: 'Invalid request body' }, 400);
        }

        const { name, email, subject, message } = body;

        // Rate limiting on contact submissions (spam prevention)
        const ip = getClientIp(request);
        const contactKey = CONTACT_RATE_PREFIX + ip;
        const kv = getKv(env);
        const now = Date.now();
        if (kv) {
            const raw = await kv.get(contactKey, 'json');
            if (raw && raw.count >= CONTACT_RATE_LIMIT && (now - raw.firstAttempt) < CONTACT_RATE_WINDOW_SECONDS * 1000) {
                return jsonResponse({ success: false, message: 'Too many messages sent. Please try again later.' }, 429);
            }
        } else {
            const record = contactRateAttempts.get(contactKey);
            if (record && record.count >= CONTACT_RATE_LIMIT && (now - record.firstAttempt) < CONTACT_RATE_WINDOW_SECONDS * 1000) {
                return jsonResponse({ success: false, message: 'Too many messages sent. Please try again later.' }, 429);
            }
        }

        if (!name || !email || !message) {
            return jsonResponse({ success: false, message: 'Name, email and message are required' }, 400);
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return jsonResponse({ success: false, message: 'Invalid email format' }, 400);
        }

        // Send email via MailChannels (free email service for Cloudflare Workers)
        try {
            const emailPayload = {
                personalizations: [
                    {
                        to: [{ email: 'info@bluebase.com', name: 'Portfolio Owner' }],
                        subject: subject || 'New Contact Form Message'
                    }
                ],
                from: { email: email, name: name },
                content: [
                    {
                        type: 'text/plain',
                        value: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
                    },
                    {
                        type: 'text/html',
                        value: `<html><body><h2>New Contact Form Message</h2><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Subject:</strong> ${subject || '(no subject)'}</p><hr><p><strong>Message:</strong></p><p>${message.replace(/\n/g, '<br>')}</p></body></html>`
                    }
                ]
            };

            const emailResponse = await fetch('https://api.mailchannels.net/v1/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(emailPayload)
            });

            if (!emailResponse.ok) {
                console.error('[MailChannels] Failed to send email:', emailResponse.status, await emailResponse.text());
            } else {
                console.log('[MailChannels] Email sent successfully');
            }
        } catch (emailError) {
            console.error('[MailChannels] Error sending email:', emailError);
            // Don't fail the request if email fails - still return success to user
        }

        return jsonResponse({ success: true, message: 'Message received. Thank you!' });
    }

    if (path === '/api/admin/login' && method === 'POST') {
        const body = await safeJson(request);
        if (!body) {
            return jsonResponse({ success: false, message: 'Invalid request body' }, 400);
        }

        const ip = getClientIp(request);

        // Rate limiting
        const rateCheck = await checkLoginRateLimit(env, ip);
        if (rateCheck.limited) {
            return jsonResponse({ 
                success: false, 
                message: 'Too many login attempts. Please try again later.',
                retryAfter: rateCheck.retryAfter 
            }, 429);
        }

        const { username, password } = body;
        const adminEntry = await getAdminHashEntry(env);

        // Verify against salted hash
        const inputHash = await hashPassword(password, adminEntry.salt);
        const isValid = username === adminEntry.username && inputHash === adminEntry.hash;

        if (!isValid) {
            await incrementLoginRate(env, ip);
            return jsonResponse({ success: false, message: 'Invalid credentials' }, 401);
        }

        await resetLoginRate(env, ip);
        const session = await createSession(env);
        const csrfToken = await issueCsrfToken(env);
        return jsonResponse({ 
            success: true, 
            token: session.token, 
            csrfToken,
            expiresIn: session.ttl 
        });
    }

    if (path === '/api/admin/csrf' && method === 'GET') {
        const token = getAuthToken(request);
        const valid = await isSessionValid(env, token);
        if (!valid) {
            return jsonResponse({ success: false, message: 'Unauthorized' }, 401);
        }
        const csrfToken = await issueCsrfToken(env);
        return jsonResponse({ success: true, csrfToken });
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

    // CSRF protection for mutating admin endpoints
    const isMutating = ['POST', 'PUT', 'DELETE'].includes(method);
    if (isMutating) {
        const csrfToken = request.headers.get('X-CSRF-Token');
        const csrfValid = await verifyCsrfToken(env, csrfToken);
        if (!csrfValid) {
            return jsonResponse({ success: false, message: 'Invalid CSRF token' }, 403);
        }
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

    // MUST check /api/admin/reset BEFORE the generic list regex,
    // otherwise "reset" is matched as a section name and fails.
    if (path === '/api/admin/reset' && method === 'POST') {
        const resetData = JSON.parse(JSON.stringify(defaultData));
        await savePortfolioData(env, resetData);
        return jsonResponse({ success: true, message: 'Data reset to default' });
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

    return jsonResponse({ success: false, message: 'Not found' }, 404);
}

// ─── CRON HANDLER FOR KV BACKUP TO R2 ──────────────────
async function handleCron(event, env) {
    const kv = getKv(env);
    const r2 = env.PORTFOLIO_BACKUPS;
    
    if (!kv || !r2) {
        console.log('[Cron] KV or R2 not configured, skipping backup');
        return;
    }

    try {
        const data = await kv.get(PORTFOLIO_KEY, 'json');
        if (!data) {
            console.log('[Cron] No portfolio data to backup');
            return;
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const key = `backups/portfolio-${timestamp}.json`;
        
        await r2.put(key, JSON.stringify(data, null, 2), {
            httpMetadata: { contentType: 'application/json' }
        });
        
        console.log(`[Cron] Backup saved to R2: ${key}`);
        
        // Clean up old backups (keep last 30)
        const list = await r2.list({ prefix: 'backups/' });
        const backups = list.objects
            .filter(obj => obj.key.endsWith('.json'))
            .sort((a, b) => new Date(b.uploaded) - new Date(a.uploaded));
        
        if (backups.length > 30) {
            const toDelete = backups.slice(30);
            for (const obj of toDelete) {
                await r2.delete(obj.key);
                console.log(`[Cron] Deleted old backup: ${obj.key}`);
            }
        }
    } catch (error) {
        console.error('[Cron] Backup failed:', error);
    }
}

export default {
    async fetch(request, env, ctx) {
        return handleRequest(request, env);
    },
    
    async scheduled(event, env, ctx) {
        await handleCron(event, env);
    }
};
