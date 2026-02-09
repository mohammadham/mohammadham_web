(() => {
    if (window.__portfolioSpaInitialized) {
        return;
    }
    window.__portfolioSpaInitialized = true;

    const ASSET_EXTENSIONS = /\.(png|jpe?g|gif|svg|webp|css|js|ico|pdf|zip|rar|mp4|mp3)$/i;

    const slugify = (value) => {
        return (value || '')
            .toString()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 60) || 'item';
    };

    const isSameOrigin = (url) => {
        try {
            return new URL(url, window.location.href).origin === window.location.origin;
        } catch (error) {
            return false;
        }
    };

    const shouldHandleLink = (link) => {
        const href = link.getAttribute('href');
        if (!href || href.startsWith('#')) return false;
        if (link.target === '_blank' || link.hasAttribute('download')) return false;
        if (/^(mailto:|tel:|javascript:)/i.test(href)) return false;
        if (!isSameOrigin(href)) return false;

        const url = new URL(href, window.location.href);
        if (url.pathname.includes('/admin')) return false;
        if (ASSET_EXTENSIONS.test(url.pathname)) return false;

        const samePath = url.pathname === window.location.pathname && url.search === window.location.search;
        if (samePath && url.hash) return false;

        return true;
    };

    const showLoader = () => {
        if (typeof window.showPageLoader === 'function') {
            window.showPageLoader();
        }
    };

    const hideLoader = () => {
        if (typeof window.hidePageLoader === 'function') {
            window.hidePageLoader();
        }
    };

    const applyTestIds = (rootDoc) => {
        const used = new Set();
        rootDoc.querySelectorAll('[data-testid]').forEach((el) => {
            used.add(el.getAttribute('data-testid'));
        });

        rootDoc.querySelectorAll('a, button, input, textarea, select, [role="button"]').forEach((el) => {
            if (el.hasAttribute('data-testid')) return;

            const tag = el.tagName.toLowerCase();
            const baseText = [
                el.getAttribute('aria-label'),
                el.textContent,
                el.getAttribute('name'),
                el.getAttribute('id'),
                el.getAttribute('placeholder'),
                el.getAttribute('href')
            ].filter(Boolean).map((value) => value.trim()).find(Boolean);

            const base = slugify(`${tag}-${baseText || 'action'}`);
            let candidate = base;
            let counter = 1;

            while (used.has(candidate)) {
                counter += 1;
                candidate = `${base}-${counter}`;
            }

            el.setAttribute('data-testid', candidate);
            used.add(candidate);
        });

        const main = rootDoc.querySelector('main');
        if (main && !main.hasAttribute('data-testid')) {
            main.setAttribute('data-testid', 'page-main');
        }
    };

    const updateActiveNav = () => {
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('.menu li').forEach((item) => {
            const link = item.querySelector('a');
            if (!link) return;
            const href = link.getAttribute('href') || '';
            const normalized = href.split('/').pop();
            item.classList.toggle('active', normalized === currentPath);
        });
    };

    const loadScriptOnce = (src) => {
        const existing = document.querySelector(`script[data-spa-script="${src}"]`);
        if (existing) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.setAttribute('data-spa-script', src);
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
    };

    const ensureContactForm = async () => {
        if (!document.querySelector('.contact-form form')) {
            return;
        }

        if (typeof window.initContactForm === 'function') {
            window.initContactForm();
            return;
        }

        try {
            await loadScriptOnce('/assets/js/ajax-form.js');
            if (typeof window.initContactForm === 'function') {
                window.initContactForm();
            }
        } catch (error) {
            console.error('Failed to load contact form script:', error);
        }
    };

    const navigate = async (url, { pushState = true } = {}) => {
        if (window.__portfolioSpaNavigating) {
            return;
        }

        window.__portfolioSpaNavigating = true;
        showLoader();

        try {
            const response = await fetch(url, {
                headers: {
                    'X-Requested-With': 'spa'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load page');
            }

            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newMain = doc.querySelector('main');
            const currentMain = document.querySelector('main');

            if (!newMain || !currentMain) {
                throw new Error('Main container not found');
            }

            currentMain.replaceWith(newMain);

            if (doc.title) {
                document.title = doc.title;
            }

            if (pushState) {
                history.pushState({}, '', url);
            }

            window.scrollTo(0, 0);

            if (typeof window.initPortfolioUI === 'function') {
                window.initPortfolioUI();
            }

            applyTestIds(document);
            updateActiveNav();
            await ensureContactForm();
        } catch (error) {
            console.error('SPA navigation failed:', error);
            window.location.href = url;
        } finally {
            hideLoader();
            window.__portfolioSpaNavigating = false;
        }
    };

    document.addEventListener('click', (event) => {
        const link = event.target.closest('a');
        if (!link || !shouldHandleLink(link)) return;
        event.preventDefault();
        navigate(link.href, { pushState: true });
    });

    window.addEventListener('popstate', () => {
        navigate(window.location.href, { pushState: false });
    });

    document.addEventListener('DOMContentLoaded', () => {
        applyTestIds(document);
        updateActiveNav();
        ensureContactForm();
    });
})();