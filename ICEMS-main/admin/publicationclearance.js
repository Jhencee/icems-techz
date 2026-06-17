// ============================================
// PUBLICATIONCLEARANCE.JS - PUBLICATION CLEARANCE HANDLER
// ============================================

// This script displays the same payment data from publicationpayment.js
// in the Clearance Requests section

// ============================================
// DISPLAY FUNCTIONS
// ============================================

// Update clearance table with payment data
function updateClearanceDisplay() {
  console.log('🔍 [Clearance] updateClearanceDisplay called');
  console.log('🔍 [Clearance] window.payments:', window.payments);
  
  const tbody = document.getElementById('clearanceTableBody');
  if (!tbody) {
    console.error('❌ [Clearance] clearanceTableBody not found!');
    return;
  }

  // Use window.payments to ensure global access
  if (!window.payments || window.payments.length === 0) {
    console.warn('⚠️ [Clearance] No payments data available');
    showEmptyClearanceState('No clearance requests yet');
    return;
  }

  console.log('✅ [Clearance] Found', window.payments.length, 'payments');

  tbody.innerHTML = window.payments.map(payment => {
    const statusColors = {
      'Verified': 'status-approved',
      'Pending': 'status-pending',
      'Rejected': 'status-rejected'
    };

    const actionButton = payment.status === 'Pending'
      ? `<button class="btn btn-primary" onclick="viewClearanceDetailsForReview(${payment.id})" style="padding: 6px 12px; font-size: 0.85rem;">
          <i class="fas fa-eye"></i> Review
        </button>`
      : `<button class="btn btn-primary" onclick="viewClearanceDetails(${payment.id})" style="padding: 6px 12px; font-size: 0.85rem;">
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

  console.log('✅ [Clearance] Table updated with', window.payments.length, 'rows');
  updateClearanceStats();
}

// Update clearance statistics
function updateClearanceStats() {
  // Use window.payments to ensure global access
  if (!window.payments) {
    console.warn('⚠️ [Clearance] No payments for stats');
    return;
  }

  const pendingCount = window.payments.filter(p => p.status === 'Pending').length;
  const approvedCount = window.payments.filter(p => p.status === 'Verified').length;
  const rejectedCount = window.payments.filter(p => p.status === 'Rejected').length;

  console.log('📊 [Clearance] Stats - Pending:', pendingCount, 'Approved:', approvedCount, 'Rejected:', rejectedCount);

  const pendingCountEl = document.getElementById('pendingClearanceCount');
  const approvedCountEl = document.getElementById('approvedClearanceCount');
  const rejectedCountEl = document.getElementById('rejectedClearanceCount');

  if (pendingCountEl) pendingCountEl.textContent = pendingCount;
  if (approvedCountEl) approvedCountEl.textContent = approvedCount;
  if (rejectedCountEl) rejectedCountEl.textContent = rejectedCount;
}

// Show empty state
function showEmptyClearanceState(message) {
  const tbody = document.getElementById('clearanceTableBody');
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="7">
        <div class="table-empty">
          <div class="table-empty-icon maroon"><i class="fas fa-clipboard-check"></i></div>
          <h3>No Clearance Requests</h3>
          <p>${message}</p>
        </div>
      </td>
    </tr>
  `;
}

// ============================================
// CLEARANCE ACTIONS
// ============================================

// Approve clearance
async function approveClearance(paymentId) {
  if (!confirm('Approve this clearance request?')) return;

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
      alert('✅ Clearance approved successfully!');
      closeClearanceDetailsModal();
      // Reload payment data which will automatically update clearance view
      await loadPaymentsFromDatabase();
      updateClearanceDisplay();
    } else {
      alert('❌ Failed to approve clearance: ' + data.message);
    }
  } catch (error) {
    console.error('❌ [Publication Clearance] Error approving clearance:', error);
    alert('❌ Failed to approve clearance. Please try again.');
  }
}

// Reject clearance
async function rejectClearance(paymentId) {
  const reason = document.getElementById('clearanceRejectionReason')?.value.trim();

  if (!reason) {
    alert('Please provide a reason for rejection.');
    return;
  }

  if (!confirm('Reject this clearance request?')) return;

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
      alert('❌ Clearance rejected.');
      closeClearanceDetailsModal();
      // Reload payment data which will automatically update clearance view
      await loadPaymentsFromDatabase();
      updateClearanceDisplay();
    } else {
      alert('❌ Failed to reject clearance: ' + data.message);
    }
  } catch (error) {
    console.error('❌ [Publication Clearance] Error rejecting clearance:', error);
    alert('❌ Failed to reject clearance. Please try again.');
  }
}

// ============================================
// VIEW CLEARANCE DETAILS (READ-ONLY)
// ============================================
async function viewClearanceDetails(paymentId) {
  // Use window.payments to ensure global access
  if (!window.payments) return;
  
  const payment = window.payments.find(p => p.id === paymentId);
  if (!payment) return;

  const statusColors = {
    'Verified': '#059669',
    'Pending': '#f59e0b',
    'Rejected': '#dc2626'
  };

  const statusColor = statusColors[payment.status] || '#666';
  const statusLabel = payment.status === 'Verified' ? 'Approved' : payment.status;

  const modalHTML = `
    <div class="modal active" id="clearanceDetailsModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; justify-content: center; align-items: center; overflow-y: auto; padding: 20px;">
      <div class="modal-content" style="background: white; border-radius: 12px; padding: 30px; max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto; position: relative;">
        <span onclick="closeClearanceDetailsModal()" style="position: absolute; top: 15px; right: 20px; font-size: 2rem; cursor: pointer; color: #666;">&times;</span>
        
        <h2 style="color: #800020; margin-bottom: 20px;">
          <i class="fas fa-clipboard-check"></i> Clearance Request Details
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
              <p><strong>Requirement:</strong> ${payment.description}</p>
              <p><strong>Amount:</strong> <span style="color: #800020; font-weight: 600;">₱${payment.amount.toLocaleString()}</span></p>
              <p><strong>Submitted:</strong> ${payment.date}</p>
              <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: 600;">${statusLabel}</span></p>
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
          <button onclick="closeClearanceDetailsModal()" style="background: #6b7280; color: white; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-size: 1rem;">
            Close
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// ============================================
// VIEW CLEARANCE DETAILS FOR REVIEW
// ============================================
async function viewClearanceDetailsForReview(paymentId) {
  // Use window.payments to ensure global access
  if (!window.payments) return;
  
  const payment = window.payments.find(p => p.id === paymentId);
  if (!payment) return;

  const statusColors = {
    'Verified': '#059669',
    'Pending': '#f59e0b',
    'Rejected': '#dc2626'
  };

  const statusColor = statusColors[payment.status] || '#666';

  const modalHTML = `
    <div class="modal active" id="clearanceDetailsModal" style="display: flex; position: fixed: top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; justify-content: center; align-items: center; overflow-y: auto; padding: 20px;">
      <div class="modal-content" style="background: white; border-radius: 12px; padding: 30px; max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto; position: relative;">
        <span onclick="closeClearanceDetailsModal()" style="position: absolute; top: 15px; right: 20px; font-size: 2rem; cursor: pointer; color: #666;">&times;</span>
        
        <h2 style="color: #800020; margin-bottom: 20px;">
          <i class="fas fa-clipboard-check"></i> Clearance Review
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
              <p><strong>Requirement:</strong> ${payment.description}</p>
              <p><strong>Amount:</strong> <span style="color: #800020; font-weight: 600;">₱${payment.amount.toLocaleString()}</span></p>
              <p><strong>Submitted:</strong> ${payment.date}</p>
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
          <textarea id="clearanceRejectionReason" rows="3" placeholder="Provide reason for rejection..." style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; resize: vertical;"></textarea>
        </div>
        
        <div style="display: flex; gap: 10px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
          <button onclick="approveClearance(${payment.id})" style="flex: 1; background: #059669; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 1rem; font-weight: 600;">
            <i class="fas fa-check"></i> Approve Clearance
          </button>
          <button onclick="rejectClearance(${payment.id})" style="flex: 1; background: #dc2626; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 1rem; font-weight: 600;">
            <i class="fas fa-times"></i> Reject Clearance
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Close clearance details modal
function closeClearanceDetailsModal() {
  const modal = document.getElementById('clearanceDetailsModal');
  if (modal) modal.remove();
}

// ============================================
// FILTER AND SEARCH
// ============================================

// Filter clearance requests by status
function filterClearanceRequests(status) {
  // Use window.payments to ensure global access
  if (!window.payments) return;

  const filteredPayments = status === 'all'
    ? window.payments
    : window.payments.filter(p => p.status.toLowerCase() === status.toLowerCase());

  const tbody = document.getElementById('clearanceTableBody');
  if (!tbody) return;

  if (filteredPayments.length === 0) {
    showEmptyClearanceState(`No ${status} clearance requests found`);
    return;
  }

  // Temporarily update display with filtered data
  const originalPayments = window.payments;
  window.payments = filteredPayments;
  updateClearanceDisplay();
  window.payments = originalPayments;
}

// Search clearance requests
function searchClearanceRequests(query) {
  // Use window.payments to ensure global access
  if (!window.payments) return;

  const searchQuery = query.toLowerCase().trim();

  if (!searchQuery) {
    updateClearanceDisplay();
    return;
  }

  const filteredPayments = window.payments.filter(p =>
    p.studentId.toLowerCase().includes(searchQuery) ||
    p.name.toLowerCase().includes(searchQuery) ||
    p.description.toLowerCase().includes(searchQuery)
  );

  const tbody = document.getElementById('clearanceTableBody');
  if (!tbody) return;

  if (filteredPayments.length === 0) {
    showEmptyClearanceState('No clearance requests match your search');
    return;
  }

  // Temporarily update display with filtered data
  const originalPayments = window.payments;
  window.payments = filteredPayments;
  updateClearanceDisplay();
  window.payments = originalPayments;
}

// ============================================
// REFRESH FUNCTION (Called from publicationpayment.js)
// ============================================
function refreshClearanceDisplay() {
  console.log('🔄 [Publication Clearance] Refreshing clearance display...');
  updateClearanceDisplay();
}

// ============================================
// NAVIGATION HANDLER
// ============================================

// Listen for section changes to update clearance display
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 [Publication Clearance] Clearance view handler initialized');

  // Set up observer to watch for clearance section becoming visible
  const observer = new MutationObserver(() => {
    const clearanceSection = document.getElementById('clearanceSection');
    if (clearanceSection && clearanceSection.style.display !== 'none') {
      // Update clearance display when section is shown
      console.log('📋 [Publication Clearance] Section visible, updating display...');
      updateClearanceDisplay();
    }
  });

  // Observe the clearance section for display changes
  const clearanceSection = document.getElementById('clearanceSection');
  if (clearanceSection) {
    observer.observe(clearanceSection, { 
      attributes: true, 
      attributeFilter: ['style'] 
    });
  }

  // Also update when clicking clearance nav link
  const clearanceNavLinks = document.querySelectorAll('[data-section="clearance"]');
  clearanceNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      console.log('📋 [Publication Clearance] Nav link clicked, updating display...');
      setTimeout(() => updateClearanceDisplay(), 100);
    });
  });
});