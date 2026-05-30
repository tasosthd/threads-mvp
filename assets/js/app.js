import { $, escapeHTML, navigate, setPageTitle, toast, timeAgo } from './helpers.js';
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
  getInbox,
  getUserById,
  getUsersByIds,
  sendMessage,
  getNotifications,
  markNotificationsRead
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
      notifications: initNotifications,
      profile: initProfile,
      'edit-profile': initEditProfile
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
    results.innerHTML = users.length ? users.map(user => userCard(user, followingMap)).join('') : emptyState('No users found', 'Try searching for alex, maya, product, code, or design.');
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
      <button class="follow-btn ${followed ? 'soft' : ''}" data-user-id="${user.id}" type="button">${followed ? 'Following' : 'Follow'}</button>
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
  const messageForm = $('#messageForm');
  const recipient = $('#recipient');
  const users = await searchUsers('', currentUser.id);
  recipient.innerHTML = users.map(user => `<option value="${user.id}">${escapeHTML(user.name)} (@${escapeHTML(user.username)})</option>`).join('');

  messageForm.addEventListener('submit', async event => {
    event.preventDefault();
    try {
      await sendMessage(currentUser.id, recipient.value, messageForm.message.value);
      messageForm.reset();
      toast('Message sent.');
      await render();
    } catch (error) {
      toast(error.message, 'error');
    }
  });

  async function render() {
    const messages = await getInbox(currentUser.id);
    const usersById = await getUsersByIds(messages.flatMap(message => [message.fromId, message.toId]));
    inbox.innerHTML = messages.length ? messages.map(message => {
      const other = usersById.get(message.fromId === currentUser.id ? message.toId : message.fromId);
      const outgoing = message.fromId === currentUser.id;
      return `<article class="message-card card"><img src="${escapeHTML(other?.avatar || '')}" alt=""><div><strong>${outgoing ? 'To' : 'From'} ${escapeHTML(other?.name || 'User')}</strong><p>${escapeHTML(message.text)}</p><small>${timeAgo(message.createdAt)}</small></div></article>`;
    }).join('') : emptyState('Inbox empty', 'Send a message and start building your network.');
  }

  await render();
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

function debounce(fn, delay = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
