// Block Live Server auto-reload
if (typeof WebSocket !== 'undefined') {
    const OriginalWebSocket = WebSocket;
    window.WebSocket = function (url) {
        if (url && url.includes('5500')) {
            return { send: function () { }, close: function () { }, addEventListener: function () { }, onopen: null, onclose: null, onmessage: null };
        }
        return new OriginalWebSocket(url);
    };
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Ã°Å¸Å¸Â¢ ICEMS Login JS loaded');

    const API_URL = 'http://127.0.0.1:8000';

    // Super Admin - Keep hardcoded (exception)
    const SUPER_ADMIN = {
        email: 'superadmin@gmail.com',
        password: 'superadmin@123',
        dashboard: '../super admin/SystemAdmin.html',
        role: 'Super Admin'
    };

    // Regular admin emails (will authenticate via database)
    const REGULAR_ADMIN_EMAILS = [
        'accounting.pupsmb@gmail.com',
        'director.pupsmb@gmail.com',
        'gymnasium.pupsmb@gmail.com',
        'laboratory.pupsmb@gmail.com',
        'library.pupsmb@gmail.com',
        'nurse.pupsmb@gmail.com',
        'organization.pupsmb@gmail.com',
        'publication.pupsmb@gmail.com',
        'sso.pupsmb@gmail.com',
        'studentcouncil.pupsmb@gmail.com'
    ];

    function isSuperAdmin(email) {
        return email.toLowerCase() === SUPER_ADMIN.email.toLowerCase();
    }

    // ============================================
    // ERROR MODAL
    // ============================================
    let modalEventBlocker = null;

    function showErrorModal(message) {
        let modal = document.getElementById('errorModal');
        let blocker = document.getElementById('modalBlocker');

        if (!blocker) {
            blocker = document.createElement('div');
            blocker.id = 'modalBlocker';
            blocker.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); z-index: 99998; display: none;';
            document.body.appendChild(blocker);
            blocker.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); }, true);
            blocker.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); }, true);
            blocker.addEventListener('mouseup', (e) => { e.preventDefault(); e.stopPropagation(); }, true);
            blocker.addEventListener('keydown', (e) => { e.preventDefault(); e.stopPropagation(); }, true);
            blocker.addEventListener('keyup', (e) => { e.preventDefault(); e.stopPropagation(); }, true);
        }

        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'errorModal';
            modal.className = 'modal-overlay';
            modal.style.cssText = 'display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 99999; justify-content: center; align-items: center; pointer-events: none;';
            modal.innerHTML = `
                <div class="modal-box" id="errorModalBox" style="max-width: 400px; text-align: center; position: relative; pointer-events: auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
                    <span class="close-btn" onclick="closeErrorModal()" style="position: absolute; top: 15px; right: 20px; font-size: 28px; cursor: pointer; color: #999; z-index: 100000;">&times;</span>
                    <div style="color: #800020; font-size: 48px; margin-bottom: 20px;">
                        <i class="fas fa-exclamation-circle"></i>
                    </div>
                    <h2 style="color: #800020; margin-bottom: 15px;">Login Failed</h2>
                    <p id="errorModalMessage" style="margin-bottom: 25px; color: #374151; font-size: 16px;"></p>
                    <button onclick="closeErrorModal()" style="background: #800020; color: white; border: none; padding: 12px 30px; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 600;">
                        <i class="fas fa-times-circle"></i> Close
                    </button>
                </div>
            `;
            document.body.appendChild(modal);
        }

        document.getElementById('errorModalMessage').textContent = message;
        blocker.style.display = 'block';
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        modalEventBlocker = function (e) {
            const modalBox = document.getElementById('errorModalBox');
            if (modalBox && !modalBox.contains(e.target)) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return false;
            }
        };

        window.addEventListener('click', modalEventBlocker, true);
        window.addEventListener('mousedown', modalEventBlocker, true);
        window.addEventListener('mouseup', modalEventBlocker, true);
        window.addEventListener('keydown', modalEventBlocker, true);
        window.addEventListener('keyup', modalEventBlocker, true);
        window.addEventListener('submit', modalEventBlocker, true);
    }

    window.closeErrorModal = function () {
        const modal = document.getElementById('errorModal');
        const blocker = document.getElementById('modalBlocker');
        if (modal) modal.style.display = 'none';
        if (blocker) blocker.style.display = 'none';
        document.body.style.overflow = '';
        if (modalEventBlocker) {
            window.removeEventListener('click', modalEventBlocker, true);
            window.removeEventListener('mousedown', modalEventBlocker, true);
            window.removeEventListener('mouseup', modalEventBlocker, true);
            window.removeEventListener('keydown', modalEventBlocker, true);
            window.removeEventListener('keyup', modalEventBlocker, true);
            window.removeEventListener('submit', modalEventBlocker, true);
            modalEventBlocker = null;
        }
    };

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
    // SIGN IN HANDLER
    // ============================================
    const signinForm = document.getElementById('signinFormElement');
    if (signinForm) {
        console.log('Ã°Å¸Å¸Â¢ Sign-in form detected');

        signinForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const emailInput = document.getElementById('signinEmail');
            const passwordInput = document.getElementById('signinPassword');
            const submitBtn = signinForm.querySelector('button[type="submit"]');
            const termsErrorMsg = document.getElementById('termsErrorMsg');

            const email = emailInput.value.trim();
            const password = passwordInput.value;

            console.log('LOGIN ATTEMPT - Email:', email);

            if (!email || !password) {
                showErrorModal('Please fill in all fields.');
                return;
            }

            // Ã¢â€â‚¬Ã¢â€â‚¬ Must accept Terms before signing in Ã¢â€â‚¬Ã¢â€â‚¬
            const acceptedTerms = document.getElementById('acceptedTerms');
            if (!acceptedTerms || !acceptedTerms.checked) {
                if (termsErrorMsg) {
                    termsErrorMsg.textContent = 'You must read and accept the Terms & Conditions and Privacy Policy before signing in.';
                }
                return;
            }

            if (termsErrorMsg) termsErrorMsg.textContent = '';

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
            }

            // Check Super Admin
            if (isSuperAdmin(email)) {
                console.log('Ã°Å¸â€Â´ Super Admin login detected');
                if (password === SUPER_ADMIN.password) {
                    console.log('Ã¢Å“â€¦ SUPER ADMIN LOGIN SUCCESSFUL');
                    localStorage.setItem('currentUser', JSON.stringify({
                        email: SUPER_ADMIN.email,
                        role: SUPER_ADMIN.role,
                        dashboard: SUPER_ADMIN.dashboard
                    }));
                    setTimeout(() => { window.location.href = SUPER_ADMIN.dashboard; }, 100);
                } else {
                    showErrorModal('Invalid super admin credentials.');
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
                    }
                }
                return;
            }

            // API Authentication
            try {
                console.log('Ã°Å¸Å¸Â¢ Sending request to API...');
                const response = await fetch(`${API_URL}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                console.log('Ã°Å¸â€œÂ¡ Response status:', response.status);
                const rawText = await response.text();
                const data = JSON.parse(rawText.replace(/^\uFEFF/, '').trim());
                console.log('Ã°Å¸â€œÂ¦ Response data:', data);

                if (response.status === 401) {
                    showErrorModal(data.message || 'Invalid email or password.');
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
                    }
                    return;
                }

                if (data.success === true) {
                    console.log('Ã¢Å“â€¦ LOGIN SUCCESSFUL - Role:', data.user.role);

                    if (data.user.role === 'admin') {
                        const userData = {
                            email: data.user.email,
                            name: data.user.name,
                            role: data.user.role,
                            department: data.user.department,
                            dashboard: data.user.dashboard
                        };
                        localStorage.setItem('currentUser', JSON.stringify(userData));
                        setTimeout(() => { window.location.href = data.user.dashboard; }, 150);
                    } else {
                        localStorage.setItem('currentUser', JSON.stringify({ ...data.user, token: data.token }));
                        if (data.user.is_first_login === true) {
                            setTimeout(() => { window.location.href = 'changepassword.html'; }, 150);
                        } else {
                            setTimeout(() => { window.location.href = 'studentdashboard.html'; }, 150);
                        }
                    }
                } else {
                    console.log('Ã¢ÂÅ’ LOGIN FAILED:', data.message);
                    showErrorModal(data.message || 'Invalid email or password.');
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
                    }
                }

            } catch (error) {
                console.error('Ã°Å¸â€™Â¥ Connection error:', error);
                showErrorModal('Connection error: Unable to reach the server. Please check if the backend is running.');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
                }
            }
        });
    }
});

// ============================================
// COMBINED TERMS & PRIVACY MODAL
// ============================================
function openCombinedModal() {
    const modal = document.getElementById('combinedModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        // Reset to Terms tab each time it opens
        switchModalTab('terms', document.querySelector('.modal-tab-btn'));
    }
}

function closeCombinedModal() {
    const modal = document.getElementById('combinedModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

function switchModalTab(tab, btn) {
    // Hide all panels
    document.querySelectorAll('.modal-tab-panel').forEach(p => p.classList.remove('active'));
    // Deactivate all tab buttons
    document.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.remove('active'));

    // Show selected panel
    const panel = document.getElementById('modalTab' + tab.charAt(0).toUpperCase() + tab.slice(1));
    if (panel) panel.classList.add('active');

    // Activate clicked button
    if (btn) btn.classList.add('active');
}

function toggleModalAcceptBtn() {
    const checkbox = document.getElementById('modalAcceptCheck');
    const btn = document.getElementById('modalAcceptBtn');
    if (btn) btn.disabled = !checkbox.checked;
}

function confirmAcceptTerms() {
    const checkbox = document.getElementById('modalAcceptCheck');
    if (!checkbox.checked) return;

    // Enable and check the sign-in form's accept checkbox
    const acceptedTerms = document.getElementById('acceptedTerms');
    if (acceptedTerms) {
        acceptedTerms.disabled = false;
        acceptedTerms.checked = true;
    }

    // Clear any terms error message
    const termsErrorMsg = document.getElementById('termsErrorMsg');
    if (termsErrorMsg) termsErrorMsg.textContent = '';

    closeCombinedModal();
    console.log('Ã¢Å“â€¦ Terms & Privacy accepted');
}

// Close combined modal when clicking outside the box
document.addEventListener('DOMContentLoaded', () => {
    const combinedModal = document.getElementById('combinedModal');
    if (combinedModal) {
        combinedModal.addEventListener('click', (e) => {
            if (e.target === combinedModal) closeCombinedModal();
        });
    }
});

function logout() {
    console.log('Ã°Å¸â€˜â€¹ Logging out...');
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}