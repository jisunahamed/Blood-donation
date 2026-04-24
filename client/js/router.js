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
  const rawHash = window.location.hash;

  // Handle Google OAuth redirect — hash contains access_token fragment
  if (rawHash.includes('access_token=') || rawHash.includes('type=recovery')) {
    document.getElementById('app').innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:60vh;flex-direction:column;gap:1rem;">
        <div class="spinner-drop"></div>
        <p style="color:var(--muted);">লগইন হচ্ছে, অপেক্ষা করুন...</p>
      </div>`;
    return;
  }

  const hash = rawHash.slice(1) || '/';
  const route = routes[hash];

  if (authRequired.includes(hash)) {
    const { data } = await supabaseClient.auth.getSession();
    if (!data?.session) {
      window.location.hash = '#/login';
      return;
    }
    let profileStr = localStorage.getItem('profile');
    let profile = null;
    try {
      profile = (profileStr && profileStr !== 'undefined' && profileStr !== 'null') ? JSON.parse(profileStr) : null;
    } catch (e) { profile = null; }
    if (!profile || !profile.blood_group) {
      try {
        const profileData = await api.get('/users/me');
        profile = profileData;
        localStorage.setItem('profile', JSON.stringify(profile));
      } catch (err) {
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
    <div class="page-container" style="text-align:center;padding-top:5rem;">
      <div class="empty-icon">🔍</div>
      <h1>404</h1>
      <p>পেজটি পাওয়া যায়নি।</p>
      <a href="#/" class="btn btn-primary" style="margin-top:1.5rem;">হোমে ফিরুন</a>
    </div>
  `;
}

const en2bn = (num) => String(num).replace(/[0-9]/g, w => ({
  0:'০',1:'১',2:'২',3:'৩',4:'৪',5:'৫',6:'৬',7:'৭',8:'৮',9:'৯'
}[w]));

async function renderLanding() {
  let stats = { total_users: 0, donations_this_month: 0, active_donors: 0 };
  try {
    const res = await api.get('/public/stats');
    if (res) {
      stats = {
        total_users: res.total_users || 0,
        donations_this_month: res.donations_this_month || 0,
        active_donors: res.active_donors || 0
      };
    }
  } catch (_) {}

  document.getElementById('app').innerHTML = `
    <div class="landing-wrapper dark-theme">

      <!-- HERO SECTION -->
      <section class="hero-dark">
        <div class="hero-dark-content">
          <div class="trust-indicator">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            ক্যাম্পাস থেকে সমাজের জন্য
          </div>
          <h1>তোমার এক ফোঁটা <span class="text-red">রক্ত</span><br/>কারো জীবনের <span class="text-red">নতুন সুযোগ</span></h1>
          <p>ক্যাম্পাস থেকে ক্যাম্পাসে, আমরা গড়ে তুলছি একটি মানবিক সমাজ।<br/>তুমি এগিয়ে আসো, জীবন বাঁচানোর এই মহৎ যাত্রায় শরিক হও।</p>
          <div class="hero-actions-dark">
            <a href="#/register" class="btn-red-glow" style="text-decoration:none; display:inline-flex; align-items:center; gap:0.5rem;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>
              রক্ত দান করুন
            </a>
            <a href="#/login" class="btn-glass-outline" style="text-decoration:none; display:inline-flex; align-items:center; gap:0.5rem;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              রক্তের প্রয়োজন
            </a>
          </div>
        </div>
        <div class="scroll-indicator">
          <div class="mouse-icon"><div class="wheel"></div></div>
          <span>নিচে স্ক্রোল করুন</span>
        </div>
      </section>

      <!-- IMPACT / STATS SECTION -->
      <section class="impact-dark">
        <div class="impact-glass-card">
          <div class="impact-stat">
            <div class="impact-icon">💧</div>
            <div class="impact-text">
              <h4>${en2bn(stats.total_users.toLocaleString())}+</h4>
              <p>মোট রক্তদাতা</p>
            </div>
          </div>
          <div class="impact-stat">
            <div class="impact-icon">❤️</div>
            <div class="impact-text">
              <h4>${en2bn(stats.active_donors.toLocaleString())}+</h4>
              <p>সফল রক্তদান</p>
            </div>
          </div>
          <div class="impact-stat">
            <div class="impact-icon">👥</div>
            <div class="impact-text">
              <h4>${en2bn(35)}+</h4>
              <p>বিশ্ববিদ্যালয় যুক্ত</p>
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

      <!-- FEATURES SECTION -->
      <section class="features-dark">
        <div class="features-grid">
          <div class="feature-card-dark">
            <div class="feature-icon-dark">🩸</div>
            <h3>রক্ত দান করুন</h3>
            <p>সহজেই ডোনার হিসেবে নিবন্ধিত হন এবং জীবন বাঁচান।</p>
          </div>
          <div class="feature-card-dark">
            <div class="feature-icon-dark">🔍</div>
            <h3>রক্ত খুঁজুন</h3>
            <p>ব্লাড গ্রুপ ও এলাকা দিয়ে কাছাকাছি ডোনার খুঁজুন।</p>
          </div>
          <div class="feature-card-dark">
            <div class="feature-icon-dark">🔒</div>
            <h3>সুরক্ষিত প্রোফাইল</h3>
            <p>আপনার তথ্য সুরক্ষিত। প্রয়োজনে নাম গোপন রাখতে পারবেন।</p>
          </div>
          <div class="feature-card-dark">
            <div class="feature-icon-dark">🤝</div>
            <h3>বিশ্বস্ত নেটওয়ার্ক</h3>
            <p>হাজারো বিশ্ববিদ্যালয় শিক্ষার্থীর একটি মানবিক আন্দোলন।</p>
          </div>
        </div>
      </section>

      <!-- QUOTE SECTION -->
      <section class="quote-dark">
        <div class="quote-content">
          <div class="quote-icon">❝</div>
          <p class="quote-text">তুমি না হয় একদিনের জন্য কারো হিরো হও,<br/>তোমার রক্তে বাঁচতে পারে একটি সম্পূর্ণ জীবন। ❤️</p>
        </div>
      </section>

      <!-- FOOTER -->
      <footer class="footer-dark">
        <p>
          &copy; ${new Date().getFullYear()} রক্তসেতু — ক্যাম্পাস থেকে মানবতার পথে।<br/>
          <span style="font-size: 0.85rem; color: var(--muted);">
            Built with ❤️ by
            <a href="https://jisun.online" target="_blank" rel="noopener" style="color:#ff4d4d; text-decoration:none; font-weight:700;">Jisun</a>
            &nbsp;•&nbsp; Student, Tongi Govt. College
          </span>
        </p>
      </footer>

    </div>
  `;
}

async function updateNav() {
  const navLinks = document.getElementById('nav-links');
  const bnavInner = document.getElementById('bnav-inner');
  const bottomNav = document.getElementById('bottom-nav');
  const { data } = await supabaseClient.auth.getSession();
  const profileStr = localStorage.getItem('profile');
  let profile = {};
  try { profile = (profileStr && profileStr !== 'undefined' && profileStr !== 'null') ? JSON.parse(profileStr) : {}; } catch(e){}
  profile = profile || {};
  const hash = window.location.hash.slice(1) || '/';

  const isDark = hash === '/';
  if (isDark) {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }

  if (data?.session) {
    // Desktop top navbar
    navLinks.innerHTML = `
      <a href="#/dashboard" class="nav-link ${hash === '/dashboard' ? 'active' : ''}">ড্যাশবোর্ড</a>
      <a href="#/search" class="nav-link ${hash === '/search' ? 'active' : ''}">রক্ত খুঁজুন</a>
      <a href="#/profile" class="nav-link ${hash === '/profile' ? 'active' : ''}">প্রোফাইল</a>
      ${profile.is_admin ? `<a href="#/admin" class="nav-link ${hash === '/admin' ? 'active' : ''}">এডমিন</a>` : ''}
      <div class="nav-user-chip">
        ${bloodBadge(profile.blood_group)}
        <span class="nav-user-name">${profile.name || 'User'}</span>
      </div>
      <button class="btn-logout" onclick="handleLogout()">লগআউট</button>
    `;

    // Mobile bottom nav
    if (bnavInner) {
      bnavInner.innerHTML = `
        <a href="#/dashboard" class="bnav-item ${hash === '/dashboard' ? 'active' : ''}">
          <span class="bnav-icon">🏠</span><span>হোম</span>
        </a>
        <a href="#/search" class="bnav-item ${hash === '/search' ? 'active' : ''}">
          <span class="bnav-icon">🔍</span><span>খুঁজুন</span>
        </a>
        <a href="#/profile" class="bnav-item ${hash === '/profile' ? 'active' : ''}">
          <span class="bnav-icon">👤</span><span>প্রোফাইল</span>
        </a>
        ${profile.is_admin ? `<a href="#/admin" class="bnav-item ${hash === '/admin' ? 'active' : ''}">
          <span class="bnav-icon">⚙️</span><span>এডমিন</span>
        </a>` : ''}
        <button class="bnav-item" onclick="handleLogout()">
          <span class="bnav-icon">🚪</span><span>বের</span>
        </button>
      `;
    }
    if (bottomNav) bottomNav.removeAttribute('style');

  } else {
    // Logged-out top navbar
    navLinks.innerHTML = `
      <a href="#/" class="nav-link ${hash === '/' ? 'active' : ''}">হোম</a>
      <a href="#/register" class="nav-link">ডোনার হন</a>
      <a href="#/login" class="nav-link">লগইন</a>
      <a href="#/register" class="${isDark ? 'btn-red-glow' : 'btn btn-primary'}" style="text-decoration:none; padding: 0.5rem 1.4rem; font-weight:700;">সাইন আপ</a>
    `;

    if (hash === '/') {
      if (bottomNav) bottomNav.style.display = 'none';
    } else {
      if (bnavInner) {
        bnavInner.innerHTML = `
          <a href="#/" class="bnav-item"><span class="bnav-icon">🏠</span><span>হোম</span></a>
          <a href="#/login" class="bnav-item ${hash === '/login' ? 'active' : ''}"><span class="bnav-icon">🔑</span><span>লগইন</span></a>
          <a href="#/register" class="bnav-item ${hash === '/register' ? 'active' : ''}"><span class="bnav-icon">✍️</span><span>সাইন আপ</span></a>
        `;
      }
      if (bottomNav) bottomNav.removeAttribute('style');
    }
  }
}

async function handleLogout() {
  showSpinner();
  try {
    await supabaseClient.auth.signOut();
    localStorage.removeItem('profile');
    showToast('লগআউট সফল হয়েছে');
    window.location.hash = '#/login';
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    hideSpinner();
  }
}

// ── Hamburger Toggle ─────────────────────────────────────────
document.getElementById('hamburger-btn')?.addEventListener('click', () => {
  document.getElementById('nav-links').classList.toggle('open');
});
document.getElementById('nav-links')?.addEventListener('click', (e) => {
  if (e.target.tagName === 'A' || e.target.closest('a')) {
    document.getElementById('nav-links').classList.remove('open');
  }
});

// ── Auth State Change (Google OAuth redirect) ────────────────
supabaseClient.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session) {
    if (window.location.hash.includes('access_token=')) {
      showSpinner();
      try {
        let profile = null;
        try {
          const profileData = await api.get('/users/me');
          profile = profileData;
          localStorage.setItem('profile', JSON.stringify(profile));
        } catch (_) {}
        if (!profile || !profile.blood_group) {
          window.location.hash = '#/complete-profile';
        } else {
          window.location.hash = '#/dashboard';
        }
      } finally {
        hideSpinner();
      }
    }
  } else if (event === 'SIGNED_OUT') {
    localStorage.removeItem('profile');
    window.location.hash = '#/login';
  }
});

// ── Init ─────────────────────────────────────────────────────
window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);
