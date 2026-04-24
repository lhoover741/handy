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

The free estimate forms now submit to:

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
- `https://godirecthomeservices.com` inside `workers/estimate-worker/wrangler.toml`

## GitHub Note

The project is ready to push to a repo named `handy`, but the GitHub connector returned `403 - Sorry. Your account was suspended`. Once GitHub access is restored, upload these files or push this folder into the repo.
