# Our Little World — merged build

This build combines the complete shared-memory website with the newer animated Thought + Mood UI.

## Included
- Full authentication / shared-space flow when Supabase is configured.
- Calendar, memories, rollback, search, settings, favorites and photo uploads.
- Clean readable Thought paragraphs.
- Thought-only Edit button with a separate saved time.
- Animated mood timeline with a timestamp for every mood entry.
- Unified plum/purple colour system with dark mode enabled by default.
- No PWA manifest or service-worker code.

## Supabase
Edit `config.js` with your Supabase URL and anon key to enable cloud features.

Without Supabase values, the complete website opens in local preview mode so the UI is still visible and the Thought/Mood features work locally in the browser.

## Run
Use a local web server (for example VS Code Live Server) and open `index.html`.
