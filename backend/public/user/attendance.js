// ============================================
// ATTENDANCE.JS - WITH PROPER USER DATA LOADING
// ============================================

const API_BASE_URL = 'http://127.0.0.1:8000/api';
let currentUser = null;
let attendanceRecords = [];
let filteredRecords = [];

// ============================================
// LOAD USER DATA FROM LOCALSTORAGE
// ============================================
function loadUserData() {
    const storedUser = localStorage.getItem('currentUser');

    if (!storedUser) {
        console.error('❌ No user logged in');
        window.location.href = '../user/studentlogin.html';
        return null;
    }

    currentUser = JSON.parse(storedUser);
    console.log('👤 User data loaded from localStorage:', currentUser);

    updateUserProfile(currentUser);
    return currentUser;
}

// ============================================
// UPDATE USER PROFILE IN SIDEBAR
// ============================================
function updateUserProfile(user) {
    console.log('🔄 Updating profile with user data:', user);

    // Build full name from first_name and last_name
    const fullName = `${user.first_name} ${user.last_name}`;
    const initials = `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    const courseYear = `${user.course || 'N/A'} ${user.year || ''}`.trim();
    const studentNumber = user.student_number || 'N/A';

    // Update sidebar avatar
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    if (sidebarAvatar) {
        sidebarAvatar.textContent = initials;
        
        // Load saved avatar if exists
        const savedAvatar = localStorage.getItem(`avatar_${user.id}`);
        if (savedAvatar) {
            sidebarAvatar.style.backgroundImage = `url(${savedAvatar})`;
            sidebarAvatar.style.backgroundSize = 'cover';
            sidebarAvatar.style.backgroundPosition = 'center';
            sidebarAvatar.style.color = 'transparent';
        }
        
        console.log('✅ Updated sidebar avatar:', initials);
    }

    // Update sidebar name
    const sidebarName = document.getElementById('sidebarName');
    if (sidebarName) {
        sidebarName.textContent = fullName;
        console.log('✅ Updated sidebar name:', fullName);
    }

    // Update sidebar ID
    const sidebarId = document.getElementById('sidebarId');
    if (sidebarId) {
        sidebarId.textContent = `${courseYear} | ${studentNumber}`;
        console.log('✅ Updated sidebar ID:', `${courseYear} | ${studentNumber}`);
    }

    // Update profile modal fields
    const editName = document.getElementById('editName');
    if (editName) {
        editName.value = fullName;
        console.log('✅ Updated profile modal name');
    }

    const editCourse = document.getElementById('editCourse');
    if (editCourse) {
        editCourse.value = courseYear;
        console.log('✅ Updated profile modal course');
    }

    const editStudentId = document.getElementById('editStudentId');
    if (editStudentId) {
        editStudentId.value = studentNumber;
        console.log('✅ Updated profile modal student ID');
    }

    const editEmail = document.getElementById('editEmail');
    if (editEmail) {
        editEmail.value = user.email;
        console.log('✅ Updated profile modal email');
    }

    console.log('✅ User profile fully updated');
}

// ============================================
// LOAD ATTENDANCE RECORDS FROM DATABASE
// ============================================
async function loadAttendanceRecords() {
    if (!currentUser) {
        console.error('❌ No user data available');
        return;
    }

    console.log('🔍 Loading attendance records for:', currentUser.email);

    try {
        const response = await fetch(`${API_BASE_URL}/clearance/student/${currentUser.email}`);
        const data = await response.json();

        console.log('📥 Attendance API response:', data);

        if (data.success && data.submissions) {
            attendanceRecords = data.submissions;
            filteredRecords = attendanceRecords;
            console.log('✅ Loaded', attendanceRecords.length, 'attendance records');
            
            updateAttendanceStatistics();
            displayAttendanceTable();
        } else {
            console.warn('⚠️ No attendance records found');
            attendanceRecords = [];
            filteredRecords = [];
            updateAttendanceStatistics();
            displayAttendanceTable();
        }
    } catch (error) {
        console.error('❌ Error loading attendance:', error);
        showError('Cannot connect to server. Please check if Laravel is running at ' + API_BASE_URL);
    }
}

// ============================================
// UPDATE ATTENDANCE STATISTICS
// ============================================
function updateAttendanceStatistics() {
    const presentCount = attendanceRecords.filter(r => r.status === 'approved').length;
    const pendingCount = attendanceRecords.filter(r => r.status === 'pending').length;
    const rejectedCount = attendanceRecords.filter(r => r.status === 'rejected').length;
    
    const totalEvents = attendanceRecords.length;
    const attendanceRate = totalEvents > 0 ? Math.round((presentCount / totalEvents) * 100) : 0;

    // Update stat cards with animation
    const presentEl = document.getElementById('presentCount');
    const absentEl = document.getElementById('absentCount');
    const pendingEl = document.getElementById('pendingCount');
    const rateEl = document.getElementById('attendanceRate');

    if (presentEl) presentEl.textContent = presentCount;
    if (absentEl) absentEl.textContent = rejectedCount;
    if (pendingEl) pendingEl.textContent = pendingCount;
    if (rateEl) rateEl.textContent = `${attendanceRate}%`;

    console.log('📊 Statistics updated:', { 
        present: presentCount, 
        absent: rejectedCount, 
        pending: pendingCount, 
        rate: attendanceRate 
    });
}

// ============================================
// DISPLAY ATTENDANCE TABLE
// ============================================
function displayAttendanceTable() {
    const container = document.getElementById('attendanceTableContent');
    const totalText = document.getElementById('totalRecordsText');

    if (!container) return;

    if (filteredRecords.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #9ca3af;">
                <i class="fas fa-calendar-times" style="font-size: 64px; margin-bottom: 20px; opacity: 0.5;"></i>
                <h3 style="color: #6b7280; margin: 0 0 10px 0;">No Attendance Records Found</h3>
                <p style="color: #9ca3af; margin: 0;">
                    ${attendanceRecords.length === 0 
                        ? 'You haven\'t submitted any attendance proof yet. Attend events and submit proof to see them here.'
                        : 'No records match your search or filter criteria. Try adjusting your filters.'}
                </p>
            </div>
        `;
        if (totalText) {
            totalText.textContent = attendanceRecords.length === 0 
                ? 'No records yet' 
                : `Showing 0 of ${attendanceRecords.length} records`;
        }
        return;
    }

    // Sort by submission date (newest first)
    const sortedRecords = [...filteredRecords].sort((a, b) => 
        new Date(b.submitted_at) - new Date(a.submitted_at)
    );

    const tableHTML = `
        <table class="attendance-table">
            <thead>
                <tr>
                    <th>Event Title</th>
                    <th>Event Date</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${sortedRecords.map(record => {
                    const submittedDate = new Date(record.submitted_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });

                    const eventDate = new Date(record.event_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    });

                    const statusMap = {
                        'approved': { text: 'Present', class: 'status-approved', icon: 'fa-check-circle' },
                        'pending': { text: 'Pending', class: 'status-pending', icon: 'fa-hourglass-half' },
                        'rejected': { text: 'Absent', class: 'status-rejected', icon: 'fa-times-circle' }
                    };

                    const status = statusMap[record.status] || statusMap['pending'];

                    return `
                        <tr>
                            <td>
                                <div class="event-title">${record.event_title}</div>
                                ${record.admin_notes ? `<div class="event-date">Note: ${record.admin_notes}</div>` : ''}
                            </td>
                            <td>${eventDate}</td>
                            <td>${submittedDate}</td>
                            <td>
                                <span class="status-badge ${status.class}">
                                    <i class="fas ${status.icon}"></i> ${status.text}
                                </span>
                            </td>
                            <td>
                                <button class="action-btn" onclick="viewProof(${record.id})">
                                    <i class="fas fa-image"></i> View Proof
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = tableHTML;
    if (totalText) {
        totalText.textContent = `Showing ${sortedRecords.length} of ${attendanceRecords.length} records`;
    }
}

// ============================================
// SEARCH ATTENDANCE
// ============================================
function searchAttendance() {
    const searchBox = document.getElementById('searchBox');
    const statusFilter = document.getElementById('statusFilter');
    
    if (!searchBox || !statusFilter) return;

    const searchTerm = searchBox.value.toLowerCase();
    const statusValue = statusFilter.value;

    filteredRecords = attendanceRecords.filter(record => {
        const matchesSearch = record.event_title.toLowerCase().includes(searchTerm) ||
                            record.event_date.includes(searchTerm);
        
        const matchesStatus = statusValue === 'all' || record.status === statusValue;

        return matchesSearch && matchesStatus;
    });

    displayAttendanceTable();
    console.log('🔍 Filtered records:', filteredRecords.length);
}

// ============================================
// FILTER BY STATUS
// ============================================
function filterByStatus() {
    searchAttendance(); // Reuse search function with filter
}

// ============================================
// VIEW PROOF MODAL
// ============================================
function viewProof(recordId) {
    const record = attendanceRecords.find(r => r.id === recordId);
    if (!record) {
        console.error('❌ Record not found:', recordId);
        return;
    }

    const eventDate = new Date(record.event_date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    const statusMap = {
        'approved': { text: 'Present', color: '#059669' },
        'pending': { text: 'Pending', color: '#f59e0b' },
        'rejected': { text: 'Absent', color: '#dc2626' }
    };

    const status = statusMap[record.status] || statusMap['pending'];

    const modalHTML = `
        <div class="modal active" id="proofModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; justify-content: center; align-items: center; padding: 20px;">
            <div style="background: white; border-radius: 16px; padding: 30px; max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto; position: relative;">
                <span onclick="closeProofModal()" style="position: absolute; top: 15px; right: 20px; font-size: 2.5rem; cursor: pointer; color: #9ca3af; transition: color 0.2s;">&times;</span>
                
                <h2 style="color: #800020; margin: 0 0 25px 0; font-size: 1.5rem;">
                    <i class="fas fa-image"></i> Attendance Proof
                </h2>
                
                <div style="background: #f9fafb; padding: 20px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid ${status.color};">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; font-size: 0.95rem;">
                        <div>
                            <strong style="color: #6b7280;">Event:</strong>
                            <div style="color: #1f2937; margin-top: 5px;">${record.event_title}</div>
                        </div>
                        <div>
                            <strong style="color: #6b7280;">Date:</strong>
                            <div style="color: #1f2937; margin-top: 5px;">${eventDate}</div>
                        </div>
                        <div>
                            <strong style="color: #6b7280;">Student:</strong>
                            <div style="color: #1f2937; margin-top: 5px;">${currentUser.first_name} ${currentUser.last_name}</div>
                        </div>
                        <div>
                            <strong style="color: #6b7280;">Status:</strong>
                            <div style="color: ${status.color}; margin-top: 5px; font-weight: 600;">${status.text}</div>
                        </div>
                    </div>
                    ${record.admin_notes ? `
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                            <strong style="color: #6b7280;">Admin Note:</strong>
                            <div style="color: #1f2937; margin-top: 5px;">${record.admin_notes}</div>
                        </div>
                    ` : ''}
                </div>
                
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="${record.proof_image}" alt="Attendance Proof" style="max-width: 100%; max-height: 500px; border-radius: 12px; border: 2px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                </div>
                
                <div style="text-align: center; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                    <button onclick="window.open('${record.proof_image}', '_blank')" style="background: #800020; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 1rem; display: inline-flex; align-items: center; gap: 8px;">
                        <i class="fas fa-external-link-alt"></i> Open in New Tab
                    </button>
                    <button onclick="closeProofModal()" style="background: #6b7280; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 1rem;">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeProofModal() {
    const modal = document.getElementById('proofModal');
    if (modal) modal.remove();
}

// ============================================
// SHOW ERROR
// ============================================
function showError(message) {
    const container = document.getElementById('attendanceTableContent');
    if (!container) return;

    container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
            <i class="fas fa-exclamation-triangle" style="font-size: 64px; color: #ef4444; margin-bottom: 20px;"></i>
            <h3 style="color: #1f2937; margin: 0 0 10px 0;">Cannot Load Attendance</h3>
            <p style="color: #6b7280; margin: 0 0 20px 0;">${message}</p>
            <button onclick="loadAttendanceRecords()" style="padding: 12px 24px; background: #800020; color: white; border: none; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; font-size: 1rem;">
                <i class="fas fa-sync"></i> Retry
            </button>
        </div>
    `;
}

// ============================================
// PROFILE MODAL
// ============================================
function openProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
}

function saveProfile() {
    const name = document.getElementById('editName').value;
    const course = document.getElementById('editCourse').value;

    // Update sidebar
    document.getElementById('sidebarName').textContent = name;
    document.getElementById('sidebarId').textContent = `${course} | ${currentUser.student_number}`;
    
    const nameParts = name.split(' ');
    const initials = nameParts.length >= 2 
        ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
        : name.substring(0, 2).toUpperCase();
    document.getElementById('sidebarAvatar').textContent = initials;

    alert('Profile updated successfully!');
    closeProfileModal();
}

// ============================================
// SIDEBAR TOGGLE
// ============================================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}

// ============================================
// LOGOUT
// ============================================
function logout() {
    const modal = document.getElementById("logoutModal");
    if (modal) {
        modal.style.display = "flex";
        document.body.style.overflow = "hidden";
    }
}

function closeLogoutModal() {
    const modal = document.getElementById("logoutModal");
    if (modal) {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
    }
}

function confirmLogout() {
    localStorage.removeItem('currentUser');
    document.body.style.overflow = "auto";
    window.location.href = "../user/studentlogin.html";
}

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 [Attendance] Initializing Attendance Page...');
    
    // Load user data first
    const user = loadUserData();
    
    if (user) {
        // Then load attendance records
        await loadAttendanceRecords();
        console.log('✅ [Attendance] Page initialized successfully');
    } else {
        console.error('❌ [Attendance] Failed to initialize - no user data');
    }
});