
// Guard: redirect to login if no user session
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUser) {
    window.location.href = 'studentlogin.html';
}



document.addEventListener('DOMContentLoaded', () => {
    console.log('ðŸŸ¢ ICEMS Change Password JS loaded');

    const API_URL = 'http://127.0.0.1:8000';

    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const form = document.getElementById('changePasswordForm');

    // ============================================
    // TOGGLE PASSWORD VISIBILITY
    // ============================================
    window.togglePassword = function (inputId, icon) {
        const input = document.getElementById(inputId);
        const eye = icon.querySelector('i');
        if (input.type === 'password') {
            input.type = 'text';
            eye.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            input.type = 'password';
            eye.classList.replace('fa-eye-slash', 'fa-eye');
        }
    };

    // ============================================
    // FIELD ERROR HELPERS
    // ============================================
    function setFieldError(inputEl, msg = '') {
        const wrapper = inputEl.closest('.input-wrapper') || inputEl.parentElement;
        if (!wrapper) return;
        wrapper.classList.toggle('error', !!msg);

        const errorSpan = document.getElementById(inputEl.id + 'Error');
        if (errorSpan) {
            errorSpan.textContent = msg;
        }
    }

    function clearAllErrors() {
        document.querySelectorAll('.error-text').forEach(el => el.textContent = '');
        document.querySelectorAll('.input-wrapper').forEach(w => w.classList.remove('error'));
    }

    // ============================================
    // PASSWORD STRENGTH
    // ============================================
    function checkPasswordStrength(password) {
        const strengthContainer = document.getElementById('strengthContainer');
        const strengthFill = document.getElementById('strengthFill');
        const strengthText = document.getElementById('strengthText');

        if (!strengthFill || !strengthText) return;

        if (password.length === 0) {
            strengthContainer.style.display = 'none';
            return;
        }

        strengthContainer.style.display = 'flex';

        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;

        if (strength <= 1) {
            strengthFill.style.width = '25%';
            strengthFill.className = 'strength-fill weak';
            strengthText.textContent = 'Weak';
        } else if (strength === 2) {
            strengthFill.style.width = '50%';
            strengthFill.className = 'strength-fill fair';
            strengthText.textContent = 'Fair';
        } else if (strength === 3) {
            strengthFill.style.width = '75%';
            strengthFill.className = 'strength-fill good';
            strengthText.textContent = 'Good';
        } else {
            strengthFill.style.width = '100%';
            strengthFill.className = 'strength-fill strong';
            strengthText.textContent = 'Strong';
        }
    }

    function isPasswordValid(password) {
        return password.length >= 8 &&
            /[a-z]/.test(password) &&
            /[A-Z]/.test(password) &&
            /\d/.test(password) &&
            /[^a-zA-Z0-9]/.test(password);
    }

    // ============================================
    // LIVE VALIDATION LISTENERS
    // ============================================
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', () => {
            checkPasswordStrength(newPasswordInput.value);
            if (newPasswordInput.value.trim()) setFieldError(newPasswordInput);

            // Re-check confirm match live
            if (confirmPasswordInput.value) {
                if (confirmPasswordInput.value !== newPasswordInput.value) {
                    setFieldError(confirmPasswordInput, 'Passwords do not match.');
                } else {
                    setFieldError(confirmPasswordInput);
                }
            }
        });
    }

    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', () => {
            const pwd = newPasswordInput.value;
            const conf = confirmPasswordInput.value;
            if (!conf) { setFieldError(confirmPasswordInput); return; }
            if (conf === pwd) {
                setFieldError(confirmPasswordInput);
            } else {
                setFieldError(confirmPasswordInput, 'Passwords do not match.');
            }
        });
    }

    // ============================================
    // NOTIFICATION HELPERS
    // ============================================
    function showSuccess(message = 'Password changed successfully!') {
        const el = document.getElementById('successMessage');
        const span = el.querySelector('span');
        if (span) span.textContent = message;
        el.style.display = 'flex';
        setTimeout(() => el.style.display = 'none', 4000);
    }

    function showError(message) {
        const el = document.getElementById('errorMessage');
        const text = document.getElementById('errorText');
        if (text) text.textContent = message;
        el.style.display = 'flex';
        setTimeout(() => el.style.display = 'none', 5000);
    }

    // ============================================
    // FORM SUBMIT
    // ============================================
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAllErrors();

            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            let valid = true;

            // Validate new password
            if (!newPassword) {
                setFieldError(newPasswordInput, 'Required.');
                valid = false;
            } else if (!isPasswordValid(newPassword)) {
                setFieldError(newPasswordInput, 'Min 8 chars, uppercase, lowercase, number & symbol.');
                valid = false;
            }

            // Validate confirm password
            if (!confirmPassword) {
                setFieldError(confirmPasswordInput, 'Required.');
                valid = false;
            } else if (newPassword && confirmPassword !== newPassword) {
                setFieldError(confirmPasswordInput, 'Passwords do not match.');
                valid = false;
            }

            if (!valid) return;

            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
            }

            // ============================================
            // GRAB TOKEN & USER FROM LOCALSTORAGE
            // ============================================
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            const token = currentUser?.token || null;

            try {
                console.log('ðŸŒ Sending change password request...');

                const response = await fetch(`${API_URL}/api/auth/change-password`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify({
                        new_password: newPassword,
                        confirm_password: confirmPassword
                    })
                });

                console.log('ðŸ“¡ Response status:', response.status);
                const rawText = await response.text();
                const data = JSON.parse(rawText.replace(/^\uFEFF/, '').trim());
                console.log('ðŸ“¦ Response data:', data);

                if (data.success === true || response.status === 200) {
                    console.log('âœ… Password changed successfully');
                    showSuccess('Password changed successfully! Redirecting to dashboard...');
                    form.reset();

                    // Reset strength bar
                    const strengthFill = document.getElementById('strengthFill');
                    const strengthText = document.getElementById('strengthText');
                    const strengthContainer = document.getElementById('strengthContainer');
                    if (strengthFill) strengthFill.className = 'strength-fill';
                    if (strengthText) strengthText.textContent = '';
                    if (strengthContainer) strengthContainer.style.display = 'none';

                    setTimeout(() => {
                        const updatedUser = JSON.parse(localStorage.getItem('currentUser'));
                    if (updatedUser) { updatedUser.password_changed = true; localStorage.setItem('currentUser', JSON.stringify(updatedUser)); }
                    setTimeout(() => { window.location.href = 'studentdashboard.html'; }, 1500);
                    }, 2000);

                } else {
                    console.log('Failed:', data.message);
                    showError(data.message || 'Failed to change password. Please try again.');
                }

            } catch (error) {
                console.error('ðŸ’¥ Change password error:', error);
                showError('Connection error. Please check if the server is running.');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Confirm';
                }
            }
        });
    }
});
