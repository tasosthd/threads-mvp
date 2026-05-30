import { supabase, AUTH_REDIRECT_URL, PASSWORD_RESET_REDIRECT_URL } from './supabase-config.js';
import { normalizeUsername } from './helpers.js';

const THEME_KEY = 'loom_threads_theme_v2';
const SETTINGS_KEY = 'loom_threads_settings_v3';

export const DEFAULT_SETTINGS = {
  theme: 'dark',
  accent: '#7c3aed',
  density: 'comfortable',
  fontSize: 'normal',
  motion: 'full',
  radius: 'rounded',
  glass: 'on'
};

export const ACCENT_PRESETS = [
  { name: 'Violet', value: '#7c3aed' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Rose', value: '#e11d48' },
  { name: 'Amber', value: '#d97706' },
  { name: 'Cyan', value: '#0891b2' }
];

export function getTheme() {
  return getLocalSettings().theme || localStorage.getItem(THEME_KEY) || DEFAULT_SETTINGS.theme;
}

export function getLocalSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function applySettings(settings = getLocalSettings()) {
  const next = { ...DEFAULT_SETTINGS, ...settings };
  const root = document.documentElement;
  root.dataset.theme = next.theme;
  root.dataset.density = next.density;
  root.dataset.fontSize = next.fontSize;
  root.dataset.motion = next.motion;
  root.dataset.radius = next.radius;
  root.dataset.glass = next.glass;
  root.style.setProperty('--accent', next.accent || DEFAULT_SETTINGS.accent);
  localStorage.setItem(THEME_KEY, next.theme);
  return next;
}

export function saveLocalSettings(settings) {
  const next = applySettings({ ...getLocalSettings(), ...settings });
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  return next;
}

export function setTheme(theme) {
  return saveLocalSettings({ theme });
}

export async function getUserSettings(userId) {
  const local = getLocalSettings();
  if (!userId) return local;

  const { data, error } = await supabase
    .from('user_preferences')
    .select('theme, accent, density, font_size, motion, radius, glass')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('Remote settings unavailable. Run supabase/settings-upgrade.sql to sync preferences.', error.message);
    return applySettings(local);
  }

  if (!data) return applySettings(local);

  const remote = {
    theme: data.theme || local.theme,
    accent: data.accent || local.accent,
    density: data.density || local.density,
    fontSize: data.font_size || local.fontSize,
    motion: data.motion || local.motion,
    radius: data.radius || local.radius,
    glass: data.glass || local.glass
  };
  saveLocalSettings(remote);
  return remote;
}

export async function saveUserSettings(userId, settings) {
  const next = saveLocalSettings(settings);
  if (!userId) return next;

  const payload = {
    user_id: userId,
    theme: next.theme,
    accent: next.accent,
    density: next.density,
    font_size: next.fontSize,
    motion: next.motion,
    radius: next.radius,
    glass: next.glass,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from('user_preferences').upsert(payload, { onConflict: 'user_id' });
  if (error) throw new Error(error.message);
  return next;
}

applySettings(getLocalSettings());

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  return data.session;
}

export async function clearSession() {
  await supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) return null;
  return await getUserById(userData.user.id, true);
}

export async function signup({ name, username, email, password }) {
  const cleanUsername = normalizeUsername(username);
  const cleanEmail = String(email).trim().toLowerCase();
  const cleanName = String(name).trim();

  if (!cleanName) throw new Error('Enter your name.');
  if (cleanUsername.length < 3) throw new Error('Username must be at least 3 characters.');
  if (!cleanEmail.includes('@')) throw new Error('Enter a valid email address.');
  if (String(password).length < 8) throw new Error('Password must be at least 8 characters.');

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      emailRedirectTo: AUTH_REDIRECT_URL,
      data: {
        name: cleanName,
        username: cleanUsername,
        avatar_url: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(cleanName)}`
      }
    }
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function login({ login, password }) {
  const identifier = String(login).trim().toLowerCase();
  if (!identifier) throw new Error('Enter your email or username.');

  let email = identifier;
  if (!identifier.includes('@')) {
    const { data, error } = await supabase.rpc('resolve_login_email', { identifier });
    if (error) throw new Error(error.message);
    if (!data) throw new Error('Invalid email/username or password.');
    email = data;
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error('Invalid email/username or password.');
  return data.user;
}


export async function requestPasswordReset(email) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail.includes('@')) throw new Error('Enter the email address connected to your account.');

  const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
    redirectTo: PASSWORD_RESET_REDIRECT_URL
  });

  if (error) throw new Error(error.message);
  return true;
}

export async function updatePassword(newPassword) {
  const password = String(newPassword || '');
  if (password.length < 8) throw new Error('Password must be at least 8 characters.');

  const { data, error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(error.message);
  return data.user;
}

export async function updateProfile(userId, updates) {
  const cleanUsername = normalizeUsername(updates.username);
  if (cleanUsername.length < 3) throw new Error('Username must be at least 3 characters.');

  const payload = {
    name: String(updates.name || '').trim(),
    username: cleanUsername,
    bio: String(updates.bio || '').trim(),
    avatar_url: String(updates.avatar || '').trim(),
    location: String(updates.location || '').trim(),
    website: String(updates.website || '').trim(),
    updated_at: new Date().toISOString()
  };

  if (!payload.name) throw new Error('Name cannot be empty.');

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select(publicProfileColumns())
    .single();

  if (error) throw new Error(error.message);
  return mapProfile(data);
}

function publicProfileColumns() {
  return 'id, username, name, bio, avatar_url, location, website, created_at, updated_at';
}

function mapProfile(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    name: row.name || row.username || 'Builder',
    bio: row.bio || '',
    avatar: row.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(row.name || row.username || 'Builder')}`,
    location: row.location || '',
    website: row.website || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapComment(row) {
  return {
    id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    content: row.content,
    createdAt: row.created_at
  };
}

function mapPost(row) {
  const likes = row.likes?.map(item => item.user_id) || [];
  const comments = row.comments?.map(mapComment) || [];
  return {
    id: row.id,
    userId: row.user_id,
    content: row.content,
    createdAt: row.created_at,
    likes,
    comments,
    author: mapProfile(row.profiles)
  };
}

export async function getUserById(id) {
  const { data, error } = await supabase
    .from('profiles')
    .select(publicProfileColumns())
    .eq('id', id)
    .single();
  if (error) return null;
  return mapProfile(data);
}

export async function getUsersByIds(ids = []) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return new Map();
  const { data, error } = await supabase
    .from('profiles')
    .select(publicProfileColumns())
    .in('id', unique);
  if (error) throw new Error(error.message);
  return new Map(data.map(row => [row.id, mapProfile(row)]));
}

export async function getUserByUsername(username) {
  const { data, error } = await supabase
    .from('profiles')
    .select(publicProfileColumns())
    .eq('username', String(username).toLowerCase())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return mapProfile(data);
}

export async function getPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id, user_id, content, created_at,
      profiles!posts_user_id_fkey (${publicProfileColumns()}),
      likes (user_id),
      comments (id, post_id, user_id, content, created_at)
    `)
    .order('created_at', { ascending: false })
    .order('created_at', { foreignTable: 'comments', ascending: true });
  if (error) throw new Error(error.message);
  return data.map(mapPost);
}

export async function getPostsByUser(userId) {
  const posts = await getPosts();
  return posts.filter(post => post.userId === userId);
}

export async function createPost(userId, content) {
  const text = String(content).trim();
  if (text.length < 1) throw new Error('Post cannot be empty.');
  if (text.length > 500) throw new Error('Post must stay under 500 characters.');

  const { data, error } = await supabase
    .from('posts')
    .insert({ user_id: userId, content: text })
    .select('id, user_id, content, created_at')
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deletePost(postId, userId) {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}

export async function toggleLike(postId, userId) {
  const { data: existing, error: lookupError } = await supabase
    .from('likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();
  if (lookupError) throw new Error(lookupError.message);

  if (existing) {
    const { error } = await supabase.from('likes').delete().eq('id', existing.id);
    if (error) throw new Error(error.message);
    return false;
  }

  const { error } = await supabase.from('likes').insert({ post_id: postId, user_id: userId });
  if (error) throw new Error(error.message);
  await createNotificationForPost(postId, userId, 'like', 'liked your post');
  return true;
}

export async function addComment(postId, userId, content) {
  const text = String(content).trim();
  if (!text) throw new Error('Comment cannot be empty.');

  const { error } = await supabase
    .from('comments')
    .insert({ post_id: postId, user_id: userId, content: text });
  if (error) throw new Error(error.message);
  await createNotificationForPost(postId, userId, 'comment', 'commented on your post');
}

async function createNotificationForPost(postId, actorId, type, text) {
  const { data: post } = await supabase.from('posts').select('user_id').eq('id', postId).single();
  if (!post || post.user_id === actorId) return;
  await supabase.from('notifications').insert({ user_id: post.user_id, actor_id: actorId, type, text, post_id: postId });
}

export async function isFollowing(followerId, followingId) {
  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function toggleFollow(followerId, followingId) {
  if (followerId === followingId) throw new Error('You cannot follow yourself.');
  const alreadyFollowing = await isFollowing(followerId, followingId);

  if (alreadyFollowing) {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);
    if (error) throw new Error(error.message);
    return false;
  }

  const { error } = await supabase.from('follows').insert({ follower_id: followerId, following_id: followingId });
  if (error) throw new Error(error.message);
  await supabase.from('notifications').insert({ user_id: followingId, actor_id: followerId, type: 'follow', text: 'started following you' });
  return true;
}

export async function getStats(userId) {
  const [{ count: posts }, { count: followers }, { count: following }, { data: userPosts }] = await Promise.all([
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', userId),
    supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
    supabase.from('posts').select('id, likes(id)').eq('user_id', userId)
  ]);

  const likes = (userPosts || []).reduce((sum, post) => sum + (post.likes?.length || 0), 0);
  return { posts: posts || 0, followers: followers || 0, following: following || 0, likes };
}

export async function searchUsers(query, currentUserId) {
  const q = String(query).trim().replace(/[%,()]/g, '');
  let builder = supabase.from('profiles').select(publicProfileColumns()).neq('id', currentUserId).order('created_at', { ascending: false });
  if (q) builder = builder.or(`username.ilike.%${q}%,name.ilike.%${q}%,bio.ilike.%${q}%`);
  const { data, error } = await builder.limit(30);
  if (error) throw new Error(error.message);
  return data.map(mapProfile);
}

export async function getFollowingMap(currentUserId, userIds = []) {
  const unique = [...new Set(userIds.filter(id => id && id !== currentUserId))];
  if (!unique.length) return new Map();
  const { data, error } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', currentUserId)
    .in('following_id', unique);
  if (error) throw new Error(error.message);
  return new Map(data.map(row => [row.following_id, true]));
}


function mapMessage(row) {
  return {
    id: row.id,
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    content: row.content,
    isRead: row.is_read,
    createdAt: row.created_at
  };
}

export async function getInbox(userId) {
  return getConversationSummaries(userId);
}

export async function getConversationSummaries(userId) {
  const { data, error } = await supabase
    .from('messages')
    .select('id, sender_id, receiver_id, content, is_read, created_at')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  const latestByUser = new Map();
  const unreadByUser = new Map();

  for (const row of data || []) {
    const otherId = row.sender_id === userId ? row.receiver_id : row.sender_id;
    if (!latestByUser.has(otherId)) latestByUser.set(otherId, mapMessage(row));
    if (row.receiver_id === userId && !row.is_read) {
      unreadByUser.set(otherId, (unreadByUser.get(otherId) || 0) + 1);
    }
  }

  const usersById = await getUsersByIds([...latestByUser.keys()]);
  return [...latestByUser.entries()].map(([otherUserId, lastMessage]) => ({
    otherUser: usersById.get(otherUserId),
    otherUserId,
    lastMessage,
    unreadCount: unreadByUser.get(otherUserId) || 0
  })).filter(item => item.otherUser);
}

export async function getConversation(currentUserId, otherUserId) {
  if (!otherUserId || otherUserId === currentUserId) throw new Error('Choose another user to message.');
  const { data, error } = await supabase
    .from('messages')
    .select('id, sender_id, receiver_id, content, is_read, created_at')
    .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []).map(mapMessage);
}

export async function markConversationRead(currentUserId, otherUserId) {
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('sender_id', otherUserId)
    .eq('receiver_id', currentUserId)
    .eq('is_read', false);
  if (error) throw new Error(error.message);
}

export async function sendMessage(senderId, receiverId, content) {
  const body = String(content).trim();
  if (!body) throw new Error('Message cannot be empty.');
  if (body.length > 1000) throw new Error('Message must stay under 1000 characters.');
  if (senderId === receiverId) throw new Error('You cannot message yourself.');

  const { data, error } = await supabase
    .from('messages')
    .insert({ sender_id: senderId, receiver_id: receiverId, content: body })
    .select('id, sender_id, receiver_id, content, is_read, created_at')
    .single();
  if (error) throw new Error(error.message);
  await supabase.from('notifications').insert({ user_id: receiverId, actor_id: senderId, type: 'message', text: 'sent you a message' });
  return mapMessage(data);
}

export async function getNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, user_id, actor_id, type, text, read, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data.map(row => ({ id: row.id, userId: row.user_id, actorId: row.actor_id, type: row.type, text: row.text, read: row.read, createdAt: row.created_at }));
}

export async function markNotificationsRead(userId) {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
  if (error) throw new Error(error.message);
}
