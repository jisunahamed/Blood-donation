async function renderProfile() {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="page-container"><div class="spinner-drop"></div></div>`;

  try {
    const profile = await api.get('/users/me');
    localStorage.setItem('profile', JSON.stringify(profile));

    app.innerHTML = `
      <div class="page-container">
        <!-- PROFILE HEADER -->
        <div class="profile-header">
          <div class="profile-avatar-big">
            ${profile.blood_group ? profile.blood_group : '👤'}
          </div>
          <div class="profile-header-info">
            <h1 class="profile-heading">${profile.name}</h1>
            <p class="profile-location">📍 ${profile.location || 'অবস্থান যোগ করুন'}</p>
          </div>
        </div>

        <!-- QUICK STATUS TOGGLES -->
        <div class="section-header" style="margin: 2rem 0 1rem;">
          <h2 style="font-size: 1.1rem; font-weight: 800; font-family: 'Hind Siliguri', sans-serif; color: var(--muted);">অ্যাক্টিভ স্ট্যাটাস</h2>
        </div>
        
        <div class="toggle-group">
          <label class="toggle-item">
            <div class="toggle-text">
              <span class="toggle-title">রক্ত দানে আগ্রহী</span>
              <span class="toggle-desc">আপনার স্ট্যাটাস পাবলিকলি দেখা যাবে</span>
            </div>
            <div class="toggle-switch">
              <input type="checkbox" id="profile-availability" ${profile.is_available ? 'checked' : ''} onchange="updateProfileAvailability(this.checked)">
              <span class="toggle-slider"></span>
            </div>
          </label>
        </div>

        <!-- PERSONAL INFORMATION -->
        <div class="section-header" style="margin: 2rem 0 1rem;">
          <h2 style="font-size: 1.1rem; font-weight: 800; font-family: 'Hind Siliguri', sans-serif; color: var(--muted);">ব্যক্তিগত তথ্য</h2>
        </div>

        <form id="profile-form" onsubmit="handleProfileUpdate(event)" class="card shadow-sm" style="padding: 1.5rem; border-radius: var(--radius-lg); border: 1px solid var(--border);">
          <div class="form-group">
            <label class="form-label">পুরো নাম</label>
            <input type="text" name="name" class="form-control" value="${profile.name}" required>
          </div>

          <div class="form-row-mobile">
            <div class="form-group">
              <label class="form-label">রক্তের গ্রুপ</label>
              <select name="blood_group" class="form-control" required disabled>
                <option value="${profile.blood_group}">${profile.blood_group}</option>
              </select>
              <p class="form-hint">রক্তের গ্রুপ পরিবর্তন করা যাবে না।</p>
            </div>
            <div class="form-group">
              <label class="form-label">ফোন নম্বর</label>
              <input type="text" class="form-control" value="${profile.phone}" readonly>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">বর্তমান অবস্থান (উপজেলা/শহর)</label>
            <input type="text" name="location" class="form-control" value="${profile.location || ''}" placeholder="উদা: টঙ্গী, গাজীপুর" required>
          </div>

          <button type="submit" class="btn btn-primary btn-glow" style="width: 100%; margin-top: 1rem; padding: 0.8rem;">তথ্য আপডেট করুন</button>
        </form>

        <button onclick="handleLogout()" class="btn btn-outline" style="width: 100%; margin-top: 2rem; border-color: var(--border); color: var(--muted);">লগআউট করুন</button>
        
        <div style="height: 2rem;"></div> <!-- bottom spacing -->
      </div>
    `;
  } catch (err) {
    showToast('প্রোফাইল লোড করতে সমস্যা হয়েছে', 'error');
  }
}

async function updateProfileAvailability(isAvailable) {
  try {
    await api.put('/users/profile', { is_available: isAvailable });
    showToast(isAvailable ? 'আপনি এখন রক্ত দানে প্রস্তুত' : 'ডোনার স্ট্যাটাস বন্ধ করা হয়েছে');
    // Update local cache
    const profile = JSON.parse(localStorage.getItem('profile'));
    profile.is_available = isAvailable;
    localStorage.setItem('profile', JSON.stringify(profile));
  } catch (err) {
    showToast('স্ট্যাটাস আপডেট করা যায়নি', 'error');
  }
}

async function handleProfileUpdate(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());
  
  showSpinner();
  try {
    const updated = await api.put('/users/profile', data);
    localStorage.setItem('profile', JSON.stringify(updated));
    showToast('প্রোফাইল সফলভাবে আপডেট করা হয়েছে');
    renderProfile();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    hideSpinner();
  }
}
