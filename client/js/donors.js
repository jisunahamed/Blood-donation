async function renderDonors() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="page-container">
      <div class="section-header" style="margin-bottom: 1.5rem;">
        <h1 class="greeting-name">রক্তদাতা খুঁজুন 🔍</h1>
        <p class="greeting-sub">আপনার প্রয়োজনীয় ব্লাড গ্রুপ ও অবস্থান নির্বাচন করুন।</p>
      </div>

      <!-- FILTER BOX -->
      <div class="filter-card card shadow-sm" style="padding: 1.2rem; border-radius: var(--radius-lg); margin-bottom: 2rem; border: 1px solid var(--border);">
        <div class="filter-row">
          <div class="form-group" style="flex: 1; min-width: 120px;">
            <label class="form-label" style="font-size: 0.8rem;">ব্লাড গ্রুপ</label>
            <select id="filter-blood" class="form-control">
              <option value="">সবগুলো</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>
          </div>
          <div class="form-group" style="flex: 2; min-width: 180px;">
            <label class="form-label" style="font-size: 0.8rem;">অবস্থান (উপজেলা/শহর)</label>
            <input type="text" id="filter-location" class="form-control" placeholder="উদা: টঙ্গী">
          </div>
        </div>
        <button onclick="searchDonors()" class="btn btn-primary btn-glow search-btn" style="width: 100%; margin-top: 0.5rem; padding: 0.8rem;">সার্চ করুন</button>
      </div>

      <div id="donor-results" class="donor-list">
        <div class="empty-state">
          <div class="empty-icon">🔎</div>
          <p>ডোনার খুঁজতে উপরের তথ্যগুলো পূরণ করে সার্চ করুন।</p>
        </div>
      </div>
      
      <div style="height: 3rem;"></div> <!-- Spacing for bottom nav -->
    </div>
  `;
}

async function searchDonors() {
  const blood = document.getElementById('filter-blood').value;
  const location = document.getElementById('filter-location').value;
  const results = document.getElementById('donor-results');
  
  results.innerHTML = `<div class="spinner-drop" style="margin: 2rem auto;"></div>`;

  try {
    const donors = await api.get(`/donors?blood_group=${encodeURIComponent(blood)}&location=${encodeURIComponent(location)}`);
    
    if (donors.length === 0) {
      results.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🙁</div>
          <p>দুঃখিত! এই গ্রুপ বা অবস্থানে কোনো ডোনার পাওয়া যায়নি।</p>
        </div>
      `;
      return;
    }

    results.innerHTML = donors.map(donor => `
      <div class="donor-item card shadow-sm" style="margin-bottom: 1rem; padding: 1.2rem; border-radius: var(--radius-lg); border: 1px solid var(--border);">
        <div class="donor-row" style="display: flex; gap: 1rem; align-items: center;">
          <div class="req-blood-badge" style="flex-shrink: 0;">${donor.blood_group}</div>
          <div class="donor-details" style="flex: 1;">
            <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--dark); margin-bottom: 0.2rem;">${donor.name}</h3>
            <p style="font-size: 0.85rem; color: var(--muted); margin: 0;">📍 ${donor.location || 'N/A'}</p>
          </div>
          <div class="donor-status-badge">
             <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #28a745; margin-right: 4px;"></span>
             <span style="font-size: 0.75rem; font-weight: 700; color: #28a745;">অ্যাক্টিভ</span>
          </div>
        </div>
        
        <div class="donor-actions" style="margin-top: 1.2rem; display: flex; gap: 0.8rem;">
          <a href="tel:${donor.phone}" class="btn btn-primary" style="flex: 1; text-align: center; font-size: 0.85rem; padding: 0.6rem;">কল করুন</a>
          <button onclick="revealContact('${donor.id}', this)" class="btn btn-outline" style="flex: 1; font-size: 0.85rem; padding: 0.6rem;">নম্বর দেখুন</button>
        </div>
        <div id="contact-${donor.id}" class="contact-reveal" style="display: none; margin-top: 1rem; background: var(--red-pale); color: var(--red-solid); padding: 0.8rem; border-radius: var(--radius-md); text-align: center; font-weight: 800; font-size: 1.1rem;">
          ${donor.phone}
        </div>
      </div>
    `).join('');
  } catch (err) {
    showToast('সার্চ করতে সমস্যা হয়েছে', 'error');
  }
}

function revealContact(id, btn) {
  const el = document.getElementById(`contact-${id}`);
  if (el.style.display === 'none') {
    el.style.display = 'block';
    btn.innerText = 'লুকিয়ে রাখুন';
  } else {
    el.style.display = 'none';
    btn.innerText = 'নম্বর দেখুন';
  }
}
