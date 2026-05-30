import { $, escapeHTML, getRootPath, timeAgo, toast } from './helpers.js';
import {
  clearSession,
  getNotifications,
  getStats,
  toggleLike,
  addComment,
  deletePost,
  toggleFollow,
  isFollowing,
  getTheme,
  setTheme,
  getUserSettings
} from './store.js';

const icons = {
  home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.8 12 3l9 7.8V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10.8Z"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.8 18.6a7.8 7.8 0 1 1 0-15.6 7.8 7.8 0 0 1 0 15.6Zm6-1.8L22 22"/></svg>',
  create: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  inbox: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v12H4z"/><path d="m4 7 8 6 8-6"/></svg>',
  message: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8.5 8.5 0 0 1-9 8.4 9.8 9.8 0 0 1-3.7-.8L3 21l1.4-4.7A8.3 8.3 0 0 1 3 12a8.5 8.5 0 1 1 18 0Z"/><path d="M8 11h8M8 15h5"/></svg>',
  alerts: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>',
  profile: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>',
  heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>',
  comment: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-4-.9L3 20l1.1-4.5a8.5 8.5 0 1 1 16.9-4Z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m-1 4v8M9 10v8M5 6l1 15h12l1-15"/></svg>',
  settings: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.8 1.8 0 0 0-1.98-.36 1.8 1.8 0 0 0-1.1 1.65V21a2 2 0 1 1-4 0v-.09a1.8 1.8 0 0 0-1.1-1.65 1.8 1.8 0 0 0-1.98.36l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.8 1.8 0 0 0 4.6 15a1.8 1.8 0 0 0-1.65-1.1H3a2 2 0 1 1 0-4h.09A1.8 1.8 0 0 0 4.74 8.8a1.8 1.8 0 0 0-.36-1.98l-.06-.06A2 2 0 0 1 7.15 3.93l.06.06a1.8 1.8 0 0 0 1.98.36A1.8 1.8 0 0 0 10.9 2.7V2a2 2 0 1 1 4 0v.09a1.8 1.8 0 0 0 1.1 1.65 1.8 1.8 0 0 0 1.98-.36l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.8 1.8 0 0 0-.36 1.98A1.8 1.8 0 0 0 22.1 10H22a2 2 0 1 1 0 4h-.09A1.8 1.8 0 0 0 19.4 15Z"/></svg>'
};

export async function initShell(active = 'home', user) {
  const root = getRootPath();
  await getUserSettings(user.id);
  const unread = user ? (await getNotifications(user.id)).filter(n => !n.read).length : 0;
  const shell = $('#appShell');
  if (!shell || !user) return;
  shell.insertAdjacentHTML('afterbegin', `
    <aside class="side-nav">
      <a class="brand" href="${root}index.html" aria-label="Loom Threads home">
        <img src="${root}assets/img/logo.svg" alt="Loom Threads logo">
        <span>Loom</span>
      </a>
      <nav class="nav-list" aria-label="Main navigation">
        ${navLink(root, 'index.html', 'home', active, icons.home, 'Home')}
        ${navLink(root, 'pages/search.html', 'search', active, icons.search, 'Search')}
        ${navLink(root, 'pages/create.html', 'create', active, icons.create, 'Create')}
        ${navLink(root, 'pages/inbox.html', 'inbox', active, icons.inbox, 'Inbox')}
        ${navLink(root, 'pages/notifications.html', 'notifications', active, icons.alerts, `Alerts${unread ? `<b>${unread}</b>` : ''}`)}
        ${navLink(root, `pages/profile.html?u=${user.username}`, 'profile', active, icons.profile, 'Profile')}
        ${navLink(root, 'pages/settings.html', 'settings', active, icons.settings, 'Settings')}
      </nav>
      <div class="nav-footer">
        <button class="theme-toggle" id="themeToggle" type="button">${getTheme() === 'dark' ? '☀ Light' : '☾ Dark'}</button>
        <button class="logout-btn" id="logoutBtn" type="button">Logout</button>
        <a class="mini-profile" href="${root}pages/profile.html?u=${user.username}">
          <img src="${escapeHTML(user.avatar)}" alt="${escapeHTML(user.name)} avatar">
          <span><strong>${escapeHTML(user.name)}</strong><small>@${escapeHTML(user.username)}</small></span>
        </a>
      </div>
    </aside>
    <nav class="mobile-nav" aria-label="Mobile navigation">
      ${mobileLink(root, 'index.html', 'home', active, icons.home)}
      ${mobileLink(root, 'pages/search.html', 'search', active, icons.search)}
      ${mobileLink(root, 'pages/create.html', 'create', active, icons.create)}
      ${mobileLink(root, 'pages/inbox.html', 'inbox', active, icons.inbox)}
      ${mobileLink(root, `pages/profile.html?u=${user.username}`, 'profile', active, icons.profile)}
      ${mobileLink(root, 'pages/settings.html', 'settings', active, icons.settings)}
    </nav>
  `);
  $('#logoutBtn')?.addEventListener('click', async () => {
    await clearSession();
    location.href = `${root}login.html`;
  });
  $('#themeToggle')?.addEventListener('click', () => {
    const next = getTheme() === 'dark' ? 'light' : 'dark';
    setTheme(next);
    $('#themeToggle').textContent = next === 'dark' ? '☀ Light' : '☾ Dark';
  });
}

function navLink(root, href, key, active, icon, label) {
  return `<a class="nav-link ${active === key ? 'active' : ''}" href="${root}${href}"><span class="nav-icon">${icon}</span><em>${label}</em></a>`;
}

function mobileLink(root, href, key, active, icon) {
  return `<a class="mobile-link ${active === key ? 'active' : ''}" href="${root}${href}" aria-label="${key}"><span class="nav-icon">${icon}</span></a>`;
}

export function renderComposer(target, user, onSubmit) {
  target.innerHTML = `
    <form class="composer card" id="composerForm">
      <img src="${escapeHTML(user.avatar)}" alt="Your avatar">
      <div class="composer-main">
        <textarea id="postContent" maxlength="500" rows="4" placeholder="What are you building today?"></textarea>
        <div class="composer-actions">
          <small><span id="charCount">0</span>/500</small>
          <button class="primary-btn" type="submit">Post</button>
        </div>
      </div>
    </form>
  `;
  const input = $('#postContent', target);
  input.addEventListener('input', () => $('#charCount', target).textContent = input.value.length);
  $('#composerForm', target).addEventListener('submit', async event => {
    event.preventDefault();
    await onSubmit(input.value);
    input.value = '';
    $('#charCount', target).textContent = '0';
  });
}

export function renderPost(post, currentUser, usersById = new Map(), options = {}) {
  const author = post.author || usersById.get(post.userId);
  if (!author) return '';
  const ownPost = post.userId === currentUser.id;
  const liked = post.likes.includes(currentUser.id);
  const root = getRootPath();
  return `
    <article class="post card" data-post-id="${post.id}">
      <a href="${root}pages/profile.html?u=${author.username}" class="avatar-link"><img src="${escapeHTML(author.avatar)}" alt="${escapeHTML(author.name)} avatar"></a>
      <div class="post-body">
        <header class="post-head">
          <a href="${root}pages/profile.html?u=${author.username}"><strong>${escapeHTML(author.name)}</strong> <span>@${escapeHTML(author.username)} · ${timeAgo(post.createdAt)}</span></a>
          ${ownPost ? `<button class="icon-btn danger delete-post" type="button" aria-label="Delete post">${icons.trash}</button>` : ''}
        </header>
        <p>${linkify(escapeHTML(post.content))}</p>
        <div class="post-actions">
          <button class="action like-post ${liked ? 'liked' : ''}" type="button">${icons.heart}<span>${post.likes.length}</span></button>
          <button class="action comment-toggle" type="button">${icons.comment}<span>${post.comments.length}</span></button>
        </div>
        <div class="comment-panel ${options.openComments ? 'open' : ''}">
          <div class="comments">
            ${post.comments.map(comment => renderComment(comment, usersById)).join('') || '<small class="muted">No comments yet. Start the conversation.</small>'}
          </div>
          <form class="comment-form">
            <input name="comment" placeholder="Write a sharp reply..." autocomplete="off">
            <button type="submit">Reply</button>
          </form>
        </div>
      </div>
    </article>
  `;
}

function renderComment(comment, usersById) {
  const user = usersById.get(comment.userId);
  if (!user) return '';
  return `<div class="comment"><img src="${escapeHTML(user.avatar)}" alt=""><p><strong>${escapeHTML(user.username)}</strong> ${escapeHTML(comment.content)} <small>${timeAgo(comment.createdAt)}</small></p></div>`;
}

function linkify(text) {
  return text.replace(/(https?:\/\/[^\s]+)/g, '<a target="_blank" rel="noreferrer" href="$1">$1</a>');
}

export function wirePosts(container, currentUser, rerender) {
  container.addEventListener('click', async event => {
    const postEl = event.target.closest('[data-post-id]');
    if (!postEl) return;
    const postId = postEl.dataset.postId;
    try {
      if (event.target.closest('.like-post')) {
        await toggleLike(postId, currentUser.id);
        await rerender();
      }
      if (event.target.closest('.comment-toggle')) {
        $('.comment-panel', postEl).classList.toggle('open');
      }
      if (event.target.closest('.delete-post')) {
        if (confirm('Delete this post?')) {
          await deletePost(postId, currentUser.id);
          toast('Post deleted.');
          await rerender();
        }
      }
    } catch (error) {
      toast(error.message, 'error');
    }
  });
  container.addEventListener('submit', async event => {
    const form = event.target.closest('.comment-form');
    if (!form) return;
    event.preventDefault();
    const postId = event.target.closest('[data-post-id]').dataset.postId;
    try {
      await addComment(postId, currentUser.id, form.comment.value);
      form.reset();
      await rerender();
    } catch (error) {
      toast(error.message, 'error');
    }
  });
}

export async function renderProfileHeader(user, currentUser) {
  const stats = await getStats(user.id);
  const root = getRootPath();
  const own = user.id === currentUser.id;
  const following = !own && await isFollowing(currentUser.id, user.id);
  return `
    <section class="profile-hero card">
      <div class="profile-top">
        <img class="profile-avatar" src="${escapeHTML(user.avatar)}" alt="${escapeHTML(user.name)} avatar">
        <div class="profile-actions">
          ${own ? `<a class="ghost-btn" href="${root}pages/edit-profile.html">Edit profile</a>` : `<a class="ghost-btn message-link" href="${root}pages/chat.html?user=${user.id}">${icons.message}<span>Message</span></a><button class="primary-btn follow-btn" data-user-id="${user.id}" type="button">${following ? 'Following' : 'Follow'}</button>`}
        </div>
      </div>
      <h1>${escapeHTML(user.name)}</h1>
      <p class="handle">@${escapeHTML(user.username)}</p>
      <p class="bio">${escapeHTML(user.bio || 'No bio yet.')}</p>
      <div class="profile-meta">
        ${user.location ? `<span>📍 ${escapeHTML(user.location)}</span>` : ''}
        ${user.website ? `<a href="${escapeHTML(user.website)}" target="_blank" rel="noreferrer">${escapeHTML(user.website)}</a>` : ''}
      </div>
      <div class="stat-grid">
        <span><strong>${stats.posts}</strong><small>Posts</small></span>
        <span><strong>${stats.followers}</strong><small>Followers</small></span>
        <span><strong>${stats.following}</strong><small>Following</small></span>
        <span><strong>${stats.likes}</strong><small>Likes</small></span>
      </div>
    </section>
  `;
}

export function wireFollowButtons(container, currentUser, rerender) {
  container.addEventListener('click', async event => {
    const btn = event.target.closest('.follow-btn');
    if (!btn) return;
    try {
      await toggleFollow(currentUser.id, btn.dataset.userId);
      await rerender();
    } catch (error) {
      toast(error.message, 'error');
    }
  });
}

export function emptyState(title, text) {
  return `<div class="empty card"><strong>${title}</strong><p>${text}</p></div>`;
}
