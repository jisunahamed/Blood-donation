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
  let stats = { total_users: 12500, donations_this_month: 8750 };
  try { 
    const res = await api.get('/public/stats'); 
    if(res) {
       stats.total_users = res.total_users > 12500 ? res.total_users : 12500;
       stats.donations_this_month = res.donations_this_month > 8750 ? res.donations_this_month : 8750;
    }
  } catch (_) {}

  // Apply dark theme just to the wrapper
  document.getElementById('app').innerHTML = `
    <div class="landing-wrapper dark-theme">
      
      <!-- HERO SECTION -->
      <section class="hero-dark">
        <div class="hero-dark-content">
          <div class="trust-indicator">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            ১০,০০০+ শিক্ষার্থী ইতোমধ্যে যুক্ত
          </div>
          <h1>তোমার এক ফোঁটা <span class="text-red">রক্ত</span><br/>কারো জীবনের <span class="text-red">নতুন সুযোগ</span></h1>
          <p>ক্যাম্পাস থেকে ক্যাম্পাসে, আমরা গড়ে তুলছি একটি মানবিক সমাজ। তুমি এগিয়ে আসো, জীবন বাঁচানোর এই মহৎ যাত্রায় শরিক হও।</p>
          <div class="hero-actions-dark">
            <a href="#/register" class="btn-red-glow" style="text-decoration:none;">🩸 রক্ত দান করুন</a>
            <a href="#/login" class="btn-glass-outline" style="text-decoration:none;">❤️ রক্তের প্রয়োজন</a>
          </div>
        </div>
      </section>

      <!-- FEATURES SECTION -->
      <section class="features-dark">
        <div class="features-grid">
          <div class="feature-card-dark">
            <div class="feature-icon-dark">🩸</div>
            <h3>রক্ত দান করুন</h3>
          </div>
          <div class="feature-card-dark">
            <div class="feature-icon-dark">🔍</div>
            <h3>রক্ত খুঁজুন</h3>
          </div>
          <div class="feature-card-dark">
            <div class="feature-icon-dark">📅</div>
            <h3>ইভেন্টে অংশ নিন</h3>
          </div>
          <div class="feature-card-dark">
            <div class="feature-icon-dark">🤝</div>
            <h3>বন্ধুদের সাথে যুক্ত হন</h3>
          </div>
        </div>
      </section>

      <!-- IMPACT / STATS SECTION -->
      <section class="impact-dark">
        <div class="impact-glass-card">
          <div class="impact-stat">
            <div class="impact-icon">💧</div>
            <div class="impact-text">
              <h4>${stats.total_users.toLocaleString()}+</h4>
              <p>মোট রক্তদাতা</p>
            </div>
          </div>
          <div class="impact-stat">
            <div class="impact-icon">❤️</div>
            <div class="impact-text">
              <h4>${stats.donations_this_month.toLocaleString()}+</h4>
              <p>সফল রক্তদানের অনুরোধ</p>
            </div>
          </div>
          <div class="impact-stat">
            <div class="impact-icon">🛡️</div>
            <div class="impact-text">
              <h4>১০০%</h4>
              <p>নির্ভরযোগ্য সেবা</p>
            </div>
          </div>
        </div>
      </section>

      <!-- EMOTIONAL QUOTE SECTION -->
      <section class="quote-dark">
        <div class="quote-content">
          <div class="quote-icon">❝</div>
          <p class="quote-text">তুমি না হয় একদিনের জন্য কারো হিরো হও,<br/>তোমার রক্তে বাঁচতে পারে একটি সম্পূর্ণ জীবন। ❤️</p>
        </div>
      </section>

      <!-- FOOTER -->
      <footer class="footer-dark">
        <div class="social-icons">
          <a href="#">FB</a>
          <a href="#">IG</a>
          <a href="#">X</a>
        </div>
        <p style="margin-top: 1.5rem;">&copy; ${new Date().getFullYear()} রক্তসেতু — ক্যাম্পাস থেকে মানবতার পথে।</p>
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
      <a href="#/dashboard" class="${hash === '/dashboard' ? 'active' : ''}">ড্যাশবোর্ড</a>
      <a href="#/search" class="${hash === '/search' ? 'active' : ''}">রক্ত খুঁজুন</a>
      <a href="#/profile" class="${hash === '/profile' ? 'active' : ''}">প্রোফাইল</a>
      ${profile.is_admin ? `<a href="#/admin" class="${hash === '/admin' ? 'active' : ''}">এডমিন</a>` : ''}
      <span class="nav-user">${bloodBadge(profile.blood_group)} ${profile.name || 'User'}</span>
      <button class="btn-logout" onclick="handleLogout()">লগআউট</button>
    `;
  } else {
    // Determine if we are in the dark theme (landing page)
    const isDark = hash === '/';
    const darkClass = isDark ? 'dark-theme' : '';
    
    // In index.html the body/nav might not be in the .dark-theme wrapper, 
    // so let's toggle a class on the body to let the navbar know it should be dark.
    if(isDark) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }

    navLinks.innerHTML = `
      <a href="#/" class="nav-link ${hash === '/' ? 'active' : ''}">হোম</a>
      <a href="#/" class="nav-link">ডোনেট করুন</a>
      <a href="#/" class="nav-link">রক্তের প্রয়োজন</a>
      <a href="#/" class="nav-link">ইভেন্ট</a>
      <a href="#/" class="nav-link">ব্লগ</a>
      <a href="#/" class="nav-link" style="margin-right: 1rem;">আমাদের সম্পর্কে</a>
      <a href="#/login" class="nav-link" style="font-weight:600;">লগইন করুন</a>
      <a href="#/register" class="${isDark ? 'btn-red-glow' : 'btn btn-primary btn-glow'}" style="text-decoration:none; padding: 0.5rem 1.5rem;">সাইন আপ করুন</a>
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
