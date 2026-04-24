// ============================================================
// API Helper — Fetch wrapper with Bearer token
// ============================================================
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api'
  : 'https://blood-donation-ra7q.vercel.app/api';

const api = {
  _retried: false,

  async _getToken() {
    const { data } = await supabaseClient.auth.getSession();
    return data?.session?.access_token || null;
  },

  async _request(method, path, body = null, isRetry = false) {
    const token = await this._getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opts = { method, headers };
    if (body && method !== 'GET') opts.body = JSON.stringify(body);

    const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
    const res = await fetch(url, opts);

    if (res.status === 401 && !isRetry) {
      const { data, error } = await supabaseClient.auth.refreshSession();
      if (!error && data?.session) {
        return this._request(method, path, body, true);
      }
      await supabaseClient.auth.signOut();
      window.location.hash = '#/login';
      throw new Error('Session expired. Please log in again.');
    }

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || `Request failed (${res.status})`);
    }
    return json.data;
  },

  async get(path) {
    // Client-side cache for locations
    if (path === '/locations' || path === '/locations/') {
      const cached = sessionStorage.getItem('api_cache_locations');
      if (cached) return JSON.parse(cached);
      const data = await this._request('GET', path);
      sessionStorage.setItem('api_cache_locations', JSON.stringify(data));
      return data;
    }
    return this._request('GET', path);
  },
  post(path, body) { return this._request('POST', path, body); },
  put(path, body) { return this._request('PUT', path, body); },
  del(path) { return this._request('DELETE', path); },
};

// ── Toast System ────────────────────────────────────────────
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span> ${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ── Spinner ─────────────────────────────────────────────────
function showSpinner() { document.getElementById('spinner-overlay').classList.remove('hidden'); }
function hideSpinner() { document.getElementById('spinner-overlay').classList.add('hidden'); }

// ── Modal ───────────────────────────────────────────────────
function showModal(html) {
  document.getElementById('modal-content').innerHTML = html;
  document.getElementById('modal-overlay').classList.remove('hidden');
}
function hideModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}
document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
  if (e.target.id === 'modal-overlay') hideModal();
});

// ── Blood Badge Helper ──────────────────────────────────────
function bloodBadge(group) {
  if (!group) return '';
  return `<span class="badge badge-blood" data-group="${group}">${group}</span>`;
}

function availabilityBadge(available) {
  return available
    ? '<span class="badge badge-available">● Available</span>'
    : '<span class="badge badge-unavailable">● Unavailable</span>';
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function activityLabel(type) {
  const labels = {
    account_created: '🎉 Account created',
    profile_updated: '✏️ Profile updated',
    contact_copied: '📋 Copied contact info',
    donated_blood: '🩸 Donated blood',
    received_blood: '💉 Received blood',
    granted_admin: '👑 Admin access granted',
    revoked_admin: '🔒 Admin access revoked',
    user_deleted: '🗑️ User deleted',
  };
  return labels[type] || type;
}
