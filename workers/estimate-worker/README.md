# Go Direct Home Services Estimate Worker

Cloudflare Worker backend for the Go Direct Home Services free estimate form.

## Endpoint

```text
POST /api/estimate
```

The website forms submit multipart form data to this endpoint.

## Features

- Validates required estimate fields
- Accepts optional photo uploads
- Stores submissions in Cloudflare D1 when configured
- Stores photos in Cloudflare R2 when configured
- Sends email notifications through Resend when configured
- Includes a honeypot spam field
- Supports CORS for Pages and custom domains

## Local setup

```bash
npm install
npx wrangler dev
```

Create a local `.dev.vars` file from `.dev.vars.example` when testing email delivery.

## Deploy

```bash
npx wrangler login
npx wrangler deploy
```

## Optional email notifications

Set these values in `wrangler.toml` under `[vars]`:

```toml
ESTIMATE_NOTIFY_TO = "your-email@example.com"
ESTIMATE_NOTIFY_FROM = "Go Direct Home Services <estimates@yourdomain.com>"
```

Set the Resend API key as a Worker secret:

```bash
npx wrangler secret put RESEND_API_KEY
```

## Optional D1 storage

Create the D1 database:

```bash
npx wrangler d1 create go_direct_estimates
```

Copy the returned `database_id` into `wrangler.toml`, then uncomment the `[[d1_databases]]` block.

Run the migration:

```bash
npx wrangler d1 execute go_direct_estimates --file=./migrations/0001_create_estimate_requests.sql --remote
```

## Optional R2 photo storage

Create an R2 bucket:

```bash
npx wrangler r2 bucket create go-direct-estimate-photos
```

Then uncomment the `[[r2_buckets]]` block in `wrangler.toml`.

## Cloudflare Pages routing

For a static site on Cloudflare Pages, route `/api/estimate` to this Worker with a custom domain route, or deploy the Worker separately and set the form endpoint in `assets/js/main.js` or by adding `data-endpoint="https://your-worker.your-subdomain.workers.dev/api/estimate"` to each form.
