# Portfolio Website (Serverless on Cloudflare)

A personal portfolio web application built as a **static frontend** (Cloudflare Pages) + **API** (Cloudflare Workers + KV) + **Admin panel**. Content is stored in Cloudflare KV and edited through the admin panel; the frontend fetches and renders the data via API (SPA-style without reloads).

## Architecture

```
Frontend (Cloudflare Pages)  ──►  /api/* (proxy via _redirects)  ──►  Worker (portfolio-api)
                                                                          │
                                                                          ├── KV: PORTFOLIO_KV  (all portfolio data)
                                                                          ├── KV: session:*      (auth tokens)
                                                                          └── KV: login_rate:*   (rate limiting)
```

## Project Structure

```
/ (root)
├── index.html, about.html, works.html, contact.html, ...   # Pages (static frontend)
├── admin/                # Admin panel (Arabic/Persian UI)
├── api/                  # Cloudflare Worker API
│   ├── index.js          # Worker logic (KV CRUD, auth, contact)
│   ├── dev-server.js     # Local dev server (static + API)
│   ├── server.js         # Local API-only server (uses index.js)
│   └── wrangler.toml     # Worker config
├── assets/
├── _headers              # Cloudflare Pages headers (security + caching)
├── _redirects            # Cloudflare Pages redirects (proxies /api/* to Worker)
├── .assetsignore         # Files excluded from Pages deployment
└── .github/workflows/deploy-cloudflare.yml   # CI/CD auto-deploy
```

## Local Development

### 1. Run the full dev server (static files + API together):

```bash
npm run dev
```

Serves frontend (from root) + API on `http://localhost:8001`.
Admin panel: `http://localhost:8001/admin/`

Default admin credentials: `admin` / `admin12345`
(Override with env vars: `ADMIN_USERNAME=... ADMIN_PASSWORD=...`)

### 2. Run only the Worker API:

```bash
npm run dev:api
```

Serves only the API on `http://localhost:3001`.

## API Endpoints

### Public
- `GET  /api/portfolio` — Get all portfolio data
- `POST /api/contact`   — Send contact form (name, email, subject, message)

### Admin (requires Bearer token + CSRF header for writes)
- `POST   /api/admin/login`            → `{ token, csrfToken }`
- `GET    /api/admin/csrf`             → get fresh CSRF token (authorized)
- `POST   /api/admin/logout`
- `GET    /api/admin/verify`
- `PUT    /api/admin/portfolio`        → update whole collection
- `GET/PUT /api/admin/section/:section`
- `POST   /api/admin/:section`         — add item to list section
- `PUT/DELETE /api/admin/:section/:id` — update/delete item

### Security
- **Rate limiting** on `/api/admin/login` (5 attempts / 5 min per IP)
- **Password hashing** (SHA-256 + per-install salt) - plaintext never stored
- **CSRF protection** on all mutating admin endpoints (`X-CSRF-Token` header)

## Deploying to Cloudflare

### Prerequisites in GitHub Secrets (`Settings → Secrets → Actions`)
| Secret | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | API token with edit on **Workers Scripts**, **Workers KV**, and **Cloudflare Pages** (Create at dash.cloudflare.com → My Profile → API Tokens) |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID (dash.cloudflare.com → right-hand sidebar) |
| `CF_PAGES_PROJECT` | Name of your Pages project (e.g. `my-portfolio`) — create it once in the Pages dashboard |
| `ADMIN_USERNAME` | Admin panel username |
| `ADMIN_PASSWORD` | Admin panel password (strong!) |

### One-time setup steps

1. **Create KV namespace**
   ```bash
   cd api
   wrangler kv:namespace create PORTFOLIO_KV
   ```
   Copy the resulting `id` into `api/wrangler.toml` under `[[kv_namespaces]]` (both `id` and `preview_id`).

2. **Create a Pages project** once (dashboard → Workers & Pages → Create → Pages). The GitHub Action (below) will then deploy updates automatically.

3. **Set the API proxy** — Edit the root `_redirects` and replace `WITH_YOUR_WORKER` with your actual Worker subdomain:
   ```
   /api/*  https://WITH_YOUR_WORKER/api/:splat  200
   ```

### Automatic CI/CD (GitHub Actions)

The workflow `.github/workflows/deploy-cloudflare.yml` runs on every push to `main`:

1. Deploys **Worker** (`portfolio-api`) from `api/`
2. Injects `ADMIN_USERNAME` and `ADMIN_PASSWORD` as Worker secrets
3. Deploys **Pages** (root folder), respecting `.assetsignore`

Once you've set the Secrets and pushed, deployment is fully automatic.

### Manual deploy (alternative)

```bash
# Worker
cd api
wrangler deploy --config wrangler.toml

# Pages
npx wrangler pages deploy . --project-name=portfolio-NAME --branch=main --commit-dirty=true
```

## Admin Panel

Access at `/admin/` after your domain.
Login, then edit Hero, About, Stats, Services, Projects, Experience, Education, Skills, Awards, Contact form data, Social Links, Blog, and Site settings.

Changes save to the Worker API → stored in KV → frontend re-fetches/rebinds immediately without a page reload.

---
*Requirement: Node.js ≥ 16 for local dev. Cloudflare Workers + Pages free tier sufficient.*