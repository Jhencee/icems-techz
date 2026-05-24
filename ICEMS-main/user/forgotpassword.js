// ===== KEEP MODAL OPEN AFTER ANY RELOAD =====
(function () {
    // Block Live Server WebSocket
    if (typeof WebSocket !== 'undefined') {
        const OriginalWebSocket = WebSocket;
        WebSocket = function (url) {
            if (url && url.includes('5500')) {
                return { send: function () { }, close: function () { }, addEventListener: function () { }, onopen: null, onclose: null, onmessage: null };
            }
            return new OriginalWebSocket(url);
        };
    }

    // Save modal state before page unloads
    window.addEventListener('beforeunload', function () {
        const modal = document.getElementById('resetModal');
        if (modal && modal.classList.contains('active')) {
            sessionStorage.setItem('modalOpen', 'true');
            sessionStorage.setItem('userEmail', userEmail || '');
            sessionStorage.setItem('resetToken', resetToken || '');

            // Save which step is active
            const activeStep = document.querySelector('.modal-step.active');
            if (activeStep) {
                sessionStorage.setItem('activeStep', activeStep.id);
            }
        }
    });

    // Restore modal state after page loads
    window.addEventListener('DOMContentLoaded', function () {
        if (sessionStorage.getItem('modalOpen') === 'true') {
            // Restore variables
            userEmail = sessionStorage.getItem('userEmail') || '';
            resetToken = sessionStorage.getItem('resetToken') || '';

            // Open modal
            const modal = document.getElementById('resetModal');
            if (modal) {
                modal.classList.add('active');

                // Restore active step
                const activeStep = sessionStorage.getItem('activeStep');
                if (activeStep) {
                    document.querySelectorAll('.modal-step').forEach(step => {
                        step.style.display = 'none';
                        step.classList.remove('active');
                    });
                    const step = document.getElementById(activeStep);
                    if (step) {
                        step.style.display = 'block';
                        step.classList.add('active');
                    }
                }
            }
        }
    });
})();
// ===== END KEEP MODAL OPEN =====
if (typeof WebSocket !== 'undefined') {
    WebSocket.prototype.send = function () { };
}

const API_URL = 'http://127.0.0.1:8000';
let userEmail = '';
let resetToken = '';

// API Request with proper CORS handling and timeout
async function apiRequest(endpoint, data) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data),
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        const json = await response.json();

        return {
            ok: response.ok,
            status: response.status,
            data: json
        };
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('Request timeout - please try again');
        }
        console.error('API Error:', error);
        throw error;
    }
}

// Modal functions
function openModal() {
    const modal = document.getElementById('resetModal');
    if (modal) {
        modal.classList.add('active');
        showModalStep('codeStep');
        setTimeout(() => {
            const code1 = document.getElementById('code1');
            if (code1) code1.focus();
        }, 100);
    }
}

function closeModal() {
    const modal = document.getElementById('resetModal');
    if (modal) {
        modal.classList.remove('active');
        clearCodeInputs();
        showModalStep('codeStep');

        // Clear session storage
        sessionStorage.removeItem('modalOpen');
        sessionStorage.removeItem('userEmail');
        sessionStorage.removeItem('resetToken');
        sessionStorage.removeItem('activeStep');
    }
}

function showModalStep(stepId) {
    document.querySelectorAll('.modal-step').forEach(step => {
        step.style.display = 'none';
        step.classList.remove('active');
    });

    const targetStep = document.getElementById(stepId);
    if (targetStep) {
        targetStep.style.display = 'block';
        targetStep.classList.add('active');
    }
}

// Email submission handler
async function handleEmailSubmit() {
    const emailInput = document.getElementById('recoveryEmail');
    if (!emailInput) {
        console.error('Email input not found');
        return;
    }

    const email = emailInput.value.trim();
    const submitBtn = document.getElementById('sendCodeBtn');

    if (!email) {
        showNotification('Please enter your email address', 'error');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }

    userEmail = email;

    if (!submitBtn) return;

    const originalHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    try {
        const response = await apiRequest('/api/password/send-code', { email });

        if (response.ok && response.data.success) {
            showNotification(response.data.message || 'Verification code sent to your email!', 'success');
            openModal();
        } else {
            if (response.status === 422 && response.data.errors) {
                const errorMessages = Object.values(response.data.errors).flat().join(', ');
                showNotification(errorMessages, 'error');
            } else {
                showNotification(response.data.message || 'Failed to send code. Please try again.', 'error');
            }
        }
    } catch (error) {
        showNotification(error.message || 'Connection error. Please ensure your server is running.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHTML;
    }
}

// Code verification handler
async function handleCodeSubmit() {
    const codes = [];
    for (let i = 1; i <= 6; i++) {
        const codeInput = document.getElementById(`code${i}`);
        if (!codeInput) {
            showNotification('Code input fields not found', 'error');
            return;
        }
        codes.push(codeInput.value);
    }

    const enteredCode = codes.join('');

    if (enteredCode.length !== 6) {
        showNotification('Please enter the complete 6-digit code', 'error');
        return;
    }

    if (!/^\d{6}$/.test(enteredCode)) {
        showNotification('Code must contain only numbers', 'error');
        return;
    }

    const submitBtn = document.getElementById('verifyCodeBtn');
    if (!submitBtn) return;

    const originalHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';

    try {
        const response = await apiRequest('/api/password/verify-code', {
            email: userEmail,
            code: enteredCode
        });

        if (response.ok && response.data.success) {
            resetToken = response.data.token;
            showNotification('Code verified successfully!', 'success');
            showModalStep('passwordStep');
        } else {
            showNotification(response.data.message || 'Invalid or expired code.', 'error');
            clearCodeInputs();
        }
    } catch (error) {
        showNotification(error.message || 'Connection error.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHTML;
    }
}

function clearCodeInputs() {
    for (let i = 1; i <= 6; i++) {
        const codeInput = document.getElementById(`code${i}`);
        if (codeInput) codeInput.value = '';
    }
    const code1 = document.getElementById('code1');
    if (code1) code1.focus();
}

function moveToNext(current, nextId) {
    if (current.value.length === 1) {
        if (!/^\d$/.test(current.value)) {
            current.value = '';
            return;
        }
        if (nextId) {
            const nextInput = document.getElementById(nextId);
            if (nextInput) nextInput.focus();
        }
    }
}

function moveToPrev(event, current, prevId) {
    if (event.key === 'Backspace' && current.value === '' && prevId) {
        event.preventDefault();
        const prevInput = document.getElementById(prevId);
        if (prevInput) {
            prevInput.focus();
            prevInput.value = '';
        }
    }
}

async function resendCode() {
    const resendBtn = event.target;
    if (!resendBtn) return;

    const originalHTML = resendBtn.innerHTML;
    resendBtn.disabled = true;
    resendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    try {
        const response = await apiRequest('/api/password/send-code', { email: userEmail });

        if (response.ok && response.data.success) {
            showNotification('New code sent to your email!', 'success');
            clearCodeInputs();
        } else {
            showNotification(response.data.message || 'Failed to resend code.', 'error');
        }
    } catch (error) {
        showNotification(error.message || 'Connection error.', 'error');
    } finally {
        resendBtn.disabled = false;
        resendBtn.innerHTML = originalHTML;
    }
}

// Password reset handler
async function handlePasswordSubmit() {
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmNewPassword');

    if (!newPasswordInput || !confirmPasswordInput) {
        showNotification('Password input fields not found', 'error');
        return;
    }

    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (newPassword !== confirmPassword) {
        showNotification('Passwords do not match!', 'error');
        return;
    }

    if (!isPasswordStrong(newPassword)) {
        showNotification('Please ensure your password meets all requirements', 'error');
        return;
    }

    const submitBtn = document.getElementById('resetPasswordBtn');
    if (!submitBtn) return;

    const originalHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resetting...';

    try {
        const response = await apiRequest('/api/password/reset', {
            token: resetToken,
            password: newPassword,
            password_confirmation: confirmPassword
        });

        if (response.ok && response.data.success) {
            showModalStep('successStep');
        } else {
            showNotification(response.data.message || 'Failed to reset password.', 'error');
        }
    } catch (error) {
        showNotification(error.message || 'Connection error.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHTML;
    }
}

// Password strength checker
function checkPasswordStrength() {
    const passwordInput = document.getElementById('newPassword');
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');

    if (!passwordInput || !strengthFill || !strengthText) return;

    const password = passwordInput.value;
    strengthFill.className = 'strength-fill';

    if (password.length === 0) {
        strengthText.textContent = '';
        strengthFill.style.width = '0%';
        return;
    }

    let strength = 0;
    let strengthPercent = 0;

    if (password.length >= 8) {
        strength++;
        updateRequirement('req-length', true);
    } else {
        updateRequirement('req-length', false);
    }

    if (/[A-Z]/.test(password)) {
        strength++;
        updateRequirement('req-uppercase', true);
    } else {
        updateRequirement('req-uppercase', false);
    }

    if (/[a-z]/.test(password)) {
        strength++;
        updateRequirement('req-lowercase', true);
    } else {
        updateRequirement('req-lowercase', false);
    }

    if (/[0-9]/.test(password)) {
        strength++;
        updateRequirement('req-number', true);
    } else {
        updateRequirement('req-number', false);
    }

    if (strength <= 2) {
        strengthFill.classList.add('strength-weak');
        strengthText.textContent = 'Weak';
        strengthText.style.color = '#ef4444';
        strengthPercent = 33;
    } else if (strength === 3) {
        strengthFill.classList.add('strength-medium');
        strengthText.textContent = 'Medium';
        strengthText.style.color = '#f59e0b';
        strengthPercent = 66;
    } else {
        strengthFill.classList.add('strength-strong');
        strengthText.textContent = 'Strong';
        strengthText.style.color = '#10b981';
        strengthPercent = 100;
    }

    strengthFill.style.width = strengthPercent + '%';
}

function updateRequirement(reqId, isValid) {
    const reqElement = document.getElementById(reqId);
    if (!reqElement) return;

    const icon = reqElement.querySelector('i');

    if (isValid) {
        reqElement.classList.add('valid');
        if (icon) icon.className = 'fas fa-check-circle';
    } else {
        reqElement.classList.remove('valid');
        if (icon) icon.className = 'fas fa-circle';
    }
}

function isPasswordStrong(password) {
    return password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password);
}

// Notification system
function showNotification(message, type = 'info') {
    const existingNotif = document.querySelector('.notification');
    if (existingNotif) {
        existingNotif.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;

    const icon = type === 'success' ? 'fa-check-circle' :
        type === 'error' ? 'fa-exclamation-circle' :
            'fa-info-circle';

    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Event listeners
window.onclick = function (event) {
    const modal = document.getElementById('resetModal');
    if (modal && event.target === modal) {
        closeModal();
    }
}

document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        const modal = document.getElementById('resetModal');
        if (modal && modal.classList.contains('active')) {
            closeModal();
        }
    }
});

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function () {
    console.log('Password Reset Loaded ✅');

    const emailInput = document.getElementById('recoveryEmail');
    if (emailInput) {
        emailInput.focus();
        // Add Enter key listener here
        emailInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleEmailSubmit();
            }
        });
    }

    const sendCodeBtn = document.getElementById('sendCodeBtn');
    if (sendCodeBtn) {
        sendCodeBtn.addEventListener('click', function (e) {
            e.preventDefault();
            handleEmailSubmit();
        });
    }

    const verifyCodeBtn = document.getElementById('verifyCodeBtn');
    if (verifyCodeBtn) {
        verifyCodeBtn.addEventListener('click', function (e) {
            e.preventDefault();
            handleCodeSubmit();
        });
    }

    const resetPasswordBtn = document.getElementById('resetPasswordBtn');
    if (resetPasswordBtn) {
        resetPasswordBtn.addEventListener('click', function (e) {
            e.preventDefault();
            handlePasswordSubmit();
        });
    }

    document.querySelectorAll('.code-input').forEach(input => {
        input.addEventListener('paste', function (e) {
            e.preventDefault();
            const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');

            if (pastedData.length === 6) {
                for (let i = 0; i < 6; i++) {
                    const codeInput = document.getElementById(`code${i + 1}`);
                    if (codeInput) {
                        codeInput.value = pastedData[i];
                    }
                }
                const code6 = document.getElementById('code6');
                if (code6) code6.focus();
            }
        });
    });
});