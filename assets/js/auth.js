import { $, navigate, toast, setPageTitle } from './helpers.js';
import {
  getCurrentUser,
  login,
  signup,
  requestPasswordReset,
  updatePassword,
  getTheme,
  setTheme
} from './store.js';

setTheme(getTheme());

const authMode = document.body.dataset.auth;
if (authMode) bootAuth(authMode);

async function bootAuth(mode) {
  const isResetMode = mode === 'reset-password';
  const currentUser = await getCurrentUser();

  if (currentUser && !isResetMode) {
    navigate('index.html');
    return;
  }

  if (isResetMode && !currentUser) {
    showError('Open the reset link from your email first. If this page was opened directly, request a new reset link.');
  }

  setupPasswordToggles();
  setupAuthForms(mode);
}

function setupPasswordToggles() {
  document.querySelectorAll('[data-toggle-password]').forEach(button => {
    button.addEventListener('click', () => {
      const input = document.querySelector(button.dataset.togglePassword);
      if (!input) return;
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      button.textContent = isPassword ? 'Hide' : 'Show';
    });
  });
}

function setupAuthForms(mode) {
  const titles = {
    login: 'Login',
    signup: 'Signup',
    'forgot-password': 'Forgot password',
    'reset-password': 'Reset password'
  };

  setPageTitle(titles[mode] || 'Auth');

  $('#themeMini')?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  });

  if (mode === 'login') setupLoginForm();
  if (mode === 'signup') setupSignupForm();
  if (mode === 'forgot-password') setupForgotPasswordForm();
  if (mode === 'reset-password') setupResetPasswordForm();
}

function setupLoginForm() {
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

function setupSignupForm() {
  $('#signupForm').addEventListener('submit', async event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      setLoading(event.submitter, true, 'Creating...');
      await signup(data);
      toast('Account created. Check your email if confirmation is enabled.');
      showSuccess('Account created. If email confirmation is enabled in Supabase, confirm your email first, then log in.');
      event.currentTarget.reset();
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(event.submitter, false, 'Create account');
    }
  });
}

function setupForgotPasswordForm() {
  $('#forgotPasswordForm').addEventListener('submit', async event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      setLoading(event.submitter, true, 'Sending...');
      await requestPasswordReset(data.email);
      showSuccess('Password reset email sent. Open the link in your inbox, then create your new password.');
      event.currentTarget.reset();
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(event.submitter, false, 'Send reset link');
    }
  });
}

function setupResetPasswordForm() {
  $('#resetPasswordForm').addEventListener('submit', async event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));

    if (data.password !== data.confirmPassword) {
      showError('Passwords do not match.');
      return;
    }

    try {
      setLoading(event.submitter, true, 'Updating...');
      await updatePassword(data.password);
      showSuccess('Password updated. You can now log in with your new password.');
      setTimeout(() => navigate('login.html'), 900);
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(event.submitter, false, 'Update password');
    }
  });
}

function setLoading(button, loading, text) {
  if (!button) return;
  button.disabled = loading;
  button.textContent = text;
}

function showError(message) {
  const box = $('#authError');
  if (!box) return;
  box.hidden = false;
  box.classList.remove('success-box');
  box.textContent = message;
}

function showSuccess(message) {
  const box = $('#authError');
  if (!box) return;
  box.hidden = false;
  box.classList.add('success-box');
  box.textContent = message;
}
