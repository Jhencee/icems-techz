document.addEventListener('DOMContentLoaded', () => {
    console.log('🟢 ICEMS Login JS loaded');

    const API_URL = 'http://127.0.0.1:8000';
    const STUDENT_REGEX = /^(\d{4})-(\d{5})-(SM)-0$/i;

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

    // Helper Functions
    function capitalizeWords(str) {
        if (!str) return '';
        return str.toLowerCase().split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    function isAdminEmail(email) {
        return email.toLowerCase() === SUPER_ADMIN.email.toLowerCase() ||
            REGULAR_ADMIN_EMAILS.includes(email.toLowerCase());
    }

    function isSuperAdmin(email) {
        return email.toLowerCase() === SUPER_ADMIN.email.toLowerCase();
    }

    function isRegularAdmin(email) {
        return REGULAR_ADMIN_EMAILS.includes(email.toLowerCase());
    }

    function setFieldError(inputEl, msg = '') {
        if (inputEl.id === 'terms') {
            const termsContainer = document.getElementById('termsErrorContainer') || inputEl.closest('.terms-checkbox');
            if (!termsContainer) return;

            let existing = termsContainer.querySelector('.error-msg');
            if (existing) existing.remove();

            if (msg) {
                const err = document.createElement('span');
                err.className = 'error-msg';
                err.textContent = msg;
                termsContainer.insertAdjacentElement('afterend', err);
            }
            return;
        }

        const wrapper = inputEl.closest('.input-wrapper') || inputEl.parentElement;
        if (!wrapper) return;

        const existing = wrapper.querySelector('.error-msg');
        if (existing) existing.remove();
        wrapper.classList.toggle('error', !!msg);

        if (msg) {
            const err = document.createElement('span');
            err.className = 'error-msg';
            err.textContent = msg;
            wrapper.appendChild(err);
        }
    }

    function clearAllErrors() {
        document.querySelectorAll('.error-msg').forEach(e => e.remove());
        document.querySelectorAll('.input-wrapper').forEach(w => w.classList.remove('error'));
        document.querySelectorAll('.terms-checkbox + .error-msg').forEach(e => e.remove());
    }

    function validateEmail(inputEl) {
        const val = inputEl.value.trim();

        if (!val) {
            setFieldError(inputEl, 'Required.');
            return false;
        }

        const validDomains = [/@iskolarngbayan\.pup\.edu\.ph$/i];
        if (!validDomains.some(regex => regex.test(val))) {
            setFieldError(inputEl, 'Use (@iskolarngbayan.pup.edu.ph) only.');
            return false;
        }

        const username = val.split('@')[0];
        if (!username) {
            setFieldError(inputEl, 'Enter a username before @.');
            return false;
        }

        setFieldError(inputEl);
        return true;
    }

    function validateStudentNumber(inputEl) {
        const val = inputEl.value.trim();
        if (!val) { setFieldError(inputEl, 'Required.'); return false; }
        if (!STUDENT_REGEX.test(val)) {
            setFieldError(inputEl, 'Format: YYYY-XXXXX-SM-0 (e.g., 2023-00000-SM-0)');
            return false;
        }
        setFieldError(inputEl);
        return true;
    }

    function checkPasswordValidity(password) {
        const hasMinLength = password.length >= 8;
        const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[^a-zA-Z0-9]/.test(password);
        return hasMinLength && hasMixedCase && hasNumber && hasSpecial;
    }

    function checkPasswordStrength() {
        const password = document.getElementById('signupPassword')?.value || '';
        const strengthFill = document.getElementById('strengthFill');
        const strengthText = document.getElementById('strengthText');
        const formatHint = document.getElementById('passwordFormatHint');

        if (!strengthFill || !strengthText) return;

        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;

        if (formatHint) {
            formatHint.style.display = (password.length > 0 && strength < 4) ? 'block' : 'none';
        }

        if (password.length === 0) {
            strengthFill.style.width = '0%';
            strengthFill.className = 'strength-fill';
            strengthText.textContent = '';
        } else if (strength <= 1) {
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

    // Error Modal Functions
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
                    <button onclick="closeErrorModal()" style="background: #800020; color: white; border: none; padding: 12px 30px; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 600; transition: background 0.3s;" onmouseover="this.style.background='#800020'" onmouseout="this.style.background='#800020'">
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

    // Element Variables
    const studentInput = document.getElementById('studentNumber');
    const emailInput = document.getElementById('signupEmail');
    const passwordInput = document.getElementById('signupPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const termsCheckbox = document.getElementById('terms');

    if (studentInput) studentInput.addEventListener('input', () => validateStudentNumber(studentInput));
    if (emailInput) emailInput.addEventListener('input', () => validateEmail(emailInput));

    if (firstNameInput) {
        firstNameInput.addEventListener('input', () => {
            if (firstNameInput.value.trim() !== '') setFieldError(firstNameInput);
        });
    }

    if (lastNameInput) {
        lastNameInput.addEventListener('input', () => {
            if (lastNameInput.value.trim() !== '') setFieldError(lastNameInput);
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            checkPasswordStrength();
            const pwd = passwordInput.value.trim();
            const conf = confirmPasswordInput?.value.trim();

            if (pwd !== '') setFieldError(passwordInput);
            if (conf && pwd === conf) setFieldError(confirmPasswordInput);

            if (!pwd) {
                setFieldError(passwordInput);
                if (confirmPasswordInput) setFieldError(confirmPasswordInput);
            }
        });
    }

    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', () => {
            const pwd = passwordInput.value;
            const conf = confirmPasswordInput.value;

            if (!conf) {
                setFieldError(confirmPasswordInput);
                return;
            }

            if (conf === pwd) {
                setFieldError(confirmPasswordInput);
            } else {
                setFieldError(confirmPasswordInput, 'Passwords do not match.');
            }
        });
    }

    if (termsCheckbox) {
        termsCheckbox.addEventListener('change', () => {
            if (termsCheckbox.checked) setFieldError(termsCheckbox);
        });
    }

    function showGlobalError(message) {
        console.error('❌ Error:', message);
        const errorMsg = document.getElementById('globalErrorMessage');
        if (errorMsg) {
            const span = errorMsg.querySelector('span');
            if (span) span.textContent = message;
            errorMsg.style.display = 'flex';
            setTimeout(() => errorMsg.style.display = 'none', 5000);
        } else {
            showErrorModal(message);
        }
    }

    function showSuccess(message = 'Success!') {
        console.log('✅ Success:', message);
        const successMsg = document.getElementById('signupSuccessMessage');
        if (successMsg) {
            const span = successMsg.querySelector('span');
            if (span) span.textContent = message;
            successMsg.style.display = 'flex';
            setTimeout(() => successMsg.style.display = 'none', 5000);
        }
    }

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
    //  SIGN IN HANDLER
    // ============================================
    const signinForm = document.getElementById('signinFormElement');
    if (signinForm) {
        console.log('🟢 Sign-in form detected');

        signinForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const emailInput = document.getElementById('signinEmail');
            const passwordInput = document.getElementById('signinPassword');

            const email = emailInput.value.trim();
            const password = passwordInput.value;

            console.log('====================================');
            console.log('LOGIN ATTEMPT DEBUG INFO:');
            console.log('Email entered:', email);
            console.log('Email length:', email.length);
            console.log('Password length:', password.length);
            console.log('Password:', password); // REMOVE THIS IN PRODUCTION!
            console.log('====================================');

            if (!email || !password) {
                showErrorModal('Please fill in all fields');
                return;
            }

            // ============================================
            // CHECK IF SUPER ADMIN
            // ============================================
            if (isSuperAdmin(email)) {
                console.log('🔴 Super Admin login detected');

                if (password === SUPER_ADMIN.password) {
                    console.log('✅ SUPER ADMIN LOGIN SUCCESSFUL');

                    localStorage.setItem('currentUser', JSON.stringify({
                        email: SUPER_ADMIN.email,
                        role: SUPER_ADMIN.role,
                        dashboard: SUPER_ADMIN.dashboard
                    }));

                    window.location.href = SUPER_ADMIN.dashboard;
                } else {
                    showErrorModal('Invalid super admin credentials');
                }
                return;
            }

            // ============================================
            // API AUTHENTICATION (ADMIN & STUDENT)
            // ============================================
            try {
                console.log('🟢 Sending request to API...');
                console.log('API URL:', `${API_URL}/api/signin`);

                const requestBody = {
                    email: email,
                    password: password
                };

                console.log('Request body:', JSON.stringify(requestBody, null, 2));

                const response = await fetch(`${API_URL}/api/signin`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody)
                });

                console.log('====================================');
                console.log('API RESPONSE DEBUG:');
                console.log('Status:', response.status);
                console.log('Status Text:', response.statusText);
                console.log('====================================');

                const data = await response.json();
                console.log('Response data:', JSON.stringify(data, null, 2));

                if (response.status === 401) {
                    console.log('❌ 401 UNAUTHORIZED');
                    console.log('This means the backend rejected the credentials');
                    console.log('Possible reasons:');
                    console.log('1. Admin account does not exist in database');
                    console.log('2. Password is incorrect or not properly hashed');
                    console.log('3. Email case sensitivity mismatch');

                    showErrorModal(data.message || 'Invalid email or password');
                    return;
                }

                if (data.success === true) {
                    console.log('✅ LOGIN SUCCESSFUL');
                    console.log('User role:', data.user.role);

                    if (data.user.role === 'admin') {
                        console.log('✅ ADMIN LOGIN - Department:', data.user.department);

                        localStorage.setItem('currentUser', JSON.stringify({
                            email: data.user.email,
                            role: data.user.role,
                            department: data.user.department,
                            dashboard: data.user.dashboard
                        }));

                        window.location.href = data.user.dashboard;
                    } else {
                        console.log('✅ STUDENT LOGIN');
                        localStorage.setItem('currentUser', JSON.stringify(data.user));
                        window.location.href = 'studentdashboard.html';
                    }
                } else {
                    console.log('❌ LOGIN FAILED:', data.message);
                    showErrorModal(data.message || 'Invalid email or password');
                }

            } catch (error) {
                console.error('====================================');
                console.error('CONNECTION ERROR:');
                console.error('Error type:', error.name);
                console.error('Error message:', error.message);
                console.error('Full error:', error);
                console.error('====================================');
                showErrorModal('Connection error: Unable to reach the server. Please check if the backend is running.');
            }
        });
    }

    // SIGN UP HANDLER
    const signupForm = document.getElementById('signupFormElement');
    if (signupForm) {
        console.log('🟢 Sign-up form detected');

        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAllErrors();

            console.log('📝 Sign-up form submitted');

            const rawFirstName = firstNameInput.value.trim();
            const rawLastName = lastNameInput.value.trim();
            const studentNumber = studentInput.value.trim();
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            const terms = termsCheckbox.checked;

            let valid = true;

            if (isAdminEmail(email)) {
                setFieldError(emailInput, 'Admin accounts cannot register. Use student email.');
                return;
            }

            if (!rawFirstName) { setFieldError(firstNameInput, 'Required.'); valid = false; }
            if (!rawLastName) { setFieldError(lastNameInput, 'Required.'); valid = false; }
            if (!validateStudentNumber(studentInput)) valid = false;
            if (!validateEmail(emailInput)) valid = false;
            if (!password) { setFieldError(passwordInput, 'Required.'); valid = false; }

            if (password && !checkPasswordValidity(password)) {
                setFieldError(passwordInput, 'Password is too weak. Min 8 chars, mixed case, number, and symbol.');
                valid = false;
            }

            if (password !== confirmPassword) { setFieldError(confirmPasswordInput, 'Passwords do not match.'); valid = false; }
            if (!terms) { setFieldError(termsCheckbox, 'You must agree.'); valid = false; }

            if (!valid) {
                console.log('❌ Validation failed');
                return;
            }

            const firstName = capitalizeWords(rawFirstName);
            const lastName = capitalizeWords(rawLastName);

            const submitBtn = signupForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing up...';
            const course = document.getElementById('course').value.trim();
            const year = document.getElementById('year').value.trim();

            if (!course) { setFieldError(document.getElementById('course'), 'Required.'); valid = false; }
            if (!year) { setFieldError(document.getElementById('year'), 'Required.'); valid = false; }

            try {
                console.log('🌐 Calling API:', `${API_URL}/api/signup`);
                const response = await fetch(`${API_URL}/api/signup`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                        first_name: firstName,
                        last_name: lastName,
                        student_number: studentNumber,
                        email: email,
                        course: course,
                        year: year,
                        password: password
                    })
                });

                console.log('📡 Response status:', response.status);
                const data = await response.json();
                console.log('📦 Response data:', data);

                if (data.success) {
                    console.log('✅ Registration successful');

                    localStorage.setItem('currentUser', JSON.stringify({
                        ...data.user,
                        role: 'student'
                    }));

                    signupForm.reset();
                    if (document.getElementById('strengthFill')) {
                        document.getElementById('strengthFill').className = 'strength-fill';
                        document.getElementById('strengthText').textContent = '';
                    }

                    showSuccess('Registration successful! Redirecting...');

                    console.log('🔄 Redirecting to: studentdashboard.html');
                    setTimeout(() => {
                        console.log('🚀 Redirecting NOW');
                        window.location.href = 'studentdashboard.html';
                    }, 1500);
                } else {
                    console.log('❌ Registration failed:', data.message);
                    showGlobalError(data.message || 'Registration failed. Please try again.');

                    if (data.message.includes('Student Number')) {
                        setFieldError(studentInput, data.message);
                    } else if (data.message.includes('Email')) {
                        setFieldError(emailInput, data.message);
                    }
                }
            } catch (error) {
                console.error('💥 Signup error:', error);
                showGlobalError('Connection error. Please check your internet connection and API.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    } else {
        console.warn('⚠️ Sign-up form NOT found in DOM');
    }
});

// GLOBAL FUNCTIONS
function switchForm(type) {
    console.log('🔄 Switching to:', type);
    document.getElementById('signinForm').classList.toggle('active', type === 'signin');
    document.getElementById('signupForm').classList.toggle('active', type === 'signup');
    document.querySelectorAll('.toggle-btn').forEach((b, i) =>
        b.classList.toggle('active', (type === 'signin' && i === 0) || (type === 'signup' && i === 1))
    );

    document.getElementById('welcomeTitle').textContent = type === 'signin' ? 'Welcome Back!' : 'Join ICEMS Today!';
    document.getElementById('welcomeDesc').textContent = type === 'signin'
        ? 'Access your account to manage clearances, events, and payments efficiently.'
        : 'Create your account to access digital clearance, event attendance, and online payment services.';
}

function openModal(id) {
    document.getElementById(id).style.display = "flex";
}

function closeModal(id) {
    document.getElementById(id).style.display = "none";
}

function logout() {
    console.log('👋 Logging out...');
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}