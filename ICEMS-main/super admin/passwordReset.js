// ============================================
// COMPLETE PASSWORD RESET SYSTEM
// ============================================
// NOTE: This file uses window.API_URL which should be set in the main JS file

// Sample Admins - IDs start from 2 because ID 1 is Super Admin (protected)
const sampleAdminsPasswordReset = [
    { id: 2, name: 'Accounting', department: 'Accounting', role: 'Admin', status: 'Active', email: 'accounting.pupsmb@gmail.com' },
    { id: 3, name: 'Director', department: 'Administration', role: 'Admin', status: 'Active', email: 'director.pupsmb@gmail.com' },
    { id: 4, name: 'Gymnasium', department: 'Sports', role: 'Admin', status: 'Active', email: 'gymnasium.pupsmb@gmail.com' },
    { id: 5, name: 'Laboratory', department: 'Laboratory', role: 'Admin', status: 'Active', email: 'laboratory.pupsmb@gmail.com' },
    { id: 6, name: 'Library', department: 'Library', role: 'Admin', status: 'Active', email: 'library.pupsmb@gmail.com' },
    { id: 7, name: 'Nurse', department: 'Medical', role: 'Admin', status: 'Active', email: 'nurse.pupsmb@gmail.com' },
    { id: 8, name: 'Student Organization', department: 'Student Affairs', role: 'Admin', status: 'Active', email: 'organization.pupsmb@gmail.com' },
    { id: 9, name: 'Student Publication', department: 'Media', role: 'Admin', status: 'Active', email: 'publication.pupsmb@gmail.com' },
    { id: 10, name: 'Student Service Office (SSO)', department: 'Student Services', role: 'Admin', status: 'Active', email: 'sso.pupsmb@gmail.com' },
    { id: 11, name: 'Student Council', department: 'Student Government', role: 'Admin', status: 'Active', email: 'studentcouncil.pupsmb@gmail.com' }
];

// ============================================
// LOAD ADMIN DROPDOWN
// ============================================
function loadAdminSelect() {
    const select = document.getElementById('adminSelect');
    if (!select) {
        console.error('❌ adminSelect dropdown not found!');
        return;
    }

    console.log('🔄 Loading admin dropdown...');
    console.log('Available admins:', sampleAdminsPasswordReset);

    // Clear existing options except the first placeholder
    select.innerHTML = '';
    
    // Add placeholder option
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = '-- Select Admin to Reset Password --';
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);

    // Add all admins to dropdown (excluding Super Admin)
    sampleAdminsPasswordReset.forEach(admin => {
        const option = document.createElement('option');
        option.value = admin.id;
        option.textContent = `${admin.name} (${admin.department})`;
        option.setAttribute('data-email', admin.email);
        select.appendChild(option);
        console.log(`✅ Added: ${admin.name} (${admin.department})`);
    });

    console.log('✅ Admin dropdown loaded with', sampleAdminsPasswordReset.length, 'admins');
}

// ============================================
// SETUP PASSWORD CHANGE FORM
// ============================================
function setupPasswordChangeForm() {
    const form = document.getElementById('resetPasswordForm');
    if (!form) {
        console.error('❌ Reset password form not found!');
        return;
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const adminSelect = document.getElementById('adminSelect');
        const newPassword = document.getElementById('newPassword').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value.trim();

        // Get selected admin ID and info
        const adminId = adminSelect.value;
        const selectedOption = adminSelect.options[adminSelect.selectedIndex];
        const adminName = selectedOption ? selectedOption.textContent : 'Unknown Admin';

        console.log('🔐 Password reset attempt:', {
            adminId: adminId,
            adminName: adminName,
            passwordLength: newPassword.length
        });

        // Validate admin selection
        if (!adminId || adminId === '') {
            showAlert('Error', 'Please select an admin from the dropdown', 'error');
            return;
        }

        // Validate passwords
        if (!newPassword || !confirmPassword) {
            showAlert('Error', 'Please fill in both password fields', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showAlert('Error', 'Password must be at least 6 characters long', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showAlert('Error', 'Passwords do not match! Please check and try again.', 'error');
            return;
        }

        // Show confirmation dialog
        showAlert = window.showAlert || showAlertPasswordReset;
        showConfirm = window.showConfirm || showConfirmPasswordReset;
        
        showConfirm(
            'Confirm Password Reset',
            `Are you sure you want to reset the password for ${adminName}?`,
            async function () {
                // Call the password update function
                const success = await updateAdminPassword(adminId, newPassword, adminName);

                if (success) {
                    // Clear the form after successful update
                    form.reset();
                }
            }
        );
    });

    console.log('✅ Password change form initialized');
}

// ============================================
// UPDATE ADMIN PASSWORD VIA API
// ============================================
async function updateAdminPassword(adminId, newPassword, adminName) {
    try {
        console.log(`🔄 Sending password reset request for Admin ID: ${adminId}`);

        const apiUrl = window.API_URL || 'http://127.0.0.1:8000/api';
        const response = await fetch(`${apiUrl}/admin/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                admin_id: parseInt(adminId),
                new_password: newPassword
            })
        });

        console.log('📡 Response status:', response.status);

        // Check if response is OK
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ HTTP Error:', response.status, errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📦 Response data:', data);

        if (data.success) {
            const alertFn = window.showAlert || showAlertPasswordReset;
            alertFn(
                'Success', 
                `Password changed successfully for ${adminName}!`, 
                'success'
            );

            // Log this action
            logAdminAction('Password Reset', `Changed password for: ${adminName} (ID: ${adminId})`);

            // Refresh the admin list if needed
            loadSecurityAdminList();

            return true;
        } else {
            const alertFn = window.showAlert || showAlertPasswordReset;
            alertFn('Error', data.message || 'Failed to change password', 'error');
            return false;
        }
    } catch (error) {
        console.error('💥 Error changing password:', error);

        const alertFn = window.showAlert || showAlertPasswordReset;
        
        // Provide specific error messages
        if (error.message.includes('403')) {
            alertFn(
                'Error', 
                'Cannot change Super Admin password. Please select a regular admin.', 
                'error'
            );
        } else if (error.message.includes('404')) {
            alertFn(
                'Error', 
                'API endpoint not found. Please check your backend routes and make sure the server is running.', 
                'error'
            );
        } else if (error.message.includes('Failed to fetch')) {
            alertFn(
                'Error', 
                'Cannot connect to server. Please make sure your Laravel backend is running on http://127.0.0.1:8000', 
                'error'
            );
        } else {
            alertFn(
                'Error', 
                'Failed to change password. Please try again or check the console for details.', 
                'error'
            );
        }
        
        return false;
    }
}

// ============================================
// LOAD SECURITY ADMIN LIST TABLE
// ============================================
function loadSecurityAdminList() {
    const tbody = document.getElementById('securityAdminList');
    if (!tbody) return;

    tbody.innerHTML = '';

    sampleAdminsPasswordReset.forEach(admin => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${admin.name}</td>
            <td>${admin.department}</td>
            <td>${admin.email}</td>
            <td><span class="status-badge status-active">${admin.status}</span></td>
        `;
        tbody.appendChild(tr);
    });

    console.log('✅ Security admin list loaded');
}

// ============================================
// INITIALIZE SECURITY CONTROL ON PAGE LOAD
// ============================================
function initializeSecurityControl() {
    console.log('🔧 Initializing Security Control...');
    
    loadAdminSelect();
    loadSecurityAdminList();
    setupPasswordChangeForm();
    
    console.log('✅ Security Control initialized successfully');
}

// ============================================
// LOG ADMIN ACTION FOR AUDIT TRAIL
// ============================================
function logAdminAction(action, details) {
    try {
        const timestamp = new Date().toLocaleString();
        const logEntry = {
            timestamp: timestamp,
            action: action,
            details: details,
            performedBy: 'Super Admin'
        };

        console.log('📝 Logging action:', logEntry);

        const apiUrl = window.API_URL || 'http://127.0.0.1:8000/api';
        
        // Send to API for logging
        fetch(`${apiUrl}/admin/log-action`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(logEntry)
        })
        .then(response => response.json())
        .then(data => console.log('✅ Action logged:', data))
        .catch(err => console.log('⚠️ Failed to log action:', err));
    } catch (error) {
        console.error('💥 Error logging action:', error);
    }
}

// ============================================
// MODAL FUNCTIONS (REUSABLE)
// ============================================
function showAlertPasswordReset(title, message, type = 'success') {
    const iconMap = {
        success: 'fa-check-circle success',
        error: 'fa-times-circle error',
        warning: 'fa-exclamation-triangle warning',
        info: 'fa-info-circle info'
    };

    const titleEl = document.getElementById('alertTitle');
    const messageEl = document.getElementById('alertMessage');
    const iconEl = document.getElementById('alertIcon');
    
    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.innerHTML = message;
    if (iconEl) iconEl.className = 'fas modal-icon ' + iconMap[type];

    const openFn = window.openModal || openModalLocal;
    openFn('alertModal');
}

function showConfirmPasswordReset(title, message, onConfirm) {
    const titleEl = document.getElementById('confirmTitle');
    const messageEl = document.getElementById('confirmMessage');
    
    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = message;

    const confirmBtn = document.getElementById('confirmYes');
    if (confirmBtn) {
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

        newConfirmBtn.addEventListener('click', function () {
            const closeFn = window.closeModal || closeModalLocal;
            closeFn('confirmModal');
            onConfirm();
        });
    }

    const openFn = window.openModal || openModalLocal;
    openFn('confirmModal');
}

function openModalLocal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
}

function closeModalLocal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

// ============================================
// EXPORT FUNCTIONS TO WINDOW (FOR HTML ACCESS)
// ============================================
window.initializeSecurityControl = initializeSecurityControl;
window.updateAdminPassword = updateAdminPassword;

// ============================================
// AUTO-INITIALIZE ON DOM READY
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded - checking for Security Control section...');
    
    // Initialize if Security Control section exists (check both possible IDs)
    const securitySection = document.getElementById('securityControl') || document.getElementById('security');
    if (securitySection) {
        console.log('✅ Security section found, initializing...');
        initializeSecurityControl();
    } else {
        console.log('⚠️ Security section not found on this page');
    }
});