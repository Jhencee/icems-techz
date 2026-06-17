// Block Live Server auto-reload
if (typeof WebSocket !== 'undefined') {
  const _OrigWS = WebSocket;
  window.WebSocket = function (url) {
    if (url && url.includes('5500')) return { send: function () { }, close: function () { }, addEventListener: function () { } };
    return new _OrigWS(url);
  };
  window.WebSocket.prototype = _OrigWS.prototype;
}


// ============================================
// ACCOUNTING.JS - CLEAN VERSION
// ============================================

const API_BASE_URL = 'http://127.0.0.1:8000/api';

let clearances = [];
let students = [];
let payments = [];
let clearanceSubmissions = [];
let events = [];
let currentStudentPayments = [];

// ============================================
// INITIALIZE â€” runs ONCE on page load
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  // Show dashboard tab by default
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
  document.getElementById('dashboard-tab').classList.remove('hidden');
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.querySelector('[onclick*="dashboard"]').classList.add('active');

  // Wire up payment form submit inside DOMContentLoaded so elements exist
  const paymentForm = document.getElementById('paymentSettingsForm');
  if (paymentForm) {
    paymentForm.addEventListener('submit', async e => {
      e.preventDefault();
      const formData = new FormData();
      formData.append('title', document.getElementById('paymentTitle').value);
      formData.append('amount', document.getElementById('paymentAmount').value);
      formData.append('description', document.getElementById('paymentDescription').value);
      formData.append('gcash_name', document.getElementById('gcashName').value);
      formData.append('gcash_number', document.getElementById('gcashNumber').value);
      formData.append('due_date', document.getElementById('paymentDueDate').value);
      formData.append('is_mandatory', document.getElementById('paymentMandatory').checked ? 1 : 0);

      const qrFile = document.getElementById('paymentQR').files[0];
      if (qrFile) formData.append('qr_code', qrFile);

      try {
        const response = await fetch(`${API_BASE_URL}/payment-requirements`, {
          method: 'POST', body: formData
        });
        const data = await response.json();

        if (data.success) {
          alert('âœ… Payment requirement created successfully!');
          closePaymentSettingsModal();
          await loadPaymentsFromDatabase();
        } else {
          alert('âŒ Failed: ' + (data.message || 'Unknown error'));
        }
      } catch (error) {
        alert('âŒ Server error. Please try again.');
        console.error(error);
      }
    });
  }

  // Close modal when clicking outside
  window.addEventListener('click', e => {
    const paymentModal = document.getElementById('paymentSettingsModal');
    if (paymentModal && e.target === paymentModal) closePaymentSettingsModal();
  });

  await Promise.all([
    loadClearanceSubmissions(),
    loadStudents(),
    loadPaymentsFromDatabase(),
    loadEventsFromDatabase()
  ]);
});

// ============================================
// DATABASE API FUNCTIONS
// ============================================

async function loadClearanceSubmissions() {
  const tbody = document.getElementById('clearancesTableBody');
  if (tbody) {
    tbody.innerHTML = `
            <tr><td colspan="6">
                <div class="table-empty">
                    <div class="table-empty-icon maroon"><i class="fas fa-spinner fa-spin"></i></div>
                    <h3>Loading submissions...</h3>
                </div>
            </td></tr>`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/clearance/submissions`);
    const data = await response.json();

    if (data.success) {
      clearanceSubmissions = data.submissions || [];
      clearances = clearanceSubmissions.map(sub => ({
        id: sub.id,
        studentId: sub.student_number,
        name: sub.student_name,
        course: `${sub.course} ${sub.year}`,
        description: sub.event_title,
        status: getAccountingStatus(sub.status, sub.accounting_status),
        ssoStatus: sub.status,
        accountingStatus: sub.accounting_status || 'new',
        remarks: sub.accounting_notes || sub.admin_notes || '-',
        submittedAt: sub.submitted_at,
        proofImage: sub.proof_image,
        studentEmail: sub.student_email,
        eventDate: sub.event_date
      }));
      updateDisplay();
    } else {
      showEmptyClearanceState('No clearance submissions found.');
    }
  } catch (error) {
    console.error('Failed to load clearances:', error);
    showEmptyClearanceState('Server error. Make sure Laravel is running on port 8000.');
  }
}

async function loadStudents() {
  try {
    const response = await fetch(`${API_BASE_URL}/students`);
    const data = await response.json();

    if (data.success) {
      students = data.students.map(student => ({
        studentId: student.student_number,
        name: `${student.first_name} ${student.last_name}`,
        course: `${student.course} ${student.year}`,
        email: student.email,
        clearanceProgress: calculateClearanceProgress(student.student_number),
        totalPayments: 0
      }));
      updateDisplay();
    }
  } catch (error) {
    console.error('Failed to load students:', error);
  }
}

async function loadPaymentsFromDatabase() {
  try {
    const response = await fetch(`${API_BASE_URL}/payments`);
    const data = await response.json();

    if (data.success) {
      payments = data.payments.map(payment => ({
        id: payment.id,
        studentId: payment.student_number,
        name: payment.student_name,
        description: payment.requirement_title || payment.description,
        amount: parseFloat(payment.amount),
        date: new Date(payment.created_at || payment.payment_date).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric'
        }),
        status: capitalizeFirst(payment.status),
        proofImage: payment.proof_image
      }));
      updateDisplay();
    }
  } catch (error) {
    console.error('Failed to load payments:', error);
  }
}

async function loadEventsFromDatabase() {
  try {
    const response = await fetch(`${API_BASE_URL}/events`);
    const data = await response.json();

    if (data.success) {
      events = data.events.map(event => ({
        id: event.id,
        title: event.title,
        date: event.event_date,
        time: event.time,
        location: event.location,
        category: event.category,
        isClearance: event.is_clearance
      }));
      updateDisplay();
    }
  } catch (error) {
    console.error('Failed to load events:', error);
  }
}

async function getStudentPaymentHistory(studentNumber) {
  try {
    const response = await fetch(`${API_BASE_URL}/payments?student_number=${studentNumber}`);
    const data = await response.json();
    return data.success ? data.payments : [];
  } catch (error) {
    console.error('Failed to load student payments:', error);
    return [];
  }
}

// ============================================
// ACCOUNTING STATUS HELPER
// ============================================
function getAccountingStatus(ssoStatus, accountingStatus) {
  if (accountingStatus === 'approved') return 'Approved';
  if (accountingStatus === 'rejected') return 'Rejected';
  if (accountingStatus === 'pending') return 'Pending';
  if (ssoStatus === 'approved') return 'New';
  return 'New';
}

function calculateClearanceProgress(studentNumber) {
  const approved = clearanceSubmissions.filter(
    sub => sub.student_number === studentNumber && sub.status === 'approved'
  ).length;
  return Math.min(100, Math.round((approved / 4) * 100));
}

// ============================================
// TAB SWITCHING
// ============================================
function showTab(tabName, event) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  document.getElementById(tabName + '-tab').classList.remove('hidden');
  if (event) event.currentTarget.classList.add('active');
  updateDisplay();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('active');
}

// ============================================
// UPDATE ALL DISPLAYS
// ============================================
function updateDisplay() {
  updateDashboard();
  updateClearancesTable();
  updateStudentsTable();
  updatePaymentsTable();
}

// ============================================
// DASHBOARD STATISTICS
// ============================================
function updateDashboard() {
  const newCount = clearances.filter(c => c.status === 'New').length;
  const pendingCount = clearances.filter(c => c.status === 'Pending').length;
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);

  const dashPendingCount = document.getElementById('dashPendingCount');
  const dashStudentCount = document.getElementById('dashStudentCount');
  const dashPaymentTotal = document.getElementById('dashPaymentTotal');

  if (dashPendingCount) dashPendingCount.textContent = newCount + pendingCount;
  if (dashStudentCount) dashStudentCount.textContent = students.length;
  if (dashPaymentTotal) dashPaymentTotal.textContent = 'â‚±' + totalPayments.toLocaleString();

  displayDashboardEvents();
}

// ============================================
// CLEARANCES TABLE
// ============================================
function updateClearancesTable() {
  const tbody = document.getElementById('clearancesTableBody');
  if (!tbody) return;

  if (clearances.length === 0) {
    tbody.innerHTML = `
            <tr><td colspan="6">
                <div class="table-empty">
                    <div class="table-empty-icon maroon"><i class="fas fa-clipboard-check"></i></div>
                    <h3>No Clearances Yet</h3>
                    <p>Clearance requests will appear here once students submit them.</p>
                </div>
            </td></tr>`;
  } else {
    tbody.innerHTML = clearances.map(c => {
      const actionButtons = (c.status === 'New' || c.status === 'Pending')
        ? `<button class="btn btn-approve" onclick="viewClearanceDetailsForAction(${c.id})">Review</button>`
        : `<button class="btn btn-primary" onclick="viewClearanceDetails(${c.id})" style="padding:6px 10px;font-size:0.8rem;"><i class="fas fa-eye"></i> View</button>`;

      const statusBadge = c.status === 'New'
        ? `<span class="status-badge" style="background:#f59e0b;color:white;">Pending</span>`
        : `<span class="status-badge status-${c.status.toLowerCase()}">${c.status}</span>`;

      return `
                <tr>
                    <td>${c.studentId}</td>
                    <td style="font-weight:500;">${c.name}</td>
                    <td>${c.course}</td>
                    <td>${c.description}</td>
                    <td>${statusBadge}</td>
                    <td>${actionButtons}</td>
                </tr>`;
    }).join('');
  }

  const clearanceCount = document.getElementById('clearanceCount');
  if (clearanceCount) clearanceCount.textContent = clearances.length;
}

// ============================================
// STUDENTS TABLE
// ============================================
function updateStudentsTable() {
  const tbody = document.getElementById('studentsTableBody');
  if (!tbody) return;

  if (students.length === 0) {
    tbody.innerHTML = `
            <tr><td colspan="6">
                <div class="table-empty">
                    <div class="table-empty-icon maroon"><i class="fas fa-user-graduate"></i></div>
                    <h3>No Students Registered</h3>
                    <p>Student records will appear here once they register.</p>
                </div>
            </td></tr>`;
  } else {
    tbody.innerHTML = students.map(s => `
            <tr>
                <td>${s.studentId}</td>
                <td style="font-weight:500;">${s.name}</td>
                <td>${s.course}</td>
                <td>${s.email}</td>
                <td>
                    <div class="progress-container">
                        <div class="progress-bar"><div class="progress-fill" style="width:${s.clearanceProgress}%"></div></div>
                        <span class="progress-text">${s.clearanceProgress}%</span>
                    </div>
                </td>
                <td>â‚±${s.totalPayments.toLocaleString()}</td>
            </tr>`).join('');
  }
}

// ============================================
// PAYMENTS TABLE
// ============================================
function updatePaymentsTable() {
  const tbody = document.getElementById('paymentsTableBody');
  if (!tbody) return;

  if (payments.length === 0) {
    tbody.innerHTML = `
            <tr><td colspan="7">
                <div class="table-empty">
                    <div class="table-empty-icon maroon"><i class="fas fa-coins"></i></div>
                    <h3>No Payment Submissions</h3>
                    <p>Payment submissions will appear here once students pay.</p>
                </div>
            </td></tr>`;
  } else {
    tbody.innerHTML = payments.map(p => `
            <tr>
                <td>${p.studentId}</td>
                <td style="font-weight:500;">${p.name}</td>
                <td>${p.description}</td>
                <td>â‚±${p.amount.toLocaleString()}</td>
                <td>${p.date}</td>
                <td><span class="status-badge status-${p.status.toLowerCase()}">${p.status}</span></td>
                <td>
                    <button class="btn btn-primary" onclick="viewPaymentDetails(${p.id})" style="padding:6px 10px;font-size:0.8rem;">
                        <i class="fas fa-eye"></i> ${p.status === 'Pending' ? 'Review' : 'View'}
                    </button>
                </td>
            </tr>`).join('');
  }
}

// ============================================
// DISPLAY DASHBOARD EVENTS
// ============================================
function displayDashboardEvents() {
  const dashboardSection = document.querySelector('#dashboard-tab');
  if (!dashboardSection || events.length === 0) return;

  // Remove any previously rendered events table to avoid duplicates
  const existing = document.getElementById('dashboardEventsTable');
  if (existing) existing.remove();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingEvents = [...events]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .filter(e => new Date(e.date) >= today)
    .slice(0, 5);

  if (upcomingEvents.length === 0) return;

  const rows = upcomingEvents.map(event => {
    const eventDate = new Date(event.date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
    const eventType = event.isClearance
      ? '<span style="color:#dc2626;font-weight:600;">MANDATORY</span>'
      : '<span style="color:#059669;font-weight:600;">OPTIONAL</span>';
    return `
            <tr style="border-bottom:1px solid #e5e7eb;">
                <td style="padding:12px;font-weight:500;color:#333;">${event.title}</td>
                <td style="padding:12px;color:#666;">${eventDate}</td>
                <td style="padding:12px;color:#666;">${event.time || 'TBA'}</td>
                <td style="padding:12px;color:#666;">${event.location || 'TBA'}</td>
                <td style="padding:12px;">${eventType}</td>
            </tr>`;
  }).join('');

  const html = `
        <div id="dashboardEventsTable" style="margin-top:40px;">
            <h2 style="color:#800020;font-size:1.3rem;margin:0 0 20px 0;">
                <i class="fas fa-calendar-alt"></i> Upcoming Events
            </h2>
            <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;">
                    <thead>
                        <tr style="background:#f3f4f6;border-bottom:2px solid #e5e7eb;">
                            <th style="padding:12px;text-align:left;color:#800020;">Event Name</th>
                            <th style="padding:12px;text-align:left;color:#800020;">Date</th>
                            <th style="padding:12px;text-align:left;color:#800020;">Time</th>
                            <th style="padding:12px;text-align:left;color:#800020;">Location</th>
                            <th style="padding:12px;text-align:left;color:#800020;">Type</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        </div>`;

  const emptyState = dashboardSection.querySelector('.empty-state');
  if (emptyState) {
    emptyState.insertAdjacentHTML('afterend', html);
  } else {
    dashboardSection.insertAdjacentHTML('beforeend', html);
  }
}

// ============================================
// APPROVE SUBMISSION
// ============================================
async function approveSubmission(submissionId) {
  const accountingNotes = document.getElementById('accountingNotes')?.value.trim();
  if (!confirm('Approve this clearance submission?')) return;

  try {
    const response = await fetch(`${API_BASE_URL}/clearance/submissions/${submissionId}/accounting-status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accounting_status: 'approved',
        accounting_notes: accountingNotes || 'Approved by Accounting'
      })
    });
    const data = await response.json();

    if (data.success) {
      alert('âœ… Clearance approved successfully!');
      closeClearanceDetailsModal();
      await loadClearanceSubmissions();
    } else {
      alert('âŒ Failed to approve: ' + (data.message || 'Unknown error'));
    }
  } catch (error) {
    alert('âŒ Server error. Please try again.');
    console.error(error);
  }
}

// ============================================
// MARK AS PENDING
// ============================================
async function markAsPending(submissionId) {
  if (!confirm('Mark this clearance as pending for review?')) return;

  try {
    const response = await fetch(`${API_BASE_URL}/clearance/submissions/${submissionId}/accounting-status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accounting_status: 'pending',
        accounting_notes: 'Under review by Accounting'
      })
    });
    const data = await response.json();

    if (data.success) {
      alert('ðŸ“‹ Clearance marked as pending!');
      closeClearanceDetailsModal();
      await loadClearanceSubmissions();
    } else {
      alert('âŒ Failed to update: ' + (data.message || 'Unknown error'));
    }
  } catch (error) {
    alert('âŒ Server error. Please try again.');
    console.error(error);
  }
}

function markClearanceAsPending(id) {
  markAsPending(id);
}

// ============================================
// REJECT SUBMISSION
// ============================================
async function rejectSubmission(submissionId) {
  const accountingNotes = document.getElementById('accountingNotes')?.value.trim();
  if (!confirm('Reject this clearance submission?')) return;

  try {
    const response = await fetch(`${API_BASE_URL}/clearance/submissions/${submissionId}/accounting-status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accounting_status: 'rejected',
        accounting_notes: accountingNotes || 'Rejected by Accounting'
      })
    });
    const data = await response.json();

    if (data.success) {
      alert('âŒ Clearance rejected.');
      closeClearanceDetailsModal();
      await loadClearanceSubmissions();
    } else {
      alert('âŒ Failed to reject: ' + (data.message || 'Unknown error'));
    }
  } catch (error) {
    alert('âŒ Server error. Please try again.');
    console.error(error);
  }
}

// ============================================
// VIEW CLEARANCE DETAILS (Read-only)
// ============================================
function viewClearanceDetails(id) {
  viewClearanceDetailsForAction(id);
}

// ============================================
// VIEW CLEARANCE DETAILS FOR ACTION (Review Mode)
// ============================================
async function viewClearanceDetailsForAction(id) {
  const clearance = clearances.find(c => c.id === id);
  const submission = clearanceSubmissions.find(s => s.id === id);
  if (!clearance || !submission) return;

  const studentPayments = await getStudentPaymentHistory(clearance.studentId);
  currentStudentPayments = studentPayments;

  const submittedDate = new Date(clearance.submittedAt).toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
    year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  const eventDate = new Date(clearance.eventDate).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  });

  const statusColors = { 'New': '#3b82f6', 'Pending': '#f59e0b', 'Approved': '#059669', 'Rejected': '#dc2626' };
  const statusColor = statusColors[clearance.status] || '#666';
  const paymentTableHTML = generatePaymentTableHTML(studentPayments);
  const isActionable = clearance.status === 'New' || clearance.status === 'Pending';

  document.body.insertAdjacentHTML('beforeend', `
        <div class="modal active" id="clearanceDetailsModal"
            style="display:flex;position:fixed;top:0;left:0;width:100%;height:100%;
            background:rgba(0,0,0,0.5);z-index:10000;justify-content:center;align-items:center;overflow-y:auto;padding:20px;">
            <div style="background:white;border-radius:12px;padding:30px;max-width:1100px;width:90%;
                max-height:90vh;overflow-y:auto;position:relative;">
                <span onclick="closeClearanceDetailsModal()"
                    style="position:absolute;top:15px;right:20px;font-size:2rem;cursor:pointer;color:#666;">&times;</span>
                <h2 style="color:#800020;margin-bottom:20px;">
                    <i class="fas fa-clipboard-check"></i> Clearance Submission Review
                </h2>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
                    <div>
                        <h3 style="color:#800020;margin-bottom:10px;">Student Information</h3>
                        <div style="background:#f9fafb;padding:15px;border-radius:8px;">
                            <p><strong>Name:</strong> ${clearance.name}</p>
                            <p><strong>Student No:</strong> ${clearance.studentId}</p>
                            <p><strong>Email:</strong> ${clearance.studentEmail}</p>
                            <p><strong>Course:</strong> ${clearance.course}</p>
                        </div>
                    </div>
                    <div>
                        <h3 style="color:#800020;margin-bottom:10px;">Event Information</h3>
                        <div style="background:#f9fafb;padding:15px;border-radius:8px;">
                            <p><strong>Event:</strong> ${clearance.description}</p>
                            <p><strong>Date:</strong> ${eventDate}</p>
                            <p><strong>Submitted:</strong> ${submittedDate}</p>
                            <p><strong>Status:</strong> <span style="color:${statusColor};font-weight:600;">${clearance.status}</span></p>
                        </div>
                    </div>
                </div>
                ${paymentTableHTML}
                <div style="margin-bottom:20px;">
                    <h3 style="color:#800020;margin-bottom:10px;">Proof of Attendance</h3>
                    <div style="border:2px solid #e0e0e0;border-radius:8px;padding:10px;background:#f9fafb;text-align:center;">
                        <img src="${clearance.proofImage}" alt="Proof" style="max-width:100%;max-height:400px;border-radius:8px;">
                    </div>
                </div>
                ${isActionable ? `
                <div style="margin-bottom:20px;">
                    <h3 style="color:#800020;margin-bottom:10px;">Accounting Notes (Optional)</h3>
                    <textarea id="accountingNotes" rows="3" placeholder="Add notes for the student..."
                        style="width:100%;padding:10px;border:2px solid #e0e0e0;border-radius:8px;resize:vertical;"></textarea>
                </div>
                <div style="display:flex;gap:10px;border-top:1px solid #e5e7eb;padding-top:20px;">
                    <button class="btn btn-primary" onclick="approveSubmission(${id})" style="flex:1;background:#059669;">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn btn-danger" onclick="rejectSubmission(${id})" style="flex:1;background:#dc2626;">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </div>` : clearance.remarks && clearance.remarks !== '-' ? `
                <div style="margin-bottom:20px;">
                    <h3 style="color:#800020;margin-bottom:10px;">Accounting Notes</h3>
                    <div style="background:#f9fafb;padding:15px;border-radius:8px;"><p>${clearance.remarks}</p></div>
                </div>` : ''}
            </div>
        </div>`);
}

function closeClearanceDetailsModal() {
  const modal = document.getElementById('clearanceDetailsModal');
  if (modal) modal.remove();
}

// ============================================
// PAYMENT TABLE HTML GENERATOR
// ============================================
function generatePaymentTableHTML(studentPayments) {
  if (!studentPayments || studentPayments.length === 0) {
    return `<div style="margin-bottom:20px;background:#f9fafb;padding:15px;border-radius:8px;text-align:center;color:#666;">
            <i class="fas fa-coins"></i> No payment records found for this student.
        </div>`;
  }

  const rows = studentPayments.map(p => `
        <tr style="border-bottom:1px solid #e5e7eb;">
            <td style="padding:10px;">${p.requirement_title || p.description || '-'}</td>
            <td style="padding:10px;">â‚±${parseFloat(p.amount).toLocaleString()}</td>
            <td style="padding:10px;">${new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
            <td style="padding:10px;"><span class="status-badge status-${(p.status || '').toLowerCase()}">${capitalizeFirst(p.status)}</span></td>
        </tr>`).join('');

  return `
        <div style="margin-bottom:20px;">
            <h3 style="color:#800020;margin-bottom:10px;">Payment History</h3>
            <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;">
                    <thead>
                        <tr style="background:#f3f4f6;border-bottom:2px solid #e5e7eb;">
                            <th style="padding:10px;text-align:left;color:#800020;">Description</th>
                            <th style="padding:10px;text-align:left;color:#800020;">Amount</th>
                            <th style="padding:10px;text-align:left;color:#800020;">Date</th>
                            <th style="padding:10px;text-align:left;color:#800020;">Status</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        </div>`;
}

// ============================================
// PAYMENT SETTINGS MODAL
// ============================================
function openPaymentSettingsModal() {
  const paymentModal = document.getElementById('paymentSettingsModal');
  if (paymentModal) {
    paymentModal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
}

function closePaymentSettingsModal() {
  const paymentModal = document.getElementById('paymentSettingsModal');
  const paymentForm = document.getElementById('paymentSettingsForm');
  if (paymentModal) {
    paymentModal.classList.remove('show');
    document.body.style.overflow = 'auto';
  }
  if (paymentForm) {
    paymentForm.reset();
    const qrPreview = document.getElementById('qrPreview');
    if (qrPreview) { qrPreview.style.display = 'none'; qrPreview.innerHTML = ''; }
  }
}

function handleQRPreview(event) {
  const file = event.target.files[0];
  const qrPreview = document.getElementById('qrPreview');
  if (file && qrPreview) {
    const reader = new FileReader();
    reader.onload = e => {
      qrPreview.innerHTML = `<img src="${e.target.result}" alt="QR Preview"
                style="max-width:200px;max-height:200px;border-radius:8px;margin-top:10px;">
                <p style="margin-top:5px;font-size:0.9rem;color:#666;">QR Code Preview</p>`;
      qrPreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function showEmptyClearanceState(message) {
  const tbody = document.getElementById('clearancesTableBody');
  if (!tbody) return;
  tbody.innerHTML = `
        <tr><td colspan="6">
            <div class="table-empty">
                <div class="table-empty-icon maroon"><i class="fas fa-exclamation-triangle"></i></div>
                <h3>Cannot Load Clearances</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="loadClearanceSubmissions()" style="margin-top:15px;padding:10px 20px;">
                    <i class="fas fa-sync"></i> Retry
                </button>
            </div>
        </td></tr>`;
}
// ============================================
// LOGOUT
// ============================================
function logout() {
  document.getElementById('logoutModal').style.display = 'flex';
}

function closeLogoutModal() {
  document.getElementById('logoutModal').style.display = 'none';
}

function confirmLogout() {
  localStorage.removeItem('currentUser');
  window.location.href = '../user/studentlogin.html';
}