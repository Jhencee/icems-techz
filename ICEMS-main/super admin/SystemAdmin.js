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

// Store allowed students
let allowedStudents = [];

// Check if data is already loaded in this login session
function isDataLoadedInSession() {
    return sessionStorage.getItem('adminDataLoaded') === 'true';
}

function markDataAsLoaded() {
    sessionStorage.setItem('adminDataLoaded', 'true');
}

function clearDataLoadedFlag() {
    sessionStorage.removeItem('adminDataLoaded');
}

// Initialize
document.addEventListener('DOMContentLoaded', function () {
    setupNavigation();
    setupSearch();
    setupForms();

    // Check for external library loading errors
    checkExternalLibraries();

    // Restore last active section
    restoreActiveSection();

    // Load data only if not already loaded in this session
    loadAllDataOnce();
});

// Check if external libraries loaded properly
function checkExternalLibraries() {
    // Check Chart.js
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js failed to load from CDN - charts will not be displayed');
    }

    // Check Font Awesome (by checking if the icon font is loaded)
    const testIcon = document.querySelector('.fas');
    if (testIcon && window.getComputedStyle(testIcon).fontFamily.indexOf('Font Awesome') === -1) {
        console.warn('Font Awesome failed to load from CDN - icons may not display properly');
    }
}

// ============================================
// LOAD ALL DATA ONCE ON LOGIN
// ============================================
async function loadAllDataOnce() {
    // Check if data was already loaded in this login session
    if (isDataLoadedInSession()) {
        console.log('Data already loaded in this session, skipping API calls...');

        // Just load from cache if available
        loadCachedData();
        return;
    }

    try {
        console.log('First login - Loading all data from API...');

        // Load all data in parallel for better performance
        await Promise.all([
            loadAllowedStudents(),
            loadRoles(),
            loadActivityLogs(),
            loadAuditTrails()
        ]);

        // Wait for Chart.js to be loaded before initializing charts
        waitForChartJS();

        // Mark data as loaded for this session
        markDataAsLoaded();

        // Cache the data
        cacheData();

        console.log('All data loaded successfully - will not reload until logout');
    } catch (error) {
        console.error('Error loading initial data:', error);
        showAlert('Error', 'Failed to load system data', 'error');
    }
}

async function loadAllowedStudents() {
    console.log('═══════════════════════════════════════');
    console.log('🔍 LOADING STUDENTS - DETAILED DEBUG');
    console.log('═══════════════════════════════════════');

    try {
        console.log('📤 Fetching from:', `${API_URL}/admin/allowed-students`);

        const response = await fetch(`${API_URL}/admin/allowed-students`);

        console.log('📥 Response status:', response.status);
        console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

        // Get raw text first
        const rawText = await response.text();
        console.log('📥 Raw response (first 500 chars):', rawText.substring(0, 500));

        // Parse JSON
        const data = JSON.parse(rawText);
        console.log('📥 Parsed data:', data);

        if (data.success) {
            console.log(`📊 Received ${data.students.length} students from API`);

            // Check EACH student as it comes from API
            data.students.forEach((student, index) => {
                console.log(`Student ${index + 1}:`, {
                    id: student.id,
                    name: `${student.first_name} ${student.last_name}`,
                    is_registered: student.is_registered,
                    is_registered_type: typeof student.is_registered,
                    is_truthy: !!student.is_registered
                });
            });

            // Count registered vs not registered
            const registeredCount = data.students.filter(s => s.is_registered).length;
            const notRegisteredCount = data.students.filter(s => !s.is_registered).length;

            console.log('📊 SUMMARY FROM API:');
            console.log(`  - Total: ${data.students.length}`);
            console.log(`  - Registered (truthy): ${registeredCount}`);
            console.log(`  - Not Registered (falsy): ${notRegisteredCount}`);

            // Find the student that's not registered
            const notRegistered = data.students.filter(s => !s.is_registered);
            if (notRegistered.length > 0) {
                console.log('❌ STUDENTS SHOWING AS NOT REGISTERED:');
                notRegistered.forEach(s => {
                    console.log(`  - ID ${s.id}: ${s.first_name} ${s.last_name} (${s.email})`);
                    console.log(`    is_registered value: ${s.is_registered}`);
                    console.log(`    is_registered type: ${typeof s.is_registered}`);
                });
            }

            // Store in global variable
            allowedStudents = data.students;

            console.log('✅ Data stored in allowedStudents global variable');
            console.log('allowedStudents length:', allowedStudents.length);

            // Display the table
            displayAllowedStudents();

            console.log('═══════════════════════════════════════');

        } else {
            console.error('❌ API returned success: false');
        }
    } catch (error) {
        console.error('═══════════════════════════════════════');
        console.error('❌ ERROR LOADING STUDENTS:', error);
        console.error('Error stack:', error.stack);
        console.error('═══════════════════════════════════════');
        showAlert('Error', 'Failed to load students', 'error');
    }
}

// ============================================
// CACHE DATA TO SESSIONSTORAGE
// ============================================
function cacheData() {
    try {
        sessionStorage.setItem('cachedStudents', JSON.stringify(allowedStudents));
        console.log('Data cached to sessionStorage');
    } catch (error) {
        console.error('Error caching data:', error);
    }
}

// ============================================
// LOAD CACHED DATA FROM SESSIONSTORAGE
// ============================================
function loadCachedData() {
    try {
        const cached = sessionStorage.getItem('cachedStudents');
        if (cached) {
            allowedStudents = JSON.parse(cached);
            displayAllowedStudents();

            // Load other tables with cached data
            loadRoles();
            loadActivityLogs();
            loadAuditTrails();

            // Wait for Chart.js to load before initializing charts
            waitForChartJS();

            console.log('Loaded data from cache');
        }
    } catch (error) {
        console.error('Error loading cached data:', error);
    }
}

// Wait for Chart.js library to be loaded
function waitForChartJS() {
    if (typeof Chart !== 'undefined') {
        initializeCharts();
    } else {
        console.log('Waiting for Chart.js to load...');
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
// ENHANCED: Mark updated student for highlight
// ============================================
async function updateStudentWithHighlight(studentId) {
    // Call the main update function
    await updateStudent(studentId);

    // Mark student as just updated
    const studentIndex = allowedStudents.findIndex(s => s.id == studentId);
    if (studentIndex !== -1) {
        allowedStudents[studentIndex]._justUpdated = true;
    }

    // Redisplay to show highlight
    displayAllowedStudents();
}

// ============================================
// EDIT STUDENT FUNCTION
// ============================================
function editStudent(studentId) {
    const student = allowedStudents.find(s => s.id === studentId || s.allowed_student_id === studentId);

    if (!student) {
        console.error('❌ Student not found in local data!');
        showAlert('Error', 'Student not found', 'error');
        return;
    }

    console.log('📝 Editing student:', {
        id: student.id,
        allowed_student_id: student.allowed_student_id,
        name: `${student.first_name} ${student.last_name}`,
        is_registered: student.is_registered,
        is_registered_type: typeof student.is_registered
    });

    // ✅ FIX: Store both IDs for reference
    // Use allowed_student_id for the update, not the user id
    const updateId = student.allowed_student_id || student.id;
    
    // Populate form fields
    document.getElementById('editUserId').value = updateId; // ✅ Use allowed_student_id
    document.getElementById('editUserName').value = `${student.first_name} ${student.last_name}`;
    document.getElementById('editUserEmail').value = student.email;

    const roleSelect = document.getElementById('editUserRole');
    if (roleSelect) {
        roleSelect.value = 'User';
    }

    // Set status dropdown based on is_registered boolean
    const statusSelect = document.getElementById('editUserStatus');
    if (statusSelect) {
        statusSelect.value = student.is_registered ? 'Active' : 'Inactive';
        console.log('📋 Status dropdown set to:', statusSelect.value);
    }

    openModal('editUserModal');
}

// Export functions
window.editStudent = editStudent;
window.updateStudent = updateStudent;
window.displayAllowedStudents = displayAllowedStudents;

// ============================================
// OPEN EDIT MODAL AND POPULATE DATA    
// ============================================
function openEditStudentModal(student) {
    console.log('Opening edit modal for student:', student);

    // Set student ID
    document.getElementById('editUserId').value = student.id;

    // Populate ONLY the fields that exist in your modal
    if (document.getElementById('editUserName')) {
        document.getElementById('editUserName').value = student.first_name || student.fullname || '';
    }

    if (document.getElementById('editUserEmail')) {
        document.getElementById('editUserEmail').value = student.email || '';
    }

    if (document.getElementById('editUserRole')) {
        document.getElementById('editUserRole').value = student.role || 'User';
    }

    if (document.getElementById('editUserStatus')) {
        document.getElementById('editUserStatus').value = student.status || 'Active';
    }

    // Open the modal
    openModal('editUserModal');
}

// ============================================
// UPDATE STUDENT FUNCTION - FIXED VERSION
// ============================================
async function updateStudent(studentId) {
    console.log('=== UPDATE STUDENT STARTED ===');
    console.log('Updating user ID:', studentId);

    try {
        const name = document.getElementById('editUserName')?.value || '';
        const email = document.getElementById('editUserEmail')?.value || '';
        const status = document.getElementById('editUserStatus')?.value || 'Active';

        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || firstName;

        // Convert status to boolean
        const isRegistered = status === 'Active';

        console.log('🔍 Form values:', { status, isRegistered });

        const updateData = {
            first_name: firstName,
            last_name: lastName,
            email: email.trim(),
            is_registered: isRegistered
        };

        console.log('📤 Sending update:', updateData);

        // Send update to backend
        const response = await fetch(`${API_URL}/admin/allowed-students/${studentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        const data = await response.json();
        console.log('📥 Backend response:', data);

        if (!response.ok) {
            throw new Error(data.message || data.error || 'Update failed');
        }

        // ✅ CRITICAL FIX: Verify IMMEDIATELY after update, before showing success
        console.log('🔍 Verifying update immediately...');
        
        // Fetch all students to verify
        const allResponse = await fetch(`${API_URL}/admin/allowed-students`);
        const allData = await allResponse.json();
        
        if (allData.success) {
            const verifiedStudent = allData.students.find(s => s.allowed_student_id == studentId || s.id == studentId);
            
            if (verifiedStudent) {
                const dbValue = !!verifiedStudent.is_registered;
                
                console.log('🔍 Verification result:', {
                    sent: isRegistered,
                    received: dbValue,
                    match: dbValue === isRegistered
                });

                if (dbValue !== isRegistered) {
                    // ❌ MISMATCH DETECTED - Show error instead of success
                    console.error('❌ UPDATE FAILED - Database has different value!');
                    console.error(`Expected: ${isRegistered}, Got: ${dbValue}`);
                    
                    closeModal('editUserModal');
                    
                    showAlert(
                        'Update Failed',
                        `The update did not save correctly to the database.\n\n` +
                        `Expected status: ${isRegistered ? 'Registered' : 'Not Registered'}\n` +
                        `Actual status: ${dbValue ? 'Registered' : 'Not Registered'}\n\n` +
                        `This indicates a backend/database issue. Please check:\n` +
                        `1. Backend API logs\n` +
                        `2. Database column type (should be BOOLEAN)\n` +
                        `3. Backend update logic`,
                        'error'
                    );
                    
                    // Update local data with ACTUAL database value
                    const studentIndex = allowedStudents.findIndex(s => s.allowed_student_id == studentId || s.id == studentId);
                    if (studentIndex !== -1) {
                        allowedStudents[studentIndex] = verifiedStudent;
                    }
                    
                    displayAllowedStudents();
                    return; // ❌ Stop here - don't show success
                }
                
                // ✅ Values match - update was successful
                console.log('✅ Verification passed - update successful');
                
                // Update local data
                const studentIndex = allowedStudents.findIndex(s => s.allowed_student_id == studentId || s.id == studentId);
                if (studentIndex !== -1) {
                    allowedStudents[studentIndex] = verifiedStudent;
                }
            }
        }

        // Update UI
        displayAllowedStudents();
        
        // Close modal
        closeModal('editUserModal');

        // ✅ Only show success if verification passed
            showAlert('Success', 'Student updated successfully!', 'success');
        

    } catch (error) {
        console.error('❌ Error:', error);
        closeModal('editUserModal');
        showAlert('Error', error.message, 'error');
    }
}

// ============================================
// BACKGROUND VERIFICATION (runs after UI updates)
// ============================================
async function verifyUpdateInBackground(studentId, expectedValue) {
    try {
        console.log('🔍 Verifying update in background...');

        // Fetch fresh data from server
        const response = await fetch(`${API_URL}/admin/allowed-students`);
        const data = await response.json();

        if (data.success) {
            const updatedStudent = data.students.find(s => s.id == studentId);

            if (updatedStudent) {
                const dbValue = !!updatedStudent.is_registered;

                console.log('🔍 Verification result:', {
                    studentId,
                    expected: expectedValue,
                    actual: dbValue,
                    match: dbValue === expectedValue ? '✅ MATCH' : '❌ MISMATCH'
                });

                if (dbValue !== expectedValue) {
                    console.error('❌ MISMATCH DETECTED!');
                    console.error('Database value differs from what was sent');
                    console.error('This might indicate a backend issue');

                    // Update local data with correct database value
                    const studentIndex = allowedStudents.findIndex(s => s.id == studentId);
                    if (studentIndex !== -1) {
                        allowedStudents[studentIndex] = updatedStudent;

                        // Refresh UI with correct data from database
                        displayAllowedStudents();

                        // Alert user about the discrepancy
                        showAlert(
                            'Notice',
                            'The database returned a different value than expected. The display has been updated to match the database.',
                            'warning'
                        );
                    }
                } else {
                    console.log('✅ Verification passed - values match perfectly');
                }
            } else {
                console.error('❌ Student not found in database response');
            }
        }
    } catch (error) {
        console.error('Background verification error:', error);
        // Don't show error to user since this is just a background check
    }
}

// ============================================
// EDIT FORM SUBMIT HANDLER
// ============================================
document.addEventListener('DOMContentLoaded', function () {
    console.log('Initializing edit form handler...');

    const editForm = document.getElementById('editUserForm');

    if (editForm) {
        // Remove any existing listeners
        editForm.removeEventListener('submit', handleEditFormSubmit);

        // Add submit listener
        editForm.addEventListener('submit', handleEditFormSubmit);

        console.log('Edit form handler attached');
    } else {
        console.warn('Edit form not found on page load');
    }
});

// Form submit handler function
async function handleEditFormSubmit(e) {
    e.preventDefault();

    console.log('Edit form submitted');

    const studentId = document.getElementById('editUserId')?.value;

    if (!studentId) {
        showAlert('Error', 'Student ID not found', 'error');
        return;
    }

    // Call update function
    await updateStudent(studentId);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Show Alert Modal
function showAlert(title, message, type = 'info') {
    const alertModal = document.getElementById('alertModal');
    const alertTitle = document.getElementById('alertTitle');
    const alertMessage = document.getElementById('alertMessage');
    const alertIcon = document.getElementById('alertIcon');

    if (alertTitle) alertTitle.textContent = title;
    if (alertMessage) alertMessage.textContent = message;

    if (alertIcon) {
        alertIcon.className = 'fas modal-icon';
        if (type === 'success') {
            alertIcon.classList.add('fa-check-circle', 'success');
        } else if (type === 'error') {
            alertIcon.classList.add('fa-times-circle', 'error');
        } else {
            alertIcon.classList.add('fa-info-circle');
        }
    }

    if (alertModal) {
        alertModal.style.display = 'flex';
    }
}

// ============================================
// ADD NEW ALLOWED STUDENT
// ============================================
async function addAllowedStudent(formData) {
    try {
        console.log('📤 Sending student data:', {
            ...formData,
            password: formData.password ? `${formData.password.length} chars` : 'NOT SET'
        });

        const response = await fetch(`${API_URL}/admin/allowed-students`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        console.log('📥 Response status:', response.status);

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('❌ Server returned HTML instead of JSON:', text.substring(0, 500));
            showAlert('Error', 'Server error. Please check the backend logs for details.', 'error');
            return false;
        }

        const data = await response.json();
        console.log('📥 Response data:', data);

        if (response.status === 422) {
            console.error('❌ Validation Error:', data);
            showAlert('Validation Error', data.message || 'Please check your input', 'error');
            return false;
        }

        if (data.success) {
            showAlert('Success', 'Student added successfully!', 'success');
            // Manually refresh only the student list without full reload
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

// Helper function to refresh only student list
async function refreshStudentList() {
    try {
        const response = await fetch(`${API_URL}/admin/allowed-students`);
        const data = await response.json();

        if (data.success) {
            allowedStudents = data.students;
            displayAllowedStudents();

            // Update cache
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
                const response = await fetch(`${API_URL}/admin/allowed-students/${id}`, {
                    method: 'DELETE'
                });

                const data = await response.json();

                if (data.success) {
                    showAlert('Success', 'Student removed successfully!', 'success');
                    // Manually refresh only the student list without full reload
                    await refreshStudentList();
                } else {
                    showAlert('Error', data.message, 'error');
                }
            } catch (error) {
                console.error('Error deleting student:', error);
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
    icon.className = 'fas modal-icon ' + iconMap[type];

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

// Export modal functions to window for passwordReset.js
window.updateStudent = updateStudent;
window.deleteStudent = deleteStudent;
window.openEditStudentModal = openEditStudentModal;
window.showAlert = showAlert;
window.showConfirm = showConfirm;
window.openModal = openModal;
window.closeModal = closeModal;

console.log('✅ Update student functions loaded');

// ============================================
// NAVIGATION
// ============================================
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            console.log('Navigation clicked - NO data loading will occur');

            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });

            const sectionId = this.getAttribute('data-section');
            document.getElementById(sectionId).classList.add('active');

            const title = this.querySelector('span').textContent;
            document.getElementById('page-title').textContent = title;

            // Save current section to sessionStorage
            sessionStorage.setItem('activeSection', sectionId);
            sessionStorage.setItem('activeTitle', title);

            console.log(`Switched to section: ${sectionId}`);

            return false; // Extra safety to prevent navigation
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
        console.log(`Restoring section: ${savedSection}`);

        // Remove all active classes
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));

        // Set active section
        const navItem = document.querySelector(`[data-section="${savedSection}"]`);
        if (navItem) {
            navItem.classList.add('active');
        }

        const contentSection = document.getElementById(savedSection);
        if (contentSection) {
            contentSection.classList.add('active');
        }

        // Update title
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

    // Load only admin appeals - filter for appeal-related data
    sampleAdmins.forEach(admin => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${admin.name}</td>
            <td>${admin.role}</td>
        `;
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
    // Add User Form
    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
        addUserForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Split the full name into first and last name
            const fullName = document.getElementById('addFullName').value.trim();
            const nameParts = fullName.split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ') || firstName;

            // ✅ AUTO-GENERATE PASSWORD
            const autoPassword = generateRandomPassword();

            const formData = {
                first_name: firstName,
                last_name: lastName,
                student_number: document.getElementById('addStudentNumber').value,
                course: document.getElementById('addCourse').value,
                year: document.getElementById('addYear').value,
                email: document.getElementById('addEmail').value,
                password: autoPassword,  // ✅ Use auto-generated password
                auto_registered: true
            };

            console.log('🔑 Auto-generated password for new user:', autoPassword);

            const success = await addAllowedStudent(formData);
            if (success) {
                this.reset();
            }
        });
    }

    // Edit User Form
    const editUserForm = document.getElementById('editUserForm');
    if (editUserForm) {
        editUserForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const studentId = document.getElementById('editUserId').value;

            // Split the full name into first and last name
            const fullName = document.getElementById('editUserName').value.trim();
            const nameParts = fullName.split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ') || firstName;

            const formData = {
                first_name: firstName,
                last_name: lastName,
                email: document.getElementById('editUserEmail').value
            };

            await updateStudent(studentId, formData);
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
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }
}

// ============================================
// INITIALIZE CHARTS
// ============================================
function initializeCharts() {
    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
        console.error('Chart.js library not loaded yet');
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
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating chart:', error);
        }
    }
}

// Update Role Function
function updateRole(id) {
    const select = document.getElementById(`role-${id}`);
    if (select) {
        const newRole = select.value;
        showAlert('Success', `Role updated to: ${newRole}`, 'success');
    }
}

// Switch Tab Function
function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    event.target.classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

// Close modal when clicking outside
window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
}

// ============================================
// LOGOUT FUNCTION WITH CONFIRMATION
// ============================================
function logout() {
    showConfirm(
        'Logout',
        'Are you sure you want to logout? You will need to login again to access the system.',
        function () {
            // User confirmed logout
            performLogout();
        }
    );
}

function performLogout() {
    // Clear the data loaded flag so data will reload on next login
    clearDataLoadedFlag();

    // Clear cached data
    sessionStorage.removeItem('cachedStudents');

    // Clear active section
    sessionStorage.removeItem('activeSection');
    sessionStorage.removeItem('activeTitle');

    console.log('Logged out - data will reload on next login');
    // After showing alert, redirect to login page
    setTimeout(function () {
        window.location.href = '../user/studentlogin.html';
    }, 1500);
}

// ============================================
// GENERATE RANDOM PASSWORD
// ============================================
function generateRandomPassword() {
    const length = 12;
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*';

    let password = '';

    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Fill the rest randomly
    const allChars = uppercase + lowercase + numbers + special;
    for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

// ============================================
// ADD NEW STUDENT WITH AUTO-REGISTRATION
// ============================================
async function addAllowedStudent(formData) {
    try {
        const response = await fetch(`${API_URL}/admin/allowed-students`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            showAlert(
                'Success',
                'Student has been added and automatically registered!\n\n'
            );

            // Manually refresh only the student list without full reload
            await refreshStudentList();
            closeModal('addUserModal');
            return true;
        } else {
            showAlert('Error', data.message, 'error');
            return false;
        }
    } catch (error) {
        console.error('Error adding student:', error);
        showAlert('Error', 'Failed to add student', 'error');
        return false;
    }
}

// ============================================
// SHOW PASSWORD ALERT WITH COPY BUTTON
// ============================================
function showPasswordAlert(title, message, password) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'passwordAlertModal';

    modal.innerHTML = `
        <div class="modal-content alert-modal-content" style="max-width: 500px;">
            <i class="fas fa-check-circle modal-icon success"></i>
            <h2>${title}</h2>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: left;">
                <pre style="margin: 0; white-space: pre-wrap; font-family: monospace;">${message}</pre>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// ============================================
// CLOSE PASSWORD ALERT
// ============================================
function closePasswordAlert() {
    const modal = document.getElementById('passwordAlertModal');
    if (modal) {
        modal.remove();
    }
}
