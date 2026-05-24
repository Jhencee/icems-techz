// ============================================
// PUBLICATIONPAYMENT.JS - PUBLICATION PAYMENT HANDLER
// ============================================

const API_BASE_URL = 'http://localhost:8000/api';

// Data storage
window.payments = [];
let students = [];
let paymentRequirements = [];

// ============================================
// DATABASE API FUNCTIONS
// ============================================

// Load payment submissions from database (filtered by Publication requirements only)
async function loadPaymentsFromDatabase() {
    console.log('🔍 [Publication] Loading payment submissions...');

    const tbody = document.getElementById('paymentsTableBody');
    if (tbody) {
        tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="table-empty">
            <div class="table-empty-icon maroon"><i class="fas fa-spinner fa-spin"></i></div>
            <h3>Loading payment submissions...</h3>
          </div>
        </td>
      </tr>
    `;
    }

    try {
        // First, ensure payment requirements are loaded
        if (paymentRequirements.length === 0) {
            await loadPaymentRequirements();
        }

        // Get all payment requirement IDs created by Publication
        const publicationRequirementIds = paymentRequirements.map(req => req.id);
        console.log('📋 [Publication] Filtering by requirement IDs:', publicationRequirementIds);

        const response = await fetch(`${API_BASE_URL}/payments`);
        const data = await response.json();

        if (data.success) {
            // Filter payments to only show those related to Publication's payment requirements
            const allPayments = data.payments || [];
            const filteredPayments = allPayments.filter(payment =>
                publicationRequirementIds.includes(payment.requirement_id)
            );

            window.payments = filteredPayments.map(payment => ({
                id: payment.id,
                requirementId: payment.requirement_id,
                studentId: payment.student_number,
                name: payment.student_name,
                description: payment.requirement_title,
                amount: parseFloat(payment.amount),
                date: new Date(payment.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                }),
                rawDate: payment.created_at,
                status: capitalizeFirst(payment.status),
                proofImage: payment.proof_image,
                studentEmail: payment.student_email,
                course: payment.course,
                year: payment.year
            }));

            console.log('✅ [Publication] Loaded', payments.length, 'payment submissions (filtered from', allPayments.length, 'total)');
            updatePaymentsDisplay();

            // 🆕 Update clearance display if function exists
            if (typeof refreshClearanceDisplay === 'function') {
                refreshClearanceDisplay();
            }

            return payments;
        } else {
            console.error('❌ [Publication] Failed to load payments:', data.message);
            showEmptyPaymentState('Failed to load payment data from server');
            return [];
        }
    } catch (error) {
        console.error('❌ [Publication] Error loading payments:', error);
        showEmptyPaymentState('Cannot connect to server. Please check if Laravel is running.');
        return [];
    }
}

function refreshClearanceDisplay() {
  console.log('🔄 [Publication Clearance] Refreshing clearance display...');
  updateClearanceDisplay();
}

// Load students from database
async function loadStudentsFromDatabase() {
    console.log('🔍 [Publication] Loading students...');

    try {
        const response = await fetch(`${API_BASE_URL}/students`);
        const data = await response.json();

        if (data.success) {
            students = data.students.map(student => ({
                studentId: student.student_number,
                name: `${student.first_name} ${student.last_name}`,
                email: student.email,
                course: student.course,
                year: student.year
            }));

            console.log('✅ [Publication] Loaded', students.length, 'students');
            return students;
        } else {
            console.error('❌ [Publication] Failed to load students:', data.message);
            return [];
        }
    } catch (error) {
        console.error('❌ [Publication] Error loading students:', error);
        return [];
    }
}

// Load payment requirements (only Publication's)
async function loadPaymentRequirements() {
    console.log('🔍 [Publication] Loading payment requirements...');

    try {
        const response = await fetch(`${API_BASE_URL}/payment-requirements`);
        const data = await response.json();

        if (data.success) {
            // ⭐ FILTER: Only get payment requirements created by Publication
            const allRequirements = data.requirements || [];
            paymentRequirements = allRequirements.filter(req => req.organization === 'publication');

            console.log('✅ [Publication] Loaded', paymentRequirements.length, 'payment requirements (filtered from', allRequirements.length, 'total)');

            // Update display if there's a requirements table
            displayPaymentRequirements();

            return paymentRequirements;
        } else {
            console.error('❌ [Publication] Failed to load payment requirements');
            return [];
        }
    } catch (error) {
        console.error('❌ [Publication] Error loading payment requirements:', error);
        return [];
    }
}

// Display payment requirements in admin view
function displayPaymentRequirements() {
    const requirementsTable = document.getElementById('requirementsTableBody');
    if (!requirementsTable) return; // Skip if no requirements table in the page

    if (paymentRequirements.length === 0) {
        requirementsTable.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="table-empty">
            <div class="table-empty-icon maroon"><i class="fas fa-receipt"></i></div>
            <h3>No Payment Requirements</h3>
            <p>Create a payment requirement to get started</p>
          </div>
        </td>
      </tr>
    `;
        return;
    }

    requirementsTable.innerHTML = paymentRequirements.map(req => {
        const dueDate = new Date(req.due_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        const typeLabel = req.is_mandatory ? 'Mandatory' : 'Optional';
        const typeBadge = req.is_mandatory
            ? '<span class="status-badge status-rejected">Mandatory</span>'
            : '<span class="status-badge status-approved">Optional</span>';

        return `
      <tr>
        <td style="font-weight: 500;">${req.title}</td>
        <td style="font-weight: 600; color: #800020;">₱${parseFloat(req.amount).toLocaleString()}</td>
        <td>${req.description || '-'}</td>
        <td>${dueDate}</td>
        <td>${typeBadge}</td>
        <td>
          <button class="btn btn-primary" onclick="viewRequirementDetails(${req.id})" style="padding: 6px 12px; font-size: 0.85rem;">
            <i class="fas fa-eye"></i> View
          </button>
        </td>
      </tr>
    `;
    }).join('');
}

// View requirement details
function viewRequirementDetails(requirementId) {
    const requirement = paymentRequirements.find(r => r.id === requirementId);
    if (!requirement) return;

    const dueDate = new Date(requirement.due_date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    const storageUrl = API_BASE_URL.replace('/api', '/storage/');
    const qrImageUrl = requirement.qr_code ? `${storageUrl}${requirement.qr_code}` : null;

    const modalHTML = `
    <div class="modal active" id="requirementDetailsModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; justify-content: center; align-items: center; overflow-y: auto; padding: 20px;">
      <div class="modal-content" style="background: white; border-radius: 12px; padding: 30px; max-width: 700px; width: 90%; max-height: 90vh; overflow-y: auto; position: relative;">
        <span onclick="closeRequirementDetailsModal()" style="position: absolute; top: 15px; right: 20px; font-size: 2rem; cursor: pointer; color: #666;">&times;</span>
        
        <h2 style="color: #800020; margin-bottom: 20px;">
          <i class="fas fa-file-invoice-dollar"></i> Payment Requirement Details
        </h2>
        
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #800020; margin-bottom: 15px;">${requirement.title}</h3>
          <p><strong>Amount:</strong> <span style="color: #800020; font-size: 1.2rem; font-weight: 600;">₱${parseFloat(requirement.amount).toLocaleString()}</span></p>
          <p><strong>Description:</strong> ${requirement.description || 'N/A'}</p>
          <p><strong>Due Date:</strong> ${dueDate}</p>
          <p><strong>Type:</strong> ${requirement.is_mandatory ? 'Mandatory' : 'Optional'}</p>
        </div>
        
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #800020; margin-bottom: 10px;">GCash Payment Details</h3>
          <p><strong>Account Name:</strong> ${requirement.gcash_name}</p>
          <p><strong>GCash Number:</strong> ${requirement.gcash_number}</p>
        </div>
        
        ${qrImageUrl ? `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #800020; margin-bottom: 10px;">QR Code</h3>
          <div style="text-align: center; background: #f9fafb; padding: 20px; border-radius: 8px;">
            <img src="${qrImageUrl}" alt="QR Code" style="max-width: 300px; border-radius: 8px;">
          </div>
        </div>
        ` : ''}
        
        <div style="text-align: center;">
          <button onclick="closeRequirementDetailsModal()" style="background: #6b7280; color: white; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-size: 1rem;">
            Close
          </button>
        </div>
      </div>
    </div>
  `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeRequirementDetailsModal() {
    const modal = document.getElementById('requirementDetailsModal');
    if (modal) modal.remove();
}

// Get student payment history
async function getStudentPaymentHistory(studentNumber) {
    console.log('🔍 [Publication] Loading payment history for student:', studentNumber);

    try {
        const response = await fetch(`${API_BASE_URL}/payments/student/${studentNumber}`);
        const data = await response.json();

        if (data.success) {
            return data.payments || [];
        } else {
            console.error('❌ [Publication] Failed to load student payment history');
            return [];
        }
    } catch (error) {
        console.error('❌ [Publication] Error loading student payment history:', error);
        return [];
    }
}

// ============================================
// PAYMENT ACTIONS
// ============================================

// Verify payment
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
        console.error('❌ [Publication] Error verifying payment:', error);
        alert('❌ Failed to verify payment. Please try again.');
    }
}

// Reject payment
async function rejectPayment(paymentId) {
    const reason = document.getElementById('rejectionReason')?.value.trim();

    if (!reason) {
        alert('Please provide a reason for rejection.');
        return;
    }

    if (!confirm('Reject this payment submission?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/payments/${paymentId}/verify`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: 'rejected',
                rejection_reason: reason
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
        console.error('❌ [Publication] Error rejecting payment:', error);
        alert('❌ Failed to reject payment. Please try again.');
    }
}

// ============================================
// DISPLAY FUNCTIONS
// ============================================

// Update payments table
function updatePaymentsDisplay() {
    const tbody = document.getElementById('paymentsTableBody');
    if (!tbody) return;

    if (payments.length === 0) {
        showEmptyPaymentState('No payment submissions yet');
        return;
    }

    tbody.innerHTML = payments.map(payment => {
        const statusColors = {
            'Verified': 'status-approved',
            'Pending': 'status-pending',
            'Rejected': 'status-rejected'
        };

        const actionButton = payment.status === 'Pending'
            ? `<button class="btn btn-primary" onclick="viewPaymentDetailsForReview(${payment.id})" style="padding: 6px 12px; font-size: 0.85rem;">
          <i class="fas fa-eye"></i> Review
        </button>`
            : `<button class="btn btn-primary" onclick="viewPaymentDetails(${payment.id})" style="padding: 6px 12px; font-size: 0.85rem;">
          <i class="fas fa-eye"></i> View
        </button>`;

        return `
      <tr>
        <td>${payment.studentId}</td>
        <td style="font-weight: 500;">${payment.name}</td>
        <td>${payment.description}</td>
        <td style="font-weight: 600; color: #800020;">₱${payment.amount.toLocaleString()}</td>
        <td>${payment.date}</td>
        <td>
          <span class="status-badge ${statusColors[payment.status]}">${payment.status}</span>
        </td>
        <td>${actionButton}</td>
      </tr>
    `;
    }).join('');

    // Update statistics
    updatePaymentStats();

    // 🆕 Update clearance display if function exists
    if (typeof refreshClearanceDisplay === 'function') {
        refreshClearanceDisplay();
    }
}

// Update payment statistics
function updatePaymentStats() {
    const pendingCount = payments.filter(p => p.status === 'Pending').length;
    const verifiedCount = payments.filter(p => p.status === 'Verified').length;
    const totalAmount = payments
        .filter(p => p.status === 'Verified')
        .reduce((sum, p) => sum + p.amount, 0);

    const pendingCountEl = document.getElementById('pendingPaymentCount');
    const verifiedCountEl = document.getElementById('verifiedPaymentCount');
    const totalAmountEl = document.getElementById('totalPaymentAmount');

    if (pendingCountEl) pendingCountEl.textContent = pendingCount;
    if (verifiedCountEl) verifiedCountEl.textContent = verifiedCount;
    if (totalAmountEl) totalAmountEl.textContent = '₱' + totalAmount.toLocaleString();
}

// Show empty state
function showEmptyPaymentState(message) {
    const tbody = document.getElementById('paymentsTableBody');
    if (!tbody) return;

    tbody.innerHTML = `
    <tr>
      <td colspan="7">
        <div class="table-empty">
          <div class="table-empty-icon maroon"><i class="fas fa-receipt"></i></div>
          <h3>No Payments</h3>
          <p>${message}</p>
        </div>
      </td>
    </tr>
  `;
}

// ============================================
// VIEW PAYMENT DETAILS (READ-ONLY)
// ============================================
async function viewPaymentDetails(paymentId) {
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return;

    const statusColors = {
        'Verified': '#059669',
        'Pending': '#f59e0b',
        'Rejected': '#dc2626'
    };

    const statusColor = statusColors[payment.status] || '#666';

    const modalHTML = `
    <div class="modal active" id="paymentDetailsModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; justify-content: center; align-items: center; overflow-y: auto; padding: 20px;">
      <div class="modal-content" style="background: white; border-radius: 12px; padding: 30px; max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto; position: relative;">
        <span onclick="closePaymentDetailsModal()" style="position: absolute; top: 15px; right: 20px; font-size: 2rem; cursor: pointer; color: #666;">&times;</span>
        
        <h2 style="color: #800020; margin-bottom: 20px;">
          <i class="fas fa-receipt"></i> Payment Details
        </h2>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div>
            <h3 style="color: #800020; margin-bottom: 10px;">Student Information</h3>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
              <p><strong>Name:</strong> ${payment.name}</p>
              <p><strong>Student No:</strong> ${payment.studentId}</p>
              <p><strong>Email:</strong> ${payment.studentEmail || 'N/A'}</p>
              <p><strong>Course:</strong> ${payment.course || 'N/A'} ${payment.year || ''}</p>
            </div>
          </div>
          
          <div>
            <h3 style="color: #800020; margin-bottom: 10px;">Payment Information</h3>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
              <p><strong>Description:</strong> ${payment.description}</p>
              <p><strong>Amount:</strong> <span style="color: #800020; font-weight: 600;">₱${payment.amount.toLocaleString()}</span></p>
              <p><strong>Date:</strong> ${payment.date}</p>
              <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: 600;">${payment.status}</span></p>
            </div>
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #800020; margin-bottom: 10px;">Proof of Payment</h3>
          <div style="border: 2px solid #e0e0e0; border-radius: 8px; padding: 10px; background: #f9fafb; text-align: center;">
            <img src="${payment.proofImage}" alt="Payment Proof" style="max-width: 100%; max-height: 400px; border-radius: 8px;">
          </div>
        </div>
        
        <div style="text-align: center;">
          <button onclick="closePaymentDetailsModal()" style="background: #6b7280; color: white; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-size: 1rem;">
            Close
          </button>
        </div>
      </div>
    </div>
  `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// ============================================
// VIEW PAYMENT DETAILS FOR REVIEW
// ============================================
async function viewPaymentDetailsForReview(paymentId) {
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return;

    const statusColors = {
        'Verified': '#059669',
        'Pending': '#f59e0b',
        'Rejected': '#dc2626'
    };

    const statusColor = statusColors[payment.status] || '#666';

    const modalHTML = `
    <div class="modal active" id="paymentDetailsModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; justify-content: center; align-items: center; overflow-y: auto; padding: 20px;">
      <div class="modal-content" style="background: white; border-radius: 12px; padding: 30px; max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto; position: relative;">
        <span onclick="closePaymentDetailsModal()" style="position: absolute; top: 15px; right: 20px; font-size: 2rem; cursor: pointer; color: #666;">&times;</span>
        
        <h2 style="color: #800020; margin-bottom: 20px;">
          <i class="fas fa-receipt"></i> Payment Review
        </h2>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div>
            <h3 style="color: #800020; margin-bottom: 10px;">Student Information</h3>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
              <p><strong>Name:</strong> ${payment.name}</p>
              <p><strong>Student No:</strong> ${payment.studentId}</p>
              <p><strong>Email:</strong> ${payment.studentEmail || 'N/A'}</p>
              <p><strong>Course:</strong> ${payment.course || 'N/A'} ${payment.year || ''}</p>
            </div>
          </div>
          
          <div>
            <h3 style="color: #800020; margin-bottom: 10px;">Payment Information</h3>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
              <p><strong>Description:</strong> ${payment.description}</p>
              <p><strong>Amount:</strong> <span style="color: #800020; font-weight: 600;">₱${payment.amount.toLocaleString()}</span></p>
              <p><strong>Date:</strong> ${payment.date}</p>
              <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: 600;">${payment.status}</span></p>
            </div>
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #800020; margin-bottom: 10px;">Proof of Payment</h3>
          <div style="border: 2px solid #e0e0e0; border-radius: 8px; padding: 10px; background: #f9fafb; text-align: center;">
            <img src="${payment.proofImage}" alt="Payment Proof" style="max-width: 100%; max-height: 400px; border-radius: 8px;">
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #800020; margin-bottom: 10px;">Rejection Reason (if rejecting)</h3>
          <textarea id="rejectionReason" rows="3" placeholder="Provide reason for rejection..." style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; resize: vertical;"></textarea>
        </div>
        
        <div style="display: flex; gap: 10px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
          <button onclick="verifyPayment(${payment.id})" style="flex: 1; background: #059669; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 1rem; font-weight: 600;">
            <i class="fas fa-check"></i> Verify Payment
          </button>
          <button onclick="rejectPayment(${payment.id})" style="flex: 1; background: #dc2626; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 1rem; font-weight: 600;">
            <i class="fas fa-times"></i> Reject Payment
          </button>
        </div>
      </div>
    </div>
  `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Close payment details modal
function closePaymentDetailsModal() {
    const modal = document.getElementById('paymentDetailsModal');
    if (modal) modal.remove();
}

// ============================================
// FILTER AND SEARCH
// ============================================

// Filter payments by status
function filterPayments(status) {
    const filteredPayments = status === 'all'
        ? payments
        : payments.filter(p => p.status.toLowerCase() === status.toLowerCase());

    const tbody = document.getElementById('paymentsTableBody');
    if (!tbody) return;

    if (filteredPayments.length === 0) {
        showEmptyPaymentState(`No ${status} payments found`);
        return;
    }

    // Update display with filtered data (reuse the display logic)
    const tempPayments = payments;
    payments = filteredPayments;
    updatePaymentsDisplay();
    payments = tempPayments;
}

// Search payments
function searchPayments(query) {
    const searchQuery = query.toLowerCase().trim();

    if (!searchQuery) {
        updatePaymentsDisplay();
        return;
    }

    const filteredPayments = payments.filter(p =>
        p.studentId.toLowerCase().includes(searchQuery) ||
        p.name.toLowerCase().includes(searchQuery) ||
        p.description.toLowerCase().includes(searchQuery)
    );

    const tbody = document.getElementById('paymentsTableBody');
    if (!tbody) return;

    if (filteredPayments.length === 0) {
        showEmptyPaymentState('No payments match your search');
        return;
    }

    // Update display with filtered data
    const tempPayments = payments;
    payments = filteredPayments;
    updatePaymentsDisplay();
    payments = tempPayments;
}

// ============================================
// UI CONTROL FUNCTIONS
// ============================================

// Sidebar toggle (mobile)
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}

// Section navigation
function showSection(sectionId, targetElement = null) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');

    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

    // Show selected section
    const sec = document.getElementById(sectionId + 'Section');
    if (sec) sec.style.display = 'block';

    // Mark clicked link active
    if (targetElement) {
        targetElement.classList.add('active');
    }
}

// Profile modal
function openProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Payment Settings modal
function openPaymentSettingsModal() {
    const modal = document.getElementById('paymentSettingsModal');
    if (!modal) return console.warn('paymentSettingsModal not found');
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const first = modal.querySelector('input, select, textarea, button');
    if (first) first.focus();
}

function closePaymentSettingsModal() {
    const modal = document.getElementById('paymentSettingsModal');
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

// Logout modal
function logout() {
    const modal = document.getElementById("logoutModal");
    if (modal) {
        modal.style.display = "flex";
        document.body.style.overflow = "hidden";
    }
}

function closeLogoutModal() {
    const modal = document.getElementById("logoutModal");
    if (modal) {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
    }
}

function confirmLogout() {
    document.body.style.overflow = "auto";
    window.location.href = "../user/studentlogin.html";
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// ============================================
// INITIALIZE
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 [Publication] Initializing Publication Payment System...');

    // Set default section to 'payment' on load
    showSection('payment');

    // Bind section navigation using the 'data-section' attribute on .nav-link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            if (section) {
                showSection(section, this);
                // Close sidebar on mobile after clicking a link
                const sidebar = document.getElementById('sidebar');
                if (sidebar && sidebar.classList.contains('active')) {
                    toggleSidebar();
                }
            }
        });
    });

    // Close modals on clicking .close-modal
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            if (!modal) return;
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        });
    });

    // Open Payment Settings button
    const openPaymentBtn = document.getElementById('openPaymentSettings');
    if (openPaymentBtn) {
        openPaymentBtn.addEventListener('click', openPaymentSettingsModal);
    }

    // Open Profile Modal button
    const openProfileBtn = document.querySelector('.org-profile');
    if (openProfileBtn) {
        openProfileBtn.addEventListener('click', openProfileModal);
    }

    // Logout button
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Bind Logout Confirm/Cancel buttons
    const logoutConfirmBtn = document.querySelector('.logout-confirm');
    if (logoutConfirmBtn) {
        logoutConfirmBtn.addEventListener('click', confirmLogout);
    }
    const logoutCancelBtn = document.querySelector('.logout-cancel');
    if (logoutCancelBtn) {
        logoutCancelBtn.addEventListener('click', closeLogoutModal);
    }

    // Bind Mobile Toggle button
    const mobileToggle = document.querySelector('.mobile-toggle');
    if (mobileToggle) {
        mobileToggle.addEventListener('click', toggleSidebar);
    }

    // Close modal by clicking overlay (outside modal content)
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', e => {
            if (e.target === modal) {
                modal.classList.remove('active');
                modal.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
            }
        });
    });

    // Close active modal on Escape key
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
                modal.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
            });
            // Also close the manual logout modal if open
            if (document.getElementById("logoutModal")?.style.display === "flex") {
                closeLogoutModal();
            }
        }
    });

    // Payment Settings form submit
    const paymentForm = document.getElementById('paymentSettingsForm');
    if (paymentForm) {
        paymentForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Create FormData from the form
            const formData = new FormData(paymentForm);

            // ⭐ ADD ORGANIZATION IDENTIFIER
            formData.append('organization', 'publication');

            try {
                console.log('📤 [Publication] Submitting payment requirement...');

                const response = await fetch(`${API_BASE_URL}/payment-requirements`, {
                    method: 'POST',
                    body: formData // Send FormData directly (includes file upload)
                });

                const data = await response.json();

                if (data.success) {
                    alert('✅ Payment requirement created successfully!');
                    closePaymentSettingsModal();
                    paymentForm.reset();

                    // Reload payment requirements first, then payments (to update filter)
                    await loadPaymentRequirements();
                    await loadPaymentsFromDatabase();
                } else {
                    alert('❌ Failed to create payment requirement: ' + (data.message || 'Unknown error'));
                }
            } catch (error) {
                console.error('❌ [Publication] Error creating payment requirement:', error);
                alert('❌ Failed to create payment requirement. Please try again.');
            }
        });
    }

    // Load payment data - IMPORTANT: Load requirements FIRST, then payments
    console.log('📦 [Publication] Loading payment requirements first...');
    await loadPaymentRequirements();

    console.log('📦 [Publication] Now loading payment submissions...');
    await loadPaymentsFromDatabase();

    console.log('📦 [Publication] Loading students data...');
    await loadStudentsFromDatabase();

    console.log('✅ [Publication] Payment system initialized successfully');
});