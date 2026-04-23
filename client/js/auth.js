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
        <p class="auth-link">Don't have an account? <a href="#/register">Register here</a></p>
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
          <button type="submit" class="btn btn-primary" style="width:100%">Create Account</button>
        </form>
        <p class="auth-link">Already registered? <a href="#/login">Login here</a></p>
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

    if (password !== confirm) return showToast('Passwords do not match', 'error');
    if (password.length < 6) return showToast('Password must be at least 6 characters', 'error');

    showSpinner();
    try {
      const data = await api.post('/auth/register', {
        email, password, name, blood_group, location_id, contact_number, department,
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
