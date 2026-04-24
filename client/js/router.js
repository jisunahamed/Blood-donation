// ============================================================
// Hash Router — SPA Navigation
// ============================================================

const routes = {
  '/': renderLanding,
  '/login': renderLogin,
  '/register': renderRegister,
  '/complete-profile': renderCompleteProfile,
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
    
    // Check if profile exists safely
    let profileStr = localStorage.getItem('profile');
    let profile = null;
    try {
      profile = (profileStr && profileStr !== 'undefined' && profileStr !== 'null') ? JSON.parse(profileStr) : null;
    } catch (e) {
      profile = null;
    }
    if (!profile || !profile.blood_group) {
      // Try fetching from backend to be sure
      try {
        const profileData = await api.get('/users/me');
        profile = profileData;
        localStorage.setItem('profile', JSON.stringify(profile));
      } catch (err) {
        // If profile fetch fails (e.g. 401/404 because it doesn't exist), redirect to complete-profile
        window.location.hash = '#/complete-profile';
        return;
      }
    }
  }

  if (hash === '/login' || hash === '/register') {
    const { data } = await supabaseClient.auth.getSession();
    if (data?.session) {
      window.location.hash = '#/dashboard';
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
  try { stats = await api.get('/public/stats'); } catch (_) {}

  document.getElementById('app').innerHTML = `
    <div class="landing">
      <!-- Background Blobs -->
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      
      <section class="hero glass-panel">
        <div class="hero-content">
          <div class="badge badge-pulse mb-2">Join the Lifesaver Network</div>
          <h1>Save a Life.<br/><span class="text-gradient">Donate Blood.</span></h1>
          <p>Connect with verified blood donors in your area. Our platform makes it easy to find, contact, and coordinate life-saving blood donations when every second counts.</p>
          <div class="hero-actions mt-2">
            <a href="#/register" class="btn btn-primary btn-glow">Register as Donor</a>
            <a href="#/login" class="btn btn-secondary glass-btn">Find Blood</a>
          </div>
        </div>
      </section>
      
      <div class="stats-bar">
        <div class="card stat-card glass-card">
          <div class="stat-icon glass-icon">👥</div>
          <div class="stat-value text-gradient">${stats.total_users || '0'}</div>
          <div class="stat-label">Registered Donors</div>
        </div>
        <div class="card stat-card glass-card">
          <div class="stat-icon glass-icon">🩸</div>
          <div class="stat-value text-gradient">${stats.active_donors || '0'}</div>
          <div class="stat-label">Active Donors</div>
        </div>
        <div class="card stat-card glass-card">
          <div class="stat-icon glass-icon">❤️</div>
          <div class="stat-value text-gradient">${stats.donations_this_month || '0'}</div>
          <div class="stat-label">Donations This Month</div>
        </div>
      </div>
      
      <section class="landing-about glass-panel mt-2">
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
  const profileStr = localStorage.getItem('profile');
  let profile = {};
  try { profile = (profileStr && profileStr !== 'undefined' && profileStr !== 'null') ? JSON.parse(profileStr) : {}; } catch(e){}
  profile = profile || {};
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
