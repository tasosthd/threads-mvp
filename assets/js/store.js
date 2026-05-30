import { seedUsers, seedPosts, seedFollows, seedMessages, seedNotifications } from './data.js';
import { uid, nowISO, normalizeUsername } from './helpers.js';

const DB_KEY = 'loom_threads_db_v1';
const SESSION_KEY = 'loom_threads_session_v1';
const THEME_KEY = 'loom_threads_theme_v1';

const defaultDB = () => ({
  users: seedUsers,
  posts: seedPosts,
  follows: seedFollows,
  messages: seedMessages,
  notifications: seedNotifications
});

export function getDB() {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) {
    const db = defaultDB();
    saveDB(db);
    return db;
  }
  try {
    return JSON.parse(raw);
  } catch {
    const db = defaultDB();
    saveDB(db);
    return db;
  }
}

export function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

export function resetDemoData() {
  const db = defaultDB();
  saveDB(db);
  localStorage.removeItem(SESSION_KEY);
}

export function getTheme() {
  return localStorage.getItem(THEME_KEY) || 'dark';
}

export function setTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
  document.documentElement.dataset.theme = theme;
}

export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setSession(userId, remember = true) {
  const payload = JSON.stringify({ userId, createdAt: nowISO() });
  if (remember) localStorage.setItem(SESSION_KEY, payload);
  else sessionStorage.setItem(SESSION_KEY, payload);
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser() {
  const session = getSession();
  if (!session) return null;
  return getDB().users.find(user => user.id === session.userId) || null;
}

export function findUserByLogin(login) {
  const value = String(login).trim().toLowerCase();
  return getDB().users.find(user => user.email.toLowerCase() === value || user.username.toLowerCase() === value) || null;
}

export function signup({ name, username, email, password }) {
  const db = getDB();
  const cleanUsername = normalizeUsername(username);
  const cleanEmail = String(email).trim().toLowerCase();

  if (!name.trim()) throw new Error('Enter your name.');
  if (cleanUsername.length < 3) throw new Error('Username must be at least 3 characters.');
  if (!cleanEmail.includes('@')) throw new Error('Enter a valid email address.');
  if (String(password).length < 8) throw new Error('Password must be at least 8 characters.');
  if (db.users.some(user => user.email.toLowerCase() === cleanEmail)) throw new Error('Email is already registered.');
  if (db.users.some(user => user.username.toLowerCase() === cleanUsername)) throw new Error('Username is already taken.');

  const newUser = {
    id: uid('u'),
    email: cleanEmail,
    username: cleanUsername,
    password,
    name: name.trim(),
    bio: 'New here. Building my profile.',
    avatar: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name.trim())}`,
    location: '',
    website: '',
    createdAt: nowISO()
  };
  db.users.push(newUser);
  saveDB(db);
  setSession(newUser.id, true);
  return newUser;
}

export function login({ login, password, remember }) {
  const user = findUserByLogin(login);
  if (!user || user.password !== password) throw new Error('Invalid email/username or password.');
  setSession(user.id, remember);
  return user;
}

export function updateProfile(userId, updates) {
  const db = getDB();
  const user = db.users.find(item => item.id === userId);
  if (!user) throw new Error('User not found.');
  const cleanUsername = normalizeUsername(updates.username);
  if (cleanUsername.length < 3) throw new Error('Username must be at least 3 characters.');
  if (db.users.some(item => item.id !== userId && item.username.toLowerCase() === cleanUsername)) throw new Error('Username is already taken.');
  Object.assign(user, {
    name: updates.name.trim() || user.name,
    username: cleanUsername,
    bio: updates.bio.trim(),
    avatar: updates.avatar.trim() || user.avatar,
    location: updates.location.trim(),
    website: updates.website.trim()
  });
  saveDB(db);
  return user;
}

export function getUserById(id) {
  return getDB().users.find(user => user.id === id) || null;
}

export function getUserByUsername(username) {
  return getDB().users.find(user => user.username.toLowerCase() === String(username).toLowerCase()) || null;
}

export function getPosts() {
  return getDB().posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getPostsByUser(userId) {
  return getPosts().filter(post => post.userId === userId);
}

export function createPost(userId, content) {
  const text = String(content).trim();
  if (text.length < 1) throw new Error('Post cannot be empty.');
  if (text.length > 500) throw new Error('Post must stay under 500 characters.');
  const db = getDB();
  const post = { id: uid('p'), userId, content: text, createdAt: nowISO(), likes: [], comments: [] };
  db.posts.unshift(post);
  saveDB(db);
  return post;
}

export function deletePost(postId, userId) {
  const db = getDB();
  const post = db.posts.find(item => item.id === postId);
  if (!post || post.userId !== userId) throw new Error('You can only delete your own posts.');
  db.posts = db.posts.filter(item => item.id !== postId);
  saveDB(db);
}

export function toggleLike(postId, userId) {
  const db = getDB();
  const post = db.posts.find(item => item.id === postId);
  if (!post) throw new Error('Post not found.');
  const liked = post.likes.includes(userId);
  post.likes = liked ? post.likes.filter(id => id !== userId) : [...post.likes, userId];
  if (!liked && post.userId !== userId) {
    db.notifications.unshift({ id: uid('n'), userId: post.userId, actorId: userId, type: 'like', text: 'liked your post', createdAt: nowISO(), read: false });
  }
  saveDB(db);
  return !liked;
}

export function addComment(postId, userId, content) {
  const text = String(content).trim();
  if (!text) throw new Error('Comment cannot be empty.');
  const db = getDB();
  const post = db.posts.find(item => item.id === postId);
  if (!post) throw new Error('Post not found.');
  post.comments.push({ id: uid('c'), userId, content: text, createdAt: nowISO() });
  if (post.userId !== userId) {
    db.notifications.unshift({ id: uid('n'), userId: post.userId, actorId: userId, type: 'comment', text: 'commented on your post', createdAt: nowISO(), read: false });
  }
  saveDB(db);
}

export function isFollowing(followerId, followingId) {
  return getDB().follows.some(item => item.followerId === followerId && item.followingId === followingId);
}

export function toggleFollow(followerId, followingId) {
  if (followerId === followingId) throw new Error('You cannot follow yourself.');
  const db = getDB();
  const exists = db.follows.some(item => item.followerId === followerId && item.followingId === followingId);
  if (exists) db.follows = db.follows.filter(item => !(item.followerId === followerId && item.followingId === followingId));
  else {
    db.follows.push({ followerId, followingId, createdAt: nowISO() });
    db.notifications.unshift({ id: uid('n'), userId: followingId, actorId: followerId, type: 'follow', text: 'started following you', createdAt: nowISO(), read: false });
  }
  saveDB(db);
  return !exists;
}

export function getStats(userId) {
  const db = getDB();
  const posts = db.posts.filter(post => post.userId === userId);
  return {
    posts: posts.length,
    followers: db.follows.filter(item => item.followingId === userId).length,
    following: db.follows.filter(item => item.followerId === userId).length,
    likes: posts.reduce((sum, post) => sum + post.likes.length, 0)
  };
}

export function searchUsers(query, currentUserId) {
  const q = String(query).trim().toLowerCase();
  return getDB().users
    .filter(user => user.id !== currentUserId)
    .filter(user => !q || user.name.toLowerCase().includes(q) || user.username.toLowerCase().includes(q) || user.bio.toLowerCase().includes(q));
}

export function getInbox(userId) {
  return getDB().messages
    .filter(item => item.toId === userId || item.fromId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function sendMessage(fromId, toId, text) {
  const body = String(text).trim();
  if (!body) throw new Error('Message cannot be empty.');
  const db = getDB();
  db.messages.unshift({ id: uid('m'), fromId, toId, text: body, createdAt: nowISO(), read: false });
  db.notifications.unshift({ id: uid('n'), userId: toId, actorId: fromId, type: 'message', text: 'sent you a message', createdAt: nowISO(), read: false });
  saveDB(db);
}

export function getNotifications(userId) {
  return getDB().notifications
    .filter(item => item.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function markNotificationsRead(userId) {
  const db = getDB();
  db.notifications.forEach(item => {
    if (item.userId === userId) item.read = true;
  });
  saveDB(db);
}
