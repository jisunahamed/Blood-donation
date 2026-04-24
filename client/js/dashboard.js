// ============================================================
// Dashboard Page
// ============================================================

async function renderDashboard() {
  const app = document.getElementById('app');
  app.innerHTML = '<div class="dashboard"><div class="spinner" style="padding:3rem;text-align:center"><div class="spinner-drop"></div><span>Loading dashboard…</span></div></div>';

  try {
    const data = await api.get('/users/me/dashboard');

    const daysText = !data.is_available && data.days_until_available > 0
      ? `<span class="text-red">Available in ${data.days_until_available} days</span>`
      : '<span class="text-success">Ready to donate</span>';

    app.innerHTML = `
      <div class="dashboard">
        <div class="dashboard-greeting">
          <h1>Hello, ${data.name} ${bloodBadge(data.blood_group)}</h1>
          <p>Welcome to your dashboard</p>
        </div>

        <div class="dashboard-stats">
          <div class="card stat-card glass-card">
            <div class="stat-icon" style="background:var(--red-pale);color:var(--red)">🩸</div>
            <div class="stat-value text-gradient" style="font-size:2rem">${formatDate(data.last_donation_date)}</div>
            <div class="stat-label">Last Donated</div>
          </div>
          <div class="card stat-card glass-card">
            <div class="stat-icon" style="background:var(--info-light);color:var(--info)">💉</div>
            <div class="stat-value text-gradient" style="font-size:2rem">${formatDate(data.last_received_date)}</div>
            <div class="stat-label">Last Received</div>
          </div>
          <div class="card stat-card glass-card">
            <div class="stat-icon" style="background:${data.is_available ? 'var(--success-light)' : 'var(--red-pale)'};color:${data.is_available ? 'var(--success)' : 'var(--red)'}">
              ${data.is_available ? '✓' : '⏳'}
            </div>
            <div class="stat-value text-gradient">${data.is_available ? 'Available' : 'Unavailable'}</div>
            <div class="stat-label">${daysText}</div>
          </div>
        </div>

        <div class="dashboard-section">
          <h3>📋 Network History</h3>
          <div class="card">
            ${data.network_history.length === 0
              ? '<div class="empty-state"><div class="empty-icon">🔗</div><p>No contacts yet. Search for donors to get started.</p></div>'
              : `<div class="table-wrap"><table class="table table-striped">
                  <thead><tr><th>Donor Info</th><th>Blood Group</th><th>Last Contact</th><th>Times</th></tr></thead>
                  <tbody>${data.network_history.map(n => `
                    <tr>
                      <td>Anonymous Donor ${n.contact?.department ? `<span style="font-size:0.8rem;color:var(--muted)">(${n.contact.department})</span>` : ''}</td>
                      <td>${bloodBadge(n.contact?.blood_group)}</td>
                      <td>${formatDateTime(n.last_contact_at)}</td>
                      <td>${n.contact_count}</td>
                    </tr>`).join('')}
                  </tbody>
                </table></div>`
            }
          </div>
        </div>

        <div class="dashboard-section">
          <h3>📜 Recent Activity</h3>
          <div class="card">
            ${data.activity_log.length === 0
              ? '<div class="empty-state"><div class="empty-icon">📭</div><p>No recent activity.</p></div>'
              : `<div class="activity-feed">${data.activity_log.map(a => `
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
      </div>
    `;
  } catch (err) {
    app.innerHTML = `<div class="dashboard"><div class="empty-state"><div class="empty-icon">⚠️</div><p>${err.message}</p></div></div>`;
    showToast(err.message, 'error');
  }
}
