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

## Form Note

The free estimate form is currently front-end only. It validates basic fields and shows a confirmation message, but it does not send submissions yet.

Recommended options:
- Formspree
- Netlify Forms
- Cloudflare Worker endpoint
- Custom backend/API
- Google Forms embed

## GitHub Upload

If the GitHub connector is blocked, upload these files manually to the `handy` repo or run:

```bash
git clone https://github.com/YOUR-USERNAME/handy.git
cp -R handy-site-files/* handy/
cd handy
git add .
git commit -m "Add Go Direct Home Services website draft"
git push
```

## Deployment

This site can be deployed on:
- GitHub Pages
- Cloudflare Pages
- Netlify
- Vercel
- Any static hosting service
