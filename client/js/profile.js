// ============================================================
// Profile Page — Edit own profile
// ============================================================

async function renderProfile() {
  const app = document.getElementById('app');
  app.innerHTML = '<div class="profile-page"><div class="spinner" style="padding:3rem;text-align:center"><div class="spinner-drop"></div><span>Loading…</span></div></div>';

  try {
    const [profile, locations] = await Promise.all([
      api.get('/users/me'),
      api.get('/locations'),
    ]);

    app.innerHTML = `
      <div class="profile-page">
        <h1>My Profile</h1>
        <div class="card">
          <form id="profile-form">
            <div class="form-group">
              <label class="form-label" for="prof-name">Full Name</label>
              <input class="form-input" type="text" id="prof-name" value="${profile.name || ''}" required />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="prof-blood">Blood Group</label>
                <select class="form-select" id="prof-blood">
                  ${['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g =>
                    `<option${g === profile.blood_group ? ' selected' : ''}>${g}</option>`
                  ).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="prof-location">Location</label>
                <select class="form-select" id="prof-location">
                  ${locations.map(l =>
                    `<option value="${l.id}"${l.id === profile.location_id ? ' selected' : ''}>${l.name} (${l.zone})</option>`
                  ).join('')}
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="prof-contact">Contact Number</label>
                <input class="form-input" type="tel" id="prof-contact" value="${profile.contact_number || ''}" required />
              </div>
              <div class="form-group">
                <label class="form-label" for="prof-dept">Department</label>
                <input class="form-input" type="text" id="prof-dept" value="${profile.department || ''}" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">
                <input type="checkbox" id="prof-available" ${profile.is_available ? 'checked' : ''} />
                Available for donation
              </label>
              <p class="form-hint">Uncheck if you're temporarily unavailable</p>
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%">Save Changes</button>
          </form>
        </div>
      </div>
    `;

    document.getElementById('profile-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      showSpinner();
      try {
        const updated = await api.put('/users/me', {
          name: document.getElementById('prof-name').value.trim(),
          blood_group: document.getElementById('prof-blood').value,
          location_id: document.getElementById('prof-location').value,
          contact_number: document.getElementById('prof-contact').value.trim(),
          department: document.getElementById('prof-dept').value.trim(),
          is_available: document.getElementById('prof-available').checked,
        });
        localStorage.setItem('profile', JSON.stringify(updated));
        showToast('Profile updated!');
        updateNav();
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        hideSpinner();
      }
    });
  } catch (err) {
    app.innerHTML = `<div class="profile-page"><div class="empty-state"><div class="empty-icon">⚠️</div><p>${err.message}</p></div></div>`;
  }
}
