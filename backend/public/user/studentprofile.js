document.addEventListener('DOMContentLoaded', () => {
    // 1. Live Image Preview Functionality for Profile Picture
    const imageUpload = document.getElementById('profileImageUpload');
    const imagePreview = document.getElementById('profileImagePreview');

    if (imageUpload && imagePreview) {
        imageUpload.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    // Update the circular image source with the uploaded file
                    imagePreview.src = e.target.result;
                };
                reader.readAsDataURL(file); 
            }
        });
    }
});

// ----------------------------------------------------
// --- PROFILE & SETTINGS SPECIFIC FUNCTIONS ---
// ----------------------------------------------------

/**
 * Handles the action for saving the profile picture changes.
 */
function saveProfilePicture() {
    const fileInput = document.getElementById('profileImageUpload');
    if (fileInput.files.length > 0) {
        // In a real application, you'd send the file to the server via AJAX/Fetch API here.
        alert('✅ Success: Profile picture uploaded! (Requires server-side implementation to finalize.)');
    } else {
        alert('⚠️ Note: No new image selected. Profile changes saved.');
    }
}


/**
 * STEP 1: Verifies the current password before showing new password fields.
 * NOTE: The verification must be handled SECURELY by the server. This is a placeholder.
 */
function verifyCurrentPassword() {
    const currentPassInput = document.getElementById('currentPassword');
    const currentPass = currentPassInput.value;
    const newFieldsDiv = document.getElementById('newPasswordFields');
    const verifyBtn = document.getElementById('verifyPasswordBtn');

    if (!currentPass) {
        alert('❌ Error: Please enter your current password to proceed.');
        return;
    }

    // --- CRITICAL SERVER INTERACTION (Placeholder) ---
    // Simulate an API call where the server checks the 'currentPass' hash.
    
    // For demonstration, we assume verification is successful.
    const isPasswordCorrect = true; 

    if (isPasswordCorrect) {
        alert('✅ Password Verified! You may now set your new password.');
        
        // 1. Reveal the new password fields
        newFieldsDiv.style.display = 'block';
        
        // 2. Hide the verification button
        verifyBtn.style.display = 'none';

        // 3. Make the current password field read-only
        currentPassInput.readOnly = true;

        // 4. Clear and focus new password fields
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        document.getElementById('newPassword').focus();

    } else {
        alert('❌ Error: Incorrect current password. Please try again.');
        // Clear the field for security
        currentPassInput.value = '';
    }
}

/**
 * STEP 2: Handles the validation and submission of the new password.
 */
function submitNewPassword() {
    const currentPassInput = document.getElementById('currentPassword');
    const newPassInput = document.getElementById('newPassword');
    const confirmPassInput = document.getElementById('confirmPassword');
    
    const newPass = newPassInput.value;
    const confirmPass = confirmPassInput.value;

    // A. All new fields required
    if (!newPass || !confirmPass) {
        alert('❌ Error: New Password and Confirm fields are required.');
        return;
    }

    // B. New Password Match Check
    if (newPass !== confirmPass) {
        alert('❌ Error: New Password and Confirm New Password must match.');
        return;
    }

    // C. Strong Password Policy Check (Min 12 chars, inc. upper, lower, number)
    // NOTE: This is client-side validation; server validation is mandatory.
    const complexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,}$/; 

    if (!complexityRegex.test(newPass)) {
        alert('❌ Error: New password must meet the strong password requirements:\n- Minimum 12 characters\n- Includes at least one uppercase letter\n- Includes at least one lowercase letter\n- Includes at least one number');
        return;
    }

    // D. Final Submission (Placeholder)
    // In a real app, send the new password (and maybe the current one) to the server.
    alert('✅ Success! New password submitted to server. (Requires Server Hashing and Save)');
    
    // --- Reset the UI after simulated success ---
    
    // 1. Clear all password fields
    currentPassInput.value = '';
    newPassInput.value = '';
    confirmPassInput.value = '';

    // 2. Restore the current password input to editable
    currentPassInput.readOnly = false;
    
    // 3. Hide the new password fields
    document.getElementById('newPasswordFields').style.display = 'none';
    
    // 4. Show the verification button again
    document.getElementById('verifyPasswordBtn').style.display = 'block';

    // 5. Set focus back to the current password field
    currentPassInput.focus();
}

/**
 * Handles the action for the "Forgot Password" link.
 */
function forgotPassword() {
    alert('🔑 Initiating Password Reset Process. You will be redirected to the login/reset page.');
    // In a real application: window.location.href = 'forgotpassword.html'; 
}

// ----------------------------------------------------
// --- SHARED DASHBOARD/UI FUNCTIONS (Placeholder) ---
// ----------------------------------------------------

/**
 * Placeholder for mobile sidebar toggle (this function is often located in 'studentdashboard.js')
 */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}