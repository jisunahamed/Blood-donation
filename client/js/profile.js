// ============================================================
// Profile Page — Bengali UI, Premium Design
// ============================================================

async function renderProfile() {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="page-container"><div class="page-loading"><div class="spinner-drop"></div><span>লোড হচ্ছে...</span></div></div>`;

  try {
    const [profile, locations] = await Promise.all([
      api.get('/users/me'),
      api.get('/locations'),
    ]);

    app.innerHTML = `
      <div class="page-container">
        <!-- Profile Header -->
        <div class="profile-header">
          <div class="profile-avatar-big">${(profile.name || 'U')[0].toUpperCase()}</div>
          <div class="profile-header-info">
            <h1 class="profile-heading">${profile.name || 'আপনার প্রোফাইল'}</h1>
            <div>${bloodBadge(profile.blood_group)}</div>
            <p class="profile-location">📍 ${profile.location_name || 'এলাকা অজানা'}</p>
          </div>
        </div>

        <!-- Edit Form -->
        <div class="section-card" style="margin-top: 1.5rem;">
          <h2 class="section-title" style="margin-bottom: 1.5rem;">✏️ তথ্য আপডেট করুন</h2>
          <form id="profile-form">
            <div class="form-group">
              <label class="form-label" for="prof-name">পুরো নাম</label>
              <input class="form-input" type="text" id="prof-name" value="${profile.name || ''}" required placeholder="আপনার নাম লিখুন" />
            </div>
            <div class="form-row-mobile">
              <div class="form-group">
                <label class="form-label" for="prof-blood">রক্তের গ্রুপ</label>
                <select class="form-select" id="prof-blood">
                  ${['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g =>
                    `<option${g === profile.blood_group ? ' selected' : ''}>${g}</option>`
                  ).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="prof-location">এলাকা</label>
                <select class="form-select" id="prof-location">
                  ${locations.map(l =>
                    `<option value="${l.id}"${l.id === profile.location_id ? ' selected' : ''}>${l.name} (${l.zone})</option>`
                  ).join('')}
                </select>
              </div>
            </div>
            <div class="form-row-mobile">
              <div class="form-group">
                <label class="form-label" for="prof-contact">মোবাইল নম্বর</label>
                <input class="form-input" type="tel" id="prof-contact" value="${profile.contact_number || ''}" required placeholder="01XXXXXXXXX" />
              </div>
              <div class="form-group">
                <label class="form-label" for="prof-dept">বিভাগ <small>(ঐচ্ছিক)</small></label>
                <input class="form-input" type="text" id="prof-dept" value="${profile.department || ''}" placeholder="যেমন: CSE, BBA" />
              </div>
            </div>

            <!-- Toggles -->
            <div class="toggle-group">
              <label class="toggle-item" for="prof-available">
                <div class="toggle-text">
                  <span class="toggle-title">রক্ত দিতে পারব</span>
                  <span class="toggle-desc">অফ করলে আপনাকে সার্চে দেখা যাবে না</span>
                </div>
                <div class="toggle-switch">
                  <input type="checkbox" id="prof-available" ${profile.is_available ? 'checked' : ''} />
                  <span class="toggle-slider"></span>
                </div>
              </label>

              <label class="toggle-item" for="prof-hide-name">
                <div class="toggle-text">
                  <span class="toggle-title">নাম গোপন রাখুন</span>
                  <span class="toggle-desc">চালু করলে প্রোফাইল Anonymous দেখাবে</span>
                </div>
                <div class="toggle-switch">
                  <input type="checkbox" id="prof-hide-name" ${profile.hide_name ? 'checked' : ''} />
                  <span class="toggle-slider"></span>
                </div>
              </label>
            </div>

            <button type="submit" class="btn btn-primary" style="width:100%; margin-top: 0.5rem;">✅ সংরক্ষণ করুন</button>
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
          hide_name: document.getElementById('prof-hide-name').checked,
        });
        localStorage.setItem('profile', JSON.stringify(updated));
        showToast('প্রোফাইল আপডেট হয়েছে!');
        updateNav();
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        hideSpinner();
      }
    });
  } catch (err) {
    app.innerHTML = `<div class="page-container"><div class="empty-state"><div class="empty-icon">⚠️</div><p>${err.message}</p></div></div>`;
  }
}
