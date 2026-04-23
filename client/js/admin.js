// ============================================================
// Admin Panel — All 7 Tabs
// ============================================================

let _adminTab = 'dashboard';

async function renderAdmin() {
  const profile = JSON.parse(localStorage.getItem('profile') || '{}');
  if (!profile.is_admin) {
    showToast('Admin access required', 'error');
    window.location.hash = '#/dashboard';
    return;
  }

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="admin-layout">
      <aside class="admin-sidebar">
        <h3>Admin Panel</h3>
        <nav class="sidebar-nav">
          <a href="#" data-tab="dashboard" class="${_adminTab === 'dashboard' ? 'active' : ''}">📊 Dashboard</a>
          <a href="#" data-tab="users" class="${_adminTab === 'users' ? 'active' : ''}">👥 Users</a>
          <a href="#" data-tab="donations" class="${_adminTab === 'donations' ? 'active' : ''}">🩸 Donations</a>
          <a href="#" data-tab="interactions" class="${_adminTab === 'interactions' ? 'active' : ''}">🔗 Interactions</a>
          <a href="#" data-tab="activity" class="${_adminTab === 'activity' ? 'active' : ''}">📜 Activity</a>
          <a href="#" data-tab="locations" class="${_adminTab === 'locations' ? 'active' : ''}">📍 Locations</a>
          <a href="#" data-tab="add-admin" class="${_adminTab === 'add-admin' ? 'active' : ''}">👑 Add Admin</a>
        </nav>
      </aside>
      <div class="admin-content" id="admin-tab-content"></div>
    </div>
  `;

  document.querySelectorAll('.sidebar-nav a').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      _adminTab = a.dataset.tab;
      document.querySelectorAll('.sidebar-nav a').forEach(x => x.classList.remove('active'));
      a.classList.add('active');
      loadAdminTab(_adminTab);
    });
  });

  loadAdminTab(_adminTab);
}

async function loadAdminTab(tab) {
  const el = document.getElementById('admin-tab-content');
  el.innerHTML = '<div style="padding:2rem;text-align:center"><div class="spinner-drop" style="margin:0 auto"></div></div>';

  try {
    switch (tab) {
      case 'dashboard': await adminDashboard(el); break;
      case 'users': await adminUsers(el); break;
      case 'donations': await adminDonations(el); break;
      case 'interactions': await adminInteractions(el); break;
      case 'activity': await adminActivity(el); break;
      case 'locations': await adminLocations(el); break;
      case 'add-admin': await adminAddAdmin(el); break;
    }
  } catch (err) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p>${err.message}</p></div>`;
  }
}

// ── Dashboard Tab ───────────────────────────────────────────
async function adminDashboard(el) {
  const stats = await api.get('/admin/stats');
  const usersData = await api.get('/admin/users?page=1&limit=10');
  const donData = await api.get('/admin/donations?page=1');

  el.innerHTML = `
    <h2>Admin Dashboard</h2>
    <div class="dashboard-stats">
      <div class="card stat-card"><div class="stat-icon" style="background:var(--info-light);color:var(--info)">👥</div><div class="stat-value">${stats.total_users}</div><div class="stat-label">Total Users</div></div>
      <div class="card stat-card"><div class="stat-icon" style="background:var(--success-light);color:var(--success)">✓</div><div class="stat-value">${stats.active_donors}</div><div class="stat-label">Active Donors</div></div>
      <div class="card stat-card"><div class="stat-icon" style="background:var(--red-pale);color:var(--red)">🩸</div><div class="stat-value">${stats.total_donations}</div><div class="stat-label">Total Donations</div></div>
      <div class="card stat-card"><div class="stat-icon" style="background:var(--warning-light);color:var(--warning)">📅</div><div class="stat-value">${stats.donations_this_month}</div><div class="stat-label">This Month</div></div>
    </div>
    <div class="grid-2 mt-2">
      <div class="card">
        <div class="card-header"><h3 class="card-title">Recent Users</h3></div>
        ${usersData.users.length ? `<div class="table-wrap"><table class="table table-striped"><thead><tr><th>Name</th><th>Blood</th><th>Joined</th></tr></thead>
          <tbody>${usersData.users.map(u => `<tr><td>${u.name}</td><td>${bloodBadge(u.blood_group)}</td><td>${formatDate(u.created_at)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="text-muted">No users yet.</p>'}
      </div>
      <div class="card">
        <div class="card-header"><h3 class="card-title">Recent Donations</h3></div>
        ${donData.donations.length ? `<div class="table-wrap"><table class="table table-striped"><thead><tr><th>Donor</th><th>Recipient</th><th>Date</th></tr></thead>
          <tbody>${donData.donations.map(d => `<tr><td>${d.donor?.name || '—'}</td><td>${d.recipient?.name || '—'}</td><td>${formatDate(d.donation_date)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="text-muted">No donations yet.</p>'}
      </div>
    </div>
  `;
}

// ── Users Tab ───────────────────────────────────────────────
let _usersPage = 1;
async function adminUsers(el, page = 1) {
  _usersPage = page;
  const search = document.getElementById('admin-user-search')?.value || '';
  const data = await api.get(`/admin/users?page=${page}&limit=20&search=${encodeURIComponent(search)}`);
  const myId = JSON.parse(localStorage.getItem('profile') || '{}').id;

  el.innerHTML = `
    <div class="admin-header">
      <h2>Users (${data.total})</h2>
      <div class="flex gap-1">
        <input class="form-input" id="admin-user-search" placeholder="Search name or phone…" value="${search}" style="width:220px" />
        <button class="btn btn-primary btn-sm" id="admin-user-search-btn">Search</button>
      </div>
    </div>
    <div class="card">
      <div class="table-wrap"><table class="table table-striped">
        <thead><tr><th>Name</th><th>Email</th><th>Blood</th><th>Location</th><th>Contact</th><th>Admin</th><th>Joined</th><th>Actions</th></tr></thead>
        <tbody>${data.users.map(u => `
          <tr>
            <td>${u.name}</td>
            <td style="font-size:.82rem;color:var(--muted)">${u.id === myId ? '(you)' : ''}</td>
            <td>${bloodBadge(u.blood_group)}</td>
            <td>${u.locations?.name || '—'}</td>
            <td>${u.contact_number}</td>
            <td>${u.is_admin ? '<span class="badge badge-admin">Admin</span>' : '—'}</td>
            <td>${formatDate(u.created_at)}</td>
            <td>
              <div class="flex gap-1">
                <button class="btn btn-sm btn-secondary" onclick="viewUserDetail('${u.id}')">View</button>
                ${u.id !== myId ? `
                  <button class="btn btn-sm ${u.is_admin ? 'btn-danger' : 'btn-success'}" onclick="toggleAdmin('${u.id}', ${!u.is_admin})">${u.is_admin ? 'Revoke' : 'Grant'}</button>
                  <button class="btn btn-sm btn-danger" onclick="deleteUser('${u.id}','${u.name}')">Delete</button>
                ` : ''}
              </div>
            </td>
          </tr>
        `).join('')}</tbody>
      </table></div>
      ${renderPagination(data.page, data.total_pages, 'adminUsersPage')}
    </div>
  `;

  document.getElementById('admin-user-search-btn')?.addEventListener('click', () => adminUsers(el, 1));
  document.getElementById('admin-user-search')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') adminUsers(el, 1); });
}

function adminUsersPage(p) { adminUsers(document.getElementById('admin-tab-content'), p); }

async function viewUserDetail(id) {
  showSpinner();
  try {
    const data = await api.get(`/admin/users/${id}`);
    const u = data.user;
    showModal(`
      <div class="modal-header"><h3>${u.name}</h3><button class="modal-close" onclick="hideModal()">×</button></div>
      <p>${bloodBadge(u.blood_group)} ${availabilityBadge(u.is_available)} ${u.is_admin ? '<span class="badge badge-admin">Admin</span>' : ''}</p>
      <div class="mt-2" style="font-size:.9rem;line-height:2">
        <strong>Contact:</strong> ${u.contact_number}<br>
        <strong>Location:</strong> ${u.locations?.name || '—'} (${u.locations?.zone || '—'})<br>
        <strong>Department:</strong> ${u.department || '—'}<br>
        <strong>Last Donated:</strong> ${formatDate(u.last_donation_date)}<br>
        <strong>Last Received:</strong> ${formatDate(u.last_received_date)}<br>
        <strong>Joined:</strong> ${formatDate(u.created_at)}
      </div>
      ${data.activities.length ? `
        <h4 class="mt-2 mb-1" style="font-size:.95rem">Activity Log</h4>
        <div class="activity-feed" style="max-height:200px;overflow-y:auto">
          ${data.activities.map(a => `<div class="activity-item"><div class="activity-dot"></div><div><div class="activity-text">${activityLabel(a.activity_type)}</div><div class="activity-time">${formatDateTime(a.created_at)}</div></div></div>`).join('')}
        </div>
      ` : ''}
      <div class="modal-actions"><button class="btn btn-secondary" onclick="hideModal()">Close</button></div>
    `);
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    hideSpinner();
  }
}

async function toggleAdmin(id, makeAdmin) {
  showSpinner();
  try {
    await api.put(`/admin/users/${id}/make-admin`, { is_admin: makeAdmin });
    showToast(makeAdmin ? 'Admin granted!' : 'Admin revoked!');
    loadAdminTab('users');
  } catch (err) { showToast(err.message, 'error'); }
  finally { hideSpinner(); }
}

async function deleteUser(id, name) {
  showModal(`
    <div class="modal-header"><h3>Delete User</h3><button class="modal-close" onclick="hideModal()">×</button></div>
    <p>Are you sure you want to delete <strong>${name}</strong>? This is a soft delete and can be reversed.</p>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="hideModal()">Cancel</button>
      <button class="btn btn-danger" onclick="confirmDeleteUser('${id}')">Delete</button>
    </div>
  `);
}

async function confirmDeleteUser(id) {
  hideModal(); showSpinner();
  try {
    await api.del(`/admin/users/${id}`);
    showToast('User deleted');
    loadAdminTab('users');
  } catch (err) { showToast(err.message, 'error'); }
  finally { hideSpinner(); }
}

// ── Donations Tab ───────────────────────────────────────────
async function adminDonations(el, page = 1) {
  const fromDate = document.getElementById('don-from')?.value || '';
  const toDate = document.getElementById('don-to')?.value || '';
  let qs = `?page=${page}`;
  if (fromDate) qs += `&from=${fromDate}`;
  if (toDate) qs += `&to=${toDate}`;

  const data = await api.get(`/admin/donations${qs}`);

  el.innerHTML = `
    <div class="admin-header">
      <h2>Donations (${data.total})</h2>
      <div class="flex gap-1 flex-wrap" style="align-items:flex-end">
        <input type="date" class="form-input" id="don-from" value="${fromDate}" style="width:160px" />
        <input type="date" class="form-input" id="don-to" value="${toDate}" style="width:160px" />
        <button class="btn btn-primary btn-sm" onclick="adminDonations(document.getElementById('admin-tab-content'), 1)">Filter</button>
        <button class="btn btn-secondary btn-sm" onclick="exportDonationsCSV()">📥 Export CSV</button>
      </div>
    </div>
    <div class="card"><div class="table-wrap"><table class="table table-striped">
      <thead><tr><th>Donor</th><th>Recipient</th><th>Date</th><th>Notes</th></tr></thead>
      <tbody>${data.donations.length ? data.donations.map(d => `
        <tr>
          <td>${d.donor?.name || '—'} ${bloodBadge(d.donor?.blood_group)}</td>
          <td>${d.recipient?.name || '—'}</td>
          <td>${formatDate(d.donation_date)}</td>
          <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis">${d.notes || '—'}</td>
        </tr>
      `).join('') : '<tr><td colspan="4" class="text-center text-muted">No donations found</td></tr>'}</tbody>
    </table></div>
    ${renderPagination(data.page, data.total_pages, 'adminDonPage')}
    </div>
  `;
}
function adminDonPage(p) { adminDonations(document.getElementById('admin-tab-content'), p); }

async function exportDonationsCSV() {
  showSpinner();
  try {
    const data = await api.get('/admin/donations?page=1');
    const rows = [['Donor', 'Recipient', 'Date', 'Notes']];
    data.donations.forEach(d => rows.push([d.donor?.name, d.recipient?.name, d.donation_date, d.notes || '']));
    const csv = rows.map(r => r.map(c => `"${(c||'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'donations.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('CSV downloaded!');
  } catch (err) { showToast(err.message, 'error'); }
  finally { hideSpinner(); }
}

// ── Interactions Tab ────────────────────────────────────────
async function adminInteractions(el, page = 1) {
  const data = await api.get(`/admin/interactions?page=${page}`);
  el.innerHTML = `
    <h2>Interactions (${data.total})</h2>
    <div class="card"><div class="table-wrap"><table class="table table-striped">
      <thead><tr><th>Who Copied</th><th>Whose Number</th><th>Action</th><th>Date/Time</th></tr></thead>
      <tbody>${data.interactions.length ? data.interactions.map(i => `
        <tr><td>${i.actor?.name || '—'}</td><td>${i.target?.name || '—'}</td><td><span class="badge" style="background:var(--info-light);color:var(--info)">${i.action_type}</span></td><td>${formatDateTime(i.created_at)}</td></tr>
      `).join('') : '<tr><td colspan="4" class="text-center text-muted">No interactions</td></tr>'}</tbody>
    </table></div>
    ${renderPagination(data.page, data.total_pages, 'adminIntPage')}
    </div>
  `;
}
function adminIntPage(p) { adminInteractions(document.getElementById('admin-tab-content'), p); }

// ── Activity Log Tab ────────────────────────────────────────
async function adminActivity(el, page = 1) {
  const data = await api.get(`/admin/activity?page=${page}`);
  el.innerHTML = `
    <h2>Activity Log (${data.total})</h2>
    <div class="card"><div class="table-wrap"><table class="table table-striped">
      <thead><tr><th>User</th><th>Type</th><th>Reference</th><th>Meta</th><th>Timestamp</th></tr></thead>
      <tbody>${data.activities.length ? data.activities.map(a => `
        <tr>
          <td>${a.user?.name || '—'}</td>
          <td>${activityLabel(a.activity_type)}</td>
          <td style="font-size:.8rem;color:var(--muted)">${a.reference_type || '—'}</td>
          <td style="font-size:.78rem;max-width:150px;overflow:hidden;text-overflow:ellipsis">${a.meta ? JSON.stringify(a.meta) : '—'}</td>
          <td>${formatDateTime(a.created_at)}</td>
        </tr>
      `).join('') : '<tr><td colspan="5" class="text-center text-muted">No activity</td></tr>'}</tbody>
    </table></div>
    ${renderPagination(data.page, data.total_pages, 'adminActPage')}
    </div>
  `;
}
function adminActPage(p) { adminActivity(document.getElementById('admin-tab-content'), p); }

// ── Locations Tab ───────────────────────────────────────────
async function adminLocations(el) {
  const locations = await api.get('/admin/locations');
  el.innerHTML = `
    <h2>Locations</h2>
    <div class="card mb-2">
      <h3 class="card-title mb-1">Add New Location</h3>
      <div class="flex gap-1 flex-wrap" style="align-items:flex-end">
        <div class="form-group" style="margin-bottom:0"><input class="form-input" id="loc-name" placeholder="Location name" style="width:180px" /></div>
        <div class="form-group" style="margin-bottom:0"><input class="form-input" id="loc-zone" placeholder="Zone (e.g. Dhaka)" style="width:160px" /></div>
        <button class="btn btn-primary btn-sm" onclick="addLocation()">Add</button>
      </div>
    </div>
    <div class="card"><div class="table-wrap"><table class="table table-striped">
      <thead><tr><th>Name</th><th>Zone</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>${locations.map(l => `
        <tr>
          <td>${l.name}</td>
          <td>${l.zone}</td>
          <td>${l.is_active ? '<span class="badge badge-available">Active</span>' : '<span class="badge badge-unavailable">Inactive</span>'}</td>
          <td>
            <div class="flex gap-1">
              <button class="btn btn-sm btn-secondary" onclick="editLocation('${l.id}','${l.name}','${l.zone}')">Edit</button>
              <button class="btn btn-sm ${l.is_active ? 'btn-danger' : 'btn-success'}" onclick="toggleLocation('${l.id}', ${!l.is_active})">${l.is_active ? 'Deactivate' : 'Activate'}</button>
            </div>
          </td>
        </tr>
      `).join('')}</tbody>
    </table></div></div>
  `;
}

async function addLocation() {
  const name = document.getElementById('loc-name').value.trim();
  const zone = document.getElementById('loc-zone').value.trim();
  if (!name || !zone) return showToast('Name and zone are required', 'error');
  showSpinner();
  try {
    await api.post('/admin/locations', { name, zone });
    showToast('Location added!');
    loadAdminTab('locations');
  } catch (err) { showToast(err.message, 'error'); }
  finally { hideSpinner(); }
}

function editLocation(id, name, zone) {
  showModal(`
    <div class="modal-header"><h3>Edit Location</h3><button class="modal-close" onclick="hideModal()">×</button></div>
    <div class="form-group"><label class="form-label">Name</label><input class="form-input" id="edit-loc-name" value="${name}" /></div>
    <div class="form-group"><label class="form-label">Zone</label><input class="form-input" id="edit-loc-zone" value="${zone}" /></div>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="hideModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveLocation('${id}')">Save</button>
    </div>
  `);
}

async function saveLocation(id) {
  const name = document.getElementById('edit-loc-name').value.trim();
  const zone = document.getElementById('edit-loc-zone').value.trim();
  hideModal(); showSpinner();
  try {
    await api.put(`/admin/locations/${id}`, { name, zone });
    showToast('Location updated!');
    loadAdminTab('locations');
  } catch (err) { showToast(err.message, 'error'); }
  finally { hideSpinner(); }
}

async function toggleLocation(id, activate) {
  showSpinner();
  try {
    await api.put(`/admin/locations/${id}`, { is_active: activate });
    showToast(activate ? 'Location activated' : 'Location deactivated');
    loadAdminTab('locations');
  } catch (err) { showToast(err.message, 'error'); }
  finally { hideSpinner(); }
}

// ── Add Admin Tab ───────────────────────────────────────────
async function adminAddAdmin(el) {
  el.innerHTML = `
    <h2>👑 Manage Admin Access</h2>
    <div class="card" style="max-width:500px">
      <div class="form-group">
        <label class="form-label">Search user by name or phone</label>
        <div class="flex gap-1">
          <input class="form-input" id="admin-search-input" placeholder="Search…" />
          <button class="btn btn-primary btn-sm" id="admin-search-go">Search</button>
        </div>
      </div>
      <div id="admin-search-result"></div>
    </div>
  `;

  document.getElementById('admin-search-go').addEventListener('click', searchForAdmin);
  document.getElementById('admin-search-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') searchForAdmin(); });
}

async function searchForAdmin() {
  const query = document.getElementById('admin-search-input').value.trim();
  const resultEl = document.getElementById('admin-search-result');
  if (!query) return;

  try {
    const data = await api.get(`/admin/users?search=${encodeURIComponent(query)}&limit=5`);
    const myId = JSON.parse(localStorage.getItem('profile') || '{}').id;

    if (!data.users.length) {
      resultEl.innerHTML = '<p class="text-muted mt-2">No users found.</p>';
      return;
    }

    resultEl.innerHTML = data.users.map(u => `
      <div class="card mt-2" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem">
        <div>
          <strong>${u.name}</strong> ${bloodBadge(u.blood_group)} ${u.is_admin ? '<span class="badge badge-admin">Admin</span>' : ''}
          <div style="font-size:.85rem;color:var(--muted)">${u.contact_number}</div>
        </div>
        ${u.id !== myId ? `
          <button class="btn btn-sm ${u.is_admin ? 'btn-danger' : 'btn-success'}" onclick="toggleAdmin('${u.id}', ${!u.is_admin})">
            ${u.is_admin ? '🔒 Revoke Admin' : '👑 Grant Admin'}
          </button>
        ` : '<span class="text-muted">(You)</span>'}
      </div>
    `).join('');
  } catch (err) {
    resultEl.innerHTML = `<p class="text-red mt-2">${err.message}</p>`;
  }
}

// ── Pagination Helper ───────────────────────────────────────
function renderPagination(current, total, fnName) {
  if (total <= 1) return '';
  let html = '<div class="pagination">';
  html += `<button ${current <= 1 ? 'disabled' : ''} onclick="${fnName}(${current - 1})">‹</button>`;
  for (let i = 1; i <= total && i <= 7; i++) {
    html += `<button class="${i === current ? 'active' : ''}" onclick="${fnName}(${i})">${i}</button>`;
  }
  if (total > 7) html += `<button disabled>…</button><button onclick="${fnName}(${total})">${total}</button>`;
  html += `<button ${current >= total ? 'disabled' : ''} onclick="${fnName}(${current + 1})">›</button>`;
  html += '</div>';
  return html;
}
