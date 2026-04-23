// ============================================================
// Hash Router — SPA Navigation
// ============================================================

const routes = {
  '/': renderLanding,
  '/login': renderLogin,
  '/register': renderRegister,
  '/dashboard': renderDashboard,
  '/search': renderDonors,
  '/profile': renderProfile,
  '/admin': renderAdmin,
};

const authRequired = ['/dashboard', '/search', '/profile', '/admin'];

async function router() {
  const hash = window.location.hash.slice(1) || '/';
  const route = routes[hash];

  if (authRequired.includes(hash)) {
    const { data } = await supabaseClient.auth.getSession();
    if (!data?.session) {
      window.location.hash = '#/login';
      return;
    }
  }

  updateNav();

  if (route) {
    route();
  } else {
    render404();
  }
}

function render404() {
  document.getElementById('app').innerHTML = `
    <div class="page-404">
      <h1>404</h1>
      <p>Oops! The page you're looking for doesn't exist.</p>
      <a href="#/" class="btn btn-primary">Go Home</a>
    </div>
  `;
}

async function renderLanding() {
  let stats = { total_users: 0, donations_this_month: 0, active_donors: 0 };
  try { stats = await api.get('/admin/stats'); } catch (_) {}

  document.getElementById('app').innerHTML = `
    <div class="landing">
      <section class="hero">
        <div class="hero-content">
          <h1>Save a Life.<br/><span>Donate Blood.</span></h1>
          <p>Connect with verified blood donors in your area. Our platform makes it easy to find, contact, and coordinate life-saving blood donations when every second counts.</p>
          <div class="hero-actions">
            <a href="#/register" class="btn btn-primary">Register as Donor</a>
            <a href="#/login" class="btn btn-secondary">Find Blood</a>
          </div>
        </div>
      </section>
      <div class="stats-bar">
        <div class="card stat-card">
          <div class="stat-value">${stats.total_users || '0'}</div>
          <div class="stat-label">Registered Donors</div>
        </div>
        <div class="card stat-card">
          <div class="stat-value">${stats.active_donors || '0'}</div>
          <div class="stat-label">Active Donors</div>
        </div>
        <div class="card stat-card">
          <div class="stat-value">${stats.donations_this_month || '0'}</div>
          <div class="stat-label">Donations This Month</div>
        </div>
      </div>
      <section class="landing-about">
        <h2>Why LifeFlow?</h2>
        <p>Every two seconds, someone needs blood. LifeFlow bridges the gap between donors and recipients with a streamlined digital platform. Search by blood group and location, connect instantly, and track your donation history — all in one place.</p>
      </section>
      <footer class="landing-footer">
        &copy; ${new Date().getFullYear()} LifeFlow Blood Donation Platform. Built with ❤️ to save lives.
      </footer>
    </div>
  `;
}

async function updateNav() {
  const navLinks = document.getElementById('nav-links');
  const { data } = await supabaseClient.auth.getSession();
  const profile = JSON.parse(localStorage.getItem('profile') || '{}');
  const hash = window.location.hash.slice(1) || '/';

  if (data?.session) {
    navLinks.innerHTML = `
      <a href="#/dashboard" class="${hash === '/dashboard' ? 'active' : ''}">Dashboard</a>
      <a href="#/search" class="${hash === '/search' ? 'active' : ''}">Find Donors</a>
      <a href="#/profile" class="${hash === '/profile' ? 'active' : ''}">Profile</a>
      ${profile.is_admin ? `<a href="#/admin" class="${hash === '/admin' ? 'active' : ''}">Admin</a>` : ''}
      <span class="nav-user">${bloodBadge(profile.blood_group)} ${profile.name || 'User'}</span>
      <button class="btn-logout" onclick="handleLogout()">Logout</button>
    `;
  } else {
    navLinks.innerHTML = `
      <a href="#/" class="${hash === '/' ? 'active' : ''}">Home</a>
      <a href="#/login" class="${hash === '/login' ? 'active' : ''}">Login</a>
      <a href="#/register" class="${hash === '/register' ? 'active' : ''}">Register</a>
    `;
  }
}

async function handleLogout() {
  showSpinner();
  try {
    await supabaseClient.auth.signOut();
    localStorage.removeItem('profile');
    showToast('Logged out successfully');
    window.location.hash = '#/login';
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    hideSpinner();
  }
}

// ── Hamburger Toggle ────────────────────────────────────────
document.getElementById('hamburger-btn')?.addEventListener('click', () => {
  document.getElementById('nav-links').classList.toggle('open');
});

// ── Init ────────────────────────────────────────────────────
window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);
