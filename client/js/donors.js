// ============================================================
// Donor Search Page
// ============================================================

const _donorState = { revealedContacts: {} };

async function renderDonors() {
  let locations = [];
  try { locations = await api.get('/locations'); } catch (_) {}

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="search-page">
      <h1>🔍 Find Blood Donors</h1>
      <div class="filter-bar">
        <div class="form-group">
          <label class="form-label" for="filter-blood">Blood Group</label>
          <select class="form-select" id="filter-blood">
            <option value="">All Groups</option>
            <option>A+</option><option>A-</option>
            <option>B+</option><option>B-</option>
            <option>AB+</option><option>AB-</option>
            <option>O+</option><option>O-</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="filter-location">Location</label>
          <select class="form-select" id="filter-location">
            <option value="">All Locations</option>
            ${locations.map(l => `<option value="${l.id}">${l.name}</option>`).join('')}
          </select>
        </div>
        <button class="btn btn-primary" id="search-btn" style="margin-bottom:0;align-self:flex-end">Search</button>
      </div>
      <div id="donor-results" class="donor-grid">
        <div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🩸</div><p>Select filters and click Search to find donors.</p></div>
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

  container.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="spinner-drop"></div><span>Searching…</span></div>';

  try {
    const donors = await api.get(`/donors/search${qs}`);

    if (donors.length === 0) {
      container.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">😔</div><p>No available donors found matching your criteria.</p></div>';
      return;
    }

    container.innerHTML = donors.map(d => {
      const avatarColor = d.blood_group?.startsWith('A') ? '#2980B9'
        : d.blood_group?.startsWith('B') ? '#27AE60'
        : d.blood_group?.startsWith('AB') ? '#8E44AD' : '#C0392B';

      const initials = d.name.substring(0, 2).toUpperCase();
      const revealed = _donorState.revealedContacts[d.id];
      const deptDisplay = d.department ? `<span style="font-size: 0.8rem; color: var(--muted); margin-left: 0.5rem;">(${d.department})</span>` : '';

      return `
        <div class="card donor-card glass-card" data-donor-id="${d.id}">
          <div class="donor-info">
            <div class="donor-avatar" style="background:${avatarColor}">${initials}</div>
            <div>
              <div class="donor-name">${d.name} ${deptDisplay}</div>
              <div class="donor-location">📍 ${d.location_name}</div>
            </div>
          </div>
          <div class="flex gap-1 flex-wrap">
            ${bloodBadge(d.blood_group)}
            ${availabilityBadge(d.is_available)}
          </div>
          ${revealed ? `
            <div class="contact-reveal">📞 ${revealed}</div>
            <div class="donor-actions">
              <button class="btn btn-success btn-sm" onclick="openDonationModal('${d.id}')">✓ Mark as Donated</button>
            </div>
          ` : `
            <div class="donor-actions">
              <button class="btn btn-primary btn-sm" onclick="copyContact('${d.id}')">📋 Get Contact</button>
            </div>
          `}
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">⚠️</div><p>${err.message}</p></div>`;
    showToast(err.message, 'error');
  }
}

async function copyContact(targetId) {
  showSpinner();
  try {
    const data = await api.post('/interactions/copy', { target_id: targetId });
    _donorState.revealedContacts[targetId] = data.contact_number;
    showToast('Contact copied successfully!');
    searchDonors(); // Re-render to show contact
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    hideSpinner();
  }
}

function openDonationModal(donorId) {
  showModal(`
    <div class="modal-header">
      <h3>Confirm Blood Donation</h3>
      <button class="modal-close" onclick="hideModal()">×</button>
    </div>
    <p>Confirm that this donor donated blood to you?</p>
    <div class="form-group mt-2">
      <label class="form-label" for="donation-notes">Notes (optional)</label>
      <textarea class="form-input" id="donation-notes" rows="3" placeholder="Any notes about this donation…"></textarea>
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="hideModal()">Cancel</button>
      <button class="btn btn-success" onclick="confirmDonation('${donorId}')">Confirm Donation</button>
    </div>
  `);
}

async function confirmDonation(donorId) {
  const notes = document.getElementById('donation-notes')?.value || '';
  hideModal();
  showSpinner();
  try {
    await api.post('/donations/confirm', { donor_id: donorId, notes });
    delete _donorState.revealedContacts[donorId];
    showToast('Donation confirmed! Thank you!');
    if (window.location.hash === '#/dashboard') {
      renderDashboard();
    } else {
      searchDonors();
    }
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    hideSpinner();
  }
}
