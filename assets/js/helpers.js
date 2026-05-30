export const $ = (selector, scope = document) => scope.querySelector(selector);
export const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function nowISO() {
  return new Date().toISOString();
}

export function timeAgo(dateValue) {
  const seconds = Math.floor((Date.now() - new Date(dateValue).getTime()) / 1000);
  const intervals = [
    ['y', 31536000], ['mo', 2592000], ['w', 604800], ['d', 86400], ['h', 3600], ['m', 60]
  ];
  for (const [label, value] of intervals) {
    const amount = Math.floor(seconds / value);
    if (amount >= 1) return `${amount}${label}`;
  }
  return 'now';
}

export function escapeHTML(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function normalizeUsername(value = '') {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9_.]/g, '').slice(0, 24);
}

export function getRootPath() {
  return location.pathname.includes('/pages/') ? '../' : './';
}

export function navigate(path) {
  window.location.href = `${getRootPath()}${path}`;
}

export function toast(message, type = 'success') {
  let area = document.querySelector('.toast-area');
  if (!area) {
    area = document.createElement('div');
    area.className = 'toast-area';
    document.body.appendChild(area);
  }
  const item = document.createElement('div');
  item.className = `toast ${type}`;
  item.textContent = message;
  area.appendChild(item);
  setTimeout(() => item.classList.add('show'), 20);
  setTimeout(() => {
    item.classList.remove('show');
    setTimeout(() => item.remove(), 250);
  }, 2600);
}

export function setPageTitle(title) {
  document.title = `${title} · Loom Threads`;
}
