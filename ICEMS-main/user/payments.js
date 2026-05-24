// ============================================
// STUDENT PAYMENT.JS - WITH USER DATA LOADING
// Compatible with Laravel API
// ============================================

const API_BASE_URL = 'http://localhost:8000/api';
let currentPayment = { name: '', amount: 0, requirementId: null };
let paymentRequirements = [];
let userPayments = [];
let currentUser = null; // Store logged-in user data

// ============================================
// LOAD USER DATA FROM LOCALSTORAGE
// ============================================
function loadUserData() {
  // Get current user from localStorage
  const storedUser = localStorage.getItem('currentUser');

  if (!storedUser) {
    console.error('❌ No user logged in');
    window.location.href = '../user/studentlogin.html';
    return null;
  }

  currentUser = JSON.parse(storedUser);
  console.log('👤 User data loaded from localStorage:', currentUser);

  // Update sidebar with user data
  updateUserProfile(currentUser);
  return currentUser;
}

// ============================================
// UPDATE USER PROFILE IN SIDEBAR
// ============================================
function updateUserProfile(user) {
  console.log('🔄 Updating profile with user data:', user);

  // Build full name from first_name and last_name
  const fullName = `${user.first_name} ${user.last_name}`;
  const initials = `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
  const courseYear = `${user.course || 'N/A'} ${user.year || ''}`.trim();
  const studentNumber = user.student_number || 'N/A';

  // Update sidebar avatar
  const sidebarAvatar = document.getElementById('sidebarAvatar');
  if (sidebarAvatar) {
    sidebarAvatar.textContent = initials;
    
    // Load saved avatar if exists
    const savedAvatar = localStorage.getItem(`avatar_${user.id}`);
    if (savedAvatar) {
      sidebarAvatar.style.backgroundImage = `url(${savedAvatar})`;
      sidebarAvatar.style.backgroundSize = 'cover';
      sidebarAvatar.style.backgroundPosition = 'center';
      sidebarAvatar.style.color = 'transparent';
    }
    
    console.log('✅ Updated sidebar avatar:', initials);
  }

  // Update sidebar name
  const sidebarName = document.getElementById('sidebarName');
  if (sidebarName) {
    sidebarName.textContent = fullName;
    console.log('✅ Updated sidebar name:', fullName);
  }

  // Update sidebar ID
  const sidebarId = document.getElementById('sidebarId');
  if (sidebarId) {
    sidebarId.textContent = `${courseYear} | ${studentNumber}`;
    console.log('✅ Updated sidebar ID:', `${courseYear} | ${studentNumber}`);
  }

  // Update profile modal fields
  const editName = document.getElementById('editName');
  if (editName) {
    editName.value = fullName;
    console.log('✅ Updated profile modal name');
  }

  const editCourse = document.getElementById('editCourse');
  if (editCourse) {
    editCourse.value = courseYear;
    console.log('✅ Updated profile modal course');
  }

  const editStudentId = document.getElementById('editStudentId');
  if (editStudentId) {
    editStudentId.value = studentNumber;
    console.log('✅ Updated profile modal student ID');
  }

  const editEmail = document.getElementById('editEmail');
  if (editEmail) {
    editEmail.value = user.email;
    console.log('✅ Updated profile modal email');
  }
}

// ============================================
// GET STUDENT INFO FROM CURRENT USER
// ============================================
function getStudentInfo() {
  if (currentUser) {
    return {
      studentNumber: currentUser.student_number,
      studentName: `${currentUser.first_name} ${currentUser.last_name}`,
      email: currentUser.email
    };
  }
  
  // Fallback to old method if currentUser not loaded
  return {
    studentNumber: localStorage.getItem('student_number') || '2021-54321',
    studentName: localStorage.getItem('student_name') || 'Student',
    email: localStorage.getItem('student_email') || 'student@pupsmb.edu.ph'
  };
}

// ============================================
// LOAD PAYMENT REQUIREMENTS FROM DATABASE
// ============================================
async function loadPaymentRequirements() {
  console.log('🔍 [Student] Loading payment requirements...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/payment-requirements`);
    const data = await response.json();

    if (data.success) {
      paymentRequirements = data.requirements || [];
      console.log('✅ [Student] Loaded', paymentRequirements.length, 'payment requirements');
      await loadUserPayments();
      updatePaymentDisplay();
    } else {
      console.error('❌ [Student] Failed to load payment requirements:', data.message);
      showEmptyState('Failed to load payment requirements');
    }
  } catch (error) {
    console.error('❌ [Student] Error loading payment requirements:', error);
    showEmptyState('Cannot connect to server. Please check if Laravel is running.');
  }
}

// ============================================
// LOAD USER'S PAYMENT SUBMISSIONS
// ============================================
async function loadUserPayments() {
  const studentInfo = getStudentInfo();
  
  try {
    const response = await fetch(`${API_BASE_URL}/payments/student/${studentInfo.studentNumber}`);
    const data = await response.json();

    if (data.success) {
      userPayments = data.payments || [];
      console.log('✅ [Student] Loaded', userPayments.length, 'user payments');
    }
  } catch (error) {
    console.error('❌ [Student] Error loading user payments:', error);
    userPayments = [];
  }
}

// ============================================
// UPDATE PAYMENT DISPLAY
// ============================================
function updatePaymentDisplay() {
  updateStatistics();
  displayPendingPayments();
  displayPaymentHistory();
}

// ============================================
// UPDATE STATISTICS
// ============================================
function updateStatistics() {
  const verifiedPayments = userPayments.filter(p => p.status === 'verified');
  const totalPaid = verifiedPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  
  const paidRequirements = new Set(verifiedPayments.map(p => p.requirement_id));
  const unpaidRequirements = paymentRequirements.filter(req => !paidRequirements.has(req.id));
  const totalUnpaid = unpaidRequirements.reduce((sum, req) => sum + parseFloat(req.amount), 0);

  document.querySelector('.stat-card:nth-child(1) .stat-value').textContent = `₱${totalPaid.toLocaleString()}`;
  document.querySelector('.stat-card:nth-child(2) .stat-value').textContent = `₱${totalUnpaid.toLocaleString()}`;
  document.querySelector('.stat-card:nth-child(3) .stat-value').textContent = userPayments.length;
  document.querySelector('.stat-card:nth-child(3) .stat-change').textContent = `${userPayments.length} Transactions`;
}

// ============================================
// DISPLAY PENDING PAYMENTS
// ============================================
function displayPendingPayments() {
  const container = document.getElementById('paymentContainer');
  if (!container) return;

  // Get already paid requirement IDs
  const verifiedPayments = userPayments.filter(p => p.status === 'verified');
  const paidRequirementIds = new Set(verifiedPayments.map(p => p.requirement_id));

  // Get pending submissions (don't show these as unpaid)
  const pendingSubmissions = userPayments.filter(p => p.status === 'pending');
  const pendingRequirementIds = new Set(pendingSubmissions.map(p => p.requirement_id));

  // Filter unpaid requirements (not paid and not pending)
  const unpaidRequirements = paymentRequirements.filter(req => 
    !paidRequirementIds.has(req.id) && !pendingRequirementIds.has(req.id)
  );

  if (unpaidRequirements.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i class="fas fa-check-circle"></i></div>
        <h2>All Payments Completed</h2>
        <p>You have no pending payments at this time</p>
      </div>
    `;
    return;
  }

  container.innerHTML = unpaidRequirements.map(req => {
    const dueDate = new Date(req.due_date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    const typeLabel = req.is_mandatory ? 'Mandatory' : 'Optional';

    return `
      <div class="payment-card unpaid" data-status="pending">
        <div class="payment-header">
          <div class="payment-title">${req.title}</div>
          <span class="payment-badge unpaid"><i class="fas fa-circle-exclamation"></i> Unpaid</span>
        </div>
        <div class="payment-amount">₱${parseFloat(req.amount).toLocaleString()}</div>
        <div class="payment-description">
          ${req.description || 'Payment requirement'}
        </div>
        <div class="payment-details">
          <div class="payment-detail-item">
            <span>Due Date:</span>
            <strong>${dueDate}</strong>
          </div>
          <div class="payment-detail-item">
            <span>Type:</span>
            <strong>${typeLabel}</strong>
          </div>
        </div>
        <button class="btn btn-primary full-btn" onclick="openPaymentModal('${escapeHtml(req.title)}', ${req.amount}, ${req.id})">Pay Now</button>
      </div>
    `;
  }).join('');
}

// ============================================
// DISPLAY PAYMENT HISTORY
// ============================================
function displayPaymentHistory() {
  const container = document.getElementById('historyContainer');
  if (!container) return;

  if (userPayments.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i class="fas fa-receipt"></i></div>
        <h2>No Payment History</h2>
        <p>You haven't made any payments yet</p>
      </div>
    `;
    return;
  }

  // Sort by date (newest first)
  const sortedPayments = [...userPayments].sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  );

  container.innerHTML = `
    <div style="overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
            <th style="padding: 12px; text-align: left; color: #800020; font-weight: 600;">Payment</th>
            <th style="padding: 12px; text-align: left; color: #800020; font-weight: 600;">Amount</th>
            <th style="padding: 12px; text-align: left; color: #800020; font-weight: 600;">Date</th>
            <th style="padding: 12px; text-align: left; color: #800020; font-weight: 600;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${sortedPayments.map(payment => {
            const date = new Date(payment.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });

            const statusClass = payment.status === 'verified' ? 'paid' : payment.status === 'rejected' ? 'rejected' : 'unpaid';
            const statusText = payment.status === 'verified' ? 'Verified' : payment.status === 'rejected' ? 'Rejected' : 'Pending';
            const statusIcon = payment.status === 'verified' ? 'fa-check-circle' : payment.status === 'rejected' ? 'fa-times-circle' : 'fa-clock';

            return `
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px; font-weight: 500;">${payment.requirement_title}</td>
                <td style="padding: 12px;">₱${parseFloat(payment.amount).toLocaleString()}</td>
                <td style="padding: 12px;">${date}</td>
                <td style="padding: 12px;">
                  <span class="payment-badge ${statusClass}">
                    <i class="fas ${statusIcon}"></i> ${statusText}
                  </span>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ============================================
// SHOW EMPTY STATE
// ============================================
function showEmptyState(message) {
  const container = document.getElementById('paymentContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon"><i class="fas fa-exclamation-triangle"></i></div>
      <h2>Cannot Load Payments</h2>
      <p>${message}</p>
      <button class="btn btn-primary" onclick="loadPaymentRequirements()" style="margin-top: 15px; padding: 10px 20px;">
        <i class="fas fa-sync"></i> Retry
      </button>
    </div>
  `;
}

// ============================================
// OPEN PAYMENT MODAL
// ============================================
function openPaymentModal(name, amount, requirementId) {
  currentPayment = { name, amount, requirementId };
  document.getElementById('paymentTitle').textContent = `Pay ${name}`;
  document.getElementById('paymentAmount').textContent = `₱${amount}`;
  document.getElementById('paymentModal').classList.add('active');

  document.body.classList.add('modal-open');

  // Find the requirement to get QR code and payment details
  const requirement = paymentRequirements.find(req => req.id === requirementId);
  
  const instructions = document.getElementById('paymentInstructions');
  
  // Check if QR code exists and construct proper URL
  let qrCodeHtml = '';
  if (requirement && requirement.qr_code) {
    // Remove /api from base URL and add /storage/
    const storageUrl = API_BASE_URL.replace('/api', '/storage/');
    qrCodeHtml = `<img src="${storageUrl}${requirement.qr_code}" alt="GCash QR Code" class="qr-image">`;
  } else {
    qrCodeHtml = `<img src="qr_hi.png" alt="GCash QR Code" class="qr-image">`;
  }
  
  instructions.innerHTML = `
    <div class="qr-code">
      ${qrCodeHtml}
      <p class="qr-text">Scan QR Code to Pay via GCash</p>
      <div class="account-info">
        <p><strong>Account Name:</strong> ${requirement?.gcash_name || 'PUP Santa Maria'}</p>
        <p><strong>GCash Number:</strong> ${requirement?.gcash_number || '0917-123-4567'}</p>
        <p><strong>Reference:</strong> ${currentPayment.name.replace(/\s+/g, '-').toUpperCase()}</p>
      </div>
    </div>
  `;

  resetPaymentModalState();
}

// ============================================
// CLOSE PAYMENT MODAL
// ============================================
function closePaymentModal() {
  document.getElementById('paymentModal').classList.remove('active');
  document.body.classList.remove('modal-open');
  resetPaymentModalState();
}

// ============================================
// RESET MODAL STATE
// ============================================
function resetPaymentModalState() {
  const proofInput = document.getElementById('proofInput');
  const uploadArea = document.getElementById('uploadArea');
  const filePreview = document.getElementById('filePreview');

  if (proofInput) proofInput.value = '';
  if (uploadArea) uploadArea.style.display = 'block';
  if (filePreview) filePreview.style.display = 'none';
}

// ============================================
// HANDLE FILE UPLOAD PREVIEW
// ============================================
function handleProofSelect(e) {
  const file = e.target.files[0];
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit');
      return;
    }

    document.getElementById('uploadArea').style.display = 'none';
    document.getElementById('filePreview').style.display = 'block';
    document.getElementById('fileName').textContent = `${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
  }
}

// ============================================
// REMOVE UPLOADED FILE
// ============================================
function removeUploadedFile() {
  const input = document.getElementById('proofInput');
  input.value = '';
  document.getElementById('filePreview').style.display = 'none';
  document.getElementById('uploadArea').style.display = 'block';
}

// ============================================
// SUBMIT PAYMENT
// ============================================
async function submitPayment() {
  const proofInput = document.getElementById('proofInput');
  if (proofInput.files.length === 0) {
    alert('Please upload proof of payment.');
    return;
  }

  const studentInfo = getStudentInfo();
  const formData = new FormData();
  formData.append('student_number', studentInfo.studentNumber);
  formData.append('requirement_id', currentPayment.requirementId);
  formData.append('amount', currentPayment.amount);
  formData.append('proof_image', proofInput.files[0]);

  try {
    const response = await fetch(`${API_BASE_URL}/payments`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (data.success) {
      alert(`✅ Payment submitted for ${currentPayment.name} (₱${currentPayment.amount}).\nYour payment is now being verified.`);
      closePaymentModal();
      await loadPaymentRequirements(); // Reload to update display
    } else {
      alert('❌ Failed to submit payment: ' + (data.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('❌ [Student] Error submitting payment:', error);
    alert('❌ Failed to submit payment. Please try again.');
  }
}

// ============================================
// FILTER PAYMENTS
// ============================================
function filterPayments(status) {
  const buttons = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.payment-card');

  buttons.forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('onclick').includes(status)) {
      btn.classList.add('active');
    }
  });

  cards.forEach(card => {
    const cardStatus = card.getAttribute('data-status');
    if (status === 'all' || cardStatus === status) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// ============================================
// MODAL CLICK OUTSIDE HANDLER
// ============================================
window.onclick = function(e) {
  const paymentModal = document.getElementById('paymentModal');
  const profileModal = document.getElementById('profileModal');
  if (e.target === paymentModal) closePaymentModal();
  if (e.target === profileModal) closeProfileModal();
};

// ============================================
// PROFILE MODAL HANDLERS
// ============================================
function openProfileModal() {
  document.getElementById('profileModal').classList.add('active');
  document.body.classList.add('modal-open');
}

function closeProfileModal() {
  document.getElementById('profileModal').classList.remove('active');
  document.body.classList.remove('modal-open');
}

function saveProfile() {
  const name = document.getElementById('editName').value;
  const course = document.getElementById('editCourse').value;
  const id = document.getElementById('editStudentId').value;

  document.getElementById('sidebarName').textContent = name;
  document.getElementById('sidebarId').textContent = `${course} | ${id}`;
  document.getElementById('sidebarAvatar').textContent =
    name.charAt(0) + (name.split(' ')[1]?.charAt(0) || '');

  // Save to localStorage
  localStorage.setItem('student_name', name);

  alert('Profile updated successfully!');
  closeProfileModal();
}

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 [Student] Initializing Student Payment Page...');
  
  // Load user data first
  loadUserData();
  
  // Then load payments
  await loadPaymentRequirements();
  
  console.log('✅ [Student] Payment page initialized with user:', currentUser?.first_name);
});