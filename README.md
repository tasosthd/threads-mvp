# Loom Threads MVP

A premium Threads/X-style social web app MVP using HTML, CSS, and vanilla JavaScript. It uses localStorage for authentication, posts, likes, comments, follows, notifications, messages, profile edits, theme, and session persistence.

## Features

- Custom email/username + password signup and login
- No Google, Apple, Facebook, or third-party OAuth
- Protected app pages
- Home feed, Search, Create Post, Inbox, Notifications, Profile, Edit Profile
- Like, comment, delete own posts
- Follow/unfollow users
- Edit profile, avatar URL, display name, username, bio, location, website
- Demo users and posts included
- Light/dark mode
- Responsive shared navbar across every app page
- Backend-ready service structure in `assets/js/store.js`

## Project Structure

```txt
threads-mvp/
├── README.md
├── index.html
├── login.html
├── signup.html
├── pages/
│   ├── search.html
│   ├── create.html
│   ├── inbox.html
│   ├── notifications.html
│   ├── profile.html
│   └── edit-profile.html
└── assets/
    ├── css/
    │   └── styles.css
    ├── img/
    │   └── logo.svg
    └── js/
        ├── app.js
        ├── auth.js
        ├── components.js
        ├── data.js
        ├── helpers.js
        └── store.js
```

## Run Locally

Because this app uses ES modules, open it with a local server instead of double-clicking HTML files.

### Option 1: VS Code

1. Open the folder in VS Code.
2. Install the **Live Server** extension.
3. Right-click `index.html` and choose **Open with Live Server**.

### Option 2: Python

```bash
cd threads-mvp
python -m http.server 5173
```

Open:

```txt
http://localhost:5173
```

## Demo Login

Use any seeded demo account:

```txt
Email: alex@demo.com
Username: alex
Password: password123
```

```txt
Email: maya@demo.com
Username: maya
Password: password123
```

Or create a new account from the signup page.

## Deploy to GitHub + Vercel

1. Create a new GitHub repository.
2. Upload every file/folder in this project.
3. Open Vercel.
4. Click **Add New Project**.
5. Import the GitHub repo.
6. Framework preset: **Other** or **Static**.
7. Build command: leave empty.
8. Output directory: leave empty or use `.`.
9. Deploy.

## Backend Upgrade Path

This MVP stores everything in localStorage. To connect a real backend later:

- Replace functions inside `assets/js/store.js` with API calls.
- Keep the UI/pages almost the same.
- Add password hashing server-side.
- Add real sessions/JWT/httpOnly cookies.
- Add database tables for users, posts, comments, likes, follows, messages, notifications.

Recommended backend options:

- Supabase
- Firebase
- Node.js + Express + PostgreSQL
- Laravel + MySQL
