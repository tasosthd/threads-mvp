import { $, escapeHTML, navigate, setPageTitle, toast, timeAgo } from './helpers.js';
import { initShell, renderComposer, renderPost, wirePosts, renderProfileHeader, wireFollowButtons, emptyState } from './components.js';
import { getCurrentUser, getPosts, createPost, searchUsers, isFollowing, getUserByUsername, getPostsByUser, updateProfile, getInbox, getUserById, sendMessage, getNotifications, markNotificationsRead, resetDemoData } from './store.js';

const page = document.body.dataset.page;
const currentUser = getCurrentUser();

if (page && !currentUser) navigate('login.html');
if (page) initShell(page);

const routes = {
  home: initHome,
  search: initSearch,
  create: initCreate,
  inbox: initInbox,
  notifications: initNotifications,
  profile: initProfile,
  'edit-profile': initEditProfile
};

routes[page]?.();

function initHome() {
  setPageTitle('Home');
  const composerMount = $('#composerMount');
  const feed = $('#feed');
  renderComposer(composerMount, content => {
    try {
      createPost(currentUser.id, content);
      toast('Post published.');
      renderFeed();
    } catch (error) {
      toast(error.message, 'error');
    }
  });
  function renderFeed() {
    const posts = getPosts();
    feed.innerHTML = posts.length ? posts.map(post => renderPost(post, currentUser)).join('') : emptyState('No posts yet', 'Create the first post and own the feed.');
  }
  wirePosts(feed, renderFeed);
  $('#resetDemo')?.addEventListener('click', () => {
    if (confirm('Reset demo data and logout?')) {
      resetDemoData();
      location.href = 'login.html';
    }
  });
  renderFeed();
}

function initSearch() {
  setPageTitle('Search');
  const input = $('#searchInput');
  const results = $('#searchResults');
  function render() {
    const users = searchUsers(input.value, currentUser.id);
    results.innerHTML = users.length ? users.map(userCard).join('') : emptyState('No users found', 'Try searching for alex, maya, product, code, or design.');
  }
  input.addEventListener('input', render);
  wireFollowButtons(results, render);
  render();
}

function userCard(user) {
  const followed = isFollowing(currentUser.id, user.id);
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

function initCreate() {
  setPageTitle('Create');
  renderComposer($('#createMount'), content => {
    try {
      createPost(currentUser.id, content);
      toast('Post live.');
      setTimeout(() => location.href = '../index.html', 350);
    } catch (error) {
      toast(error.message, 'error');
    }
  });
}

function initInbox() {
  setPageTitle('Inbox');
  const inbox = $('#inboxList');
  const messageForm = $('#messageForm');
  const recipient = $('#recipient');
  const users = searchUsers('', currentUser.id);
  recipient.innerHTML = users.map(user => `<option value="${user.id}">${escapeHTML(user.name)} (@${escapeHTML(user.username)})</option>`).join('');
  messageForm.addEventListener('submit', event => {
    event.preventDefault();
    try {
      sendMessage(currentUser.id, recipient.value, messageForm.message.value);
      messageForm.reset();
      toast('Message sent.');
      render();
    } catch (error) {
      toast(error.message, 'error');
    }
  });
  function render() {
    const messages = getInbox(currentUser.id);
    inbox.innerHTML = messages.length ? messages.map(message => {
      const other = getUserById(message.fromId === currentUser.id ? message.toId : message.fromId);
      const outgoing = message.fromId === currentUser.id;
      return `<article class="message-card card"><img src="${escapeHTML(other.avatar)}" alt=""><div><strong>${outgoing ? 'To' : 'From'} ${escapeHTML(other.name)}</strong><p>${escapeHTML(message.text)}</p><small>${timeAgo(message.createdAt)}</small></div></article>`;
    }).join('') : emptyState('Inbox empty', 'Send a message and start building your network.');
  }
  render();
}

function initNotifications() {
  setPageTitle('Notifications');
  const list = $('#notificationsList');
  function render() {
    const notifications = getNotifications(currentUser.id);
    list.innerHTML = notifications.length ? notifications.map(item => {
      const actor = getUserById(item.actorId);
      return `<article class="notification card ${item.read ? '' : 'unread'}"><img src="${escapeHTML(actor?.avatar || '')}" alt=""><div><strong>${escapeHTML(actor?.name || 'Someone')}</strong> ${escapeHTML(item.text)}<small>${timeAgo(item.createdAt)}</small></div></article>`;
    }).join('') : emptyState('No notifications', 'Likes, follows, comments, and messages will appear here.');
  }
  $('#markRead').addEventListener('click', () => {
    markNotificationsRead(currentUser.id);
    toast('Notifications marked as read.');
    render();
  });
  render();
}

function initProfile() {
  setPageTitle('Profile');
  const main = $('#profileMain');
  const params = new URLSearchParams(location.search);
  const username = params.get('u') || currentUser.username;
  function render() {
    const user = getUserByUsername(username) || currentUser;
    const posts = getPostsByUser(user.id);
    main.innerHTML = renderProfileHeader(user, currentUser) + `<section id="profilePosts" class="feed-stack">${posts.length ? posts.map(post => renderPost(post, currentUser)).join('') : emptyState('No posts yet', 'This profile has not posted yet.')}</section>`;
    wirePosts($('#profilePosts'), render);
  }
  wireFollowButtons(main, render);
  render();
}

function initEditProfile() {
  setPageTitle('Edit Profile');
  const form = $('#editProfileForm');
  form.name.value = currentUser.name;
  form.username.value = currentUser.username;
  form.bio.value = currentUser.bio || '';
  form.avatar.value = currentUser.avatar || '';
  form.location.value = currentUser.location || '';
  form.website.value = currentUser.website || '';
  form.addEventListener('submit', event => {
    event.preventDefault();
    try {
      const data = Object.fromEntries(new FormData(form));
      const updated = updateProfile(currentUser.id, data);
      toast('Profile updated.');
      setTimeout(() => location.href = `profile.html?u=${updated.username}`, 300);
    } catch (error) {
      toast(error.message, 'error');
    }
  });
}
