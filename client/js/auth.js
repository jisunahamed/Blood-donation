// ============================================================
// Auth Pages — Login + Register
// ============================================================

async function renderLogin() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="auth-page">
      <div class="blob blob-1"></div>
      <div class="blob blob-2" style="bottom: 0; left: 0;"></div>
      <div class="auth-card glass-card">
        <h2>Welcome Back</h2>
        <p class="auth-subtitle">Sign in to find donors and save lives</p>
        <form id="login-form">
          <div class="form-group">
            <label class="form-label" for="login-email">Email</label>
            <input class="form-input" type="email" id="login-email" placeholder="you@example.com" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="login-password">Password</label>
            <input class="form-input" type="password" id="login-password" placeholder="••••••••" required />
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%">Sign In</button>
        </form>
        <div style="margin: 1rem 0; text-align: center; color: var(--muted); font-size: 0.9rem;">OR</div>
        <button class="btn btn-secondary glass-btn" style="width:100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem;" onclick="handleGoogleLogin()">
          <svg style="width:18px;height:18px" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.36,22 12.22,22C17.74,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1V11.1Z" /></svg>
          Continue with Google
        </button>
        <p class="auth-link mt-2">Don't have an account? <a href="#/register">Register here</a></p>
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
      <div class="blob blob-2" style="bottom: 0; left: 0;"></div>
      <div class="auth-card glass-card" style="max-width: 500px;">
        <h2>Create Account</h2>
        <p class="auth-subtitle">Join the community of life-savers</p>
        <form id="register-form">
          <div class="form-group">
            <label class="form-label" for="reg-name">Full Name *</label>
            <input class="form-input" type="text" id="reg-name" placeholder="Your full name" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="reg-email">Email *</label>
              <input class="form-input" type="email" id="reg-email" placeholder="you@example.com" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-contact">Contact Number *</label>
              <input class="form-input" type="tel" id="reg-contact" placeholder="01XXXXXXXXX" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="reg-password">Password *</label>
              <input class="form-input" type="password" id="reg-password" placeholder="Min. 6 characters" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-confirm">Confirm Password *</label>
              <input class="form-input" type="password" id="reg-confirm" placeholder="Re-enter password" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="reg-blood">Blood Group *</label>
              <select class="form-select" id="reg-blood" required>
                <option value="">Select</option>
                <option>A+</option><option>A-</option>
                <option>B+</option><option>B-</option>
                <option>AB+</option><option>AB-</option>
                <option>O+</option><option>O-</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-location">Location *</label>
              <select class="form-select" id="reg-location" required>
                <option value="">Select</option>
                ${locations.map(l => `<option value="${l.id}">${l.name} (${l.zone})</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="reg-dept">Department <small>(optional)</small></label>
            <input class="form-input" type="text" id="reg-dept" placeholder="e.g. CSE, MBA" />
          </div>
          <div class="form-group" style="display: flex; align-items: center; gap: 0.5rem; margin-top: 1rem;">
            <input type="checkbox" id="reg-hide-name" style="width:16px;height:16px;" />
            <label for="reg-hide-name" style="margin:0;cursor:pointer;">Hide my name (Make profile anonymous)</label>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%">Create Account</button>
        </form>
        <div style="margin: 1rem 0; text-align: center; color: var(--muted); font-size: 0.9rem;">OR</div>
        <button class="btn btn-secondary glass-btn" style="width:100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem;" onclick="handleGoogleLogin()">
          <svg style="width:18px;height:18px" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.36,22 12.22,22C17.74,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1V11.1Z" /></svg>
          Continue with Google
        </button>
        <p class="auth-link mt-2">Already registered? <a href="#/login">Login here</a></p>
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
      <div class="blob blob-2" style="bottom: 0; left: 0;"></div>
      <div class="auth-card glass-card">
        <h2>Complete Profile</h2>
        <p class="auth-subtitle">Just a few more details to join the network.</p>
        <form id="complete-profile-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="cp-blood">Blood Group *</label>
              <select class="form-select" id="cp-blood" required>
                <option value="">Select</option>
                <option>A+</option><option>A-</option>
                <option>B+</option><option>B-</option>
                <option>AB+</option><option>AB-</option>
                <option>O+</option><option>O-</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="cp-location">Location *</label>
              <select class="form-select" id="cp-location" required>
                <option value="">Select</option>
                ${locations.map(l => `<option value="${l.id}">${l.name} (${l.zone})</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="cp-contact">Contact Number *</label>
            <input class="form-input" type="tel" id="cp-contact" placeholder="e.g. 01XXXXXXXXX" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="comp-dept">Department <small>(optional)</small></label>
            <input class="form-input" type="text" id="comp-dept" placeholder="e.g. CSE, BBA" />
          </div>
          <div class="form-group" style="display: flex; align-items: center; gap: 0.5rem; margin-top: 1rem;">
            <input type="checkbox" id="comp-hide-name" style="width:16px;height:16px;" />
            <label for="comp-hide-name" style="margin:0;cursor:pointer;">Hide my name (Make profile anonymous)</label>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%">Save Profile</button>
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
