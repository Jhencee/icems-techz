// ⭐ CRITICAL: Prevent duplicate script execution with unique flag
if (window.organizationMainScriptLoaded) {
    console.warn('⚠️ Organization main script already loaded, blocking duplicate');
    throw new Error('Duplicate script load blocked');
}
window.organizationMainScriptLoaded = true;

// ==============================================
// ORGANIZATION.JS - MAIN NAVIGATION & SECTIONS
// ==============================================

// ⭐ CRITICAL: Single initialization flag
let mainOrganizationInitialized = false;

// Get all the section elements in the main wrapper
const sections = {
    'dashboard': document.getElementById('dashboardSection'),
    'events': document.getElementById('eventsSection'),
    'clearance': document.getElementById('clearanceSection'),
    'payments': document.getElementById('paymentsSection')
};

// Get modal elements
const profileModal = document.getElementById('profileModal');
const paymentSettingsModal = document.getElementById('paymentSettingsModal');
const logoutModal = document.getElementById('logoutModal');

// Get the sidebar element
const sidebar = document.getElementById('sidebar');

// Student Clearance Data
const studentClearanceData = {};

// Payment Transactions Data
const paymentTransactions = [];

// ============================================
// NAVIGATION AND SIDEBAR FUNCTIONS
// ============================================

function toggleSidebar() {
    sidebar.classList.toggle('active');
}

function showSection(sectionId) {
    console.log('🎯 [Navigation] Switching to section:', sectionId);

    // ⭐ Save current section to sessionStorage
    sessionStorage.setItem('currentSection', sectionId);

    // Hide all sections
    for (let id in sections) {
        if (sections[id]) {
            sections[id].style.display = 'none';
        }
    }

    // Show target section
    const targetSection = sections[sectionId];
    if (targetSection) {
        targetSection.style.display = 'block';
        console.log('✅ [Navigation] Section displayed:', sectionId);
    } else {
        console.error('❌ [Navigation] Section not found:', sectionId);
    }

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    const activeLink = document.querySelector(`.nav-link[onclick*="${sectionId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // Close sidebar on mobile
    if (sidebar && sidebar.classList.contains('active')) {
        toggleSidebar();
    }

    // Load section-specific data ONLY when needed
    if (sectionId === 'dashboard') {
        console.log('📊 [Navigation] Loading dashboard...');
        loadRecentActivity();
        updateDashboardStats();
    }

    if (sectionId === 'events') {
        console.log('🎨 [Navigation] Initializing Events section...');
        if (typeof window.initializeEventsSection === 'function') {
            window.initializeEventsSection();
        }
    }

    if (sectionId === 'clearance') {
        console.log('📋 [Navigation] Loading clearance section...');
        if (typeof window.loadClearanceSubmissions === 'function') {
            window.loadClearanceSubmissions();
        }
    }

    if (sectionId === 'payments') {
        console.log('💰 [Navigation] Loading payments section...');
        loadPaymentTransactions();
        updatePaymentStats();
    }
}

// ============================================
// DASHBOARD FUNCTIONS
// ============================================

function loadRecentActivity() {
    const dashboardContainer = document.querySelector('#dashboardSection .table-container');
    if (!dashboardContainer) return;

    dashboardContainer.innerHTML = `
        <div class="table-header">
            <h2 class="table-title">Recent Activity</h2>
        </div>
        <div class="empty-state">
            <div class="empty-icon"><i class="fa-solid fa-chart-column"></i></div>
            <h2>No Recent Activity</h2>
            <p>Start creating events and managing clearances to see activity here</p>
        </div>
    `;
}

function updateDashboardStats() {
    const totalEvents = document.getElementById('totalEvents');
    const totalClearance = document.getElementById('totalClearance');
    const totalPayments = document.getElementById('totalPayments');
    const totalStudents = document.getElementById('totalStudents');

    // ⭐ Use safe function that doesn't trigger event loading
    if (totalEvents) {
        const eventCount = typeof window.getEventCountForDashboard === 'function'
            ? window.getEventCountForDashboard()
            : 0;
        totalEvents.textContent = eventCount;
    }

    if (totalClearance) totalClearance.textContent = Object.keys(studentClearanceData).length;

    const paymentsSum = paymentTransactions.reduce((sum, p) => sum + p.amount, 0);
    if (totalPayments) totalPayments.textContent = `₱${paymentsSum}`;
    if (totalStudents) totalStudents.textContent = Object.keys(studentClearanceData).length;
}

// ============================================
// STUDENT CLEARANCE DETAILS MODAL
// ============================================

function viewStudentDetails(studentId) {
    const student = studentClearanceData[studentId];

    if (!student) {
        alert("Student data not found!");
        return;
    }

    let modalHTML = `
        <div class="modal active" id="studentDetailsModal" style="display: flex;">
            <div class="modal-content" style="max-width: 800px;">
                <span class="close-modal" onclick="closeStudentDetailsModal()">&times;</span>
                <h2 class="modal-title">Student Clearance Details</h2>
                
                <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 10px;">
                    <h3 style="margin-bottom: 10px; color: #800020;">${student.name}</h3>
                    <p><strong>Student ID:</strong> ${studentId}</p>
                    <p><strong>Course & Year:</strong> ${student.course}</p>
                    <p><strong>Email:</strong> ${student.email}</p>
                    <p><strong>Current Status:</strong> <span style="color: ${student.status === 'CLEARED' ? '#059669' : '#f59e0b'}; font-weight: 600;">${student.status}</span></p>
                </div>
                
                <h3 style="margin-bottom: 15px;">Event Attendance Records</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; margin-bottom: 20px;">`;

    if (student.eventAttendance && student.eventAttendance.length > 0) {
        student.eventAttendance.forEach(event => {
            modalHTML += `
                <div style="border: 2px solid #e5e5e5; border-radius: 10px; padding: 10px; text-align: center;">
                    <img src="${event.photoUrl}" alt="${event.eventName}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;">
                    <p style="font-weight: 600; font-size: 0.9rem; margin-bottom: 5px;">${event.eventName}</p>
                    <p style="font-size: 0.85rem; color: #666;">${event.date}</p>
                    <span style="color: #059669; font-weight: 600; font-size: 0.85rem;">${event.status}</span>
                </div>
            `;
        });
    } else {
        modalHTML += `<p style="text-align: center; color: #666;">No event attendance records found.</p>`;
    }

    modalHTML += `
                </div>
                
                <div style="display: flex; gap: 15px; justify-content: center; padding-top: 20px; border-top: 1px solid #e5e5e5;">
                    <button class="btn btn-primary" onclick="approveClearance('${studentId}')" style="background: #059669;">
                        <i class="fas fa-check"></i> Approve Clearance
                    </button>
                    <button class="btn" onclick="rejectClearance('${studentId}')" style="background: #dc2626; color: white;">
                        <i class="fas fa-times"></i> Reject Clearance
                    </button>
                    <button class="btn btn-secondary" onclick="closeStudentDetailsModal()">
                        <i class="fas fa-arrow-left"></i> Close
                    </button>
                </div>
            </div>
        </div>
    `;

    const existingModal = document.getElementById('studentDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeStudentDetailsModal() {
    const modal = document.getElementById('studentDetailsModal');
    if (modal) {
        modal.remove();
    }
}

function approveClearance(studentId) {
    if (confirm(`Approve clearance for ${studentClearanceData[studentId].name}?`)) {
        studentClearanceData[studentId].status = "CLEARED";
        alert(`Clearance approved for ${studentClearanceData[studentId].name}!`);
        closeStudentDetailsModal();
    }
}

function rejectClearance(studentId) {
    const reason = prompt(`Enter reason for rejecting clearance for ${studentClearanceData[studentId].name}:`);
    if (reason) {
        studentClearanceData[studentId].status = "REJECTED";
        alert(`Clearance rejected for ${studentClearanceData[studentId].name}.\nReason: ${reason}`);
        closeStudentDetailsModal();
    }
}

// ============================================
// QR CODE VALIDATION WITH JSQR LIBRARY
// ============================================

// Load jsQR library dynamically
function loadJsQRLibrary() {
    return new Promise((resolve, reject) => {
        if (window.jsQR) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load QR scanner library'));
        document.head.appendChild(script);
    });
}

function validateQRCode(file) {
    return new Promise(async (resolve, reject) => {
        // Check if file exists
        if (!file) {
            reject('No file selected');
            return;
        }

        // Check file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            reject('Invalid file type. Please upload a valid image (JPEG, PNG, WEBP)');
            return;
        }

        // Check file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            reject('File size too large. Maximum size is 5MB');
            return;
        }

        // Load jsQR library if not already loaded
        try {
            await loadJsQRLibrary();
        } catch (error) {
            reject('Failed to load QR validation library');
            return;
        }

        // Create image to validate
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                // Check minimum dimensions (QR codes should be at least 100x100)
                if (img.width < 100 || img.height < 100) {
                    reject('Image too small. QR code must be at least 100x100 pixels');
                    return;
                }

                // Create canvas to process image
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                // Get image data
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                // Use jsQR to detect QR code
                const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });

                if (!qrCode) {
                    reject('No valid QR code detected in image. Please upload an image containing a QR code.');
                    return;
                }

                // QR code detected successfully
                console.log('QR Code Data:', qrCode.data);
                
                resolve({
                    valid: true,
                    dataUrl: e.target.result,
                    width: img.width,
                    height: img.height,
                    size: file.size,
                    qrData: qrCode.data,
                    qrLocation: qrCode.location
                });
            };

            img.onerror = function() {
                reject('Invalid image file. Unable to load image');
            };

            img.src = e.target.result;
        };

        reader.onerror = function() {
            reject('Error reading file. Please try again');
        };

        reader.readAsDataURL(file);
    });
}

function openUploadQRModal() {
    let modalHTML = `
        <div class="modal active" id="uploadQRModal" style="display: flex !important; z-index: 10000;">
            <div class="modal-content" style="max-width: 500px;">
                <span class="close-modal" onclick="closeUploadQRModal()">&times;</span>
                <h2 class="modal-title"><i class="fas fa-qrcode"></i> Upload Payment QR Code</h2>
                
                <form id="uploadQRForm" style="padding: 20px 0;">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">
                            QR Code Image <span style="color: #dc2626;">*</span>
                        </label>
                        <div style="position: relative;">
                            <input 
                                type="file" 
                                id="qrCodeInput" 
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                style="width: 100%; padding: 12px; border: 2px dashed #800020; border-radius: 8px; cursor: pointer; background: #fff;"
                                required
                            />
                        </div>
                        <small style="display: block; margin-top: 5px; color: #666;">
                            <i class="fas fa-info-circle"></i> Accepted formats: JPG, PNG, WEBP (Max 5MB)
                        </small>
                    </div>

                    <!-- Validation Message -->
                    <div id="qrValidationMessage" style="display: none; padding: 12px; border-radius: 8px; margin-bottom: 15px; font-size: 0.9rem;"></div>

                    <!-- Preview Container -->
                    <div id="qrPreviewContainer" style="display: none; margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">
                            <i class="fas fa-eye"></i> Preview:
                        </label>
                        <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px; border: 2px solid #059669;">
                            <img id="qrPreview" src="" alt="QR Preview" style="max-width: 100%; max-height: 300px; border-radius: 8px;" />
                        </div>
                        <div id="qrInfo" style="margin-top: 10px; font-size: 0.85rem; color: #666; text-align: center;"></div>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">
                            Payment Title
                        </label>
                        <input 
                            type="text" 
                            id="qrPaymentTitle" 
                            placeholder="e.g., Organizational Fee, Event Registration Fee"
                            style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;"
                        />
                    </div>

                    <div style="display: flex; gap: 15px; justify-content: center; padding-top: 15px; border-top: 1px solid #e5e5e5;">
                        <button type="submit" class="btn btn-primary" id="uploadQRBtn" disabled style="background: #800020; opacity: 0.5;">
                            <i class="fas fa-upload"></i> Upload QR Code
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="closeUploadQRModal()">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('uploadQRModal');
    if (existingModal) existingModal.remove();

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Add event listener for file input
    const qrInput = document.getElementById('qrCodeInput');
    const uploadBtn = document.getElementById('uploadQRBtn');
    const validationMsg = document.getElementById('qrValidationMessage');
    const previewContainer = document.getElementById('qrPreviewContainer');
    const qrPreview = document.getElementById('qrPreview');
    const qrInfo = document.getElementById('qrInfo');

    let validatedFile = null;

    qrInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        
        // Reset validation state
        validationMsg.style.display = 'none';
        previewContainer.style.display = 'none';
        uploadBtn.disabled = true;
        uploadBtn.style.opacity = '0.5';
        validatedFile = null;

        if (!file) return;

        try {
            // Show loading state
            validationMsg.style.display = 'block';
            validationMsg.style.background = '#e0f2fe';
            validationMsg.style.color = '#0369a1';
            validationMsg.style.border = '1px solid #bae6fd';
            validationMsg.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Validating QR code...';

            // Validate the QR code
            const result = await validateQRCode(file);

            // Show success message
            validationMsg.style.background = '#dcfce7';
            validationMsg.style.color = '#059669';
            validationMsg.style.border = '1px solid #86efac';
            validationMsg.innerHTML = '<i class="fas fa-check-circle"></i> <strong>Valid QR code detected!</strong> The image passed all validation checks.';

            // Show preview
            previewContainer.style.display = 'block';
            qrPreview.src = result.dataUrl;
            qrInfo.innerHTML = `
                <i class="fas fa-info-circle"></i>
                <strong>Dimensions:</strong> ${result.width}x${result.height}px | 
                <strong>Size:</strong> ${(result.size / 1024).toFixed(2)} KB
            `;

            // Enable upload button
            uploadBtn.disabled = false;
            uploadBtn.style.opacity = '1';
            validatedFile = file;

        } catch (error) {
            // Show error message
            validationMsg.style.display = 'block';
            validationMsg.style.background = '#fee2e2';
            validationMsg.style.color = '#dc2626';
            validationMsg.style.border = '1px solid #fca5a5';
            validationMsg.innerHTML = `
                <i class="fas fa-exclamation-circle"></i> 
                <strong>Invalid QR Code!</strong><br>
                <span style="font-size: 0.85rem;">${error}</span>
            `;

            uploadBtn.disabled = true;
            uploadBtn.style.opacity = '0.5';
            validatedFile = null;
        }
    });

    // Handle form submission
    const form = document.getElementById('uploadQRForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        if (!validatedFile) {
            alert('⚠️ Please select a valid QR code image first!');
            return;
        }

        const paymentTitle = document.getElementById('qrPaymentTitle').value;

        // Here you would typically upload to your server
        alert(`✅ QR Code uploaded successfully!${paymentTitle ? '\n📝 Title: ' + paymentTitle : ''}`);
        
        closeUploadQRModal();
    });
}

function closeUploadQRModal() {
    const modal = document.getElementById('uploadQRModal');
    if (modal) modal.remove();
}

// ============================================
// PAYMENT TRANSACTIONS FUNCTIONS
// ============================================

function loadPaymentTransactions() {
    const paymentsTableContainer = document.querySelector('#paymentsSection .table-container');

    if (!paymentsTableContainer) return;

    if (paymentTransactions.length === 0) {
        paymentsTableContainer.innerHTML = `
            <div class="table-header">
                <h2 class="table-title">Payment Transactions</h2>
                <div class="search-box">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" placeholder="Search transactions...">
                </div>
            </div>
            <div class="empty-state">
                <div class="empty-icon"><i class="fa-solid fa-peso-sign"></i></div>
                <h2>No Payment Transactions</h2>
                <p>Student payment submissions will appear here</p>
            </div>
        `;
        return;
    }

    let html = `
        <div class="table-header">
            <h2 class="table-title">Payment Transactions</h2>
            <div class="search-box">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input type="text" placeholder="Search transactions..." id="paymentSearch">
            </div>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Reference</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    paymentTransactions.forEach(payment => {
        const statusBadge = payment.status === 'Verified' ?
            '<span style="color:#059669; font-weight: 600;">VERIFIED</span>' :
            '<span style="color:#f59e0b; font-weight: 600;">PENDING</span>';

        const actionButton = payment.status === 'Pending' ?
            `<button class="btn btn-primary" style="padding: 6px 10px; font-size: 0.8rem;" onclick="openVerifyPaymentModal(${payment.id})">
                <i class="fas fa-check"></i> Verify
            </button>` :
            '<span style="color: #999;">Verified</span>';

        html += `
            <tr>
                <td>${payment.studentId}</td>
                <td>${payment.name}</td>
                <td>₱${payment.amount}</td>
                <td>${payment.date}</td>
                <td>${payment.reference}</td>
                <td>${statusBadge}</td>
                <td>${actionButton}</td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    paymentsTableContainer.innerHTML = html;

    const searchInput = document.getElementById('paymentSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            const searchTerm = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#paymentsSection table tbody tr');

            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }
}

function openVerifyPaymentModal(paymentId) {
    const payment = paymentTransactions.find(p => p.id === paymentId);

    if (!payment) {
        alert("Payment not found!");
        return;
    }

    let modalHTML = `
        <div class="modal active" id="verifyPaymentModal" style="display: flex !important; z-index: 10000;">
            <div class="modal-content" style="max-width: 500px;">
                <span class="close-modal" onclick="closeVerifyPaymentModal()">&times;</span>
                <h2 class="modal-title">Verify Payment</h2>
                
                <p style="margin-bottom: 20px; color: #666; text-align: center;">
                    Are you sure you want to verify this payment?
                </p>
                
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button class="btn btn-primary" onclick="confirmVerifyPayment(${payment.id})" style="background: #059669;">
                        <i class="fas fa-check"></i> Confirm Verification
                    </button>
                    <button class="btn btn-secondary" onclick="closeVerifyPaymentModal()">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
            </div>
        </div>
    `;

    const existingModal = document.getElementById('verifyPaymentModal');
    if (existingModal) {
        existingModal.remove();
    }

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeVerifyPaymentModal() {
    const modal = document.getElementById('verifyPaymentModal');
    if (modal) {
        modal.remove();
    }
}

function confirmVerifyPayment(paymentId) {
    const payment = paymentTransactions.find(p => p.id === paymentId);
    if (payment) {
        payment.status = 'Verified';
        alert('Payment verified successfully!');
        closeVerifyPaymentModal();
        loadPaymentTransactions();
        updatePaymentStats();
    }
}

function verifyPayment(paymentId) {
    openVerifyPaymentModal(paymentId);
}

function updatePaymentStats() {
    const totalCollected = paymentTransactions
        .filter(p => p.status === 'Verified')
        .reduce((sum, p) => sum + p.amount, 0);

    const pendingCount = paymentTransactions.filter(p => p.status === 'Pending').length;
    const verifiedCount = paymentTransactions.filter(p => p.status === 'Verified').length;

    const statsCards = document.querySelectorAll('#paymentsSection .stat-card');
    if (statsCards[0]) {
        const valueEl = statsCards[0].querySelector('.stat-value');
        if (valueEl) valueEl.textContent = `₱${totalCollected}`;
    }
    if (statsCards[1]) {
        const valueEl = statsCards[1].querySelector('.stat-value');
        if (valueEl) valueEl.textContent = pendingCount;
    }
    if (statsCards[2]) {
        const valueEl = statsCards[2].querySelector('.stat-value');
        if (valueEl) valueEl.textContent = verifiedCount;
    }
}

// ============================================
// MODAL MANAGEMENT FUNCTIONS
// ============================================

function openProfileModal() { if (profileModal) profileModal.style.display = 'flex'; }
function closeProfileModal() { if (profileModal) profileModal.style.display = 'none'; }
function openPaymentSettingsModal() { if (paymentSettingsModal) paymentSettingsModal.style.display = 'flex'; }
function closePaymentSettingsModal() { if (paymentSettingsModal) paymentSettingsModal.style.display = 'none'; }
function logout() { if (logoutModal) logoutModal.style.display = 'flex'; }
function closeLogoutModal() { if (logoutModal) logoutModal.style.display = 'none'; }
function confirmLogout() { alert('Logging out...'); window.location.href = '../user/studentlogin.html'; }

// ============================================
// FORM HANDLING
// ============================================

function handlePaymentSettings(e) {
    e.preventDefault();
    const title = document.getElementById('paymentTitle').value;
    const amount = document.getElementById('paymentAmount').value;
    console.log(`Payment Setting Saved: ${title} (₱${amount})`);
    alert(`Payment setting for "${title}" saved successfully!`);
    closePaymentSettingsModal();
    document.getElementById('paymentSettingsForm').reset();
}

// ============================================
// PAYMENT QR VALIDATION IN SETTINGS MODAL
// ============================================

function setupPaymentQRValidation() {
    const qrInput = document.getElementById('paymentQR');
    if (!qrInput) return;

    // Create validation message container if it doesn't exist
    let validationContainer = document.getElementById('qrValidationContainer');
    if (!validationContainer) {
        validationContainer = document.createElement('div');
        validationContainer.id = 'qrValidationContainer';
        validationContainer.style.marginTop = '10px';
        qrInput.parentElement.appendChild(validationContainer);
    }

    // Create preview container if it doesn't exist
    let previewContainer = document.getElementById('qrPreviewInSettings');
    if (!previewContainer) {
        previewContainer = document.createElement('div');
        previewContainer.id = 'qrPreviewInSettings';
        previewContainer.style.display = 'none';
        previewContainer.style.marginTop = '15px';
        previewContainer.style.textAlign = 'center';
        qrInput.parentElement.appendChild(previewContainer);
    }

    // Add change event listener
    qrInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        
        // Reset states
        validationContainer.innerHTML = '';
        previewContainer.style.display = 'none';
        previewContainer.innerHTML = '';

        if (!file) return;

        try {
            // Show loading
            validationContainer.innerHTML = `
                <div style="padding: 10px; background: #e0f2fe; color: #0369a1; border-radius: 8px; font-size: 0.9rem;">
                    <i class="fas fa-spinner fa-spin"></i> Validating QR code...
                </div>
            `;

            // Validate the QR code
            const result = await validateQRCode(file);

            // Show success message
            validationContainer.innerHTML = `
                <div style="padding: 10px; background: #dcfce7; color: #059669; border: 1px solid #86efac; border-radius: 8px; font-size: 0.9rem;">
                    <i class="fas fa-check-circle"></i> <strong>Valid QR code detected!</strong> 
                    <div style="margin-top: 5px; font-size: 0.85rem;">
                        QR Code Data: <code style="background: #fff; padding: 2px 6px; border-radius: 4px;">${result.qrData}</code>
                    </div>
                </div>
            `;

            // Show preview
            previewContainer.style.display = 'block';
            previewContainer.innerHTML = `
                <div style="padding: 15px; background: #f8f9fa; border: 2px solid #059669; border-radius: 8px;">
                    <img src="${result.dataUrl}" alt="QR Preview" style="max-width: 100%; max-height: 200px; border-radius: 8px;" />
                    <div style="margin-top: 10px; font-size: 0.85rem; color: #666;">
                        <i class="fas fa-info-circle"></i>
                        <strong>Dimensions:</strong> ${result.width}x${result.height}px | 
                        <strong>Size:</strong> ${(result.size / 1024).toFixed(2)} KB
                    </div>
                </div>
            `;

        } catch (error) {
            // Show error message
            validationContainer.innerHTML = `
                <div style="padding: 10px; background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; border-radius: 8px; font-size: 0.9rem;">
                    <i class="fas fa-exclamation-circle"></i> 
                    <strong>Invalid QR Code!</strong><br>
                    <span style="font-size: 0.85rem;">${error}</span>
                </div>
            `;

            // Clear the file input
            qrInput.value = '';
        }
    });
}

// ============================================
// INITIALIZE - ONLY RUNS ONCE
// ============================================
if (!mainOrganizationInitialized) {
    mainOrganizationInitialized = true;

    document.addEventListener('DOMContentLoaded', () => {
        console.log('🚀 [Main Organization] Initializing...');

        // ⭐ Restore saved section or default to dashboard
        const savedSection = sessionStorage.getItem('currentSection') || 'dashboard';
        console.log('📌 [Navigation] Restoring section:', savedSection);
        showSection(savedSection);

        // Close modal handlers
        document.querySelectorAll('.close-modal').forEach(span => {
            span.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal') || e.target.closest('.logout-modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });

        // Payment settings form
        const paymentSettingsForm = document.getElementById('paymentSettingsForm');
        if (paymentSettingsForm) {
            paymentSettingsForm.addEventListener('submit', handlePaymentSettings);
        }

        // Payment settings button
        const openPaymentSettingsBtn = document.getElementById('openPaymentSettings');
        if (openPaymentSettingsBtn) {
            openPaymentSettingsBtn.addEventListener('click', () => {
                openPaymentSettingsModal();
                // Setup QR validation after modal opens
                setTimeout(setupPaymentQRValidation, 100);
            });
        }

        // Click outside modal to close
        window.onclick = function (event) {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        }

        console.log('✅ [Main Organization] Initialized successfully');
    }, { once: true });
}