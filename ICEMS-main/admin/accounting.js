// Load payments from database
async function loadPaymentsFromDatabase() {
  console.log('🔍 [Accounting] Loading payment submissions...');

  try {
    const response = await fetch(`${API_BASE_URL}/payments`);
    const data = await response.json();

    if (data.success) {
      payments = data.payments.map(payment => ({
        id: payment.id,
        studentId: payment.student_number,
        name: payment.student_name,
        description: payment.requirement_title,
        amount: parseFloat(payment.amount),
        date: new Date(payment.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        status: capitalizeFirst(payment.status),
        proofImage: payment.proof_image
      }));

      console.log('✅ [Accounting] Loaded', payments.length, 'payment submissions');
      updateDisplay();
      return payments;
    } else {
      console.error('❌ [Accounting] Failed to load payments:', data.message);
      return [];
    }
  } catch (error) {
    console.error('❌ [Accounting] Error loading payments:', error);
    console.warn('⚠️ [Accounting] Payments endpoint not available yet');
    return [];
  }
}


// Load events from database
async function loadEventsFromDatabase() {
  console.log('🔍 [Accounting] Loading events...');

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

      console.log('✅ [Accounting] Loaded', events.length, 'events');
      updateDisplay();
      return events;
    } else {
      console.error('❌ [Accounting] Failed to load events:', data.message);
      return [];
    }
  } catch (error) {
    console.error('❌ [Accounting] Error loading events:', error);
    console.warn('⚠️ [Accounting] Events endpoint not available yet');
    return [];
  }
}// ============================================
// ACCOUNTING.JS - WITH DATABASE INTEGRATION
// ============================================

const API_BASE_URL = 'http://localhost:8000/api';

// Data storage 
let clearances = [];
let students = [];
let payments = [];
let clearanceSubmissions = [];
let events = [];

// ============================================
// DATABASE API FUNCTIONS
// ============================================

// Load clearance submissions from database
async function loadClearanceSubmissions() {
  console.log('🔍 [Accounting] Loading clearance submissions...');

  const tbody = document.getElementById('clearancesTableBody');
  if (tbody) {
    tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="table-empty">
                        <div class="table-empty-icon maroon"><i class="fas fa-spinner fa-spin"></i></div>
                        <h3>Loading submissions...</h3>
                    </div>
                </td>
            </tr>
        `;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/clearance/submissions`);
    const data = await response.json();

    if (data.success) {
      clearanceSubmissions = data.submissions || [];
      console.log('✅ [Accounting] Loaded', clearanceSubmissions.length, 'submissions');

      // Transform to accounting format with accounting-specific status
      clearances = clearanceSubmissions.map(sub => ({
        id: sub.id,
        studentId: sub.student_number,
        name: sub.student_name,
        course: `${sub.course} ${sub.year}`,
        description: sub.event_title,
        status: getAccountingStatus(sub.status, sub.accounting_status),
        ssoStatus: sub.status, // Keep original SSO status
        accountingStatus: sub.accounting_status || 'new', // Accounting's own status
        remarks: sub.accounting_notes || sub.admin_notes || '-',
        submittedAt: sub.submitted_at,
        proofImage: sub.proof_image,
        studentEmail: sub.student_email,
        eventDate: sub.event_date
      }));

      updateDisplay();
      return clearanceSubmissions;
    } else {
      console.error('❌ [Accounting] Failed to load submissions:', data.message);
      showEmptyClearanceState('Failed to load clearance data from server');
      return [];
    }
  } catch (error) {
    console.error('❌ [Accounting] Error loading submissions:', error);
    showEmptyClearanceState('Cannot connect to server. Please check if Laravel is running.');
    return [];
  }
}

// Get accounting-specific status
function getAccountingStatus(ssoStatus, accountingStatus) {
  // If accounting hasn't reviewed yet, status is 'New'
  if (!accountingStatus || accountingStatus === 'new') {
    return 'New';
  }

  // Otherwise use accounting's status
  return capitalizeFirst(accountingStatus);
}

// Load students from database
async function loadStudentsFromDatabase() {
  console.log('🔍 [Accounting] Loading students...');

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
        totalPayments: 0 // Will be calculated from payments
      }));

      console.log('✅ [Accounting] Loaded', students.length, 'students');
      updateDisplay();
      return students;
    } else {
      console.error('❌ [Accounting] Failed to load students:', data.message);
      return [];
    }
  } catch (error) {
    console.error('❌ [Accounting] Error loading students:', error);
    return [];
  }
}

// Load payments from database (if you have a payments endpoint)
async function loadPaymentsFromDatabase() {
  console.log('🔍 [Accounting] Loading payments...');

  try {
    const response = await fetch(`${API_BASE_URL}/payments`);
    const data = await response.json();

    if (data.success) {
      payments = data.payments.map(payment => ({
        studentId: payment.student_number,
        name: payment.student_name,
        description: payment.description,
        amount: parseFloat(payment.amount),
        date: new Date(payment.payment_date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        status: capitalizeFirst(payment.status)
      }));

      console.log('✅ [Accounting] Loaded', payments.length, 'payments');
      updateDisplay();
      return payments;
    } else {
      console.error('❌ [Accounting] Failed to load payments:', data.message);
      return [];
    }
  } catch (error) {
    console.error('❌ [Accounting] Error loading payments:', error);
    // If payments endpoint doesn't exist yet, return empty array
    console.warn('⚠️ [Accounting] Payments endpoint not available yet');
    return [];
  }
}

// Calculate clearance progress for a student
function calculateClearanceProgress(studentNumber) {
  const studentSubmissions = clearanceSubmissions.filter(
    sub => sub.student_number === studentNumber && sub.status === 'approved'
  );

  // Assuming 4 required clearances
  const totalRequired = 4;
  const completed = studentSubmissions.length;

  return Math.min(100, Math.round((completed / totalRequired) * 100));
}

// ============================================
// TAB SWITCHING
// ============================================
function showTab(tabName, event) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  document.getElementById(tabName + '-tab').classList.remove('hidden');

  if (event) {
    event.currentTarget.classList.add('active');
  }

  updateDisplay();
}

// ============================================
// SIDEBAR TOGGLE (MOBILE)
// ============================================
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
  // Count based on accounting status, not SSO status
  const newCount = clearances.filter(c => c.status === 'New').length;
  const pendingCount = clearances.filter(c => c.status === 'Pending').length;
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);

  const dashPendingCount = document.getElementById('dashPendingCount');
  const dashStudentCount = document.getElementById('dashStudentCount');
  const dashPaymentTotal = document.getElementById('dashPaymentTotal');

  // Show combined new + pending as "Pending" in dashboard
  if (dashPendingCount) dashPendingCount.textContent = newCount + pendingCount;
  if (dashStudentCount) dashStudentCount.textContent = students.length;
  if (dashPaymentTotal) dashPaymentTotal.textContent = '₱' + totalPayments.toLocaleString();

  // Display events in dashboard
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
            <tr>
                <td colspan="6">
                    <div class="table-empty">
                        <div class="table-empty-icon maroon"><i class="fas fa-clipboard-check"></i></div>
                        <h3>No Clearances Yet</h3>
                        <p>Clearance requests will appear here once students submit them.</p>
                    </div>
                </td>
            </tr>`;
  } else {
    tbody.innerHTML = clearances.map(c => {
      let actionButtons = '';

      // Show different buttons based on accounting status
      if (c.status === 'New' || c.status === 'Pending') {
        actionButtons = `
                    <button class="btn btn-approve" onclick="viewClearanceDetailsForAction(${c.id})">Review</button>`;
      } else {
        actionButtons = `<button class="btn btn-primary" onclick="viewClearanceDetails(${c.id})" style="padding: 6px 10px; font-size: 0.8rem;">
                    <i class="fas fa-eye"></i> View
                </button>`;
      }

      return `
                <tr>
                    <td>${c.studentId}</td>
                    <td style="font-weight:500;">${c.name}</td>
                    <td>${c.course}</td>
                    <td>${c.description}</td>
                    <td>
                        ${c.status === 'New' ? `<span class="status-badge" style="background: #f59e0b; color: white;">Pending</span>` : `<span class="status-badge status-${c.status.toLowerCase()}">${c.status}</span>`}
                    </td>
                    <td>${actionButtons}</td>
                </tr>`;
    }).join('');
  }

  const clearanceCount = document.getElementById('clearanceCount');
  if (clearanceCount) {
    clearanceCount.textContent = clearances.length;
  }
}

// ============================================
// STUDENTS TABLE
// ============================================
function updateStudentsTable() {
  const tbody = document.getElementById('studentsTableBody');
  if (!tbody) return;

  if (students.length === 0) {
    tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="table-empty">
                        <div class="table-empty-icon maroon"><i class="fas fa-user-graduate"></i></div>
                        <h3>No Students Registered</h3>
                        <p>Student records will appear here once they register in the system.</p>
                    </div>
                </td>
            </tr>`;
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
                <td>₱${s.totalPayments.toLocaleString()}</td>
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
            <tr>
                <td colspan="7">
                    <div class="table-empty">
                        <div class="table-empty-icon maroon"><i class="fas fa-coins"></i></div>
                        <h3>No Payment Submissions</h3>
                        <p>Payment submissions will appear here once students pay.</p>
                    </div>
                </td>
            </tr>`;
  } else {
    tbody.innerHTML = payments.map(p => {
      const actionButton = `<button class="btn btn-primary" onclick="viewPaymentDetails(${p.id})" style="padding: 6px 10px; font-size: 0.8rem;">
                <i class="fas fa-eye"></i> ${p.status === 'Pending' ? 'Review' : 'View'}
            </button>`;

      return `
            <tr>
                <td>${p.studentId}</td>
                <td style="font-weight:500;">${p.name}</td>
                <td>${p.description}</td>
                <td>₱${p.amount.toLocaleString()}</td>
                <td>${p.date}</td>
                <td><span class="status-badge status-${p.status.toLowerCase()}">${p.status}</span></td>
                <td>${actionButton}</td>
            </tr>`;
    }).join('');
  }
}

// Mark clearance as pending directly from table
function markClearanceAsPending(id) {
  markAsPending(id);
}

// ============================================
// DISPLAY DASHBOARD EVENTS
// ============================================
function displayDashboardEvents() {
  const dashboardSection = document.querySelector('#dashboard-tab');
  if (!dashboardSection) return;

  if (events.length === 0) {
    return; // Keep the default empty state if no events
  }

  // Sort events by date (upcoming first)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sortedEvents = [...events].sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });

  // Get only upcoming events, limit to 5
  const upcomingEvents = sortedEvents.filter(e => new Date(e.date) >= today).slice(0, 5);

  if (upcomingEvents.length === 0) {
    return; // No upcoming events
  }

  // Find the empty state div and replace it with events
  const emptyState = dashboardSection.querySelector('.empty-state');
  if (!emptyState) return;

  let html = `
        <div style="margin-top: 40px;">
            <div style="margin-bottom: 20px;">
                <h2 style="color: #800020; font-size: 1.3rem; margin: 0 0 20px 0;">
                    <i class="fas fa-calendar-alt"></i> Upcoming Events
                </h2>
            </div>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
                            <th style="padding: 12px; text-align: left; color: #800020; font-weight: 600;">Event Name</th>
                            <th style="padding: 12px; text-align: left; color: #800020; font-weight: 600;">Date</th>
                            <th style="padding: 12px; text-align: left; color: #800020; font-weight: 600;">Time</th>
                            <th style="padding: 12px; text-align: left; color: #800020; font-weight: 600;">Location</th>
                            <th style="padding: 12px; text-align: left; color: #800020; font-weight: 600;">Type</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

  upcomingEvents.forEach(event => {
    const eventDate = new Date(event.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const eventType = event.isClearance
      ? '<span style="color:#dc2626; font-weight: 600;">MANDATORY</span>'
      : '<span style="color:#059669; font-weight: 600;">OPTIONAL</span>';

    html += `
            <tr style="border-bottom: 1px solid #e5e7eb; transition: background 0.2s;">
                <td style="padding: 12px; font-weight: 500; color: #333;">${event.title}</td>
                <td style="padding: 12px; color: #666;">${eventDate}</td>
                <td style="padding: 12px; color: #666;">${event.time || 'TBA'}</td>
                <td style="padding: 12px; color: #666;">${event.location || 'TBA'}</td>
                <td style="padding: 12px;">${eventType}</td>
            </tr>
        `;
  });

  html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;

  emptyState.insertAdjacentHTML('afterend', html);
}

// ✅ APPROVE SUBMISSION (SSO STYLE)
async function approveSubmission(submissionId) {
  const accountingNotes = document.getElementById('accountingNotes')?.value.trim();

  if (!confirm('Approve this clearance submission?')) return;

  try {
    const response = await fetch(`${API_BASE_URL}/clearance/submissions/${submissionId}/accounting-status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accounting_status: 'approved',
        accounting_notes: accountingNotes || 'Approved by Accounting'
      })
    });

    const data = await response.json();

    if (data.success) {
      alert('✅ Clearance approved successfully!');
      closeClearanceDetailsModal();
      await loadClearanceSubmissions();
    } else {
      alert('❌ ' + (data.message || 'Failed to approve submission'));
    }
  } catch (error) {
    console.error('Error approving submission:', error);
    alert('❌ Failed to approve clearance. Please try again.');
  }
}

// ❌ REJECT SUBMISSION (SSO STYLE)
async function rejectSubmission(submissionId) {
  const accountingNotes = document.getElementById('accountingNotes')?.value.trim();

  if (!accountingNotes) {
    alert('Please provide a reason for rejection in the accounting notes.');
    return;
  }

  if (!confirm('Reject this clearance submission?')) return;

  try {
    const response = await fetch(`${API_BASE_URL}/clearance/submissions/${submissionId}/accounting-status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accounting_status: 'rejected',
        accounting_notes: accountingNotes
      })
    });

    const data = await response.json();

    if (data.success) {
      alert('❌ Submission rejected.');
      closeClearanceDetailsModal();
      await loadClearanceSubmissions();
    } else {
      alert('❌ ' + (data.message || 'Failed to reject submission'));
    }
  } catch (error) {
    console.error('Error rejecting submission:', error);
    alert('❌ Failed to reject submission. Please try again.');
  }
}

// ⏳ MARK AS PENDING (SSO STYLE)
async function markAsPending(submissionId) {
  if (!confirm('Mark this clearance as pending for review?')) return;

  try {
    const response = await fetch(`${API_BASE_URL}/clearance/submissions/${submissionId}/accounting-status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accounting_status: 'pending',
        accounting_notes: 'Under review by Accounting'
      })
    });

    const data = await response.json();

    if (data.success) {
      alert('📋 Clearance marked as pending for review!');
      closeClearanceDetailsModal();
      await loadClearanceSubmissions();
    } else {
      alert('❌ Failed to update: ' + (data.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error marking as pending:', error);
    alert('❌ Failed to mark as pending. Please try again.');
  }
}

// ============================================
// VIEW CLEARANCE DETAILS MODAL FOR ACTION
// ============================================
async function viewClearanceDetails(id) {
  const clearance = clearances.find(c => c.id === id);
  const submission = clearanceSubmissions.find(s => s.id === id);

  if (!clearance || !submission) return;

  // Fetch student's payment history
  const studentPayments = await getStudentPaymentHistory(clearance.studentId);
  currentStudentPayments = studentPayments; // Store for viewPaymentProof function

  const submittedDate = new Date(clearance.submittedAt).toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const eventDate = new Date(clearance.eventDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const statusColors = {
    'New': '#3b82f6',
    'Pending': '#f59e0b',
    'Approved': '#059669',
    'Rejected': '#dc2626'
  };

  const statusColor = statusColors[clearance.status] || '#666';

  // Generate payment table HTML
  const paymentTableHTML = generatePaymentTableHTML(studentPayments);

  const modalHTML = `
    <div class="modal active" id="clearanceDetailsModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; justify-content: center; align-items: center; overflow-y: auto; padding: 20px;">
      <div class="modal-content" style="background: white; border-radius: 12px; padding: 30px; max-width: 1100px; width: 90%; max-height: 90vh; overflow-y: auto; position: relative;">
        <span onclick="closeClearanceDetailsModal()" style="position: absolute; top: 15px; right: 20px; font-size: 2rem; cursor: pointer; color: #666;">&times;</span>
        
        <h2 style="color: #800020; margin-bottom: 20px;">
          <i class="fas fa-clipboard-check"></i> Clearance Details
        </h2>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div>
            <h3 style="color: #800020; margin-bottom: 10px;">Student Information</h3>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
              <p><strong>Name:</strong> ${clearance.name}</p>
              <p><strong>Student No:</strong> ${clearance.studentId}</p>
              <p><strong>Email:</strong> ${clearance.studentEmail}</p>
              <p><strong>Course:</strong> ${clearance.course}</p>
            </div>
          </div>
          
          <div>
            <h3 style="color: #800020; margin-bottom: 10px;">Event Information</h3>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
              <p><strong>Event:</strong> ${clearance.description}</p>
              <p><strong>Date:</strong> ${eventDate}</p>
              <p><strong>Submitted:</strong> ${submittedDate}</p>
              <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: 600;">${clearance.status}</span></p>
            </div>
          </div>
        </div>

        <!-- Payment Table Section (Replaces Payment History Cards) -->
        ${paymentTableHTML}
        
        ${clearance.remarks && clearance.remarks !== '-' ? `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #800020; margin-bottom: 10px;">Accounting Notes</h3>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
            <p>${clearance.remarks}</p>
          </div>
        </div>
        ` : ''}
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #800020; margin-bottom: 10px;">Proof of Attendance</h3>
          <div style="border: 2px solid #e0e0e0; border-radius: 8px; padding: 10px; background: #f9fafb; text-align: center;">
            <img src="${clearance.proofImage}" alt="Proof" style="max-width: 100%; max-height: 400px; border-radius: 8px;">
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// ============================================
// VIEW CLEARANCE DETAILS FOR ACTION (Review Mode) - With Payment Table
// ============================================
async function viewClearanceDetailsForAction(id) {
  const clearance = clearances.find(c => c.id === id);
  const submission = clearanceSubmissions.find(s => s.id === id);

  if (!clearance || !submission) return;

  // Fetch student's payment history
  const studentPayments = await getStudentPaymentHistory(clearance.studentId);
  currentStudentPayments = studentPayments; // Store for viewPaymentProof function

  const submittedDate = new Date(clearance.submittedAt).toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const eventDate = new Date(clearance.eventDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const statusColors = {
    'New': '#3b82f6',
    'Pending': '#f59e0b',
    'Approved': '#059669',
    'Rejected': '#dc2626'
  };

  const statusColor = statusColors[clearance.status] || '#666';

  // Generate payment table HTML
  const paymentTableHTML = generatePaymentTableHTML(studentPayments);

  const modalHTML = `
    <div class="modal active" id="clearanceDetailsModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; justify-content: center; align-items: center; overflow-y: auto; padding: 20px;">
      <div class="modal-content" style="background: white; border-radius: 12px; padding: 30px; max-width: 1100px; width: 90%; max-height: 90vh; overflow-y: auto; position: relative;">
        <span onclick="closeClearanceDetailsModal()" style="position: absolute; top: 15px; right: 20px; font-size: 2rem; cursor: pointer; color: #666;">&times;</span>
        
        <h2 style="color: #800020; margin-bottom: 20px;">
          <i class="fas fa-clipboard-check"></i> Clearance Submission Review
        </h2>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div>
            <h3 style="color: #800020; margin-bottom: 10px;">Student Information</h3>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
              <p><strong>Name:</strong> ${clearance.name}</p>
              <p><strong>Student No:</strong> ${clearance.studentId}</p>
              <p><strong>Email:</strong> ${clearance.studentEmail}</p>
              <p><strong>Course:</strong> ${clearance.course}</p>
            </div>
          </div>
          
          <div>
            <h3 style="color: #800020; margin-bottom: 10px;">Event Information</h3>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
              <p><strong>Event:</strong> ${clearance.description}</p>
              <p><strong>Date:</strong> ${eventDate}</p>
              <p><strong>Submitted:</strong> ${submittedDate}</p>
              <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: 600;">${clearance.status}</span></p>
            </div>
          </div>
        </div>

        <!-- Payment Table Section (Replaces Payment History Cards) -->
        ${paymentTableHTML}
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #800020; margin-bottom: 10px;">Proof of Attendance</h3>
          <div style="border: 2px solid #e0e0e0; border-radius: 8px; padding: 10px; background: #f9fafb; text-align: center;">
            <img src="${clearance.proofImage}" alt="Proof" style="max-width: 100%; max-height: 400px; border-radius: 8px;">
          </div>
        </div>
        
        ${clearance.status === 'New' || clearance.status === 'Pending' ? `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #800020; margin-bottom: 10px;">Accounting Notes (Optional)</h3>
          <textarea id="accountingNotes" rows="3" placeholder="Add notes for the student..." style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; resize: vertical;"></textarea>
        </div>
        ` : clearance.remarks && clearance.remarks !== '-' ? `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #800020; margin-bottom: 10px;">Accounting Notes</h3>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
            <p>${clearance.remarks}</p>
          </div>
        </div>
        ` : ''}
        
        ${clearance.status === 'New' || clearance.status === 'Pending' ? `
        <div style="display: flex; gap: 10px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
          <button class="btn btn-primary" onclick="approveSubmission(${id})" style="flex: 1; background: #059669;">
            <i class="fas fa-check"></i> Approve
          </button>
          <button class="btn btn-danger" onclick="rejectSubmission(${id})" style="flex: 1; background: #dc2626;">
            <i class="fas fa-times"></i> Reject
          </button>
        </div>
        ` : ''}
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeClearanceDetailsModal() {
  const modal = document.getElementById('clearanceDetailsModal');
  if (modal) modal.remove();
}


// ============================================
// UTILITY FUNCTIONS
// ============================================
function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function createElementFromHTML(htmlString) {
  const div = document.createElement('div');
  div.innerHTML = htmlString;
  return div.firstChild;
}
function showEmptyClearanceState(message) {
  const tbody = document.getElementById('clearancesTableBody');
  if (!tbody) return;

  tbody.innerHTML = `
        <tr>
            <td colspan="6">
                <div class="table-empty">
                    <div class="table-empty-icon maroon"><i class="fas fa-exclamation-triangle"></i></div>
                    <h3>Cannot Load Clearances</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="loadClearanceSubmissions()" style="margin-top: 15px; padding: 10px 20px;">
                        <i class="fas fa-sync"></i> Retry
                    </button>
                </div>
            </td>
        </tr>
    `;
}

// ============================================
// PAYMENT SETTINGS MODAL
// ============================================
const paymentModal = document.getElementById('paymentSettingsModal');
const paymentForm = document.getElementById('paymentSettingsForm');

function openPaymentSettingsModal() {
  if (paymentModal) {
    paymentModal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
}

function closePaymentSettingsModal() {
  if (paymentModal) {
    paymentModal.classList.remove('show');
    document.body.style.overflow = 'auto';
  }
  if (paymentForm) {
    paymentForm.reset();
    // Clear QR preview if exists
    const qrPreview = document.getElementById('qrPreview');
    if (qrPreview) {
      qrPreview.style.display = 'none';
      qrPreview.innerHTML = '';
    }
  }
}

// Preview QR code before upload
function handleQRPreview(event) {
  const file = event.target.files[0];
  const qrPreview = document.getElementById('qrPreview');

  if (file && qrPreview) {
    const reader = new FileReader();
    reader.onload = function (e) {
      qrPreview.innerHTML = `
                <img src="${e.target.result}" alt="QR Preview" style="max-width: 200px; max-height: 200px; border-radius: 8px; margin-top: 10px;">
                <p style="margin-top: 5px; font-size: 0.9rem; color: #666;">QR Code Preview</p>
            `;
      qrPreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
}

// Close modal when clicking outside
window.addEventListener('click', e => {
  if (e.target === paymentModal) closePaymentSettingsModal();
});

// Handle payment requirement form submission
if (paymentForm) {
  paymentForm.addEventListener('submit', async (e) => {
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
    if (qrFile) {
      formData.append('qr_code', qrFile);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/payment-requirements`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Payment requirement created successfully!');
        closePaymentSettingsModal();
        await loadPaymentsFromDatabase();
      } else {
        alert('❌ Failed to create payment requirement: ' + data.message);
      }
    } catch (error) {
      console.error('Error creating payment requirement:', error);
      alert('❌ Failed to create payment requirement. Please try again.');
    }
  });
}

// ============================================
// GET STUDENT PAYMENT HISTORY
// ============================================
async function getStudentPaymentHistory(studentNumber) {
  try {
    const response = await fetch(`${API_BASE_URL}/payments/student/${studentNumber}`);
    const data = await response.json();

    if (data.success) {
      return data.payments || [];
    } else {
      console.error('Failed to load student payment history');
      return [];
    }
  } catch (error) {
    console.error('Error loading student payment history:', error);
    return [];
  }
}

// ============================================
// GENERATE PAYMENT HISTORY HTML
// ============================================
function generatePaymentTableHTML(studentPayments) {
  if (!studentPayments || studentPayments.length === 0) {
    return `
      <div style="margin-bottom: 20px;">
        <h3 style="color: #800020; margin-bottom: 10px;">
          <i class="fas fa-receipt"></i> Payment History
        </h3>
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; text-align: center; color: #666;">
          <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 10px; opacity: 0.5;"></i>
          <p>No payment history available</p>
        </div>
      </div>
    `;
  }

  // Sort by date (newest first)
  const sortedPayments = [...studentPayments].sort((a, b) =>
    new Date(b.created_at) - new Date(a.created_at)
  );

  return `
    <div style="margin-bottom: 20px;">
      <h3 style="color: #800020; margin-bottom: 15px;">
        <i class="fas fa-receipt"></i> Payment Submissions
      </h3>
      
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
              <th style="padding: 12px; text-align: left; color: #800020; font-weight: 600; font-size: 0.9rem;">Student ID</th>
              <th style="padding: 12px; text-align: left; color: #800020; font-weight: 600; font-size: 0.9rem;">Name</th>
              <th style="padding: 12px; text-align: left; color: #800020; font-weight: 600; font-size: 0.9rem;">Payment Title</th>
              <th style="padding: 12px; text-align: right; color: #800020; font-weight: 600; font-size: 0.9rem;">Amount</th>
              <th style="padding: 12px; text-align: center; color: #800020; font-weight: 600; font-size: 0.9rem;">Date</th>
              <th style="padding: 12px; text-align: center; color: #800020; font-weight: 600; font-size: 0.9rem;">Status</th>
              <th style="padding: 12px; text-align: center; color: #800020; font-weight: 600; font-size: 0.9rem;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${sortedPayments.map((payment, index) => {
    const date = new Date(payment.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const statusMap = {
      'verified': { text: 'Verified', color: '#059669', bg: '#dcfce7' },
      'pending': { text: 'Pending', color: '#f59e0b', bg: '#fef3c7' },
      'rejected': { text: 'Rejected', color: '#dc2626', bg: '#fee2e2' }
    };

    const status = statusMap[payment.status] || statusMap['pending'];

    return `
                <tr style="border-bottom: 1px solid #e5e7eb; transition: background 0.2s;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='white'">
                  <td style="padding: 12px; font-size: 0.9rem;">${payment.student_number || 'N/A'}</td>
                  <td style="padding: 12px; font-weight: 500; font-size: 0.9rem;">${payment.student_name || 'Unknown'}</td>
                  <td style="padding: 12px; font-size: 0.9rem;">${payment.requirement_title}</td>
                  <td style="padding: 12px; text-align: right; font-weight: 600; color: #800020; font-size: 0.9rem;">₱${parseFloat(payment.amount).toLocaleString()}</td>
                  <td style="padding: 12px; text-align: center; color: #666; font-size: 0.9rem;">${date}</td>
                  <td style="padding: 12px; text-align: center;">
                    <span style="display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; background: ${status.bg}; color: ${status.color};">
                      ${status.text}
                    </span>
                  </td>
                  <td style="padding: 12px; text-align: center;">
                    <button onclick="viewPaymentProof(${index})" style="background: #800020; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 5px;">
                      <i class="fas fa-eye"></i> Review
                    </button>
                  </td>
                </tr>
              `;
  }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ============================================
// VIEW PAYMENT DETAILS MODAL
// ============================================
let currentStudentPayments = [];

function viewPaymentProof(index) {
  const payment = currentStudentPayments[index];
  if (!payment) return;

  const statusMap = {
    'verified': { text: 'Verified', color: '#059669' },
    'pending': { text: 'Pending', color: '#f59e0b' },
    'rejected': { text: 'Rejected', color: '#dc2626' }
  };

  const status = statusMap[payment.status] || statusMap['pending'];

  const proofModalHTML = `
    <div class="modal active" id="paymentProofModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10001; justify-content: center; align-items: center; padding: 20px;">
      <div class="modal-content" style="background: white; border-radius: 12px; padding: 30px; max-width: 700px; width: 90%; max-height: 90vh; overflow-y: auto; position: relative;">
        <span onclick="closePaymentProofModal()" style="position: absolute; top: 15px; right: 20px; font-size: 2rem; cursor: pointer; color: #666;">&times;</span>
        
        <h2 style="color: #800020; margin-bottom: 20px;">
          <i class="fas fa-receipt"></i> Payment Proof
        </h2>
        
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <p style="margin: 5px 0;"><strong>Payment:</strong> ${payment.requirement_title}</p>
          <p style="margin: 5px 0;"><strong>Amount:</strong> ₱${parseFloat(payment.amount).toLocaleString()}</p>
          <p style="margin: 5px 0;"><strong>Student:</strong> ${payment.student_name}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: ${status.color}; font-weight: 600;">${status.text}</span></p>
        </div>
        
        <div style="text-align: center; margin-bottom: 15px;">
          <img src="${payment.proof_image}" alt="Payment Proof" style="max-width: 100%; max-height: 400px; border-radius: 8px; border: 2px solid #e5e7eb;">
        </div>
        
        <div style="text-align: center;">
          <button onclick="closePaymentProofModal()" style="background: #6b7280; color: white; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-size: 1rem;">
            Close
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', proofModalHTML);
}

function closePaymentProofModal() {
  const modal = document.getElementById('paymentProofModal');
  if (modal) modal.remove();
}


// ============================================
// GET STUDENT PAYMENT HISTORY
// ============================================
async function getStudentPaymentHistory(studentNumber) {
  try {
    const response = await fetch(`${API_BASE_URL}/payments/student/${studentNumber}`);
    const data = await response.json();

    if (data.success) {
      return data.payments || [];
    } else {
      console.error('Failed to load student payment history');
      return [];
    }
  } catch (error) {
    console.error('Error loading student payment history:', error);
    return [];
  }
}

function closePaymentDetailsModal() {
  const modal = document.getElementById('paymentDetailsModal');
  if (modal) modal.remove();
}

// ============================================
// VERIFY/REJECT PAYMENT
// ============================================
async function verifyPayment(paymentId) {
  if (!confirm('Verify this payment submission?')) return;

  try {
    const response = await fetch(`${API_BASE_URL}/payments/${paymentId}/verify`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'verified'
      })
    });

    const data = await response.json();

    if (data.success) {
      alert('✅ Payment verified successfully!');
      closePaymentDetailsModal();
      await loadPaymentsFromDatabase();
    } else {
      alert('❌ Failed to verify payment: ' + data.message);
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    alert('❌ Failed to verify payment. Please try again.');
  }
}

async function rejectPayment(paymentId) {
  if (!confirm('Reject this payment submission?')) return;

  try {
    const response = await fetch(`${API_BASE_URL}/payments/${paymentId}/verify`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'rejected'
      })
    });

    const data = await response.json();

    if (data.success) {
      alert('❌ Payment rejected.');
      closePaymentDetailsModal();
      await loadPaymentsFromDatabase();
    } else {
      alert('❌ Failed to reject payment: ' + data.message);
    }
  } catch (error) {
    console.error('Error rejecting payment:', error);
    alert('❌ Failed to reject payment. Please try again.');
  }
}
// ============================================
// PROFILE MODAL
// ============================================
const profileModal = document.getElementById('profileModal');

function openProfileModal() {
  if (profileModal) profileModal.classList.add('show');
}

function closeProfileModal() {
  if (profileModal) profileModal.classList.remove('show');
}

window.addEventListener('click', e => {
  if (e.target === profileModal) closeProfileModal();
});

// ============================================
// LOGOUT FUNCTIONS
// ============================================
function logout() {
  document.getElementById("logoutModal").style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeLogoutModal() {
  document.getElementById("logoutModal").style.display = "none";
  document.body.style.overflow = "auto";
}

function confirmLogout() {
  document.body.style.overflow = "auto";
  window.location.href = "../user/studentlogin.html";
}

// ============================================
// INITIALIZE
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 [Accounting] Initializing Accounting Dashboard...');

  // Load all data from database
  await Promise.all([
    loadClearanceSubmissions(),
    loadStudentsFromDatabase(),
    loadPaymentsFromDatabase(),
    loadEventsFromDatabase()
  ]);

  // Initial display update
  updateDisplay();

  console.log('✅ [Accounting] Dashboard initialized successfully');
});