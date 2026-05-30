# Loom Threads Supabase MVP

A premium Threads/X-style social media MVP using plain **HTML + CSS + JavaScript** with **Supabase Auth + Supabase Postgres**.

No Google login. No Apple login. No Facebook login. No OAuth. Email/username + password only.

## What is included

- Custom signup page
- Custom login page
- Forgot password page
- Reset password page
- Email or username login
- Password show/hide button
- Supabase email/password authentication
- Supabase session persistence
- Protected app pages
- Home feed
- Create post
- Likes
- Comments
- Delete own posts
- Search users
- Follow/unfollow users
- Inbox conversation list
- Dedicated chat page for messaging one real Supabase user
- Unread message indicators
- Message read receipts when opened
- Notifications
- Profile page
- Edit profile page
- Profile picture URL support
- Dark/light mode
- Larger polished SVG icons
- Mobile-first responsive UI
- Supabase SQL schema with RLS policies

## Folder structure

```txt
threads-mvp/
├── README.md
├── index.html
├── login.html
├── signup.html
├── forgot-password.html
├── reset-password.html
├── pages/
│   ├── search.html
│   ├── create.html
│   ├── inbox.html
│   ├── chat.html
│   ├── notifications.html
│   ├── profile.html
│   └── edit-profile.html
├── assets/
│   ├── css/
│   │   └── styles.css
│   ├── img/
│   │   └── logo.svg
│   └── js/
│       ├── app.js
│       ├── auth.js
│       ├── components.js
│       ├── data.js
│       ├── helpers.js
│       ├── store.js
│       └── supabase-config.js
└── supabase/
    ├── schema.sql
    └── messaging-upgrade.sql
```

## Step 1: Create your Supabase project

1. Go to Supabase.
2. Create a new project.
3. Open **SQL Editor**.
4. Open this file in the project: `supabase/schema.sql`.
5. Copy the whole SQL file.
6. Paste it into Supabase SQL Editor.
7. Click **Run**.

This creates all database tables, indexes, policies, auth trigger, username login resolver, the DM system, and demo feed content.

If you already ran the previous Supabase ZIP SQL and do not want to reset your project, run only this upgrade file instead:

```txt
supabase/messaging-upgrade.sql
```

Paste it into **Supabase Dashboard → SQL Editor → New query → Run**. It safely upgrades the old messages columns from `from_id/to_id/text/read` to `sender_id/receiver_id/content/is_read` and refreshes the RLS policies.


## Messaging architecture

The DM system uses one Supabase table: `public.messages`.

```txt
messages
├── id
├── sender_id
├── receiver_id
├── content
├── is_read
└── created_at
```

The frontend flow is:

```txt
pages/inbox.html → list conversation previews
pages/chat.html?user=USER_ID → open one private conversation
assets/js/store.js → getConversationSummaries(), getConversation(), sendMessage(), markConversationRead()
```

Security rules:

- A user can only read messages where they are `sender_id` or `receiver_id`.
- A user can only insert messages where `sender_id = auth.uid()`.
- A receiver can mark their received messages as read.
- Self-DMs are blocked.

## How to test messaging with two users

1. Sign up with User A.
2. Log out.
3. Sign up with User B.
4. Stay logged in as User B and create a post or make sure User B appears in Search.
5. Log out and log in as User A.
6. Go to Search.
7. Click **Message** on User B.
8. Send a message.
9. Log out and log in as User B.
10. Go to Inbox.
11. You should see User A with an unread badge.
12. Open the chat. The unread message becomes read.
13. Reply to User A.

You can verify database writes in:

```txt
Supabase → Table Editor → messages
```

## Step 2: Put your Supabase URL and anon key here

Open:

```txt
assets/js/supabase-config.js
```

Paste your values here:

```js
export const SUPABASE_URL = 'PASTE_YOUR_SUPABASE_PROJECT_URL_HERE';
export const SUPABASE_ANON_KEY = 'PASTE_YOUR_SUPABASE_ANON_KEY_HERE';
```

Get them from Supabase:

```txt
Supabase Dashboard → Project Settings → API
```

Use:

```txt
Project URL
anon public key
```

Do **not** put the `service_role` key in this app. The browser should only ever receive the anon/public key.

## Step 3: Set your Supabase fallback/redirect URL

The app uses this in:

```txt
assets/js/supabase-config.js
```

```js
export const AUTH_REDIRECT_URL = `${window.location.origin}/login.html`;
export const PASSWORD_RESET_REDIRECT_URL = `${window.location.origin}/reset-password.html`;
```

In Supabase, go to:

```txt
Authentication → URL Configuration
```

Set:

```txt
Site URL: your deployed app URL
```

Example local Site URL:

```txt
http://127.0.0.1:5500
```

Example deployed Site URL:

```txt
https://your-app.vercel.app
```

Then add Redirect URLs:

```txt
http://127.0.0.1:5500/login.html
http://127.0.0.1:5500/reset-password.html
https://your-app.vercel.app/login.html
https://your-app.vercel.app/reset-password.html
```

If you use a custom domain later, add that too:

```txt
https://yourdomain.com/login.html
https://yourdomain.com/reset-password.html
```

## Step 4: Enable email/password auth

In Supabase:

```txt
Authentication → Providers → Email
```

Enable email provider.

You can choose whether email confirmations are required:

- If confirmation is ON: users must confirm their email before login.
- If confirmation is OFF: users can login immediately after signup.

For real production, keep confirmation ON and configure SMTP.

## Step 5: Run locally

This app uses JavaScript modules, so run it with a local server.

Easy option with VS Code:

1. Install the **Live Server** extension.
2. Right-click `index.html`.
3. Click **Open with Live Server**.

Or use Python:

```bash
python -m http.server 5500
```

Then open:

```txt
http://127.0.0.1:5500
```

## Step 6: Deploy to GitHub + Vercel

1. Create a GitHub repo.
2. Upload all project files.
3. Go to Vercel.
4. Import the GitHub repo.
5. Deploy.
6. Copy your Vercel URL.
7. Add it in Supabase:

```txt
Authentication → URL Configuration → Site URL + Redirect URLs
```

Example:

```txt
https://your-app.vercel.app
https://your-app.vercel.app/login.html
```

## Important MVP security note

This is a frontend-only MVP. Username login is handled with a Supabase SQL function called `resolve_login_email` because Supabase Auth signs users in with email/password. For a serious production app, the next upgrade is to move username login and advanced notification logic into Supabase Edge Functions.

## Real startup upgrade path

High-ROI next moves:

1. Add image uploads with Supabase Storage.
2. Add realtime feed updates with Supabase Realtime.
3. Add password reset flow.
4. Add email verification SMTP through Resend.
5. Add report/block systems.
6. Add rate limits with Edge Functions.
7. Add premium profile badges or creator subscriptions.
8. Add SEO landing page outside the protected app.

Ship it, test it, improve it. MVP first, empire later.
