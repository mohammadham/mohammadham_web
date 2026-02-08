# پرتفلیو شخصی با پنل مدیریت

## معرفی
این پروژه یک وبسایت پرتفلیو شخصی است که شامل:
- قالب HTML/CSS/JS تیره و مدرن
- پنل ادمین فارسی برای مدیریت تمام بخش‌ها
- API سازگار با Cloudflare Workers
- قابلیت ذخیره‌سازی در Cloudflare KV

## ساختار پروژه
```
/app/
├── index.html          # صفحه اصلی
├── about.html          # صفحه درباره
├── works.html          # صفحه پروژه‌ها
├── contact.html        # صفحه تماس
├── credentials.html    # صفحه رزومه
├── service.html        # صفحه خدمات
├── blog.html           # صفحه بلاگ
├── assets/             # فایل‌های استاتیک
│   ├── css/
│   ├── js/
│   └── images/
├── admin/              # پنل مدیریت
│   ├── index.html
│   ├── admin.css
│   └── admin.js
└── api/                # API (Cloudflare Workers)
    ├── index.js
    ├── server.js       # سرور توسعه محلی
    └── wrangler.toml
```

## اطلاعات ورود پنل ادمین
- **مسیر پنل:** `/admin/index.html`
- **نام کاربری:** `admin`
- **رمز عبور:** `portfolio2024`

## راهنمای دیپلوی روی Cloudflare

### 1. دیپلوی فرانت‌اند روی Cloudflare Pages

1. وارد داشبورد Cloudflare شوید
2. به بخش **Pages** بروید
3. روی **Create a project** کلیک کنید
4. گزینه **Direct Upload** را انتخاب کنید
5. تمام فایل‌های پروژه (به جز پوشه `api`) را آپلود کنید
6. نام پروژه را وارد کنید و **Deploy** بزنید

### 2. دیپلوی API روی Cloudflare Workers

#### نصب Wrangler
```bash
npm install -g wrangler
```

#### ورود به حساب Cloudflare
```bash
wrangler login
```

#### ایجاد KV Namespace
```bash
wrangler kv:namespace create "PORTFOLIO_KV"
```

#### به‌روزرسانی wrangler.toml
فایل `api/wrangler.toml` را ویرایش کرده و ID namespace را اضافه کنید:
```toml
name = "portfolio-api"
main = "index.js"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "PORTFOLIO_KV"
id = "your-kv-namespace-id-here"

[vars]
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "your-secure-password"
```

#### دیپلوی Worker
```bash
cd api
wrangler deploy
```

### 3. اتصال فرانت به API

در فایل `admin/admin.js` مقدار `API_BASE` را به آدرس Worker خود تغییر دهید:
```javascript
const API_BASE = 'https://portfolio-api.your-subdomain.workers.dev';
```

### 4. تنظیم Custom Domain (اختیاری)

1. در داشبورد Pages به تنظیمات پروژه بروید
2. **Custom domains** را انتخاب کنید
3. دامنه خود را اضافه کنید

## توسعه محلی

### اجرای سرور API
```bash
cd api
node server.js
```

سرور API روی پورت 3001 اجرا می‌شود.

### استفاده از Live Server
می‌توانید از VS Code Live Server یا هر HTTP server ساده استفاده کنید:
```bash
npx serve /app
```

## API Endpoints

### Public
- `GET /api/portfolio` - دریافت تمام داده‌های پرتفلیو

### Admin (نیاز به Token)
- `POST /api/admin/login` - ورود ادمین
- `POST /api/admin/logout` - خروج
- `GET /api/admin/verify` - تأیید توکن
- `PUT /api/admin/portfolio` - به‌روزرسانی کل پرتفلیو
- `PUT /api/admin/section/:section` - به‌روزرسانی بخش خاص
- `POST /api/admin/:section` - افزودن آیتم جدید
- `PUT /api/admin/:section/:id` - ویرایش آیتم
- `DELETE /api/admin/:section/:id` - حذف آیتم

## بخش‌های قابل ویرایش
- اطلاعات شخصی (نام، عنوان، تصویر)
- درباره من
- آمار (تجربه، مشتری، پروژه)
- خدمات
- پروژه‌ها
- تجربیات کاری
- تحصیلات
- مهارت‌ها
- جوایز
- اطلاعات تماس
- شبکه‌های اجتماعی
- بلاگ
- تنظیمات سایت

## نکات امنیتی
- رمز عبور پیش‌فرض را حتماً تغییر دهید
- از HTTPS استفاده کنید
- متغیرهای محیطی را در داشبورد Cloudflare تنظیم کنید
