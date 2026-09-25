# Akarsh & Ritu — Our Little World

This is the complete, polished version matching the supplied romantic dashboard reference:
- Akarsh & Ritu branding
- Romantic sunset/couple hero
- Left sidebar navigation
- Welcome/quick-action panel
- Monthly calendar
- Recent Memories
- Our Stats
- Today's Mood
- Memory Rollback
- On This Day
- Search
- Private A+B sharing
- Photo uploads
- Thoughts, moods and favorites
- Live clock
- Light/dark toggle
- Responsive mobile layout
- Supabase Auth + PostgreSQL RLS + private Storage

## 1. Create Supabase

Open Supabase and create a new project.

## 2. Create the database

In Supabase:
1. Open SQL Editor.
2. Create a new query.
3. Paste the entire contents of `supabase.sql`.
4. Click Run.
5. Make sure it finishes without an error.

This creates the A+B shared-space tables, RLS policies, invite functions and private `memory-photos` bucket.

## 3. Get your browser keys

In your Supabase project, copy:
- Project URL
- Anon/public publishable key

Open `config.js` and replace:

`https://YOUR-PROJECT.supabase.co`

and

`YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY`

Do NOT paste a service_role/secret key into this file.

## 4. Turn on authentication

In Supabase Auth, keep Email/Password enabled.

For easiest testing, you can turn email confirmation off temporarily. For production, keep confirmation/recovery configured and use a real email setup.

## 5. Run the website locally

Install Python 3 if needed.

Open a terminal in this project folder and run:

`python -m http.server 8080`

Then open:

`http://localhost:8080`

Do not double-click `index.html`; ES modules and Supabase work correctly when served through HTTP/HTTPS.

## 6. Create User A

1. Click Create account.
2. Register User A's email/password.
3. Sign in.
4. Create the space named `Akarsh & Ritu`.
5. Copy the invite code.

## 7. Create User B

On another phone/browser:
1. Open the same website.
2. Create a different account for User B.
3. Sign in.
4. Paste User A's invite code.
5. Click Join shared space.

The space is limited to two members.

## 8. Test privacy

Create a memory as User A.

Then sign in as User B: the same memory should appear.

Create a third account (User C) and try to access the app. User C will have no membership and therefore cannot read the A+B memories.

The database and private Storage bucket enforce this restriction; the UI is not the security boundary.

## 9. Add a memory

Click:
- Add Memory
- Select a date
- Write a thought
- Pick a mood
- Mark Favorite if desired
- Save Memory

Both members can see it.

## 10. Add photos

Open a saved memory, choose Photos, and select images.

Images are uploaded to a private Storage bucket using:

`space-id / memory-id / random-file-name`

Only members of that space can access the objects.

## 11. Deploy it

You can deploy this folder to any static HTTPS host.

Typical choices:
- Vercel
- Netlify
- Cloudflare Pages
- GitHub Pages (with appropriate HTTPS/auth configuration)

After deployment, add the production site URL to Supabase Auth URL/redirect configuration.

## 12. Production checklist

Before using it for sensitive personal memories:
- Use HTTPS.
- Never expose a service_role/secret key.
- Keep the Storage bucket private.
- Keep RLS enabled.
- Configure email confirmation and password recovery.
- Review Supabase backups.
- Use strong passwords.
- Do not share the invite code publicly.
- If an invite is exposed, create a new invite and stop using the old one.

## Project structure

- `index.html` — complete dashboard UI
- `style.css` — visual design and responsive layout
- `app.js` — calendar, auth, memories, photos, rollback, search and interactions
- `config.js` — Supabase URL/key
- `supabase.sql` — database, RLS, private storage and pairing functions
- `assets/romantic-header.jpg` — romantic header artwork
- `assets/rollback-bg.jpg` — rollback artwork
