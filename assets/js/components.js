import { $, escapeHTML, getRootPath, timeAgo, toast } from './helpers.js';
import { getCurrentUser, getUserById, getStats, toggleLike, addComment, deletePost, toggleFollow, isFollowing, getNotifications, clearSession, getTheme, setTheme } from './store.js';

export function initShell(active = 'home') {
  const user = getCurrentUser();
  const root = getRootPath();
  document.documentElement.dataset.theme = getTheme();
  const unread = user ? getNotifications(user.id).filter(n => !n.read).length : 0;
  const shell = $('#appShell');
  if (!shell || !user) return;
  shell.insertAdjacentHTML('afterbegin', `
    <aside class="side-nav">
      <a class="brand" href="${root}index.html" aria-label="Loom Threads home">
        <img src="${root}assets/img/logo.svg" alt="Loom Threads logo">
        <span>Loom</span>
      </a>
      <nav class="nav-list" aria-label="Main navigation">
        ${navLink(root, 'index.html', 'home', active, '⌂', 'Home')}
        ${navLink(root, 'pages/search.html', 'search', active, '⌕', 'Search')}
        ${navLink(root, 'pages/create.html', 'create', active, '+', 'Create')}
        ${navLink(root, 'pages/inbox.html', 'inbox', active, '✉', 'Inbox')}
        ${navLink(root, 'pages/notifications.html', 'notifications', active, '◦', `Alerts${unread ? `<b>${unread}</b>` : ''}`)}
        ${navLink(root, `pages/profile.html?u=${user.username}`, 'profile', active, '◎', 'Profile')}
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
      ${mobileLink(root, 'index.html', 'home', active, '⌂')}
      ${mobileLink(root, 'pages/search.html', 'search', active, '⌕')}
      ${mobileLink(root, 'pages/create.html', 'create', active, '+')}
      ${mobileLink(root, 'pages/inbox.html', 'inbox', active, '✉')}
      ${mobileLink(root, `pages/profile.html?u=${user.username}`, 'profile', active, '◎')}
    </nav>
  `);
  $('#logoutBtn')?.addEventListener('click', () => {
    clearSession();
    location.href = `${root}login.html`;
  });
  $('#themeToggle')?.addEventListener('click', () => {
    const next = getTheme() === 'dark' ? 'light' : 'dark';
    setTheme(next);
    $('#themeToggle').textContent = next === 'dark' ? '☀ Light' : '☾ Dark';
  });
}

function navLink(root, href, key, active, icon, label) {
  return `<a class="nav-link ${active === key ? 'active' : ''}" href="${root}${href}"><span>${icon}</span><em>${label}</em></a>`;
}

function mobileLink(root, href, key, active, icon) {
  return `<a class="mobile-link ${active === key ? 'active' : ''}" href="${root}${href}" aria-label="${key}">${icon}</a>`;
}

export function renderComposer(target, onSubmit) {
  const user = getCurrentUser();
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
  $('#composerForm', target).addEventListener('submit', event => {
    event.preventDefault();
    onSubmit(input.value);
    input.value = '';
    $('#charCount', target).textContent = '0';
  });
}

export function renderPost(post, currentUser, options = {}) {
  const author = getUserById(post.userId);
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
          ${ownPost ? '<button class="icon-btn danger delete-post" type="button">Delete</button>' : ''}
        </header>
        <p>${linkify(escapeHTML(post.content))}</p>
        <div class="post-actions">
          <button class="action like-post ${liked ? 'liked' : ''}" type="button">♥ <span>${post.likes.length}</span></button>
          <button class="action comment-toggle" type="button">💬 <span>${post.comments.length}</span></button>
        </div>
        <div class="comment-panel ${options.openComments ? 'open' : ''}">
          <div class="comments">
            ${post.comments.map(comment => renderComment(comment)).join('') || '<small class="muted">No comments yet. Start the conversation.</small>'}
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

function renderComment(comment) {
  const user = getUserById(comment.userId);
  if (!user) return '';
  return `<div class="comment"><img src="${escapeHTML(user.avatar)}" alt=""><p><strong>${escapeHTML(user.username)}</strong> ${escapeHTML(comment.content)} <small>${timeAgo(comment.createdAt)}</small></p></div>`;
}

function linkify(text) {
  return text.replace(/(https?:\/\/[^\s]+)/g, '<a target="_blank" rel="noreferrer" href="$1">$1</a>');
}

export function wirePosts(container, rerender) {
  const currentUser = getCurrentUser();
  container.addEventListener('click', event => {
    const postEl = event.target.closest('[data-post-id]');
    if (!postEl) return;
    const postId = postEl.dataset.postId;
    try {
      if (event.target.closest('.like-post')) {
        toggleLike(postId, currentUser.id);
        rerender();
      }
      if (event.target.closest('.comment-toggle')) {
        $('.comment-panel', postEl).classList.toggle('open');
      }
      if (event.target.closest('.delete-post')) {
        if (confirm('Delete this post?')) {
          deletePost(postId, currentUser.id);
          toast('Post deleted.');
          rerender();
        }
      }
    } catch (error) {
      toast(error.message, 'error');
    }
  });
  container.addEventListener('submit', event => {
    const form = event.target.closest('.comment-form');
    if (!form) return;
    event.preventDefault();
    const postId = event.target.closest('[data-post-id]').dataset.postId;
    try {
      addComment(postId, currentUser.id, form.comment.value);
      form.reset();
      rerender();
    } catch (error) {
      toast(error.message, 'error');
    }
  });
}

export function renderProfileHeader(user, currentUser) {
  const stats = getStats(user.id);
  const root = getRootPath();
  const own = user.id === currentUser.id;
  const following = !own && isFollowing(currentUser.id, user.id);
  return `
    <section class="profile-hero card">
      <div class="profile-top">
        <img class="profile-avatar" src="${escapeHTML(user.avatar)}" alt="${escapeHTML(user.name)} avatar">
        <div class="profile-actions">
          ${own ? `<a class="ghost-btn" href="${root}pages/edit-profile.html">Edit profile</a>` : `<button class="primary-btn follow-btn" data-user-id="${user.id}" type="button">${following ? 'Following' : 'Follow'}</button>`}
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

export function wireFollowButtons(container, rerender) {
  const currentUser = getCurrentUser();
  container.addEventListener('click', event => {
    const btn = event.target.closest('.follow-btn');
    if (!btn) return;
    try {
      toggleFollow(currentUser.id, btn.dataset.userId);
      rerender();
    } catch (error) {
      toast(error.message, 'error');
    }
  });
}

export function emptyState(title, text) {
  return `<div class="empty card"><strong>${title}</strong><p>${text}</p></div>`;
}
