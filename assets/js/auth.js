import { $, navigate, toast, setPageTitle } from './helpers.js';
import { getCurrentUser, login, signup, getTheme, setTheme } from './store.js';

setTheme(getTheme());

const authMode = document.body.dataset.auth;
if (authMode) bootAuth(authMode);

async function bootAuth(mode) {
  const currentUser = await getCurrentUser();
  if (currentUser) navigate('index.html');
  setupPasswordToggles();
  setupAuthForms(mode);
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
    $('#loginForm').addEventListener('submit', async event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget));
      try {
        setLoading(event.submitter, true, 'Logging in...');
        await login({ login: data.login, password: data.password });
        toast('Welcome back.');
        setTimeout(() => navigate('index.html'), 250);
      } catch (error) {
        showError(error.message);
      } finally {
        setLoading(event.submitter, false, 'Login');
      }
    });
  }

  if (mode === 'signup') {
    $('#signupForm').addEventListener('submit', async event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget));
      try {
        setLoading(event.submitter, true, 'Creating...');
        await signup(data);
        toast('Account created. Check your email if confirmation is enabled.');
        $('#authError').hidden = false;
        $('#authError').textContent = 'Account created. If email confirmation is enabled in Supabase, confirm your email first, then log in.';
        event.currentTarget.reset();
      } catch (error) {
        showError(error.message);
      } finally {
        setLoading(event.submitter, false, 'Create account');
      }
    });
  }
}

function setLoading(button, loading, text) {
  if (!button) return;
  button.disabled = loading;
  button.textContent = text;
}

function showError(message) {
  const box = $('#authError');
  box.hidden = false;
  box.textContent = message;
}
