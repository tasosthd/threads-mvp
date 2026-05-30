import { $, navigate, toast, setPageTitle } from './helpers.js';
import { getCurrentUser, login, signup, getTheme, setTheme } from './store.js';

setTheme(getTheme());

const authMode = document.body.dataset.auth;
if (authMode) {
  if (getCurrentUser()) navigate('index.html');
  setupPasswordToggles();
  setupAuthForms(authMode);
}

function setupPasswordToggles() {
  document.querySelectorAll('[data-toggle-password]').forEach(button => {
    button.addEventListener('click', () => {
      const input = document.querySelector(button.dataset.togglePassword);
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      button.textContent = isPassword ? 'Hide' : 'Show';
    });
  });
}

function setupAuthForms(mode) {
  setPageTitle(mode === 'login' ? 'Login' : 'Signup');
  $('#themeMini')?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  });
  if (mode === 'login') {
    $('#loginForm').addEventListener('submit', event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget));
      try {
        login({ login: data.login, password: data.password, remember: Boolean(data.remember) });
        toast('Welcome back.');
        setTimeout(() => navigate('index.html'), 250);
      } catch (error) {
        showError(error.message);
      }
    });
  }
  if (mode === 'signup') {
    $('#signupForm').addEventListener('submit', event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget));
      try {
        signup(data);
        toast('Account created.');
        setTimeout(() => navigate('index.html'), 250);
      } catch (error) {
        showError(error.message);
      }
    });
  }
}

function showError(message) {
  const error = $('#authError');
  error.textContent = message;
  error.hidden = false;
}
