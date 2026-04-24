// ============================================================
// Dashboard Page — Bengali UI, Premium Design
// ============================================================

async function renderDashboard() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="page-container">
      <div class="page-loading">
        <div class="spinner-drop"></div>
        <span>লোড হচ্ছে...</span>
      </div>
    </div>`;

  try {
    const data = await api.get('/users/me/dashboard');

    const availText = !data.is_available && data.days_until_available > 0
      ? `<span class="text-red">আরও ${data.days_until_available} দিন পর</span>`
      : `<span class="avail-ready">✓ প্রস্তুত</span>`;

    app.innerHTML = `
      <div class="page-container">
        <!-- Greeting -->
        <div class="greeting-section">
          <div class="greeting-left">
            <p class="greeting-sub">স্বাগতম 👋</p>
            <h1 class="greeting-name">${data.name} ${bloodBadge(data.blood_group)}</h1>
          </div>
          <a href="#/search" class="floating-action-btn">
            🩸 রক্ত খুঁজুন
          </a>
        </div>

        <!-- Status Cards -->
        <div class="status-cards">
          <div class="status-card">
            <div class="status-icon">🩸</div>
            <div class="status-info">
              <span class="status-label">সর্বশেষ দান</span>
              <span class="status-value">${formatDate(data.last_donation_date)}</span>
            </div>
          </div>
          <div class="status-card">
            <div class="status-icon">💉</div>
            <div class="status-info">
              <span class="status-label">সর্বশেষ গ্রহণ</span>
              <span class="status-value">${formatDate(data.last_received_date)}</span>
            </div>
          </div>
          <div class="status-card ${data.is_available ? 'status-available' : 'status-busy'}">
            <div class="status-icon">${data.is_available ? '✅' : '⏳'}</div>
            <div class="status-info">
              <span class="status-label">অবস্থা</span>
              <span class="status-value">${data.is_available ? 'দান করতে পারব' : 'বিরতিতে আছি'}</span>
              <span class="status-sub">${availText}</span>
            </div>
          </div>
        </div>

        <!-- Network History -->
        <div class="section-header">
          <h2 class="section-title">📋 যোগাযোগ ইতিহাস</h2>
        </div>
        <div class="section-card">
          ${data.network_history.length === 0
            ? `<div class="empty-state">
                <div class="empty-icon">🔗</div>
                <p>এখনো কারো সাথে যোগাযোগ হয়নি।<br/>ডোনার খুঁজে যোগাযোগ শুরু করুন।</p>
                <a href="#/search" class="btn btn-primary btn-sm">ডোনার খুঁজুন</a>
               </div>`
            : `<div class="network-list">
                ${data.network_history.map(n => {
                  const nameDisplay = n.contact?.hide_name ? 'পরিচয় গোপন' : (n.contact?.name || 'অজানা');
                  return `
                  <div class="network-item">
                    <div class="network-avatar">${(nameDisplay[0] || '?').toUpperCase()}</div>
                    <div class="network-info">
                      <span class="network-name">${nameDisplay}${n.contact?.department ? ` <small>(${n.contact.department})</small>` : ''}</span>
                      <span class="network-meta">${bloodBadge(n.contact?.blood_group)} &nbsp; ${formatDateTime(n.last_contact_at)}</span>
                    </div>
                    <button class="btn-donated" onclick="openDonationModal('${n.contact_id}')">✓ পেয়েছি</button>
                  </div>`;
                }).join('')}
              </div>`
          }
        </div>

        <!-- Recent Activity -->
        <div class="section-header" style="margin-top: 2rem;">
          <h2 class="section-title">📜 সাম্প্রতিক কার্যক্রম</h2>
        </div>
        <div class="section-card">
          ${data.activity_log.length === 0
            ? `<div class="empty-state"><div class="empty-icon">📭</div><p>কোনো কার্যক্রম নেই।</p></div>`
            : `<div class="activity-feed">
                ${data.activity_log.map(a => `
                  <div class="activity-item">
                    <div class="activity-dot"></div>
                    <div>
                      <div class="activity-text">${activityLabel(a.activity_type)}</div>
                      <div class="activity-time">${formatDateTime(a.created_at)}</div>
                    </div>
                  </div>`).join('')}
              </div>`
          }
        </div>
      </div>
    `;
  } catch (err) {
    app.innerHTML = `<div class="page-container"><div class="empty-state"><div class="empty-icon">⚠️</div><p>${err.message}</p></div></div>`;
    showToast(err.message, 'error');
  }
}
