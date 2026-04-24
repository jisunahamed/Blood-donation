async function renderDashboard() {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="page-container"><div class="spinner-drop"></div></div>`;

  try {
    const profile = JSON.parse(localStorage.getItem('profile'));
    const requests = await api.get('/blood-requests');
    const myRequests = requests.filter(r => r.user_id === profile.id);

    app.innerHTML = `
      <div class="page-container">
        <!-- GREETING SECTION -->
        <div class="dashboard-header" style="margin-bottom: 2rem;">
          <div class="greeting-content">
            <h1 class="greeting-name">হ্যালো, ${profile.name.split(' ')[0]}! 👋</h1>
            <p class="greeting-sub">আজকের দিনটি ভালো কাটুক। আপনার রক্তদানে বাঁচতে পারে একটি প্রাণ।</p>
          </div>
        </div>

        <!-- STATUS CARDS -->
        <div class="status-cards" style="margin-bottom: 2rem;">
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(255, 46, 46, 0.1); color: #ff2e2e;">🩸</div>
            <div class="stat-info">
              <span class="stat-value">${profile.blood_group || 'N/A'}</span>
              <span class="stat-label">আপনার রক্ত গ্রুপ</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: rgba(52, 199, 89, 0.1); color: #28a745;">✅</div>
            <div class="stat-info">
              <span class="stat-value">${profile.is_available ? 'সক্রিয়' : 'নিষ্ক্রিয়'}</span>
              <span class="stat-label">ডোনার স্ট্যাটাস</span>
            </div>
          </div>
        </div>

        <!-- RECENT REQUESTS SECTION -->
        <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem;">
          <h2 style="font-size: 1.25rem; font-weight: 800; font-family: 'Hind Siliguri', sans-serif;">জরুরী রক্তের আবেদন</h2>
          <a href="#/search" style="font-size: 0.85rem; font-weight: 700; color: #ff2e2e; text-decoration: none;">সবগুলো দেখুন</a>
        </div>

        <div class="requests-list">
          ${requests.length === 0 ? `
            <div class="empty-state">
              <div class="empty-icon">📭</div>
              <p>বর্তমানে কোনো রক্তের আবেদন নেই।</p>
            </div>
          ` : requests.slice(0, 5).map(req => `
            <div class="request-card">
              <div class="req-header">
                <div class="req-blood-badge">${req.blood_group}</div>
                <div class="req-meta">
                  <span class="req-location">📍 ${req.location}</span>
                  <span class="req-date">📅 ${new Date(req.created_at).toLocaleDateString('bn-BD')}</span>
                </div>
              </div>
              <p class="req-reason">${req.reason || 'জরুরী রক্ত প্রয়োজন'}</p>
              <div class="req-footer">
                <a href="tel:${req.contact_phone}" class="btn btn-primary" style="flex: 1; text-align: center; font-size: 0.9rem;">যোগাযোগ করুন</a>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- MY ACTIVITY SECTION -->
        <div class="section-header" style="margin: 2.5rem 0 1.2rem;">
          <h2 style="font-size: 1.25rem; font-weight: 800; font-family: 'Hind Siliguri', sans-serif;">আপনার সাম্প্রতিক কার্যক্রম</h2>
        </div>
        
        <div class="activity-list">
           ${myRequests.length === 0 ? `
            <div class="activity-card" style="text-align: center; color: var(--muted); padding: 1.5rem;">
              আপনার কোনো সাম্প্রতিক আবেদন নেই।
            </div>
           ` : myRequests.slice(0, 3).map(req => `
            <div class="activity-item">
              <div class="activity-icon">📢</div>
              <div class="activity-details">
                <p class="activity-title">${req.blood_group} রক্তের জন্য আবেদন করেছেন</p>
                <p class="activity-time">${new Date(req.created_at).toLocaleString('bn-BD')}</p>
              </div>
            </div>
           `).join('')}
        </div>
      </div>
    `;
  } catch (err) {
    showToast('ড্যাশবোর্ড লোড করতে সমস্যা হয়েছে', 'error');
  }
}
