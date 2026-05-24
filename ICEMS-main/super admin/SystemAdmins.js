const API_URL = 'http://127.0.0.1:8000/api';
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
    checkExternalLibraries();
    restoreActiveSection();
    loadAllDataOnce();
});

function checkExternalLibraries() {
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js failed to load — charts will not display.');
    }
}

// ============================================
// LOAD ALL DATA — FIX: only cache if students > 0
// ============================================
async function loadAllDataOnce() {
    const cached = sessionStorage.getItem('cachedStudents');
    const dataLoaded = isDataLoadedInSession();

    // FIX: treat empty-array cache as invalid — always re-fetch
    let cachedStudents = [];
    try {
        cachedStudents = cached ? JSON.parse(cached) : [];
    } catch (_) {
        cachedStudents = [];
    }

    if (dataLoaded && cachedStudents.length > 0) {
        console.log('✅ Valid cache found — loading from session.');
        loadCachedData(cachedStudents);
        return;
    }

    // Cache was empty or missing — fetch fresh
    console.log('🔄 Fetching fresh data from API...');
    try {
        await Promise.all([
            loadAllowedStudents(),
            loadRoles(),
            loadActivityLogs(),
            loadAuditTrails()
        ]);

        waitForChartJS();
        markDataAsLoaded();
        cacheData();
        console.log('✅ All data loaded and cached.');
    } catch (error) {
        console.error('Error loading initial data:', error);
        showAlert('Error', 'Failed to load system data', 'error');
    }
}

// ============================================
// LOAD ALLOWED STUDENTS
// ============================================
async function loadAllowedStudents() {
    try {
        console.log('📤 Fetching students from:', `${API_URL}/admin/allowed-students`);

        const response = await fetch(`${API_URL}/admin/allowed-students`);
        console.log('📥 Response status:', response.status);

        const rawText = await response.text();
        const data = JSON.parse(rawText);

        if (data.success) {
            console.log(`📊 Received ${data.students.length} students from API`);

            const registeredCount = data.students.filter(s => s.is_registered).length;
            const notRegisteredCount = data.students.filter(s => !s.is_registered).length;
            console.log(`📊 Registered: ${registeredCount} | Not Registered: ${notRegisteredCount}`);

            allowedStudents = data.students;
            displayAllowedStudents();
        } else {
            console.error('❌ API returned success: false');
        }
    } catch (error) {
        console.error('❌ ERROR LOADING STUDENTS:', error);
        showAlert('Error', 'Failed to load students', 'error');
    }
}

// ============================================
// CACHE DATA — FIX: only cache non-empty arrays
// ============================================
function cacheData() {
    try {
        if (allowedStudents.length > 0) {
            sessionStorage.setItem('cachedStudents', JSON.stringify(allowedStudents));
            console.log(`✅ Cached ${allowedStudents.length} students.`);
        } else {
            console.warn('⚠️ Skipping cache — student list is empty.');
        }
    } catch (error) {
        console.error('Error caching data:', error);
    }
}

// ============================================
// LOAD CACHED DATA
// ============================================
function loadCachedData(cachedStudents) {
    allowedStudents = cachedStudents;
    console.log(`📦 Loaded ${allowedStudents.length} students from cache.`);
    displayAllowedStudents();
    loadRoles();
    loadActivityLogs();
    loadAuditTrails();
    waitForChartJS();
}

// ============================================
// WAIT FOR CHART.JS
// ============================================
function waitForChartJS() {
    if (typeof Chart !== 'undefined') {
        initializeCharts();
    } else {
        setTimeout(waitForChartJS, 100);
    }
}

// ============================================
// DISPLAY ALLOWED STUDENTS
// ============================================
function displayAllowedStudents() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) {
        console.error('❌ Table body element not found!');
        return;
    }

    tbody.innerHTML = '';
    console.log(`📊 Displaying ${allowedStudents.length} students in table...`);

    if (allowedStudents.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:20px;color:#666;">
                    <i class="fas fa-inbox" style="font-size:48px;margin-bottom:10px;display:block;"></i>
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
            ? `<span style="font-family:monospace;">••••••••</span>`
            : '<span style="color:#999;">Not Set</span>';

        tr.innerHTML = `
            <td>${student.id}</td>
            <td>${student.first_name} ${student.last_name}</td>
            <td>${student.email}</td>
            <td>${student.student_number || 'N/A'}</td>
            <td>${passwordDisplay}</td>
            <td>${statusBadge}</td>
            <td>
                <button class="action-btn btn-primary" onclick="editStudent(${student.allowed_student_id || student.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                ${!isRegistered ? `
                    <button class="action-btn btn-danger" onclick="deleteStudent(${student.allowed_student_id || student.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });

    console.log('✅ Students displayed successfully');
}

// ============================================
// EDIT STUDENT
// ============================================
function editStudent(studentId) {
    const student = allowedStudents.find(s => s.id === studentId || s.allowed_student_id === studentId);

    if (!student) {
        console.error('❌ Student not found in local data!');
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
// UPDATE STUDENT
// ============================================
async function updateStudent(studentId) {
    console.log('=== UPDATE STUDENT STARTED ===');

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

        const response = await fetch(`${API_URL}/admin/allowed-students/${studentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(updateData)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || data.error || 'Update failed');

        // Verify immediately
        const allResponse = await fetch(`${API_URL}/admin/allowed-students`);
        const allData = await allResponse.json();

        if (allData.success) {
            const verified = allData.students.find(s => s.allowed_student_id == studentId || s.id == studentId);

            if (verified && !!verified.is_registered !== isRegistered) {
                closeModal('editUserModal');
                showAlert('Update Failed', 'Database returned a different value. Please check backend logs.', 'error');

                const idx = allowedStudents.findIndex(s => s.allowed_student_id == studentId || s.id == studentId);
                if (idx !== -1) allowedStudents[idx] = verified;
                displayAllowedStudents();
                return;
            }

            if (verified) {
                const idx = allowedStudents.findIndex(s => s.allowed_student_id == studentId || s.id == studentId);
                if (idx !== -1) allowedStudents[idx] = verified;
            }

            // Update cache with latest
            cacheData();
        }

        displayAllowedStudents();
        closeModal('editUserModal');
        showAlert('Success', 'Student updated successfully!', 'success');

    } catch (error) {
        console.error('❌ Error:', error);
        closeModal('editUserModal');
        showAlert('Error', error.message, 'error');
    }
}

// ============================================
// EDIT FORM SUBMIT HANDLER
// ============================================
document.addEventListener('DOMContentLoaded', function () {
    const editForm = document.getElementById('editUserForm');
    if (editForm) {
        editForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const studentId = document.getElementById('editUserId')?.value;
            if (!studentId) { showAlert('Error', 'Student ID not found', 'error'); return; }
            await updateStudent(studentId);
        });
        console.log('Edit form handler attached');
    }
});

// ============================================
// ADD ALLOWED STUDENT
// ============================================
async function addAllowedStudent(formData) {
    try {
        const response = await fetch(`${API_URL}/admin/allowed-students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            showAlert('Error', 'Server error. Please check the backend logs.', 'error');
            return false;
        }

        const data = await response.json();
        if (response.status === 422) {
            showAlert('Validation Error', data.message || 'Please check your input', 'error');
            return false;
        }

        if (data.success) {
            showAlert('Success', 'Student added and registered successfully!', 'success');
            await refreshStudentList();
            closeModal('addUserModal');
            return true;
        } else {
            showAlert('Error', data.message || 'Failed to add student', 'error');
            return false;
        }
    } catch (error) {
        console.error('❌ Error adding student:', error);
        showAlert('Error', 'Network error: ' + error.message, 'error');
        return false;
    }
}

// ============================================
// REFRESH STUDENT LIST
// ============================================
async function refreshStudentList() {
    try {
        const response = await fetch(`${API_URL}/admin/allowed-students`);
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
// DELETE STUDENT
// ============================================
async function deleteStudent(id) {
    showConfirm(
        'Delete Student',
        'Are you sure you want to remove this student from the allowed list?',
        async function () {
            try {
                const response = await fetch(`${API_URL}/admin/allowed-students/${id}`, { method: 'DELETE' });
                const data = await response.json();
                if (data.success) {
                    showAlert('Success', 'Student removed successfully!', 'success');
                    await refreshStudentList();
                } else {
                    showAlert('Error', data.message, 'error');
                }
            } catch (error) {
                showAlert('Error', 'Failed to delete student', 'error');
            }
        }
    );
}

// ============================================
// MODAL FUNCTIONS
// ============================================
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function showAlert(title, message, type = 'success') {
    const iconMap = {
        success: 'fa-check-circle success',
        error: 'fa-times-circle error',
        warning: 'fa-exclamation-triangle warning',
        info: 'fa-info-circle info'
    };
    document.getElementById('alertTitle').textContent = title;
    document.getElementById('alertMessage').textContent = message;
    const icon = document.getElementById('alertIcon');
    icon.className = 'fas modal-icon ' + (iconMap[type] || iconMap.info);
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

window.openModal = openModal;
window.closeModal = closeModal;
window.showAlert = showAlert;
window.showConfirm = showConfirm;
window.editStudent = editStudent;
window.updateStudent = updateStudent;
window.deleteStudent = deleteStudent;
window.displayAllowedStudents = displayAllowedStudents;

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
            const section = document.getElementById(sectionId);
            if (section) section.classList.add('active');

            const title = this.querySelector('span')?.textContent || '';
            document.getElementById('page-title').textContent = title;

            sessionStorage.setItem('activeSection', sectionId);
            sessionStorage.setItem('activeTitle', title);

            // FIX: Only initialize reports when the reports tab is actually clicked
            if (sectionId === 'reports' && typeof window.initializeReports === 'function') {
                console.log('📊 Reports tab clicked — initializing reports...');
                setTimeout(window.initializeReports, 300);
            }
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
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));

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
        tr.innerHTML = `
            <td>${log.timestamp}</td>
            <td>${log.user}</td>
            <td>${log.action}</td>
            <td>${log.details}</td>
        `;
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

            const formData = {
                first_name: firstName,
                last_name: lastName,
                student_number: document.getElementById('addStudentNumber').value,
                course: document.getElementById('addCourse').value,
                year: document.getElementById('addYear').value,
                email: document.getElementById('addEmail').value,
                password: generateRandomPassword(),
                auto_registered: true
            };

            const success = await addAllowedStudent(formData);
            if (success) this.reset();
        });
    }
}

// ============================================
// SEARCH
// ============================================
function setupSearch() {
    const searchBox = document.getElementById('userSearch');
    if (searchBox) {
        searchBox.addEventListener('input', function (e) {
            const searchTerm = e.target.value.toLowerCase();
            document.querySelectorAll('#usersTableBody tr').forEach(row => {
                row.style.display = row.textContent.toLowerCase().includes(searchTerm) ? '' : 'none';
            });
        });
    }
}

// ============================================
// CHARTS
// ============================================
function initializeCharts() {
    if (typeof Chart === 'undefined') { console.error('Chart.js not loaded'); return; }

    const userCtx = document.getElementById('userChart')?.getContext('2d');
    if (userCtx) {
        const registeredCount = allowedStudents.filter(s => s.is_registered).length;
        const notRegisteredCount = allowedStudents.filter(s => !s.is_registered).length;

        try {
            new Chart(userCtx, {
                type: 'bar',
                data: {
                    labels: ['Registered', 'Not Registered', 'Total Allowed'],
                    datasets: [{
                        label: 'Student Statistics',
                        data: [registeredCount, notRegisteredCount, allowedStudents.length],
                        backgroundColor: ['rgba(34,197,94,0.9)', 'rgba(239,68,68,0.9)', 'rgba(59,130,246,0.9)'],
                        borderColor: ['rgba(22,163,74,1)', 'rgba(220,38,38,1)', 'rgba(37,99,235,1)'],
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
// MISC HELPERS
// ============================================
function generateRandomPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = 'Aa1!'; // guarantee requirements
    for (let i = password.length; i < 12; i++) {
        password += chars[Math.floor(Math.random() * chars.length)];
    }
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
};

// ============================================
// LOGOUT
// ============================================
function logout() {
    showConfirm(
        'Logout',
        'Are you sure you want to logout?',
        function () { performLogout(); }
    );
}

function performLogout() {
    clearDataLoadedFlag();
    sessionStorage.removeItem('cachedStudents');
    sessionStorage.removeItem('activeSection');
    sessionStorage.removeItem('activeTitle');
    setTimeout(function () {
        window.location.href = '../user/studentlogin.html';
    }, 1500);
}

console.log('✅ Update student functions loaded');