# Loom Threads — Supabase Social MVP

A premium Threads/X-style social MVP using HTML, CSS, JavaScript, and Supabase.

Included:

- Email/username + password auth only
- Forgot/reset password
- Protected app pages
- Home feed
- Posts, likes, comments, delete own posts
- Profiles and edit profile
- Search users
- Follow/unfollow
- Inbox and 1-to-1 chat
- Notifications
- Deep Settings page: dark/light mode, accent color, density, font size, motion, corners, glass effect
- Supabase SQL with RLS
- No demo/test threads or fake users inserted

## Configure Supabase

Open:

```txt
assets/js/supabase-config.js
```

Paste your values here:

```js
export const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
export const SUPABASE_ANON_KEY = 'YOUR_ANON_PUBLIC_KEY';
```

Use only the anon public key. Never put your service_role key in frontend code.

## Fresh Supabase setup

Supabase Dashboard → SQL Editor → New query → paste everything from:

```txt
supabase/schema.sql
```

Run it once.

## Existing project upgrades

If your project already has the older messaging schema, run:

```txt
supabase/settings-upgrade.sql
```

This adds the `user_preferences` table for deep settings sync.

## Auth URL configuration

Supabase → Authentication → URL Configuration

Local URLs:

```txt
http://127.0.0.1:5500
http://127.0.0.1:5500/login.html
http://127.0.0.1:5500/reset-password.html
```

Vercel URLs:

```txt
https://your-app.vercel.app
https://your-app.vercel.app/login.html
https://your-app.vercel.app/reset-password.html
```

## Run locally

Use VS Code Live Server. Do not open the HTML as `file:///`.

Start at:

```txt
http://127.0.0.1:5500/login.html
```

## Test checklist

1. Sign up with a real email.
2. Check Supabase Auth → Users.
3. Check Table Editor → profiles.
4. Create a post.
5. Create a second user.
6. Search the second user.
7. Follow/message the second user.
8. Open Settings and save an accent/theme.
9. Check Table Editor → user_preferences.
10. Test forgot password with `forgot-password.html`.

## Deploy

Push the folder to GitHub, import to Vercel, deploy, then add your Vercel URLs to Supabase Authentication URL Configuration.
