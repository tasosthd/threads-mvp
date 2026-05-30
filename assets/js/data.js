import { nowISO } from './helpers.js';

const hour = 60 * 60 * 1000;
const isoAgo = (ms) => new Date(Date.now() - ms).toISOString();

export const seedUsers = [
  {
    id: 'u_alex',
    email: 'alex@demo.com',
    username: 'alex',
    password: 'password123',
    name: 'Alex Carter',
    bio: 'Building tiny internet products with big ambition. SaaS, design, execution.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    location: 'Athens',
    website: 'https://example.com',
    createdAt: isoAgo(60 * 24 * hour)
  },
  {
    id: 'u_maya',
    email: 'maya@demo.com',
    username: 'maya',
    password: 'password123',
    name: 'Maya Stone',
    bio: 'Product designer. Clean interfaces, better habits, calmer systems.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    location: 'London',
    website: 'https://example.com',
    createdAt: isoAgo(43 * 24 * hour)
  },
  {
    id: 'u_neo',
    email: 'neo@demo.com',
    username: 'neo',
    password: 'password123',
    name: 'Neo Brooks',
    bio: 'Code, coffee, creative systems. Shipping beats dreaming.',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
    location: 'Berlin',
    website: '',
    createdAt: isoAgo(35 * 24 * hour)
  }
];

export const seedPosts = [
  {
    id: 'p_1',
    userId: 'u_alex',
    content: 'MVP rule: build the smallest thing that proves the biggest assumption. Then iterate like your bank account depends on it.',
    createdAt: isoAgo(2 * hour),
    likes: ['u_maya'],
    comments: [
      { id: 'c_1', userId: 'u_maya', content: 'This is the exact energy. Less theory, more shipping.', createdAt: isoAgo(90 * 60 * 1000) }
    ]
  },
  {
    id: 'p_2',
    userId: 'u_maya',
    content: 'Compact UI feels premium when spacing is intentional, typography is confident, and every button has one clear job.',
    createdAt: isoAgo(5 * hour),
    likes: ['u_alex', 'u_neo'],
    comments: []
  },
  {
    id: 'p_3',
    userId: 'u_neo',
    content: 'LocalStorage today. Real database tomorrow. The key is building the app architecture so the swap is clean.',
    createdAt: isoAgo(12 * hour),
    likes: ['u_alex'],
    comments: [
      { id: 'c_2', userId: 'u_alex', content: 'Exactly. Store layer first, backend later.', createdAt: isoAgo(10 * hour) }
    ]
  }
];

export const seedFollows = [
  { followerId: 'u_alex', followingId: 'u_maya', createdAt: nowISO() },
  { followerId: 'u_maya', followingId: 'u_alex', createdAt: nowISO() },
  { followerId: 'u_neo', followingId: 'u_alex', createdAt: nowISO() }
];

export const seedMessages = [
  { id: 'm_1', fromId: 'u_maya', toId: 'u_alex', text: 'Loved your MVP post. Are you shipping today?', createdAt: isoAgo(3 * hour), read: false },
  { id: 'm_2', fromId: 'u_neo', toId: 'u_alex', text: 'The new layout feels clean. Keep it compact.', createdAt: isoAgo(8 * hour), read: true }
];

export const seedNotifications = [
  { id: 'n_1', userId: 'u_alex', actorId: 'u_maya', type: 'like', text: 'liked your post', createdAt: isoAgo(70 * 60 * 1000), read: false },
  { id: 'n_2', userId: 'u_alex', actorId: 'u_neo', type: 'follow', text: 'started following you', createdAt: isoAgo(7 * hour), read: false }
];
