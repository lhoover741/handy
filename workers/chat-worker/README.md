# Go Direct AI Chat Worker

This Cloudflare Worker securely connects the Go Direct Home Services website chatbot to OpenRouter.

## Setup

```bash
cd workers/chat-worker
npm install
npx wrangler login
npx wrangler secret put OPENROUTER_API_KEY
```

Paste the OpenRouter API key when prompted. The key is stored as an encrypted Cloudflare secret and must never be added to the website JavaScript or committed to GitHub.

## Configure the route

In `wrangler.toml`, uncomment the route and confirm the domain values:

```toml
routes = [
  { pattern = "go.govdirect.org/api/chat", zone_name = "govdirect.org" }
]
```

Then deploy:

```bash
npx wrangler deploy
```

## Optional model change

Update this variable in `wrangler.toml`:

```toml
OPENROUTER_MODEL = "openai/gpt-4o-mini"
```

The frontend stores only a short chat history in the visitor's browser session. The Worker validates that history, inserts the Go Direct business instructions, calls OpenRouter, and returns the assistant reply.
