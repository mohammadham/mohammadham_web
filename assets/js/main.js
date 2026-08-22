;(function($) {
    const initMenuToggle = () => {
        $(document).off('click.portfolioMenu');
        $(document).on('click.portfolioMenu', '.header-area .show-menu', function() {
            $(this).toggleClass('active');
            $(".header-area .navbar").toggleClass('active');
        });
    };

    const initThemeToggle = () => {
        const toggleBtn = document.querySelector('.theme-toggle');
        if (!toggleBtn) return;

        // Check for saved theme preference or default to dark
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = savedTheme ? savedTheme === 'dark' : prefersDark;

        if (isDark) {
            document.body.classList.remove('light-theme');
        } else {
            document.body.classList.add('light-theme');
        }

        toggleBtn.addEventListener('click', () => {
            const isLight = document.body.classList.toggle('light-theme');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
        });
    };

    const initAOS = () => {
        if (typeof AOS === 'undefined') return;
        if (!window.__aosInitialized) {
            AOS.init({
                duration: 1500,
                once: true
            });
            window.__aosInitialized = true;
            return;
        }
        if (typeof AOS.refreshHard === 'function') {
            AOS.refreshHard();
        } else if (typeof AOS.refresh === 'function') {
            AOS.refresh();
        }
    };

    window.initPortfolioUI = () => {
        initAOS();
        initThemeToggle();
        if (typeof window.initContactForm === 'function') {
            window.initContactForm();
        }
    };

    $(document).ready(function() {
        initMenuToggle();
        initAOS();
        initThemeToggle();
    });
})(jQuery);

(function() {
    const ensurePreloader = () => {
        if (document.getElementById('preloader')) {
            return;
        }
        const div = document.createElement('div');
        div.id = 'preloader';
        div.className = 'preloader';
        div.innerHTML = '<div class="black_wall"></div><div class="loader"></div>';
        document.body.insertBefore(div, document.body.firstChild);
    };

    const getPreloader = () => document.getElementById('preloader');

    window.showPageLoader = () => {
        const preloader = getPreloader();
        if (preloader) {
            preloader.classList.remove('off');
        }
    };

    window.hidePageLoader = () => {
        const preloader = getPreloader();
        if (preloader) {
            preloader.classList.add('off');
        }
    };

    ensurePreloader();

    window.addEventListener('load', () => {
        window.hidePageLoader();
    });
})();