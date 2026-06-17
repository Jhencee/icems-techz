const API_URL = 'https://icems-techz-production.up.railway.app/api';
window.API_URL = API_URL;

// Sample Admins
const sampleAdmins = [
    { id: 1, name: 'Accounting', department: 'Accounting', role: 'Admin', status: 'Active' },
    { id: 2, name: 'Director', department: 'Administration', role: 'Admin', status: 'Active' },
    { id: 3, name: 'Nurse', department: 'Medical', role: 'Admin', status: 'Active' },
    { id: 4, name: 'Library', department: 'Library', role: 'Admin', status: 'Active' },
    { id: 5, name: 'Laboratory', department: 'Laboratory', role: 'Admin', status: 'Active' },
    { id: 6, name: 'Gymnasium', department: 'Sports', role: 'Admin', status: 'Active' },
    { id: 7, name: 'Student Service Office', department: 'Student Services', role: 'Admin', status: 'Active' },
    { id: 8, name: 'Student Organization', department: 'Student Affairs', role: 'Admin', status: 'Active' },
    { id: 9, name: 'Student Council', department: 'Student Government', role: 'Admin', status: 'Active' },
    { id: 10, name: 'Student Publication', department: 'Media', role: 'Admin', status: 'Active' }
];

const activityLogs = [
    { timestamp: '2024-11-06 10:30:45', user: 'Jhencee R. Borjal', action: 'Login', details: 'Successful login from 192.168.1.100' },
    { timestamp: '2024-11-06 10:15:22', user: 'Michaela DG. Estinor', action: 'Profile Update', details: 'Updated contact information' },
    { timestamp: '2024-11-06 09:45:10', user: 'Grace Ann D. Lucero', action: 'Document Upload', details: 'Uploaded clearance form' },
    { timestamp: '2024-11-06 09:30:55', user: 'Samantha G. Santos', action: 'Login', details: 'Successful login from 192.168.1.105' },
    { timestamp: '2024-11-06 09:00:33', user: 'Jhencee R. Borjal', action: 'Event Registration', details: 'Registered for Academic Seminar' }
];

const auditTrails = [
    { date: '2024-11-06', admin: 'Accounting', action: 'Approval', target: 'Clearance Request #128', status: 'Approved' },
    { date: '2024-11-06', admin: 'Library', action: 'Approval', target: 'Book Return Verification', status: 'Approved' },
    { date: '2024-11-05', admin: 'Director', action: 'Login', target: 'System Access', status: 'Success' },
    { date: '2024-11-05', admin: 'Laboratory', action: 'Approval', target: 'Lab Equipment Clearance', status: 'Approved' },
    { date: '2024-11-05', admin: 'Nurse', action: 'Review', target: 'Medical Clearance Request', status: 'Pending' }
];

// Store allowed students
let allowedStudents = [];

// ============================================
// SESSION HELPERS
// ============================================
function isDataLoadedInSession() {
    return sessionStorage.getItem('adminDataLoaded') === 'true';
}

function markDataAsLoaded() {
    sessionStorage.setItem('adminDataLoaded', 'true');
}

function clearDataLoadedFlag() {
    sessionStorage.removeItem('adminDataLoaded');
}

// ============================================
// INITIALIZE
// ============================================
document.addEventListener('DOMContentLoaded', function () {
    setupNavigation();
    setupSearch();
    setupForms();
    setupEditFormHandler();
    checkExternalLibraries();
    restoreActiveSection();
    loadAllDataOnce();
});

function checkExternalLibraries() {
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js failed to load from CDN - charts will not be displayed');
    }
}

// ============================================
// UNIFIED MODAL FUNCTIONS (single definition)
// ============================================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
    if (modalId === 'batchUploadModal') {
        resetBatchUpload();
    }
}

function resetBatchUpload() {
    const csvFileInput = document.getElementById('csvFile');
    if (csvFileInput) csvFileInput.value = '';
    const fileInfo = document.getElementById('fileInfo');
    if (fileInfo) fileInfo.style.display = 'none';
    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn) uploadBtn.disabled = true;
}

// ============================================
// UNIFIED SHOW ALERT (single definition)
// ============================================
function showAlert(title, message, type = 'info') {
    const iconMap = {
        success: 'fa-check-circle success',
        error: 'fa-times-circle error',
        warning: 'fa-exclamation-triangle warning',
        info: 'fa-info-circle info'
    };

    const alertTitle = document.getElementById('alertTitle');
    const alertMessage = document.getElementById('alertMessage');
    const alertIcon = document.getElementById('alertIcon');

    if (alertTitle) alertTitle.textContent = title;
    if (alertMessage) alertMessage.textContent = message;
    if (alertIcon) alertIcon.className = 'fas modal-icon ' + (iconMap[type] || iconMap.info);

    openModal('alertModal');
}

function showConfirm(title, message, onConfirm) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;

    const confirmBtn = document.getElementById('confirmYes');
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.addEventListener('click', function () {
        closeModal('confirmModal');
        onConfirm();
    });

    openModal('confirmModal');
}

// ============================================
// FETCH WITH TIMEOUT HELPER
// ============================================
async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timer);
        return response;
    } catch (error) {
        clearTimeout(timer);
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Is the Laravel server running on https://icems-techz-production.up.railway.app?');
        }
        throw error;
    }
}

// ============================================
// LOAD ALL DATA ONCE ON LOGIN
// ============================================
async function loadAllDataOnce() {
    if (isDataLoadedInSession()) {
        const cached = sessionStorage.getItem('cachedStudents');
        const parsedCache = cached ? JSON.parse(cached) : null;

        if (!parsedCache || parsedCache.length === 0) {
            console.log('?? Cache is empty, fetching fresh...');
            sessionStorage.removeItem('adminDataLoaded');
            sessionStorage.removeItem('cachedStudents');
        } else {
            console.log('? Loading from cache...');
            allowedStudents = parsedCache;
            displayAllowedStudents();
            loadRoles();
            loadActivityLogs();
            loadAuditTrails();
            waitForChartJS();
            return;
        }
    }

    try {
        console.log('?? Fetching fresh data from API...');
        await Promise.all([
            loadAllowedStudents(),
            loadRoles(),
            loadActivityLogs(),
            loadAuditTrails()
        ]);
        waitForChartJS();

        if (allowedStudents.length > 0) {
            markDataAsLoaded();
            sessionStorage.setItem('cachedStudents', JSON.stringify(allowedStudents));
        }

    } catch (error) {
        console.error('Error loading initial data:', error);
        showAlert('Error', 'Failed to load system data: ' + error.message, 'error');
    }
}

// ============================================
// LOAD ALLOWED STUDENTS
// ============================================
async function loadAllowedStudents() {
    console.log('?? Loading students from API...');

    try {
        const response = await fetchWithTimeout(`${API_URL}/admin/allowed-students`);

        console.log('?? Response status:', response.status);

        const rawText = await response.text();
        console.log('?? Raw response (first 500 chars):', rawText.substring(0, 500));

        let data;
        try {
            // Strip BOM character if present
            const cleanText = rawText.replace(/^\uFEFF/, '');
            data = JSON.parse(cleanText);
        } catch (e) {
            throw new Error('Server returned invalid JSON. Check if backend is running correctly.');
        }

        if (data.success) {
            console.log(`?? Received ${data.students.length} students from API`);

            const registeredCount = data.students.filter(s => s.is_registered).length;
            const notRegisteredCount = data.students.filter(s => !s.is_registered).length;

            console.log(`?? Total: ${data.students.length} | Registered: ${registeredCount} | Not Registered: ${notRegisteredCount}`);

            allowedStudents = data.students;
            displayAllowedStudents();

        } else {
            console.error('? API returned success: false', data);
            showAlert('Error', data.message || 'Failed to load students from server.', 'error');
        }
    } catch (error) {
        console.error('? ERROR LOADING STUDENTS:', error);
        showAlert('Error', error.message || 'Failed to load students. Check if the server is running.', 'error');
    }
}

// ============================================
// CACHE DATA TO SESSIONSTORAGE
// ============================================
function cacheData() {
    try {
        if (allowedStudents.length > 0) {
            sessionStorage.setItem('cachedStudents', JSON.stringify(allowedStudents));
        }
    } catch (error) {
        console.error('Error caching data:', error);
    }
}

// ============================================
// WAIT FOR CHART.JS
// ============================================
function waitForChartJS(attempts = 0) {
    if (typeof Chart !== 'undefined') {
        initializeCharts();
    } else if (attempts < 20) {
        setTimeout(() => waitForChartJS(attempts + 1), 100);
    } else {
        console.warn('Chart.js failed to load after 2 seconds, skipping charts.');
    }
}

// ============================================
// DISPLAY ALLOWED STUDENTS
// ============================================
function displayAllowedStudents() {
    const tbody = document.getElementById('usersTableBody');

    if (!tbody) {
        console.error('? Table body element not found!');
        return;
    }

    tbody.innerHTML = '';

    console.log(`?? Displaying ${allowedStudents.length} students in table...`);

    if (allowedStudents.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 20px; color: #666;">
                    <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 10px; display: block;"></i>
                    No students found. Click "Add User" to add your first student.
                </td>
            </tr>
        `;
        return;
    }

    allowedStudents.forEach(student => {
        const tr = document.createElement('tr');
        tr.style.transition = 'background-color 0.3s ease';

        const isRegistered = !!student.is_registered;

        const statusBadge = isRegistered
            ? '<span class="status-badge status-active">Registered</span>'
            : '<span class="status-badge status-inactive">Not Registered</span>';

        const passwordDisplay = student.password
            ? `<span style="font-family: monospace;">••••••••</span>`
            : '<span style="color: #999;">Not Set</span>';

        const studentId = student.allowed_student_id || student.id;

        tr.innerHTML = `
            <td>${student.id}</td>
            <td>${student.first_name} ${student.last_name}</td>
            <td>${student.email}</td>
            <td>${student.student_number || 'N/A'}</td>
            <td>${passwordDisplay}</td>
            <td>${statusBadge}</td>
            <td>
                <button class="action-btn btn-primary" onclick="editStudent(${studentId})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                ${!isRegistered ? `
                    <button class="action-btn btn-danger" onclick="deleteStudent(${studentId})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                ` : ''}
            </td>
        `;

        tbody.appendChild(tr);
    });

    console.log('? Students displayed successfully');
}

// ============================================
// EDIT STUDENT
// ============================================
function editStudent(studentId) {
    const student = allowedStudents.find(s => s.id === studentId || s.allowed_student_id === studentId);

    if (!student) {
        console.error('? Student not found in local data!');
        showAlert('Error', 'Student not found', 'error');
        return;
    }

    const updateId = student.allowed_student_id || student.id;

    document.getElementById('editUserId').value = updateId;
    document.getElementById('editUserName').value = `${student.first_name} ${student.last_name}`;
    document.getElementById('editUserEmail').value = student.email;

    const roleSelect = document.getElementById('editUserRole');
    if (roleSelect) roleSelect.value = 'User';

    const statusSelect = document.getElementById('editUserStatus');
    if (statusSelect) statusSelect.value = student.is_registered ? 'Active' : 'Inactive';

    openModal('editUserModal');
}

// ============================================
// OPEN EDIT STUDENT MODAL (alternative entry)
// ============================================
function openEditStudentModal(student) {
    document.getElementById('editUserId').value = student.id;

    if (document.getElementById('editUserName'))
        document.getElementById('editUserName').value = student.first_name || student.fullname || '';
    if (document.getElementById('editUserEmail'))
        document.getElementById('editUserEmail').value = student.email || '';
    if (document.getElementById('editUserRole'))
        document.getElementById('editUserRole').value = student.role || 'User';
    if (document.getElementById('editUserStatus'))
        document.getElementById('editUserStatus').value = student.status || 'Active';

    openModal('editUserModal');
}

// ============================================
// SETUP EDIT FORM HANDLER (single attachment)
// ============================================
function setupEditFormHandler() {
    const editForm = document.getElementById('editUserForm');
    if (editForm) {
        editForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const studentId = document.getElementById('editUserId')?.value;
            if (!studentId) {
                showAlert('Error', 'Student ID not found', 'error');
                return;
            }
            await updateStudent(studentId);
        });
        console.log('? Edit form handler attached');
    }
}

// ============================================
// UPDATE STUDENT
// ============================================
async function updateStudent(studentId) {
    console.log('=== UPDATE STUDENT STARTED ===', studentId);

    try {
        const name = document.getElementById('editUserName')?.value || '';
        const email = document.getElementById('editUserEmail')?.value || '';
        const status = document.getElementById('editUserStatus')?.value || 'Active';

        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || firstName;
        const isRegistered = status === 'Active';

        const updateData = {
            first_name: firstName,
            last_name: lastName,
            email: email.trim(),
            is_registered: isRegistered
        };

        console.log('?? Sending update:', updateData);

        const response = await fetchWithTimeout(`${API_URL}/admin/allowed-students/${studentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        const data = await response.json();
        console.log('?? Backend response:', data);

        if (!response.ok) {
            throw new Error(data.message || data.error || 'Update failed');
        }

        // Refresh list from server to confirm
        const allResponse = await fetchWithTimeout(`${API_URL}/admin/allowed-students`);
        const allData = await allResponse.json();

        if (allData.success) {
            const verifiedStudent = allData.students.find(s => s.allowed_student_id == studentId || s.id == studentId);
            if (verifiedStudent) {
                const studentIndex = allowedStudents.findIndex(s => s.allowed_student_id == studentId || s.id == studentId);
                if (studentIndex !== -1) {
                    allowedStudents[studentIndex] = verifiedStudent;
                }
            }
            allowedStudents = allData.students;
            cacheData();
        }

        displayAllowedStudents();
        closeModal('editUserModal');
        showAlert('Success', 'Student updated successfully!', 'success');

    } catch (error) {
        console.error('? Error updating student:', error);
        closeModal('editUserModal');
        showAlert('Error', error.message, 'error');
    }
}

// ============================================
// ADD NEW ALLOWED STUDENT (single definition)
// ============================================
async function addAllowedStudent(formData) {
    try {
        console.log('?? Sending student data:', {
            ...formData,
            password: formData.password ? `${formData.password.length} chars` : 'NOT SET'
        });

        const response = await fetchWithTimeout(`${API_URL}/admin/allowed-students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        console.log('?? Response status:', response.status);

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('? Server returned non-JSON:', text.substring(0, 500));
            showAlert('Error', 'Server error. Please check the backend logs.', 'error');
            return false;
        }

        const data = await response.json();
        console.log('?? Response data:', data);

        if (response.status === 422) {
            showAlert('Validation Error', data.message || 'Please check your input', 'error');
            return false;
        }

        if (data.success) {
            showAlert('Success', 'Student added and automatically registered!', 'success');
            await refreshStudentList();
            closeModal('addUserModal');
            return true;
        } else {
            showAlert('Error', data.message || 'Failed to add student', 'error');
            return false;
        }
    } catch (error) {
        console.error('? Error adding student:', error);
        showAlert('Error', 'Network error: ' + error.message, 'error');
        return false;
    }
}

// ============================================
// REFRESH STUDENT LIST
// ============================================
async function refreshStudentList() {
    try {
        const response = await fetchWithTimeout(`${API_URL}/admin/allowed-students`);
        const data = await response.json();

        if (data.success) {
            allowedStudents = data.students;
            displayAllowedStudents();
            cacheData();
        }
    } catch (error) {
        console.error('Error refreshing student list:', error);
    }
}

// ============================================
// DELETE ALLOWED STUDENT
// ============================================
async function deleteStudent(id) {
    showConfirm(
        'Delete Student',
        'Are you sure you want to remove this student from the allowed list? They will not be able to register.',
        async function () {
            try {
                const response = await fetchWithTimeout(`${API_URL}/admin/allowed-students/${id}`, {
                    method: 'DELETE'
                });

                const data = await response.json();

                if (data.success) {
                    showAlert('Success', 'Student removed successfully!', 'success');
                    await refreshStudentList();
                } else {
                    showAlert('Error', data.message, 'error');
                }
            } catch (error) {
                console.error('Error deleting student:', error);
                showAlert('Error', 'Failed to delete student: ' + error.message, 'error');
            }
        }
    );
}

// ============================================
// NAVIGATION
// ============================================
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });

            const sectionId = this.getAttribute('data-section');
            document.getElementById(sectionId).classList.add('active');

            const title = this.querySelector('span').textContent;
            document.getElementById('page-title').textContent = title;

            sessionStorage.setItem('activeSection', sectionId);
            sessionStorage.setItem('activeTitle', title);

            console.log(`Switched to section: ${sectionId}`);
        });
    });
}

// ============================================
// RESTORE ACTIVE SECTION
// ============================================
function restoreActiveSection() {
    const savedSection = sessionStorage.getItem('activeSection');
    const savedTitle = sessionStorage.getItem('activeTitle');

    if (savedSection && savedTitle) {
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));

        const navItem = document.querySelector(`[data-section="${savedSection}"]`);
        if (navItem) navItem.classList.add('active');

        const contentSection = document.getElementById(savedSection);
        if (contentSection) contentSection.classList.add('active');

        document.getElementById('page-title').textContent = savedTitle;
    }
}

// ============================================
// LOAD OTHER TABLES
// ============================================
function loadRoles() {
    const tbody = document.getElementById('rolesTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    sampleAdmins.forEach(admin => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${admin.name}</td><td>${admin.role}</td>`;
        tbody.appendChild(tr);
    });
}

function loadActivityLogs() {
    const tbody = document.getElementById('activityLogsBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    activityLogs.forEach(log => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${log.timestamp}</td><td>${log.user}</td><td>${log.action}</td><td>${log.details}</td>`;
        tbody.appendChild(tr);
    });
}

function loadAuditTrails() {
    const tbody = document.getElementById('auditTrailsBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    auditTrails.forEach(trail => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${trail.date}</td>
            <td>${trail.admin}</td>
            <td>${trail.action}</td>
            <td>${trail.target}</td>
            <td><span class="status-badge ${trail.status === 'Approved' ? 'status-active' : 'status-inactive'}">${trail.status}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

// ============================================
// SETUP FORMS
// ============================================
function setupForms() {
    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
        addUserForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const fullName = document.getElementById('addFullName').value.trim();
            const nameParts = fullName.split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ') || firstName;

            const autoPassword = generateRandomPassword();

            const formData = {
                first_name: firstName,
                last_name: lastName,
                student_number: document.getElementById('addStudentNumber').value,
                course: document.getElementById('addCourse').value,
                year: document.getElementById('addYear').value,
                email: document.getElementById('addEmail').value,
                password: autoPassword,
                auto_registered: true
            };

            const success = await addAllowedStudent(formData);
            if (success) this.reset();
        });
    }
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================
function setupSearch() {
    const searchBox = document.getElementById('userSearch');
    if (searchBox) {
        searchBox.addEventListener('input', function (e) {
            const searchTerm = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#usersTableBody tr');
            rows.forEach(row => {
                row.style.display = row.textContent.toLowerCase().includes(searchTerm) ? '' : 'none';
            });
        });
    }
}

// ============================================
// INITIALIZE CHARTS
// ============================================
function initializeCharts() {
    if (typeof Chart === 'undefined') {
        console.error('Chart.js not loaded');
        return;
    }

    const userCtx = document.getElementById('userChart')?.getContext('2d');
    if (userCtx) {
        const registeredCount = allowedStudents.filter(s => s.is_registered).length;
        const notRegisteredCount = allowedStudents.filter(s => !s.is_registered).length;
        const totalCount = allowedStudents.length;

        try {
            new Chart(userCtx, {
                type: 'bar',
                data: {
                    labels: ['Registered', 'Not Registered', 'Total Allowed'],
                    datasets: [{
                        label: 'Student Statistics',
                        data: [registeredCount, notRegisteredCount, totalCount],
                        backgroundColor: [
                            'rgba(34, 197, 94, 0.9)',
                            'rgba(239, 68, 68, 0.9)',
                            'rgba(59, 130, 246, 0.9)'
                        ],
                        borderColor: [
                            'rgba(22, 163, 74, 1)',
                            'rgba(220, 38, 38, 1)',
                            'rgba(37, 99, 235, 1)'
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                }
            });
        } catch (error) {
            console.error('Error creating chart:', error);
        }
    }
}

// ============================================
// MISC FUNCTIONS
// ============================================
function updateRole(id) {
    const select = document.getElementById(`role-${id}`);
    if (select) showAlert('Success', `Role updated to: ${select.value}`, 'success');
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

// Close modal when clicking outside
window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
        event.target.classList.remove('active');
    }
    const logoutModal = document.getElementById('logoutModal');
    if (event.target === logoutModal) closeLogoutModal();
};

// ============================================
// LOGOUT FUNCTIONS
// ============================================
function logout() {
    document.getElementById('logoutModal').style.display = 'flex';
    document.body.classList.add('no-scroll');
}

function closeLogoutModal() {
    document.getElementById('logoutModal').style.display = 'none';
    document.body.classList.remove('no-scroll');
}

function confirmLogout() {
    document.body.classList.remove('no-scroll');
    clearDataLoadedFlag();
    sessionStorage.removeItem('cachedStudents');
    sessionStorage.removeItem('activeSection');
    sessionStorage.removeItem('activeTitle');
    window.location.href = '../user/studentlogin.html';
}

// ============================================
// GENERATE RANDOM PASSWORD
// ============================================
function generateRandomPassword() {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*';

    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    const allChars = uppercase + lowercase + numbers + special;
    for (let i = password.length; i < 12; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    return password.split('').sort(() => Math.random() - 0.5).join('');
}

// ============================================
// SHOW/CLOSE PASSWORD ALERT
// ============================================
function showPasswordAlert(title, message) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'passwordAlertModal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content alert-modal-content" style="max-width: 500px;">
            <i class="fas fa-check-circle modal-icon success"></i>
            <h2>${title}</h2>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: left;">
                <pre style="margin: 0; white-space: pre-wrap; font-family: monospace;">${message}</pre>
            </div>
            <button class="btn btn-primary" onclick="closePasswordAlert()">OK</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function closePasswordAlert() {
    const modal = document.getElementById('passwordAlertModal');
    if (modal) modal.remove();
}

// ============================================
// EXPORT TO WINDOW
// ============================================
window.editStudent = editStudent;
window.updateStudent = updateStudent;
window.deleteStudent = deleteStudent;
window.displayAllowedStudents = displayAllowedStudents;
window.openEditStudentModal = openEditStudentModal;
window.showAlert = showAlert;
window.showConfirm = showConfirm;
window.openModal = openModal;
window.closeModal = closeModal;
window.refreshStudentList = refreshStudentList;
window.loadAllowedStudents = loadAllowedStudents;

console.log('? SystemAdmin.js loaded successfully');

