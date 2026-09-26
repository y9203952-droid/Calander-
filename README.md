# Our Little World — cleaned website

This package contains the current dashboard code with the PWA pieces removed.

## Files
- `index.html` — complete website layout
- `style.css` — complete responsive styling
- `app.js` — dashboard/auth/memory/mood logic
- `config.js` — Supabase configuration placeholders

## Setup
1. Open `config.js`.
2. Replace `YOUR-PROJECT-URL` and `YOUR_SUPABASE_ANON_KEY` with your Supabase project URL and anon key.
3. Serve the folder from a local web server (for example VS Code Live Server). ES modules and Supabase require HTTP(S), not `file://`.

## PWA status
No manifest, service worker registration, install metadata, or PWA-specific files are included.
