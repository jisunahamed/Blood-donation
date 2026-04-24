// ============================================================
// Auth Pages — Login + Register
// ============================================================

async function renderLogin() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="auth-page">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="auth-card">
        <h2>ফিরে আসার জন্য ধন্যবাদ</h2>
        <p class="auth-subtitle">আপনার একাউন্টে লগইন করুন</p>

        <button class="btn btn-secondary glass-btn" style="width:100%; display: flex; align-items: center; justify-content: center; gap: 0.8rem; margin-bottom: 1.5rem;" onclick="handleGoogleLogin()">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" height="18" alt="Google">
          গুগল দিয়ে লগইন
        </button>

        <div style="margin: 1.5rem 0; text-align: center; color: var(--muted); font-size: 0.85rem; position: relative;">
          <span style="background: #fff; padding: 0 0.5rem; position: relative; z-index: 1;">অথবা ইমেইল দিয়ে</span>
          <div style="position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: var(--border);"></div>
        </div>

        <form id="login-form">
          <div class="form-group" style="text-align: left;">
            <label class="form-label">ইমেইল</label>
            <input class="form-input" type="email" id="login-email" placeholder="example@email.com" required />
          </div>
          <div class="form-group" style="text-align: left;">
            <label class="form-label">পাসওয়ার্ড</label>
            <input class="form-input" type="password" id="login-password" placeholder="••••••••" required />
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%; margin-top: 1rem;">লগইন করুন</button>
        </form>
        <p class="auth-link">একাউন্ট নেই? <a href="#/register">নতুন একাউন্ট খুলুন</a></p>
      </div>
    </div>
  `;

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) return showToast('Please fill all fields', 'error');

    showSpinner();
    try {
      const data = await api.post('/auth/login', { email, password });
      if (data.session) {
        await supabaseClient.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }
      localStorage.setItem('profile', JSON.stringify(data.profile));
      showToast('Welcome back!');
      window.location.hash = '#/dashboard';
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      hideSpinner();
    }
  });
}

async function renderRegister() {
  let locations = [];
  try { locations = await api.get('/locations'); } catch (_) {}

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="auth-page">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="auth-card" style="max-width: 500px;">
        <h2>নতুন একাউন্ট</h2>
        <p class="auth-subtitle">জীবন বাঁচাতে আজই আমাদের সাথে যুক্ত হোন</p>

        <button class="btn btn-secondary glass-btn" style="width:100%; display: flex; align-items: center; justify-content: center; gap: 0.8rem; margin-bottom: 1.5rem;" onclick="handleGoogleLogin()">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" height="18" alt="Google">
          গুগল দিয়ে সাইন আপ
        </button>

        <div style="margin: 1.5rem 0; text-align: center; color: var(--muted); font-size: 0.85rem; position: relative;">
          <span style="background: #fff; padding: 0 0.5rem; position: relative; z-index: 1;">অথবা ফর্ম পূরণ করুন</span>
          <div style="position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: var(--border);"></div>
        </div>

        <form id="register-form">
          <div class="form-group" style="text-align: left;">
            <label class="form-label">পুরো নাম *</label>
            <input class="form-input" type="text" id="reg-name" placeholder="আপনার নাম লিখুন" required />
          </div>
          
          <div class="form-group" style="text-align: left;">
            <label class="form-label">ইমেইল *</label>
            <input class="form-input" type="email" id="reg-email" placeholder="example@email.com" required />
          </div>

          <div class="form-row-mobile">
            <div class="form-group" style="text-align: left;">
              <label class="form-label">মোবাইল নম্বর *</label>
              <input class="form-input" type="tel" id="reg-contact" placeholder="01XXXXXXXXX" required />
            </div>
            <div class="form-group" style="text-align: left;">
              <label class="form-label">রক্তের গ্রুপ *</label>
              <select class="form-select" id="reg-blood" required>
                <option value="">নির্বাচন করুন</option>
                <option>A+</option><option>A-</option>
                <option>B+</option><option>B-</option>
                <option>AB+</option><option>AB-</option>
                <option>O+</option><option>O-</option>
              </select>
            </div>
          </div>

          <div class="form-group" style="text-align: left;">
            <label class="form-label">লোকেশন *</label>
            <select class="form-select" id="reg-location" required>
              <option value="">নির্বাচন করুন</option>
              ${locations.map(l => `<option value="${l.id}">${l.name} (${l.zone})</option>`).join('')}
            </select>
          </div>

          <div class="form-row-mobile">
            <div class="form-group" style="text-align: left;">
              <label class="form-label">পাসওয়ার্ড *</label>
              <input class="form-input" type="password" id="reg-password" placeholder="কমপক্ষে ৬ অক্ষর" required />
            </div>
            <div class="form-group" style="text-align: left;">
              <label class="form-label">পাসওয়ার্ড নিশ্চিত করুন *</label>
              <input class="form-input" type="password" id="reg-confirm" placeholder="আবার লিখুন" required />
            </div>
          </div>

          <div class="form-group" style="display: flex; align-items: center; gap: 0.6rem; margin: 1.2rem 0; text-align: left;">
            <input type="checkbox" id="reg-hide-name" style="width:18px;height:18px;cursor:pointer;" />
            <label for="reg-hide-name" style="margin:0;cursor:pointer;font-size:0.85rem;color:var(--muted);">আমার নাম গোপন রাখুন (অ্যানোনিমাস প্রোফাইল)</label>
          </div>
          
          <button type="submit" class="btn btn-primary" style="width:100%">একাউন্ট খুলুন</button>
        </form>
        <p class="auth-link">ইতিমধ্যে একাউন্ট আছে? <a href="#/login">লগইন করুন</a></p>
      </div>
    </div>
  `;

  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;
    const blood_group = document.getElementById('reg-blood').value;
    const location_id = document.getElementById('reg-location').value;
    const contact_number = document.getElementById('reg-contact').value.trim();
    const department = document.getElementById('reg-dept').value.trim();
    const hide_name = document.getElementById('reg-hide-name').checked;

    if (password !== confirm) return showToast('Passwords do not match', 'error');
    if (password.length < 6) return showToast('Password must be at least 6 characters', 'error');

    showSpinner();
    try {
      const data = await api.post('/auth/register', {
        email, password, name, blood_group, location_id, contact_number, department, hide_name
      });
      if (data.session) {
        await supabaseClient.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }
      localStorage.setItem('profile', JSON.stringify(data.profile));
      showToast('Account created successfully!');
      window.location.hash = '#/dashboard';
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      hideSpinner();
    }
  });
}

async function handleGoogleLogin() {
  const currentUrl = window.location.origin + window.location.pathname;
  try {
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: currentUrl
      }
    });
    if (error) throw error;
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function renderCompleteProfile() {
  let locations = [];
  try { locations = await api.get('/locations'); } catch (_) {}

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="auth-page">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="auth-card">
        <h2>প্রোফাইল সম্পন্ন করুন</h2>
        <p class="auth-subtitle">আমাদের নেটওয়ার্কে যোগ দিতে কিছু তথ্য প্রয়োজন</p>
        <form id="complete-profile-form">
          <div class="form-row-mobile">
            <div class="form-group" style="text-align: left;">
              <label class="form-label">রক্তের গ্রুপ *</label>
              <select class="form-select" id="cp-blood" required>
                <option value="">নির্বাচন করুন</option>
                <option>A+</option><option>A-</option>
                <option>B+</option><option>B-</option>
                <option>AB+</option><option>AB-</option>
                <option>O+</option><option>O-</option>
              </select>
            </div>
            <div class="form-group" style="text-align: left;">
              <label class="form-label">লোকেশন *</label>
              <select class="form-select" id="cp-location" required>
                <option value="">নির্বাচন করুন</option>
                ${locations.map(l => `<option value="${l.id}">${l.name} (${l.zone})</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-group" style="text-align: left;">
            <label class="form-label">মোবাইল নম্বর *</label>
            <input class="form-input" type="tel" id="cp-contact" placeholder="01XXXXXXXXX" required />
          </div>
          <div class="form-group" style="text-align: left;">
            <label class="form-label">ডিপার্টমেন্ট <small>(ঐচ্ছিক)</small></label>
            <input class="form-input" type="text" id="comp-dept" placeholder="যেমন: CSE, BBA" />
          </div>
          <div class="form-group" style="display: flex; align-items: center; gap: 0.6rem; margin: 1.2rem 0; text-align: left;">
            <input type="checkbox" id="comp-hide-name" style="width:18px;height:18px;cursor:pointer;" />
            <label for="comp-hide-name" style="margin:0;cursor:pointer;font-size:0.85rem;color:var(--muted);">আমার নাম গোপন রাখুন (অ্যানোনিমাস প্রোফাইল)</label>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%">প্রোফাইল সেভ করুন</button>
        </form>
      </div>
    </div>
  `;

  document.getElementById('complete-profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const blood_group = document.getElementById('cp-blood').value;
    const location_id = document.getElementById('cp-location').value;
    const contact_number = document.getElementById('cp-contact').value.trim();
    const department = document.getElementById('comp-dept').value.trim();
    const hide_name = document.getElementById('comp-hide-name').checked;

    showSpinner();
    try {
      const data = await api.post('/auth/complete-profile', {
        blood_group, location_id, contact_number, department, hide_name
      });
      localStorage.setItem('profile', JSON.stringify(data.profile));
      showToast('Profile completed successfully!');
      window.location.hash = '#/dashboard';
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      hideSpinner();
    }
  });
}
