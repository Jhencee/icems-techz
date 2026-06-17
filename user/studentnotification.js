// ============================================
// NOTIFICATION.JS — STUDENT PORTAL
// Connects to Laravel /api/notifications/* endpoints
// ============================================

const API_BASE_URL = window.API_URL || 'http://127.0.0.1:8000';
let currentUser = null;
let allNotifications = [];
let currentFilter = 'all';
let unreadPollTimer = null;

// ============================================
// INITIALISE
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔔 Notifications page initialising...');

    currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = '../user/studentlogin.html';
        return;
    }

    updateUserProfile(currentUser);
    await loadNotifications();
    startUnreadPolling();
    setupSidebarLogout();
});

// ============================================
// LOAD NOTIFICATIONS FROM API
// ============================================
async function loadNotifications(category = 'all') {
    showLoadingState();

    try {
        const params = new URLSearchParams();
        if (category !== 'all') params.set('category', category);

        const res = await fetch(
            `${API_BASE_URL}/api/notifications/${currentUser.student_number}?${params}`,
            { headers: { 'Accept': 'application/json' } }
        );
        const data = await res.json();

        if (data.success) {
            allNotifications = data.notifications;
            renderNotifications(allNotifications);
            updateBadge(data.unread_count);
            updateSummaryBar(allNotifications);
        } else {
            showError('Failed to load notifications.');
        }
    } catch (err) {
        console.error('Notification load error:', err);
        showError('Cannot connect to server. Please ensure the backend is running.');
    }
}

// ============================================
// RENDER NOTIFICATIONS
// ============================================
function renderNotifications(notifications) {
    const list = document.getElementById('notifList');
    if (!list) return;

    if (!notifications.length) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔔</div>
                <h2>No Notifications</h2>
                <p>You're all caught up! Notifications will appear here when you have updates.</p>
            </div>`;
        return;
    }

    list.innerHTML = notifications.map(n => buildNotifCard(n)).join('');
}

function buildNotifCard(n) {
    const iconMap = {
        success: 'fa-check-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle',
        error: 'fa-times-circle',
    };
    const colorMap = {
        success: '#10b981',
        info: '#3b82f6',
        warning: '#f59e0b',
        error: '#ef4444',
    };

    const icon = iconMap[n.type] || 'fa-bell';
    const color = colorMap[n.type] || '#6b7280';
    const readClass = n.is_read ? 'read' : 'unread';

    return `
    <div class="notif-card ${readClass}" id="notif-${n.id}" data-id="${n.id}" data-category="${n.category}">
        <div class="notif-icon" style="background:${color}20; color:${color};">
            <i class="fas ${icon}"></i>
        </div>
        <div class="notif-body">
            <div class="notif-header-row">
                <span class="notif-title">${escapeHtml(n.title)}</span>
                <span class="notif-time">${n.time}</span>
            </div>
            <p class="notif-message">${escapeHtml(n.message)}</p>
            <div class="notif-meta">
                <span class="notif-category-badge category-${n.category}">${n.category}</span>
                ${!n.is_read ? `<button class="mark-read-btn" onclick="markAsRead(this, ${n.id})">
                    <i class="fas fa-check"></i> Mark read
                </button>` : '<span class="read-label"><i class="fas fa-check-double"></i> Read</span>'}
                <button class="delete-notif-btn" onclick="deleteNotification(${n.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    </div>`;
}

// ============================================
// FILTER CHIPS
// ============================================
function filterNotifs(filter) {
    currentFilter = filter;

    // Update active chip
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    event.target.classList.add('active');

    const filtered = filter === 'all'
        ? allNotifications
        : allNotifications.filter(n => n.category === filter);

    renderNotifications(filtered);
}

// ============================================
// MARK SINGLE AS READ
// ============================================
async function markAsRead(btn, id) {
    try {
        const res = await fetch(
            `${API_BASE_URL}/api/notifications/${currentUser.student_number}/${id}/read`,
            { method: 'POST', headers: { 'Accept': 'application/json' } }
        );
        const data = await res.json();

        if (data.success) {
            const card = document.getElementById(`notif-${id}`);
            if (card) {
                card.classList.remove('unread');
                card.classList.add('read');
                // Replace button with "read" label
                const metaDiv = card.querySelector('.notif-meta');
                const markBtn = metaDiv.querySelector('.mark-read-btn');
                if (markBtn) {
                    markBtn.outerHTML = '<span class="read-label"><i class="fas fa-check-double"></i> Read</span>';
                }
            }

            // Update local state
            const notif = allNotifications.find(n => n.id === id);
            if (notif) notif.is_read = true;

            refreshUnreadBadge();
        }
    } catch (err) {
        console.error('Mark-read error:', err);
    }
}

// ============================================
// MARK ALL READ
// ============================================
async function markAllRead() {
    try {
        const params = currentFilter !== 'all' ? `?category=${currentFilter}` : '';
        const res = await fetch(
            `${API_BASE_URL}/api/notifications/${currentUser.student_number}/mark-all-read${params}`,
            { method: 'POST', headers: { 'Accept': 'application/json' } }
        );
        const data = await res.json();

        if (data.success) {
            // Update DOM
            document.querySelectorAll('.notif-card.unread').forEach(card => {
                card.classList.remove('unread');
                card.classList.add('read');
                const markBtn = card.querySelector('.mark-read-btn');
                if (markBtn) {
                    markBtn.outerHTML = '<span class="read-label"><i class="fas fa-check-double"></i> Read</span>';
                }
            });

            // Update local state
            allNotifications.forEach(n => { n.is_read = true; });
            refreshUnreadBadge();
            showToast(`${data.updated} notification(s) marked as read`);
        }
    } catch (err) {
        console.error('Mark-all-read error:', err);
    }
}

// ============================================
// DELETE SINGLE NOTIFICATION
// ============================================
async function deleteNotification(id) {
    if (!confirm('Delete this notification?')) return;

    try {
        const res = await fetch(
            `${API_BASE_URL}/api/notifications/${currentUser.student_number}/${id}`,
            { method: 'DELETE', headers: { 'Accept': 'application/json' } }
        );
        const data = await res.json();

        if (data.success) {
            const card = document.getElementById(`notif-${id}`);
            if (card) card.remove();
            allNotifications = allNotifications.filter(n => n.id !== id);

            if (!allNotifications.length) renderNotifications([]);
            refreshUnreadBadge();
        }
    } catch (err) {
        console.error('Delete notification error:', err);
    }
}

// ============================================
// CLEAR ALL
// ============================================
async function clearAll() {
    if (!confirm('Are you sure you want to clear all notifications?')) return;

    try {
        const params = currentFilter !== 'all' ? `?category=${currentFilter}` : '';
        const res = await fetch(
            `${API_BASE_URL}/api/notifications/${currentUser.student_number}/clear-all${params}`,
            { method: 'DELETE', headers: { 'Accept': 'application/json' } }
        );
        const data = await res.json();

        if (data.success) {
            allNotifications = currentFilter === 'all'
                ? []
                : allNotifications.filter(n => n.category !== currentFilter);

            renderNotifications(currentFilter === 'all' ? [] : allNotifications);
            updateBadge(0);
            showToast(`${data.deleted} notification(s) cleared`);
        }
    } catch (err) {
        console.error('Clear-all error:', err);
    }
}

// ============================================
// UNREAD BADGE HELPERS
// ============================================
async function refreshUnreadBadge() {
    try {
        const res = await fetch(
            `${API_BASE_URL}/api/notifications/${currentUser.student_number}/unread-count`,
            { headers: { 'Accept': 'application/json' } }
        );
        const data = await res.json();
        if (data.success) updateBadge(data.unread_count);
    } catch (_) { }
}

function updateBadge(count) {
    const badges = document.querySelectorAll('.notif-badge, #notifBadge, .notification-count');
    badges.forEach(b => {
        b.textContent = count > 0 ? (count > 99 ? '99+' : count) : '';
        b.style.display = count > 0 ? 'inline-flex' : 'none';
    });
}

// Poll every 60 s for new unread notifications
function startUnreadPolling() {
    unreadPollTimer = setInterval(async () => {
        await refreshUnreadBadge();
    }, 60_000);
}

// ============================================
// SUMMARY BAR (counts per category)
// ============================================
function updateSummaryBar(notifications) {
    const counts = {};
    notifications.forEach(n => {
        if (!n.is_read) counts[n.category] = (counts[n.category] || 0) + 1;
    });

    ['payments', 'events', 'clearance', 'attendance', 'general'].forEach(cat => {
        const el = document.getElementById(`count-${cat}`);
        if (el) el.textContent = counts[cat] || 0;
    });
}

// ============================================
// UI STATE HELPERS
// ============================================
function showLoadingState() {
    const list = document.getElementById('notifList');
    if (list) {
        list.innerHTML = `
            <div style="text-align:center; padding:60px 20px; color:#9ca3af;">
                <i class="fas fa-spinner fa-spin" style="font-size:3rem; color:#800020;"></i>
                <p style="margin-top:15px;">Loading notifications...</p>
            </div>`;
    }
}

function showError(message) {
    const list = document.getElementById('notifList');
    if (list) {
        list.innerHTML = `
            <div style="text-align:center; padding:60px 20px;">
                <i class="fas fa-exclamation-triangle" style="font-size:3rem; color:#ef4444;"></i>
                <h3 style="color:#1f2937; margin:15px 0 10px;">Cannot Load Notifications</h3>
                <p style="color:#6b7280;">${message}</p>
                <button onclick="loadNotifications()" style="margin-top:20px; padding:10px 20px;
                    background:#800020; color:white; border:none; border-radius:8px; cursor:pointer;">
                    <i class="fas fa-sync"></i> Retry
                </button>
            </div>`;
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position:fixed; bottom:24px; right:24px; background:#1f2937; color:white;
        padding:12px 20px; border-radius:8px; font-size:.9rem; z-index:99999;
        box-shadow:0 4px 12px rgba(0,0,0,.2); transition:opacity .3s;`;
    toast.innerHTML = `<i class="fas fa-check-circle" style="color:#10b981; margin-right:8px;"></i>${message}`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
}

function escapeHtml(text) {
    return String(text ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ============================================
// USER PROFILE (shared pattern across pages)
// ============================================
function updateUserProfile(user) {
    const fullName = `${user.first_name} ${user.last_name}`;
    const initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    const courseYear = `${user.course || 'N/A'} ${user.year || ''}`.trim();
    const studentNumber = user.student_number || 'N/A';

    const sidebarAvatar = document.getElementById('sidebarAvatar');
    const sidebarName = document.getElementById('sidebarName');
    const sidebarId = document.getElementById('sidebarId');

    if (sidebarAvatar) {
        sidebarAvatar.textContent = initials;
        const savedAvatar = localStorage.getItem(`avatar_${user.id}`);
        if (savedAvatar) {
            Object.assign(sidebarAvatar.style, {
                backgroundImage: `url(${savedAvatar})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                color: 'transparent',
            });
        }
    }
    if (sidebarName) sidebarName.textContent = fullName;
    if (sidebarId) sidebarId.textContent = `${courseYear} | ${studentNumber}`;
}

// ============================================
// SIDEBAR / LOGOUT
// ============================================
function toggleSidebar() {
    document.getElementById('sidebar')?.classList.toggle('active');
}

function logout() {
    document.getElementById('logoutModal').style.display = 'flex';
}

function closeLogoutModal() {
    document.getElementById('logoutModal').style.display = 'none';
}

function confirmLogout() {
    clearInterval(unreadPollTimer);
    localStorage.removeItem('currentUser');
    window.location.href = '../user/studentlogin.html';
}

function setupSidebarLogout() {
    window.addEventListener('click', e => {
        const modal = document.getElementById('logoutModal');
        if (modal && e.target === modal) closeLogoutModal();
    });
}