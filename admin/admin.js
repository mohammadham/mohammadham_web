/**
 * Admin Panel JavaScript
 * Manages authentication, data loading, and form handling
 */

// Configuration
const API_BASE = ''; // Same-origin API base for Cloudflare Pages/Workers

// State
let portfolioData = null;
let currentSection = 'hero';
let isDirty = false;

// DOM Elements
const loginPage = document.getElementById('login-page');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const saveBtn = document.getElementById('save-btn');
const contentBody = document.getElementById('content-body');
const sectionTitle = document.getElementById('section-title');
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.querySelector('.sidebar');

// Section Titles (Persian)
const sectionTitles = {
    hero: 'اطلاعات شخصی',
    about: 'درباره من',
    stats: 'آمار',
    services: 'خدمات',
    projects: 'پروژه‌ها',
    experience: 'تجربیات',
    education: 'تحصیلات',
    skills: 'مهارت‌ها',
    awards: 'جوایز',
    contact: 'تماس',
    socialLinks: 'شبکه‌های اجتماعی',
    blog: 'بلاگ',
    siteSettings: 'تنظیمات سایت'
};

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
    // Check if already logged in
    const token = localStorage.getItem('admin_token');
    if (token) {
        const isValid = await verifyToken(token);
        if (isValid) {
            await showDashboard();
        } else {
            localStorage.removeItem('admin_token');
            showLogin();
        }
    } else {
        showLogin();
    }

    // Setup event listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Login form
    loginForm.addEventListener('submit', handleLogin);

    // Logout
    logoutBtn.addEventListener('click', handleLogout);

    // Save
    saveBtn.addEventListener('click', handleSave);

    // Sidebar navigation
    document.querySelectorAll('.sidebar-nav li').forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;
            switchSection(section);
        });
    });

    // Mobile menu toggle
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    // Close sidebar on outside click (mobile)
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 1024 && 
            !sidebar.contains(e.target) && 
            !menuToggle.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });

    // Track changes
    contentBody.addEventListener('input', () => {
        isDirty = true;
    });

    // Warn before leaving if unsaved
    window.addEventListener('beforeunload', (e) => {
        if (isDirty) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
}

// Authentication Functions
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    loginError.textContent = '';

    try {
        const response = await fetch(`${API_BASE}/api/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok || !data.success || !data.token) {
            loginError.textContent = data.message || 'نام کاربری یا رمز عبور اشتباه است';
            return;
        }

        localStorage.setItem('admin_token', data.token);
        await showDashboard();
        showToast('ورود موفقیت‌آمیز', 'success');
    } catch (error) {
        console.error('Login error:', error);
        loginError.textContent = 'خطا در برقراری ارتباط با سرور';
    }
}

async function handleLogout() {
    const token = localStorage.getItem('admin_token');
    
    try {
        await fetch(`${API_BASE}/api/admin/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    } catch (error) {
        console.log('Logout API error (ignored):', error);
    }

    localStorage.removeItem('admin_token');
    portfolioData = null;
    isDirty = false;
    showLogin();
    showToast('با موفقیت خارج شدید', 'success');
}

async function verifyToken(token) {
    try {
        const response = await fetch(`${API_BASE}/api/admin/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        return data.success && data.valid;
    } catch (error) {
        return false;
    }
}

// Page Navigation
function showLogin() {
    loginPage.classList.add('active');
    dashboard.classList.remove('active');
    loginForm.reset();
}

async function showDashboard() {
    loginPage.classList.remove('active');
    dashboard.classList.add('active');
    await loadPortfolioData();
    switchSection('hero');
}

function switchSection(section) {
    currentSection = section;
    
    // Update sidebar active state
    document.querySelectorAll('.sidebar-nav li').forEach(item => {
        item.classList.toggle('active', item.dataset.section === section);
    });

    // Update title
    sectionTitle.textContent = sectionTitles[section] || section;

    // Close mobile sidebar
    sidebar.classList.remove('open');

    // Render section
    renderSection(section);
}

// Data Functions
async function loadPortfolioData() {
    try {
        const response = await fetch(`${API_BASE}/api/portfolio`);
        const data = await response.json();
        if (data.success) {
            portfolioData = data.data;
        }
    } catch (error) {
        console.error('Portfolio load error:', error);
        showToast('خطا در دریافت اطلاعات. داده‌های پیش‌فرض نمایش داده می‌شود.', 'error');
        portfolioData = getDefaultData();
    }
}

async function handleSave() {
    if (!portfolioData) return;

    // Collect data from form
    collectFormData();

    const token = localStorage.getItem('admin_token');

    try {
        const response = await fetch(`${API_BASE}/api/admin/portfolio`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(portfolioData)
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            showToast('خطا در ذخیره تغییرات', 'error');
            return;
        }

        showToast('تغییرات با موفقیت ذخیره شد', 'success');
        isDirty = false;
    } catch (error) {
        console.error('Save error:', error);
        showToast('خطا در برقراری ارتباط با سرور', 'error');
    }
}

// Form Rendering
function renderSection(section) {
    if (!portfolioData) return;

    let html = '';

    switch (section) {
        case 'hero':
            html = renderHeroForm();
            break;
        case 'about':
            html = renderAboutForm();
            break;
        case 'stats':
            html = renderStatsForm();
            break;
        case 'services':
            html = renderServicesForm();
            break;
        case 'projects':
            html = renderProjectsForm();
            break;
        case 'experience':
            html = renderExperienceForm();
            break;
        case 'education':
            html = renderEducationForm();
            break;
        case 'skills':
            html = renderSkillsForm();
            break;
        case 'awards':
            html = renderAwardsForm();
            break;
        case 'contact':
            html = renderContactForm();
            break;
        case 'socialLinks':
            html = renderSocialLinksForm();
            break;
        case 'blog':
            html = renderBlogForm();
            break;
        case 'siteSettings':
            html = renderSiteSettingsForm();
            break;
    }

    contentBody.innerHTML = html;
    setupFormEventListeners();
}

function renderHeroForm() {
    const hero = portfolioData.hero || {};
    return `
        <div class="form-section">
            <h3 class="form-section-title">اطلاعات اصلی</h3>
            <div class="form-row">
                <div class="form-group">
                    <label>نام کامل</label>
                    <input type="text" data-field="hero.name" value="${escapeHtml(hero.name || '')}" data-testid="hero-name">
                </div>
                <div class="form-group">
                    <label>نام کاربری</label>
                    <input type="text" data-field="hero.username" value="${escapeHtml(hero.username || '')}" data-testid="hero-username">
                </div>
            </div>
            <div class="form-group">
                <label>عنوان شغلی</label>
                <input type="text" data-field="hero.title" value="${escapeHtml(hero.title || '')}" data-testid="hero-title">
            </div>
            <div class="form-group">
                <label>توضیحات کوتاه</label>
                <textarea data-field="hero.description" data-testid="hero-description">${escapeHtml(hero.description || '')}</textarea>
            </div>
            <div class="form-group">
                <label>آدرس تصویر</label>
                <input type="text" data-field="hero.image" value="${escapeHtml(hero.image || '')}" data-testid="hero-image">
                ${hero.image ? `<div class="image-preview" data-testid="hero-image-preview"><img src="${hero.image}" alt="Preview" data-testid="hero-image-preview-img"></div>` : ''}
            </div>
        </div>
    `;
}

function renderAboutForm() {
    const about = portfolioData.about || {};
    return `
        <div class="form-section">
            <h3 class="form-section-title">درباره من</h3>
            <div class="form-group">
                <label>خلاصه (برای صفحه اصلی)</label>
                <textarea data-field="about.summary" rows="3" data-testid="about-summary">${escapeHtml(about.summary || '')}</textarea>
            </div>
            <div class="form-group">
                <label>بیوگرافی کامل</label>
                <textarea data-field="about.detailedBio" rows="8" data-testid="about-bio">${escapeHtml(about.detailedBio || '')}</textarea>
            </div>
        </div>
    `;
}

function renderStatsForm() {
    const stats = portfolioData.stats || [];
    return `
        <div class="form-section">
            <h3 class="form-section-title">آمار</h3>
            <div class="items-list" id="stats-list">
                ${stats.map((stat, index) => `
                    <div class="list-item" data-index="${index}">
                        <div class="list-item-header">
                            <span class="list-item-title">آمار ${index + 1}</span>
                            <div class="list-item-actions">
                                <button class="btn-icon delete" data-action="delete" data-section="stats" data-index="${index}" data-testid="stats-${index}-delete">
                                    <i class="iconoir-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>مقدار</label>
                                <input type="text" data-field="stats.${index}.value" value="${escapeHtml(stat.value || '')}" data-testid="stats-${index}-value">
                            </div>
                            <div class="form-group">
                                <label>برچسب</label>
                                <input type="text" data-field="stats.${index}.label" value="${escapeHtml(stat.label || '')}" data-testid="stats-${index}-label">
                            </div>
                            <div class="form-group">
                                <label>زیربرچسب</label>
                                <input type="text" data-field="stats.${index}.sublabel" value="${escapeHtml(stat.sublabel || '')}" data-testid="stats-${index}-sublabel">
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <button class="add-item-btn" data-action="add" data-section="stats" data-testid="stats-add-button">
                <i class="iconoir-plus"></i>
                افزودن آمار جدید
            </button>
        </div>
    `;
}

function renderServicesForm() {
    const services = portfolioData.services || [];
    return `
        <div class="form-section">
            <h3 class="form-section-title">خدمات</h3>
            <div class="items-list" id="services-list">
                ${services.map((service, index) => `
                    <div class="list-item" data-index="${index}">
                        <div class="list-item-header">
                            <span class="list-item-title">${escapeHtml(service.title || 'خدمت جدید')}</span>
                            <div class="list-item-actions">
                                <button class="btn-icon delete" data-action="delete" data-section="services" data-index="${index}" data-testid="services-${index}-delete">
                                    <i class="iconoir-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>عنوان</label>
                                <input type="text" data-field="services.${index}.title" value="${escapeHtml(service.title || '')}" data-testid="services-${index}-title">
                            </div>
                            <div class="form-group">
                                <label>آیکون (کلاس iconoir)</label>
                                <input type="text" data-field="services.${index}.icon" value="${escapeHtml(service.icon || '')}" data-testid="services-${index}-icon">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>توضیحات</label>
                            <textarea data-field="services.${index}.description" rows="3" data-testid="services-${index}-description">${escapeHtml(service.description || '')}</textarea>
                        </div>
                    </div>
                `).join('')}
            </div>
            <button class="add-item-btn" data-action="add" data-section="services" data-testid="services-add-button">
                <i class="iconoir-plus"></i>
                افزودن خدمت جدید
            </button>
        </div>
    `;
}

function renderProjectsForm() {
    const projects = portfolioData.projects || [];
    return `
        <div class="form-section">
            <h3 class="form-section-title">پروژه‌ها</h3>
            <div class="items-list" id="projects-list">
                ${projects.map((project, index) => `
                    <div class="list-item" data-index="${index}">
                        <div class="list-item-header">
                            <span class="list-item-title">${escapeHtml(project.title || 'پروژه جدید')}</span>
                            <div class="list-item-actions">
                                <button class="btn-icon delete" data-action="delete" data-section="projects" data-index="${index}" data-testid="projects-${index}-delete">
                                    <i class="iconoir-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>عنوان</label>
                                <input type="text" data-field="projects.${index}.title" value="${escapeHtml(project.title || '')}" data-testid="projects-${index}-title">
                            </div>
                            <div class="form-group">
                                <label>دسته‌بندی</label>
                                <input type="text" data-field="projects.${index}.category" value="${escapeHtml(project.category || '')}" data-testid="projects-${index}-category">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>تصویر</label>
                                <input type="text" data-field="projects.${index}.image" value="${escapeHtml(project.image || '')}" data-testid="projects-${index}-image">
                            </div>
                            <div class="form-group">
                                <label>لینک</label>
                                <input type="text" data-field="projects.${index}.link" value="${escapeHtml(project.link || '')}" data-testid="projects-${index}-link">
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <button class="add-item-btn" data-action="add" data-section="projects" data-testid="projects-add-button">
                <i class="iconoir-plus"></i>
                افزودن پروژه جدید
            </button>
        </div>
    `;
}

function renderExperienceForm() {
    const experience = portfolioData.experience || [];
    return `
        <div class="form-section">
            <h3 class="form-section-title">تجربیات کاری</h3>
            <div class="items-list" id="experience-list">
                ${experience.map((exp, index) => `
                    <div class="list-item" data-index="${index}">
                        <div class="list-item-header">
                            <span class="list-item-title">${escapeHtml(exp.title || 'تجربه جدید')}</span>
                            <div class="list-item-actions">
                                <button class="btn-icon delete" data-action="delete" data-section="experience" data-index="${index}" data-testid="experience-${index}-delete">
                                    <i class="iconoir-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>بازه زمانی</label>
                                <input type="text" data-field="experience.${index}.period" value="${escapeHtml(exp.period || '')}" data-testid="experience-${index}-period">
                            </div>
                            <div class="form-group">
                                <label>عنوان شغلی</label>
                                <input type="text" data-field="experience.${index}.title" value="${escapeHtml(exp.title || '')}" data-testid="experience-${index}-title">
                            </div>
                            <div class="form-group">
                                <label>شرکت</label>
                                <input type="text" data-field="experience.${index}.company" value="${escapeHtml(exp.company || '')}" data-testid="experience-${index}-company">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>توضیحات</label>
                            <textarea data-field="experience.${index}.description" rows="3" data-testid="experience-${index}-description">${escapeHtml(exp.description || '')}</textarea>
                        </div>
                    </div>
                `).join('')}
            </div>
            <button class="add-item-btn" data-action="add" data-section="experience" data-testid="experience-add-button">
                <i class="iconoir-plus"></i>
                افزودن تجربه جدید
            </button>
        </div>
    `;
}

function renderEducationForm() {
    const education = portfolioData.education || [];
    return `
        <div class="form-section">
            <h3 class="form-section-title">تحصیلات</h3>
            <div class="items-list" id="education-list">
                ${education.map((edu, index) => `
                    <div class="list-item" data-index="${index}">
                        <div class="list-item-header">
                            <span class="list-item-title">${escapeHtml(edu.title || 'تحصیل جدید')}</span>
                            <div class="list-item-actions">
                                <button class="btn-icon delete" data-action="delete" data-section="education" data-index="${index}" data-testid="education-${index}-delete">
                                    <i class="iconoir-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>بازه زمانی</label>
                                <input type="text" data-field="education.${index}.period" value="${escapeHtml(edu.period || '')}" data-testid="education-${index}-period">
                            </div>
                            <div class="form-group">
                                <label>مدرک</label>
                                <input type="text" data-field="education.${index}.title" value="${escapeHtml(edu.title || '')}" data-testid="education-${index}-title">
                            </div>
                            <div class="form-group">
                                <label>دانشگاه</label>
                                <input type="text" data-field="education.${index}.institution" value="${escapeHtml(edu.institution || '')}" data-testid="education-${index}-institution">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>توضیحات</label>
                            <textarea data-field="education.${index}.description" rows="3" data-testid="education-${index}-description">${escapeHtml(edu.description || '')}</textarea>
                        </div>
                    </div>
                `).join('')}
            </div>
            <button class="add-item-btn" data-action="add" data-section="education" data-testid="education-add-button">
                <i class="iconoir-plus"></i>
                افزودن تحصیل جدید
            </button>
        </div>
    `;
}

function renderSkillsForm() {
    const skills = portfolioData.skills || [];
    return `
        <div class="form-section">
            <h3 class="form-section-title">مهارت‌ها</h3>
            <div class="items-list" id="skills-list">
                ${skills.map((skill, index) => `
                    <div class="list-item" data-index="${index}">
                        <div class="list-item-header">
                            <span class="list-item-title">${escapeHtml(skill.name || 'مهارت جدید')}</span>
                            <div class="list-item-actions">
                                <button class="btn-icon delete" data-action="delete" data-section="skills" data-index="${index}" data-testid="skills-${index}-delete">
                                    <i class="iconoir-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>نام مهارت</label>
                                <input type="text" data-field="skills.${index}.name" value="${escapeHtml(skill.name || '')}" data-testid="skills-${index}-name">
                            </div>
                            <div class="form-group">
                                <label>درصد</label>
                                <input type="text" data-field="skills.${index}.percent" value="${escapeHtml(skill.percent || '')}" data-testid="skills-${index}-percent">
                            </div>
                            <div class="form-group">
                                <label>توضیح</label>
                                <input type="text" data-field="skills.${index}.description" value="${escapeHtml(skill.description || '')}" data-testid="skills-${index}-description">
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <button class="add-item-btn" data-action="add" data-section="skills" data-testid="skills-add-button">
                <i class="iconoir-plus"></i>
                افزودن مهارت جدید
            </button>
        </div>
    `;
}

function renderAwardsForm() {
    const awards = portfolioData.awards || [];
    return `
        <div class="form-section">
            <h3 class="form-section-title">جوایز</h3>
            <div class="items-list" id="awards-list">
                ${awards.map((award, index) => `
                    <div class="list-item" data-index="${index}">
                        <div class="list-item-header">
                            <span class="list-item-title">${escapeHtml(award.name || 'جایزه جدید')}</span>
                            <div class="list-item-actions">
                                <button class="btn-icon delete" data-action="delete" data-section="awards" data-index="${index}" data-testid="awards-${index}-delete">
                                    <i class="iconoir-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>تاریخ</label>
                                <input type="text" data-field="awards.${index}.date" value="${escapeHtml(award.date || '')}" data-testid="awards-${index}-date">
                            </div>
                            <div class="form-group">
                                <label>نام جایزه</label>
                                <input type="text" data-field="awards.${index}.name" value="${escapeHtml(award.name || '')}" data-testid="awards-${index}-name">
                            </div>
                            <div class="form-group">
                                <label>توضیح</label>
                                <input type="text" data-field="awards.${index}.description" value="${escapeHtml(award.description || '')}" data-testid="awards-${index}-description">
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <button class="add-item-btn" data-action="add" data-section="awards" data-testid="awards-add-button">
                <i class="iconoir-plus"></i>
                افزودن جایزه جدید
            </button>
        </div>
    `;
}

function renderContactForm() {
    const contact = portfolioData.contact || {};
    const emails = contact.emails || [];
    const phones = contact.phones || [];
    return `
        <div class="form-section">
            <h3 class="form-section-title">اطلاعات تماس</h3>
            <div class="form-group">
                <label>ایمیل‌ها (هر خط یک ایمیل)</label>
                <textarea data-field="contact.emails" rows="3" data-testid="contact-emails">${emails.join('\n')}</textarea>
            </div>
            <div class="form-group">
                <label>شماره تلفن‌ها (هر خط یک شماره)</label>
                <textarea data-field="contact.phones" rows="3" data-testid="contact-phones">${phones.join('\n')}</textarea>
            </div>
            <div class="form-group">
                <label>آدرس</label>
                <textarea data-field="contact.address" rows="3" data-testid="contact-address">${escapeHtml(contact.address || '')}</textarea>
            </div>
        </div>
    `;
}

function renderSocialLinksForm() {
    const socialLinks = portfolioData.socialLinks || [];
    return `
        <div class="form-section">
            <h3 class="form-section-title">شبکه‌های اجتماعی</h3>
            <div class="items-list" id="socialLinks-list">
                ${socialLinks.map((link, index) => `
                    <div class="list-item" data-index="${index}">
                        <div class="list-item-header">
                            <span class="list-item-title">${escapeHtml(link.platform || 'شبکه جدید')}</span>
                            <div class="list-item-actions">
                                <button class="btn-icon delete" data-action="delete" data-section="socialLinks" data-index="${index}" data-testid="social-${index}-delete">
                                    <i class="iconoir-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>پلتفرم</label>
                                <input type="text" data-field="socialLinks.${index}.platform" value="${escapeHtml(link.platform || '')}" data-testid="social-${index}-platform">
                            </div>
                            <div class="form-group">
                                <label>آیکون (کلاس iconoir)</label>
                                <input type="text" data-field="socialLinks.${index}.icon" value="${escapeHtml(link.icon || '')}" data-testid="social-${index}-icon">
                            </div>
                            <div class="form-group">
                                <label>لینک</label>
                                <input type="text" data-field="socialLinks.${index}.url" value="${escapeHtml(link.url || '')}" data-testid="social-${index}-url">
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <button class="add-item-btn" data-action="add" data-section="socialLinks" data-testid="social-add-button">
                <i class="iconoir-plus"></i>
                افزودن شبکه جدید
            </button>
        </div>
    `;
}

function renderBlogForm() {
    const blog = portfolioData.blog || [];
    return `
        <div class="form-section">
            <h3 class="form-section-title">مقالات بلاگ</h3>
            <div class="items-list" id="blog-list">
                ${blog.map((post, index) => `
                    <div class="list-item" data-index="${index}">
                        <div class="list-item-header">
                            <span class="list-item-title">${escapeHtml(post.title || 'مقاله جدید')}</span>
                            <div class="list-item-actions">
                                <button class="btn-icon delete" data-action="delete" data-section="blog" data-index="${index}" data-testid="blog-${index}-delete">
                                    <i class="iconoir-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>عنوان</label>
                                <input type="text" data-field="blog.${index}.title" value="${escapeHtml(post.title || '')}" data-testid="blog-${index}-title">
                            </div>
                            <div class="form-group">
                                <label>تاریخ</label>
                                <input type="text" data-field="blog.${index}.date" value="${escapeHtml(post.date || '')}" data-testid="blog-${index}-date">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>تصویر</label>
                                <input type="text" data-field="blog.${index}.image" value="${escapeHtml(post.image || '')}" data-testid="blog-${index}-image">
                            </div>
                            <div class="form-group">
                                <label>تعداد کامنت</label>
                                <input type="number" data-field="blog.${index}.comments" value="${post.comments || 0}" data-testid="blog-${index}-comments">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>خلاصه</label>
                            <textarea data-field="blog.${index}.excerpt" rows="3" data-testid="blog-${index}-excerpt">${escapeHtml(post.excerpt || '')}</textarea>
                        </div>
                    </div>
                `).join('')}
            </div>
            <button class="add-item-btn" data-action="add" data-section="blog" data-testid="blog-add-button">
                <i class="iconoir-plus"></i>
                افزودن مقاله جدید
            </button>
        </div>
    `;
}

function renderSiteSettingsForm() {
    const settings = portfolioData.siteSettings || {};
    return `
        <div class="form-section">
            <h3 class="form-section-title">تنظیمات سایت</h3>
            <div class="form-group">
                <label>نام سایت</label>
                <input type="text" data-field="siteSettings.siteName" value="${escapeHtml(settings.siteName || '')}" data-testid="site-name">
            </div>
            <div class="form-group">
                <label>آدرس لوگو</label>
                <input type="text" data-field="siteSettings.logo" value="${escapeHtml(settings.logo || '')}" data-testid="site-logo">
                ${settings.logo ? `<div class="image-preview" data-testid="site-logo-preview"><img src="${settings.logo}" alt="Logo Preview" data-testid="site-logo-preview-img"></div>` : ''}
            </div>
            <div class="form-group">
                <label>متن کپی‌رایت</label>
                <input type="text" data-field="siteSettings.copyright" value="${escapeHtml(settings.copyright || '')}" data-testid="site-copyright">
            </div>
        </div>
    `;
}

// Form Event Listeners
function setupFormEventListeners() {
    // Add item buttons
    document.querySelectorAll('[data-action="add"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            addItem(section);
        });
    });

    // Delete item buttons
    document.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            const index = parseInt(btn.dataset.index);
            deleteItem(section, index);
        });
    });
}

// Add/Delete Items
function addItem(section) {
    const defaults = {
        stats: { value: '', label: '', sublabel: '' },
        services: { id: Date.now(), title: '', icon: '', description: '' },
        projects: { id: Date.now(), title: '', category: '', image: '', link: '' },
        experience: { id: Date.now(), period: '', title: '', company: '', description: '' },
        education: { id: Date.now(), period: '', title: '', institution: '', description: '' },
        skills: { id: Date.now(), name: '', percent: '', description: '' },
        awards: { id: Date.now(), date: '', name: '', description: '' },
        socialLinks: { platform: '', icon: '', url: '' },
        blog: { id: Date.now(), title: '', date: '', image: '', comments: 0, shares: 0, excerpt: '', content: '' }
    };

    if (!portfolioData[section]) {
        portfolioData[section] = [];
    }

    portfolioData[section].push(defaults[section] || {});
    isDirty = true;
    renderSection(currentSection);
}

function deleteItem(section, index) {
    if (confirm('آیا از حذف این مورد اطمینان دارید؟')) {
        portfolioData[section].splice(index, 1);
        isDirty = true;
        renderSection(currentSection);
    }
}

// Collect form data
function collectFormData() {
    document.querySelectorAll('[data-field]').forEach(input => {
        const field = input.dataset.field;
        const path = field.split('.');
        let value = input.value;

        // Handle special cases
        if (field === 'contact.emails' || field === 'contact.phones') {
            value = value.split('\n').filter(v => v.trim());
        }

        // Set nested value
        let obj = portfolioData;
        for (let i = 0; i < path.length - 1; i++) {
            const key = path[i];
            if (!isNaN(key)) {
                obj = obj[parseInt(key)];
            } else {
                obj = obj[key];
            }
        }

        const lastKey = path[path.length - 1];
        if (!isNaN(lastKey)) {
            obj[parseInt(lastKey)] = value;
        } else {
            obj[lastKey] = value;
        }
    });
}

// Utility Functions
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    toast.className = `toast ${type}`;
    toastMessage.textContent = message;
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function getDefaultData() {
    return {
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
            summary: 'I am a San francisco-based product designer with a focus on web design, illustration, a visual development.',
            detailedBio: 'Sit amet luctussd fav venenatis, lectus magna fringilla inis urna...'
        },
        stats: [
            { value: '07', label: 'Years', sublabel: 'Experience' },
            { value: '+125', label: 'CLIENTS', sublabel: 'WORLDWIDE' },
            { value: '+210', label: 'Total', sublabel: 'Projects' }
        ],
        socialLinks: [
            { platform: 'dribbble', url: '#', icon: 'iconoir-dribbble' },
            { platform: 'twitter', url: '#', icon: 'iconoir-twitter' }
        ],
        services: [
            { id: 1, title: 'Photography', icon: 'iconoir-camera', description: 'Professional photography services.' },
            { id: 2, title: 'Web Designing', icon: 'iconoir-design-pencil', description: 'Modern web design solutions.' }
        ],
        projects: [
            { id: 1, title: 'Dynamic', category: 'WEB DESIGNING', image: '/assets/images/project1.jpeg', link: '#' }
        ],
        experience: [
            { id: 1, period: '2017 - 2023', title: 'Front-End Developer', company: 'Larsen & Toubro', description: '' }
        ],
        education: [
            { id: 1, period: '2007 - 2009', title: 'Master Degree in Designing', institution: 'University of Texas', description: '' }
        ],
        skills: [
            { id: 1, name: 'JavaScript', percent: '85%', description: 'Non enim praesent' }
        ],
        awards: [
            { id: 1, date: '14 May 2020', name: 'Bluebase', description: 'Non enim praesent' }
        ],
        contact: {
            emails: ['info@bluebase.com'],
            phones: ['+1 504-899-8221'],
            address: '22 Baker Street, Texas\nUnited States'
        },
        blog: [
            { id: 1, title: 'Consulted admitting is power acuteness.', date: '25 March 2022', image: '/assets/images/blog1.jpeg', excerpt: '', content: '' }
        ]
    };
}
