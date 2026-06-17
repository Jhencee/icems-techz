// ============================================
// ORGANIZATION.JS - MAIN NAVIGATION & DATA
// ============================================

const API_BASE_URL_SC = 'http://127.0.0.1:8000/api';

// State
let scEvents = [];
let scClearances = [];
let scPayments = [];
let scStudents = [];

// ============================================
// NAVIGATION
// ============================================
function showSection(sectionId) {
    console.log("showSection called:", sectionId, new Error().stack.split("\n")[1]);
    sessionStorage.setItem('activeSection', sectionId);
    document.querySelectorAll('.section, .content-section').forEach(s => s.style.display = 'none');
    const target = document.getElementById(sectionId + 'Section');
    if (target) target.style.display = 'block';

    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-link[onclick*="${sectionId}"]`);
    if (activeLink) activeLink.classList.add('active');

    if (sectionId === 'dashboard') updateDashboardStats();
    if (sectionId === 'events') initEventsSection();
    if (sectionId === 'clearance') renderClearanceTable();
    if (sectionId === 'payments') renderPaymentsTable();
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

// ============================================
// INITIALIZE
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    const lastSection = sessionStorage.getItem('activeSection') || 'dashboard';
    showSection(lastSection);
    const reopenModal = sessionStorage.getItem('reopenModal');
    if (reopenModal) {
        sessionStorage.removeItem('reopenModal');
        setTimeout(() => {
            const m = document.getElementById(reopenModal);
            if (m) m.classList.add('active');
        }, 500);
    }
    const alreadyLoaded = sessionStorage.getItem('scDataLoaded');

    if (alreadyLoaded) {
        scEvents     = JSON.parse(sessionStorage.getItem('scEvents')     || '[]');
        scClearances = JSON.parse(sessionStorage.getItem('scClearances') || '[]');
        scPayments   = JSON.parse(sessionStorage.getItem('scPayments')   || '[]');
        scStudents   = JSON.parse(sessionStorage.getItem('scStudents')   || '[]');

        mockEvents = {};
        scEvents.forEach(e => {
            mockEvents[e.event_date ? e.event_date.toString().slice(0,10) : e.id] = {
                id: e.id,
                title: e.title,
                time: e.time || '',
                startTime: e.start_time || '',
                endTime: e.end_time || '',
                description: e.description || '',
                location: e.location || '',
                category: e.category || 'optional',
                audience: e.audience || 'All Students',
                admin: e.admin || 'Student Council',
                isClearance: e.is_clearance || false,
            };
        });
        console.log('📦 [SC] Restored from session cache');
    } else {
        await Promise.all([
            loadEvents(),
            loadClearances(),
            loadPayments(),
            loadStudents(),
        ]);
        sessionStorage.setItem('scEvents',     JSON.stringify(scEvents));
        sessionStorage.setItem('scClearances', JSON.stringify(scClearances));
        sessionStorage.setItem('scPayments',   JSON.stringify(scPayments));
        sessionStorage.setItem('scStudents',   JSON.stringify(scStudents));
        sessionStorage.setItem('scDataLoaded', 'true');
        console.log('✅ [SC] Data loaded from API and cached');
    }

    updateDashboardStats();
    updateBadges();
});

// ============================================
// DATA LOADERS
// ============================================
async function loadEvents() {
    try {
        const res = await fetch(`${API_BASE_URL_SC}/student-councils/${SC_ID}/events`);
        const data = await res.json();
        if (data.success) {
            scEvents = data.events || [];
            // Build mockEvents for calendar
            mockEvents = {};
            scEvents.forEach(e => {
                mockEvents[e.event_date ? e.event_date.toString().slice(0,10) : e.id] = {
                    id: e.id,
                    title: e.title,
                    time: e.time || '',
                    startTime: e.start_time || '',
                    endTime: e.end_time || '',
                    description: e.description || '',
                    location: e.location || '',
                    category: e.category || 'optional',
                    audience: e.audience || 'All Students',
                    admin: e.admin || 'Student Council',
                    isClearance: e.is_clearance || false,
                };
            });
            eventsLoaded = true;
            updateBadges();
            renderCalendar();
            loadAllEventsTable();
        }
    } catch (e) {
        console.error('Failed to load events:', e);
    }
}

async function loadClearances() {
    try {
        const res = await fetch(`${API_BASE_URL_SC}/student-councils/${SC_ID}/clearances`);
        const data = await res.json();
        if (data.success) {
            scClearances = data.submissions || [];
            updateBadges();
            renderClearanceTable();
        }
    } catch (e) {
        console.error('Failed to load clearances:', e);
    }
}

async function loadPayments() {
    try {
        const res = await fetch(`${API_BASE_URL_SC}/student-councils/${SC_ID}/payments`);
        const data = await res.json();
        if (data.success) {
            scPayments = data.payments || [];
            updateBadges();
            renderPaymentsTable();
        }
    } catch (e) {
        console.error('Failed to load payments:', e);
    }
}

async function loadStudents() {
    try {
        const res = await fetch(`${API_BASE_URL_SC}/students`);
        const data = await res.json();
        if (data.success) scStudents = data.students || [];
    } catch (e) {
        console.error('Failed to load students:', e);
    }
}

// ============================================
// DASHBOARD STATS
// ============================================
function updateDashboardStats() {
    const totalEvents = document.getElementById('totalEvents');
    const totalClearance = document.getElementById('totalClearance');
    const totalPayments = document.getElementById('totalPayments');
    const totalStudents = document.getElementById('totalStudents');

    if (totalEvents) totalEvents.textContent = scEvents.length;
    if (totalClearance) totalClearance.textContent = scClearances.length;
    if (totalStudents) totalStudents.textContent = scStudents.length;

    const verifiedTotal = scPayments
        .filter(p => p.status === 'verified')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    if (totalPayments) totalPayments.textContent = '₱' + verifiedTotal.toLocaleString();
}

function updateBadges() {
    const eventsBadge = document.getElementById('eventsBadge');
    const clearanceBadge = document.getElementById('clearanceBadge');
    const paymentsBadge = document.getElementById('paymentsBadge');

    if (eventsBadge) {
        eventsBadge.textContent = scEvents.length;
        eventsBadge.style.display = scEvents.length > 0 ? 'inline-block' : 'none';
    }
    const pendingClearances = scClearances.filter(c => c.status === 'pending').length;
    if (clearanceBadge) {
        clearanceBadge.textContent = pendingClearances;
        clearanceBadge.style.display = pendingClearances > 0 ? 'inline-block' : 'none';
    }
    const pendingPayments = scPayments.filter(p => p.status === 'pending').length;
    if (paymentsBadge) {
        paymentsBadge.textContent = pendingPayments;
        paymentsBadge.style.display = pendingPayments > 0 ? 'inline-block' : 'none';
    }
}

// ============================================
// CLEARANCE TABLE
// ============================================
function renderClearanceTable() {
    const container = document.querySelector('#clearanceSection .table-container');
    if (!container) return;

    if (scClearances.length === 0) {
        container.innerHTML = `
            <div class="table-header"><h3 class="table-title">Student Clearance List</h3></div>
            <div class="empty-state">
                <div class="empty-icon"><i class="fas fa-clipboard-check"></i></div>
                <h2>No Clearance Submissions</h2>
                <p>Student clearance submissions will appear here.</p>
            </div>`;
        return;
    }

    const rows = scClearances.map(c => {
        const statusColor = { pending: '#f59e0b', approved: '#059669', rejected: '#dc2626' }[c.status] || '#666';
        return `
            <tr>
                <td>${c.student_number || '-'}</td>
                <td style="font-weight:500;">${c.student_name || '-'}</td>
                <td>${c.course || '-'} ${c.year || ''}</td>
                <td><span style="color:${statusColor};font-weight:600;">${capitalize(c.status)}</span></td>
                <td>
                    <button class="btn btn-primary" onclick="openClearanceReview(${c.id})"
                        style="padding:6px 10px;font-size:0.8rem;">
                        <i class="fas fa-eye"></i> ${c.status === 'pending' ? 'Review' : 'View'}
                    </button>
                </td>
            </tr>`;
    }).join('');

    container.innerHTML = `
        <div class="table-header">
            <h3 class="table-title">Student Clearance List</h3>
            <div class="search-box">
                <i class="fa-solid fa-magnifying-glass" style="color:#999;"></i>
                <input type="text" placeholder="Search..." oninput="filterClearanceTable(this.value)">
            </div>
        </div>
        <table id="clearanceTable">
            <thead>
                <tr>
                    <th>Student ID</th><th>Name</th><th>Course & Year</th>
                    <th>Status</th><th>Actions</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>`;
}

function filterClearanceTable(query) {
    const rows = document.querySelectorAll('#clearanceTable tbody tr');
    rows.forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(query.toLowerCase()) ? '' : 'none';
    });
}

async function openClearanceReview(id) {
    const c = scClearances.find(x => x.id === id);
    if (!c) return;

    const isActionable = c.status === 'pending';
    const statusColor = { pending: '#f59e0b', approved: '#059669', rejected: '#dc2626' }[c.status] || '#666';
    const submittedDate = c.submitted_at
        ? new Date(c.submitted_at).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '-';

    document.body.insertAdjacentHTML('beforeend', `
        <div id="clearanceReviewModal" style="display:flex;position:fixed;top:0;left:0;width:100%;height:100%;
            background:rgba(0,0,0,0.5);z-index:10000;justify-content:center;align-items:center;padding:20px;">
            <div style="background:white;border-radius:12px;padding:30px;max-width:700px;width:90%;
                max-height:90vh;overflow-y:auto;position:relative;">
                <span onclick="closeClearanceReview()"
                    style="position:absolute;top:15px;right:20px;font-size:2rem;cursor:pointer;color:#666;">&times;</span>
                <h2 style="color:#800020;margin-bottom:20px;"><i class="fas fa-clipboard-check"></i> Clearance Review</h2>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:20px;">
                    <div style="background:#f9fafb;padding:15px;border-radius:8px;">
                        <h4 style="color:#800020;margin-bottom:10px;">Student Info</h4>
                        <p><strong>Name:</strong> ${c.student_name || '-'}</p>
                        <p><strong>Student No:</strong> ${c.student_number || '-'}</p>
                        <p><strong>Email:</strong> ${c.student_email || '-'}</p>
                        <p><strong>Course:</strong> ${c.course || '-'} ${c.year || ''}</p>
                    </div>
                    <div style="background:#f9fafb;padding:15px;border-radius:8px;">
                        <h4 style="color:#800020;margin-bottom:10px;">Event Info</h4>
                        <p><strong>Event:</strong> ${c.event_title || '-'}</p>
                        <p><strong>Submitted:</strong> ${submittedDate}</p>
                        <p><strong>Status:</strong> <span style="color:${statusColor};font-weight:600;">${capitalize(c.status)}</span></p>
                        ${c.admin_notes ? `<p><strong>Notes:</strong> ${c.admin_notes}</p>` : ''}
                    </div>
                </div>

                ${c.proof_image ? `
                <div style="margin-bottom:20px;">
                    <h4 style="color:#800020;margin-bottom:10px;">Proof of Attendance</h4>
                    <div style="border:2px solid #e0e0e0;border-radius:8px;padding:10px;text-align:center;background:#f9fafb;">
                        <img src="${c.proof_image}" alt="Proof" style="max-width:100%;max-height:400px;border-radius:8px;">
                    </div>
                </div>` : ''}

                ${isActionable ? `
                <div style="margin-bottom:15px;">
                    <h4 style="color:#800020;margin-bottom:8px;">Notes (Optional)</h4>
                    <textarea id="clearanceNotes" rows="3" placeholder="Add notes for the student..."
                        style="width:100%;padding:10px;border:2px solid #e0e0e0;border-radius:8px;resize:vertical;"></textarea>
                </div>
                <div style="display:flex;gap:10px;">
                    <button onclick="submitClearanceStatus(${id},'approved')"
                        style="flex:1;padding:12px;background:#059669;color:white;border:none;border-radius:8px;font-size:1rem;cursor:pointer;">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button onclick="submitClearanceStatus(${id},'rejected')"
                        style="flex:1;padding:12px;background:#dc2626;color:white;border:none;border-radius:8px;font-size:1rem;cursor:pointer;">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </div>` : ''}
            </div>
        </div>`);
}

function closeClearanceReview() {
    const modal = document.getElementById('clearanceReviewModal');
    if (modal) modal.remove();
}

async function submitClearanceStatus(id, status) {
    const notes = document.getElementById('clearanceNotes')?.value.trim();
    if (!confirm(`${capitalize(status)} this clearance submission?`)) return;

    try {
        const res = await fetch(`${API_BASE_URL_SC}/student-councils/${SC_ID}/clearances/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, admin_notes: notes || `${capitalize(status)} by Student Council` })
        });
        const data = await res.json();
        if (data.success) {
            alert(`âœ… Clearance ${status} successfully!`);
            closeClearanceReview();
            await loadClearances();
            updateDashboardStats();
            updateBadges();
        } else {
            alert('âŒ Failed: ' + (data.message || 'Unknown error'));
        }
    } catch (e) {
        alert('âŒ Server error. Please try again.');
        console.error(e);
    }
}

// ============================================
// PAYMENTS TABLE
// ============================================
function renderPaymentsTable() {
    const container = document.querySelector('#paymentsSection .table-container');
    if (!container) return;

    // Update payment stats
    const verified = scPayments.filter(p => p.status === 'verified');
    const pending = scPayments.filter(p => p.status === 'pending');
    const verifiedTotal = verified.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    const statsCards = document.querySelectorAll('#paymentsSection .stat-card .stat-value');
    if (statsCards[0]) statsCards[0].textContent = '₱' + verifiedTotal.toLocaleString();
    if (statsCards[1]) statsCards[1].textContent = pending.length;
    if (statsCards[2]) statsCards[2].textContent = verified.length;

    if (scPayments.length === 0) {
        container.innerHTML = `
            <div class="table-header"><h2 class="table-title">Payment Transactions</h2></div>
            <div class="empty-state">
                <div class="empty-icon"><i class="fa-solid fa-peso-sign"></i></div>
                <h2>No Payment Transactions</h2>
                <p>Student payment submissions will appear here</p>
            </div>`;
        return;
    }

    const rows = scPayments.map(p => {
        const statusColor = { pending: '#f59e0b', verified: '#059669', rejected: '#dc2626' }[p.status] || '#666';
        return `
            <tr>
                <td>${p.student_number || '-'}</td>
                <td style="font-weight:500;">${p.student_name || '-'}</td>
                <td>₱${parseFloat(p.amount || 0).toLocaleString()}</td>
                <td>${p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}</td>
                <td>-</td>
                <td><span style="color:${statusColor};font-weight:600;">${capitalize(p.status)}</span></td>
                <td>
                    <button onclick="openPaymentReview(${p.id})"
                        class="btn btn-primary" style="padding:6px 10px;font-size:0.8rem;">
                        <i class="fas fa-eye"></i> ${p.status === 'pending' ? 'Verify' : 'View'}
                    </button>
                </td>
            </tr>`;
    }).join('');

    container.innerHTML = `
        <div class="table-header">
            <h2 class="table-title">Payment Transactions</h2>
            <div class="search-box">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input type="text" placeholder="Search transactions..." oninput="filterPaymentsTable(this.value)">
            </div>
        </div>
        <table id="paymentsTable">
            <thead>
                <tr>
                    <th>Student ID</th><th>Name</th><th>Amount</th>
                    <th>Date</th><th>Reference</th><th>Status</th><th>Actions</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>`;
}

function filterPaymentsTable(query) {
    const rows = document.querySelectorAll('#paymentsTable tbody tr');
    rows.forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(query.toLowerCase()) ? '' : 'none';
    });
}

async function openPaymentReview(id) {
    const p = scPayments.find(x => x.id === id);
    if (!p) return;

    const isActionable = p.status === 'pending';
    const statusColor = { pending: '#f59e0b', verified: '#059669', rejected: '#dc2626' }[p.status] || '#666';

    document.body.insertAdjacentHTML('beforeend', `
        <div id="paymentReviewModal" style="display:flex;position:fixed;top:0;left:0;width:100%;height:100%;
            background:rgba(0,0,0,0.5);z-index:10000;justify-content:center;align-items:center;padding:20px;">
            <div style="background:white;border-radius:12px;padding:30px;max-width:600px;width:90%;
                max-height:90vh;overflow-y:auto;position:relative;">
                <span onclick="closePaymentReview()"
                    style="position:absolute;top:15px;right:20px;font-size:2rem;cursor:pointer;color:#666;">&times;</span>
                <h2 style="color:#800020;margin-bottom:20px;"><i class="fas fa-peso-sign"></i> Payment Review</h2>

                <div style="background:#f9fafb;padding:15px;border-radius:8px;margin-bottom:20px;">
                    <p><strong>Student:</strong> ${p.student_name || p.student_number}</p>
                    <p><strong>Payment:</strong> ${p.requirement_title || '-'}</p>
                    <p><strong>Amount:</strong> ₱${parseFloat(p.amount || 0).toLocaleString()}</p>
                    <p><strong>Status:</strong> <span style="color:${statusColor};font-weight:600;">${capitalize(p.status)}</span></p>
                    ${p.admin_notes ? `<p><strong>Notes:</strong> ${p.admin_notes}</p>` : ''}
                </div>

                ${p.proof_image ? `
                <div style="margin-bottom:20px;">
                    <h4 style="color:#800020;margin-bottom:10px;">Proof of Payment</h4>
                    <div style="border:2px solid #e0e0e0;border-radius:8px;padding:10px;text-align:center;background:#f9fafb;">
                        <img src="${p.proof_image}" alt="Proof" style="max-width:100%;max-height:350px;border-radius:8px;">
                    </div>
                </div>` : ''}

                ${isActionable ? `
                <div style="margin-bottom:15px;">
                    <h4 style="color:#800020;margin-bottom:8px;">Notes (Optional)</h4>
                    <textarea id="paymentNotes" rows="3" placeholder="Add notes..."
                        style="width:100%;padding:10px;border:2px solid #e0e0e0;border-radius:8px;resize:vertical;"></textarea>
                </div>
                <div style="display:flex;gap:10px;">
                    <button onclick="submitPaymentStatus(${id},'verified')"
                        style="flex:1;padding:12px;background:#059669;color:white;border:none;border-radius:8px;font-size:1rem;cursor:pointer;">
                        <i class="fas fa-check"></i> Verify
                    </button>
                    <button onclick="submitPaymentStatus(${id},'rejected')"
                        style="flex:1;padding:12px;background:#dc2626;color:white;border:none;border-radius:8px;font-size:1rem;cursor:pointer;">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </div>` : ''}
            </div>
        </div>`);
}

function closePaymentReview() {
    const modal = document.getElementById('paymentReviewModal');
    if (modal) modal.remove();
}

async function submitPaymentStatus(id, status) {
    const notes = document.getElementById('paymentNotes')?.value.trim();
    if (!confirm(`${capitalize(status)} this payment?`)) return;

    try {
        const res = await fetch(`${API_BASE_URL_SC}/student-councils/${SC_ID}/payments/${id}/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, admin_notes: notes || `${capitalize(status)} by Student Council` })
        });
        const data = await res.json();
        if (data.success) {
            alert(`âœ… Payment ${status} successfully!`);
            closePaymentReview();
            await loadPayments();
            updateDashboardStats();
            updateBadges();
        } else {
            alert('âŒ Failed: ' + (data.message || 'Unknown error'));
        }
    } catch (e) {
        alert('âŒ Server error. Please try again.');
        console.error(e);
    }
}

// ============================================
// MODAL HELPERS
// ============================================
function openProfileModal() {
    const m = document.getElementById('profileModal');
    if (m) m.classList.add('active');
}
function closeProfileModal() {
    const m = document.getElementById('profileModal');
    if (m) m.classList.remove('active');
}
async function openPaymentSettingsModal() {
    const m = document.getElementById('paymentSettingsModal');
    if (m) m.classList.add('active');
    try {
        const res = await fetch(API_BASE_URL_SC + '/student-councils/' + SC_ID + '/payment-requirements');
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.requirements && data.requirements.length > 0) {
            const r = data.requirements[0];
            const el = id => document.getElementById(id);
            if (el('paymentTitle'))      el('paymentTitle').value      = r.title || '';
            if (el('paymentAmount'))     el('paymentAmount').value     = r.amount || '';
            if (el('paymentDefinition')) el('paymentDefinition').value = r.description || '';
            if (el('gcashName'))         el('gcashName').value         = r.gcash_name || '';
            if (el('gcashNumber'))       el('gcashNumber').value       = r.gcash_number || '';
            if (el('paymentDueDate'))    el('paymentDueDate').value    = r.due_date ? r.due_date.toString().slice(0,10) : '';
            if (el('paymentMandatory'))  el('paymentMandatory').value  = r.is_mandatory ? 'yes' : 'no';
        }
    } catch(e) {
        console.warn('Could not load payment settings:', e.message);
    }
}

function closePaymentSettingsModal() {
    const m = document.getElementById('paymentSettingsModal');
    if (m) m.classList.remove('active');
}

async function handlePaymentSettings(e) {
    e.preventDefault();
    const el = id => document.getElementById(id);
    const title       = el('paymentTitle').value;
    const amount      = el('paymentAmount').value;
    const description = el('paymentDefinition') ? el('paymentDefinition').value : '';
    const gcashName   = el('gcashName').value;
    const gcashNumber = el('gcashNumber') ? el('gcashNumber').value : '';
    const dueDate     = el('paymentDueDate') ? el('paymentDueDate').value : '';
    const isMandatory = el('paymentMandatory') ? el('paymentMandatory').value === 'yes' : true;
    try {
        const res = await fetch(API_BASE_URL_SC + '/student-councils/' + SC_ID + '/payment-requirements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: title,
                amount: amount,
                description: description,
                gcash_name: gcashName,
                gcash_number: gcashNumber,
                due_date: dueDate,
                is_mandatory: isMandatory
            })
        });
        const data = await res.json();
        if (data.success) {
            alert('Payment setting saved successfully!');
            closePaymentSettingsModal();
            el('paymentSettingsForm').reset();
        } else {
            alert('Failed: ' + (data.message || JSON.stringify(data.errors)));
        }
    } catch(err) {
        alert('Server error: ' + err.message);
    }
}
function logout() {
    const m = document.getElementById('logoutModal');
    if (m) m.classList.add('active');
}
function closeLogoutModal() {
    const m = document.getElementById('logoutModal');
    if (m) m.classList.remove('active');
}
function confirmLogout() {
    sessionStorage.removeItem('scDataLoaded');
    sessionStorage.removeItem('scEvents');
    sessionStorage.removeItem('scClearances');
    sessionStorage.removeItem('scPayments');
    sessionStorage.removeItem('scStudents');
    window.location.href = '../user/studentlogin.html';
}

// ============================================
// UTILITY
// ============================================
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Close modals on outside click
window.addEventListener('click', e => {
    ['profileModal', 'paymentSettingsModal', 'logoutModal'].forEach(id => {
        const m = document.getElementById(id);
        if (m && e.target === m) m.classList.remove('active');
    });
});










