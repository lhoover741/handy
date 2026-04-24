# Go Direct Home Services Website

Multi-page static website draft for **Go Direct Home Services**.

Tagline:

> Assembly. Mounting. Repairs. Installation. Done Direct.

## Pages

- `index.html` - Homepage
- `services.html` - Services overview
- `free-estimate.html` - Free estimate form
- `about.html` - About page
- `contact.html` - Contact page and FAQ

## Cloudflare Worker Form Backend

The free estimate forms submit to:

```text
/api/estimate
```

Worker files are included here:

```text
workers/estimate-worker/
```

The Worker supports:

- Form submission handling
- Required field validation
- Honeypot spam field
- Optional D1 database storage
- Optional Resend email notifications
- Optional R2 photo storage

See `workers/estimate-worker/README.md` for setup commands.

## Quick Worker Deploy

```bash
cd workers/estimate-worker
npm install
npx wrangler login
npx wrangler deploy
```

## Optional Email Setup

Update these variables in `workers/estimate-worker/wrangler.toml`:

```toml
ESTIMATE_NOTIFY_TO = "your-email@example.com"
ESTIMATE_NOTIFY_FROM = "Go Direct Home Services <estimates@yourdomain.com>"
```

Then add the Resend API key as a secret:

```bash
npx wrangler secret put RESEND_API_KEY
```

## Optional D1 Storage

```bash
npx wrangler d1 create go_direct_estimates
```

Copy the returned `database_id` into `workers/estimate-worker/wrangler.toml`, uncomment the D1 block, then run:

```bash
npx wrangler d1 execute go_direct_estimates --file=./migrations/0001_create_estimate_requests.sql --remote
```

## Optional R2 Photo Storage

```bash
npx wrangler r2 bucket create go-direct-estimate-photos
```

Then uncomment the R2 bucket block in `workers/estimate-worker/wrangler.toml`.

## Brand Colors

- Deep Navy: `#0F172A`
- Steel Gray: `#475569`
- Clean White: `#FFFFFF`
- Soft Gray: `#F1F5F9`
- Workwear Orange: `#F97316`
- Charcoal Black: `#111827`

## Update These Placeholders

Search the project for these placeholders and replace them when ready:

- `(000) 000-0000`
- `info@godirecthomeservices.com`
- `[City/Area]`
- `Business hours`
- `ESTIMATE_NOTIFY_TO`
- `ESTIMATE_NOTIFY_FROM`
- `ALLOWED_ORIGINS`
