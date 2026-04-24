// ============================================================
// Donor Search Page — Bengali UI, Mobile First
// ============================================================

const _donorState = { revealedContacts: {} };

async function renderDonors() {
  let locations = [];
  try { locations = await api.get('/locations'); } catch (_) {}

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="page-container">
      <div class="section-header">
        <h1 class="section-title" style="font-size: 1.8rem;">🔍 রক্তদাতা খুঁজুন</h1>
      </div>

      <div class="filter-card">
        <div class="filter-row">
          <div class="form-group" style="margin-bottom:0; flex:1;">
            <label class="form-label" for="filter-blood">রক্তের গ্রুপ</label>
            <select class="form-select" id="filter-blood">
              <option value="">সব গ্রুপ</option>
              <option>A+</option><option>A-</option>
              <option>B+</option><option>B-</option>
              <option>AB+</option><option>AB-</option>
              <option>O+</option><option>O-</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom:0; flex:1;">
            <label class="form-label" for="filter-location">এলাকা</label>
            <select class="form-select" id="filter-location">
              <option value="">সব এলাকা</option>
              ${locations.map(l => `<option value="${l.id}">${l.name}</option>`).join('')}
            </select>
          </div>
        </div>
        <button class="btn btn-primary search-btn" id="search-btn">🔍 খুঁজুন</button>
      </div>

      <div id="donor-results" class="donor-list">
        <div class="empty-state">
          <div class="empty-icon">🩸</div>
          <p>রক্তের গ্রুপ ও এলাকা বেছে খুঁজুন।</p>
        </div>
      </div>
    </div>
  `;

  document.getElementById('search-btn').addEventListener('click', searchDonors);
}

async function searchDonors() {
  const blood = document.getElementById('filter-blood').value;
  const location = document.getElementById('filter-location').value;
  const container = document.getElementById('donor-results');

  let params = [];
  if (blood) params.push(`blood_group=${encodeURIComponent(blood)}`);
  if (location) params.push(`location_id=${location}`);
  const qs = params.length ? '?' + params.join('&') : '';

  container.innerHTML = `<div class="empty-state"><div class="spinner-drop"></div><span>খোঁজা হচ্ছে...</span></div>`;

  try {
    const donors = await api.get(`/donors/search${qs}`);

    if (donors.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">😔</div><p>এই মুহূর্তে কোনো ডোনার পাওয়া যায়নি।</p></div>`;
      return;
    }

    container.innerHTML = donors.map(d => {
      const avatarColor = d.blood_group?.startsWith('AB') ? '#8E44AD'
        : d.blood_group?.startsWith('A') ? '#2980B9'
        : d.blood_group?.startsWith('B') ? '#27AE60' : '#C0392B';

      const initials = d.name.substring(0, 2).toUpperCase();
      const revealed = _donorState.revealedContacts[d.id];

      return `
        <div class="donor-item glass-card" data-donor-id="${d.id}">
          <div class="donor-row">
            <div class="donor-avatar-lg" style="background:${avatarColor}">${initials}</div>
            <div class="donor-details">
              <div class="donor-name-lg">${d.name}${d.department ? ` <small>(${d.department})</small>` : ''}</div>
              <div class="donor-meta">📍 ${d.location_name}</div>
              <div class="donor-badges">
                ${bloodBadge(d.blood_group)}
                ${availabilityBadge(d.is_available)}
              </div>
            </div>
          </div>
          ${revealed ? `
            <div class="contact-reveal">📞 ${revealed}</div>
            <button class="btn btn-success btn-sm" style="width:100%;margin-top:0.5rem;" onclick="openDonationModal('${d.id}')">✓ রক্ত পেয়েছি</button>
          ` : `
            <button class="btn btn-primary btn-sm" style="width:100%;margin-top:0.75rem;" onclick="copyContact('${d.id}')">📋 যোগাযোগ দেখুন</button>
          `}
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p>${err.message}</p></div>`;
  }
}

async function copyContact(donorId) {
  try {
    showSpinner();
    const data = await api.post(`/donors/${donorId}/contact`, {});
    _donorState.revealedContacts[donorId] = data.contact_number;
    try { await navigator.clipboard.writeText(data.contact_number); } catch (_) {}
    showToast('যোগাযোগ নম্বর দেখানো হচ্ছে!');
    searchDonors();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    hideSpinner();
  }
}

async function openDonationModal(donorId) {
  const overlay = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');
  content.innerHTML = `
    <h2 style="margin-bottom:1rem;">✅ রক্তদান নিশ্চিত করুন</h2>
    <p style="color:var(--muted); margin-bottom:2rem;">এই ডোনার কি সফলভাবে রক্ত দিয়েছে?</p>
    <div style="display:flex;gap:1rem;">
      <button class="btn btn-primary" style="flex:1" onclick="confirmDonation('${donorId}')">হ্যাঁ, নিশ্চিত</button>
      <button class="btn btn-secondary" style="flex:1" onclick="closeModal()">না, বাতিল</button>
    </div>
  `;
  overlay.classList.remove('hidden');
}

async function confirmDonation(donorId) {
  closeModal();
  showSpinner();
  try {
    await api.post(`/donors/${donorId}/donation`, {});
    showToast('রক্তদান নিশ্চিত হয়েছে!');
    renderDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    hideSpinner();
  }
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}
