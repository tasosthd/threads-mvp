import { $, $$, escapeHTML, navigate, setPageTitle, toast, timeAgo } from './helpers.js';
import { initShell, renderComposer, renderPost, wirePosts, renderProfileHeader, wireFollowButtons, emptyState } from './components.js';
import {
  getCurrentUser,
  getPosts,
  createPost,
  searchUsers,
  getFollowingMap,
  getUserByUsername,
  getPostsByUser,
  updateProfile,
  getConversationSummaries,
  getConversation,
  getUserById,
  getUsersByIds,
  markConversationRead,
  sendMessage,
  getNotifications,
  markNotificationsRead,
  getUserSettings,
  saveUserSettings,
  DEFAULT_SETTINGS,
  ACCENT_PRESETS
} from './store.js';

const page = document.body.dataset.page;
let currentUser = null;

boot();

async function boot() {
  try {
    currentUser = await getCurrentUser();
    if (page && !currentUser) return navigate(getLoginPath());
    if (page) await initShell(page, currentUser);

    const routes = {
      home: initHome,
      search: initSearch,
      create: initCreate,
      inbox: initInbox,
      chat: initChat,
      notifications: initNotifications,
      profile: initProfile,
      'edit-profile': initEditProfile,
      settings: initSettings
    };

    await routes[page]?.();
  } catch (error) {
    toast(error.message, 'error');
    console.error(error);
  }
}

function getLoginPath() {
  return location.pathname.includes('/pages/') ? '../login.html' : 'login.html';
}

async function hydrateUsersForPosts(posts) {
  const commentUserIds = posts.flatMap(post => post.comments.map(comment => comment.userId));
  const authorIds = posts.map(post => post.userId);
  return await getUsersByIds([...commentUserIds, ...authorIds]);
}

async function initHome() {
  setPageTitle('Home');
  const composerMount = $('#composerMount');
  const feed = $('#feed');
  renderComposer(composerMount, currentUser, async content => {
    try {
      await createPost(currentUser.id, content);
      toast('Post published.');
      await renderFeed();
    } catch (error) {
      toast(error.message, 'error');
    }
  });

  async function renderFeed() {
    feed.innerHTML = '<div class="empty card"><strong>Loading feed...</strong><p>Pulling posts from Supabase.</p></div>';
    const posts = await getPosts();
    const usersById = await hydrateUsersForPosts(posts);
    feed.innerHTML = posts.length ? posts.map(post => renderPost(post, currentUser, usersById)).join('') : emptyState('No posts yet', 'Create the first post and own the feed.');
  }

  wirePosts(feed, currentUser, renderFeed);
  await renderFeed();
}

async function initSearch() {
  setPageTitle('Search');
  const input = $('#searchInput');
  const results = $('#searchResults');

  async function render() {
    results.innerHTML = '<div class="empty card"><strong>Searching...</strong><p>Checking Supabase profiles.</p></div>';
    const users = await searchUsers(input.value, currentUser.id);
    const followingMap = await getFollowingMap(currentUser.id, users.map(user => user.id));
    results.innerHTML = users.length ? users.map(user => userCard(user, followingMap)).join('') : emptyState('No users found', 'Try searching for a real username, name, or bio.');
  }

  input.addEventListener('input', debounce(render, 250));
  wireFollowButtons(results, currentUser, render);
  await render();
}

function userCard(user, followingMap) {
  const followed = followingMap.get(user.id);
  return `
    <article class="user-card card">
      <a class="user-card-main" href="profile.html?u=${user.username}">
        <img src="${escapeHTML(user.avatar)}" alt="${escapeHTML(user.name)} avatar">
        <span><strong>${escapeHTML(user.name)}</strong><small>@${escapeHTML(user.username)}</small><em>${escapeHTML(user.bio)}</em></span>
      </a>
      <div class="user-card-actions">
        <a class="ghost-btn mini-action" href="chat.html?user=${user.id}">Message</a>
        <button class="follow-btn ${followed ? 'soft' : ''}" data-user-id="${user.id}" type="button">${followed ? 'Following' : 'Follow'}</button>
      </div>
    </article>
  `;
}

async function initCreate() {
  setPageTitle('Create');
  renderComposer($('#createMount'), currentUser, async content => {
    try {
      await createPost(currentUser.id, content);
      toast('Post live.');
      setTimeout(() => location.href = '../index.html', 350);
    } catch (error) {
      toast(error.message, 'error');
    }
  });
}


async function initInbox() {
  setPageTitle('Inbox');
  const inbox = $('#inboxList');
  const searchInput = $('#newMessageSearch');
  const usersMount = $('#newMessageUsers');

  async function renderConversations() {
    inbox.innerHTML = '<div class="empty card"><strong>Loading conversations...</strong><p>Pulling your DMs from Supabase.</p></div>';
    const conversations = await getConversationSummaries(currentUser.id);
    inbox.innerHTML = conversations.length ? conversations.map(renderConversationPreview).join('') : emptyState('No conversations yet', 'Search a user below or tap Message on any profile to start a DM.');
  }

  async function renderUserSearch() {
    const users = await searchUsers(searchInput.value, currentUser.id);
    usersMount.innerHTML = users.length ? users.slice(0, 8).map(user => `
      <a class="user-card compact card" href="chat.html?user=${user.id}">
        <span class="user-card-main">
          <img src="${escapeHTML(user.avatar)}" alt="${escapeHTML(user.name)} avatar">
          <span><strong>${escapeHTML(user.name)}</strong><small>@${escapeHTML(user.username)}</small></span>
        </span>
        <span class="ghost-btn mini-action">Message</span>
      </a>
    `).join('') : '<div class="empty card"><strong>No users found</strong><p>Try another name or username.</p></div>';
  }

  searchInput.addEventListener('input', debounce(renderUserSearch, 250));
  await renderConversations();
  await renderUserSearch();
}

function renderConversationPreview(item) {
  const user = item.otherUser;
  const outgoing = item.lastMessage.senderId === currentUser.id;
  return `
    <a class="conversation-card card ${item.unreadCount ? 'has-unread' : ''}" href="chat.html?user=${user.id}">
      <img src="${escapeHTML(user.avatar)}" alt="${escapeHTML(user.name)} avatar">
      <div class="conversation-main">
        <div class="conversation-top"><strong>${escapeHTML(user.name)}</strong><small>${timeAgo(item.lastMessage.createdAt)}</small></div>
        <span>@${escapeHTML(user.username)}</span>
        <p>${outgoing ? 'You: ' : ''}${escapeHTML(item.lastMessage.content)}</p>
      </div>
      ${item.unreadCount ? `<b class="unread-dot">${item.unreadCount}</b>` : ''}
    </a>
  `;
}

async function initChat() {
  const params = new URLSearchParams(location.search);
  const otherUserId = params.get('user');
  const chat = $('#chatThread');
  const form = $('#chatForm');
  const input = $('#chatInput');
  const header = $('#chatHeader');

  const otherUser = await getUserById(otherUserId);
  if (!otherUser || otherUser.id === currentUser.id) {
    header.innerHTML = '<h1>Conversation</h1><p>User not found.</p>';
    chat.innerHTML = emptyState('Cannot open chat', 'Choose another real Supabase user from Search or Inbox.');
    form.hidden = true;
    return;
  }

  setPageTitle(`Chat with ${otherUser.name}`);
  header.innerHTML = `
    <a class="chat-back" href="inbox.html">← Inbox</a>
    <div class="chat-person">
      <img src="${escapeHTML(otherUser.avatar)}" alt="${escapeHTML(otherUser.name)} avatar">
      <span><h1>${escapeHTML(otherUser.name)}</h1><p>@${escapeHTML(otherUser.username)}</p></span>
    </div>
  `;

  async function renderConversation() {
    const messages = await getConversation(currentUser.id, otherUser.id);
    chat.innerHTML = messages.length ? messages.map(message => `
      <article class="chat-bubble ${message.senderId === currentUser.id ? 'mine' : 'theirs'}">
        <p>${escapeHTML(message.content)}</p>
        <small>${timeAgo(message.createdAt)}${message.senderId === currentUser.id && message.isRead ? ' · Read' : ''}</small>
      </article>
    `).join('') : emptyState('No messages yet', `Send ${escapeHTML(otherUser.name)} the first message.`);
    requestAnimationFrame(() => chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' }));
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const body = input.value.trim();
    if (!body) return;
    const optimistic = document.createElement('article');
    optimistic.className = 'chat-bubble mine sending';
    optimistic.innerHTML = `<p>${escapeHTML(body)}</p><small>Sending...</small>`;
    chat.appendChild(optimistic);
    chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' });
    input.value = '';
    try {
      await sendMessage(currentUser.id, otherUser.id, body);
      await renderConversation();
    } catch (error) {
      optimistic.remove();
      input.value = body;
      toast(error.message, 'error');
    }
  });

  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  await markConversationRead(currentUser.id, otherUser.id);
  await renderConversation();
}

async function initNotifications() {
  setPageTitle('Notifications');
  const list = $('#notificationsList');

  async function render() {
    const notifications = await getNotifications(currentUser.id);
    const usersById = await getUsersByIds(notifications.map(item => item.actorId));
    list.innerHTML = notifications.length ? notifications.map(item => {
      const actor = usersById.get(item.actorId);
      return `<article class="notification card ${item.read ? '' : 'unread'}"><img src="${escapeHTML(actor?.avatar || '')}" alt=""><div><strong>${escapeHTML(actor?.name || 'Someone')}</strong> ${escapeHTML(item.text)}<small>${timeAgo(item.createdAt)}</small></div></article>`;
    }).join('') : emptyState('No notifications', 'Likes, follows, comments, and messages will appear here.');
  }

  $('#markRead').addEventListener('click', async () => {
    await markNotificationsRead(currentUser.id);
    toast('Notifications marked as read.');
    await render();
  });

  await render();
}

async function initProfile() {
  setPageTitle('Profile');
  const main = $('#profileMain');
  const params = new URLSearchParams(location.search);
  const username = params.get('u') || currentUser.username;

  async function render() {
    const user = await getUserByUsername(username) || currentUser;
    const posts = await getPostsByUser(user.id);
    const usersById = await hydrateUsersForPosts(posts);
    main.innerHTML = await renderProfileHeader(user, currentUser) + `<section id="profilePosts" class="feed-stack">${posts.length ? posts.map(post => renderPost(post, currentUser, usersById)).join('') : emptyState('No posts yet', 'This profile has not posted yet.')}</section>`;
    wirePosts($('#profilePosts'), currentUser, render);
  }

  wireFollowButtons(main, currentUser, render);
  await render();
}

async function initEditProfile() {
  setPageTitle('Edit Profile');
  const form = $('#editProfileForm');
  form.name.value = currentUser.name;
  form.username.value = currentUser.username;
  form.bio.value = currentUser.bio || '';
  form.avatar.value = currentUser.avatar || '';
  form.location.value = currentUser.location || '';
  form.website.value = currentUser.website || '';

  form.addEventListener('submit', async event => {
    event.preventDefault();
    try {
      const data = Object.fromEntries(new FormData(form));
      const updated = await updateProfile(currentUser.id, data);
      toast('Profile updated.');
      setTimeout(() => location.href = `profile.html?u=${updated.username}`, 300);
    } catch (error) {
      toast(error.message, 'error');
    }
  });
}


async function initSettings() {
  setPageTitle('Settings');
  const form = $('#settingsForm');
  const preview = $('#settingsPreview');
  const resetBtn = $('#resetSettings');
  const accentGrid = $('#accentGrid');
  const settings = await getUserSettings(currentUser.id);

  accentGrid.innerHTML = ACCENT_PRESETS.map(item => `
    <button class="accent-swatch ${settings.accent === item.value ? 'active' : ''}" type="button" data-accent="${item.value}" style="--swatch:${item.value}">
      <span></span><strong>${item.name}</strong>
    </button>
  `).join('');

  form.theme.value = settings.theme;
  form.accent.value = settings.accent;
  form.density.value = settings.density;
  form.fontSize.value = settings.fontSize;
  form.motion.value = settings.motion;
  form.radius.value = settings.radius;
  form.glass.value = settings.glass;

  function currentFormSettings() {
    return {
      theme: form.theme.value,
      accent: form.accent.value,
      density: form.density.value,
      fontSize: form.fontSize.value,
      motion: form.motion.value,
      radius: form.radius.value,
      glass: form.glass.value
    };
  }

  function paintPreview(next = currentFormSettings()) {
    saveUserSettings(null, next);
    $$('.accent-swatch', accentGrid).forEach(btn => btn.classList.toggle('active', btn.dataset.accent === next.accent));
    preview.innerHTML = `
      <div class="settings-preview-card">
        <div class="preview-avatar"></div>
        <div>
          <strong>${escapeHTML(currentUser.name)}</strong>
          <p>Theme: ${escapeHTML(next.theme)} · Accent: ${escapeHTML(next.accent)} · Density: ${escapeHTML(next.density)}</p>
          <button class="primary-btn" type="button">Preview button</button>
        </div>
      </div>
    `;
  }

  form.addEventListener('input', () => paintPreview());
  accentGrid.addEventListener('click', event => {
    const btn = event.target.closest('[data-accent]');
    if (!btn) return;
    form.accent.value = btn.dataset.accent;
    paintPreview();
  });

  resetBtn.addEventListener('click', () => {
    Object.entries(DEFAULT_SETTINGS).forEach(([key, value]) => {
      if (form[key]) form[key].value = value;
    });
    paintPreview(DEFAULT_SETTINGS);
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    try {
      await saveUserSettings(currentUser.id, currentFormSettings());
      toast('Settings saved to Supabase.');
    } catch (error) {
      toast(`${error.message} — settings were kept locally.`, 'error');
    }
  });

  paintPreview(settings);
}

function debounce(fn, delay = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
