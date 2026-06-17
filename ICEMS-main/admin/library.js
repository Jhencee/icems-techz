// ==========================================================
// ADMIN LIBRARY CLEARANCE
// ==========================================================

if (typeof window.API_URL === 'undefined') {
    window.API_URL = 'https://icems-techz-production.up.railway.app/api';
    console.log('âš™ï¸ Using default API_URL:', window.API_URL);
}

let clearances = [];
let currentStudentId = null;

// ==========================================================
// FETCH REAL CLEARANCE DATA FROM API
// ==========================================================
async function fetchLibraryClearances() {
    try {
        const url = `${window.API_URL}/library/all-clearances`;
        console.log('ðŸ” Fetching from URL:', url);

        const response = await fetch(url);

        console.log('ðŸ“¡ Response status:', response.status);

        if (!response.ok) {
            const text = await response.text();
            console.error('âŒ Response body:', text);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('ðŸ“¦ Raw API Response:', data);

        if (data.success && data.clearances) {
            clearances = data.clearances.map(clearance => {
                return {
                    id: clearance.id,
                    studentId: clearance.student_id || 'N/A',
                    name: clearance.student_name || 'N/A',
                    course: clearance.section || clearance.course || 'N/A',
                    email: clearance.student_email || 'N/A',
                    borrowedBooks: clearance.borrowed_books,
                    bookItems: clearance.book_items || [],
                    proofImage: clearance.proof_image || null,
                    notes: clearance.notes || '',
                    description: clearance.borrowed_books
                        ? `Borrowed ${clearance.book_items ? clearance.book_items.length : 0} book(s)`
                        : 'No books borrowed',
                    status: clearance.status || 'pending',
                    remarks: clearance.remarks || '',
                    submittedAt: clearance.submitted_at || null,
                    processedAt: clearance.processed_at || null
                };
            });

            console.log('âœ… Loaded', clearances.length, 'library clearances');
            return clearances;
        } else {
            console.warn('âš ï¸ No clearances found');
            clearances = [];
            return [];
        }
    } catch (error) {
        console.error('âŒ Error fetching library clearances:', error);
        clearances = [];
        return [];
    }
}

// ==========================================================
// INITIALIZE DASHBOARD
// ==========================================================
async function initDashboard() {
    showLoadingState();
    await fetchLibraryClearances();
    updateStats();
    renderTable(clearances);
    document.getElementById('sectionsFilter').value = 'sections';
}

// ==========================================================
// SHOW LOADING STATE
// ==========================================================
function showLoadingState() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="7">
                <div class="empty-state">
                    <div class="empty-icon"><span class="icon-circle"><i class="fas fa-spinner fa-spin"></i></span></div>
                    <h3>Loading Clearances...</h3>
                    <p>Please wait while we fetch the data</p>
                </div>
            </td>
        </tr>
    `;
}

// ==========================================================
// UPDATE STATISTICS
// ==========================================================
function updateStats() {
    const pending  = clearances.filter(c => c.status === 'pending').length;
    const approved = clearances.filter(c => c.status === 'approved').length;
    const rejected = clearances.filter(c => c.status === 'rejected').length;

    document.getElementById('pendingCount').textContent  = pending;
    document.getElementById('approvedCount').textContent = approved;
    document.getElementById('rejectedCount').textContent = rejected;
    document.getElementById('totalCount').textContent    = clearances.length;
    document.getElementById('totalProcessed').textContent = clearances.length;
}

// ==========================================================
// STATUS ICON
// ==========================================================
function setStatusIcon(status) {
    let iconClass = '';
    const colorClass = `status-${status}`;
    const title = status.charAt(0).toUpperCase() + status.slice(1);

    if (status === 'pending')  iconClass = 'fa-solid fa-clock';
    else if (status === 'approved') iconClass = 'fa-solid fa-check-circle';
    else if (status === 'rejected') iconClass = 'fa-solid fa-times-circle';

    return `<span class="status-badge ${colorClass}" title="${title}"><i class="${iconClass}"></i></span>`;
}

// ==========================================================
// RENDER TABLE
// ==========================================================
function renderTable(data) {
    const tbody = document.getElementById('tableBody');

    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <div class="empty-icon"><span class="icon-circle"><i class="fas fa-book"></i></span></div>
                        <h3>No Clearances Yet</h3>
                        <p>Clearance submissions will appear here</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = data.map(clearance => {
        const studentId  = clearance.studentId || 'N/A';
        const name       = clearance.name || 'N/A';
        const description = clearance.description || 'No description';
        const remarks    = clearance.remarks || 'N/A';

        // Clean up section display
        let course = clearance.course || '';
        course = course.replace(/undefined/g, '').replace(/[-\s]+$/, '').trim();
        if (!course) course = 'N/A';

        return `
        <tr>
            <td>${studentId}</td>
            <td>${name}</td>
            <td>${course}</td>
            <td>${description}</td>
            <td>${setStatusIcon(clearance.status)}</td>
            <td>${remarks}</td>
            <td>
                <div class="action-buttons">
                    ${clearance.status === 'pending' ? `
                        <button class="btn btn-approve" onclick="approveClearance('${studentId}')">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn btn-reject" onclick="rejectClearance('${studentId}')">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    ` : `
                        <button class="btn btn-view" onclick="viewClearance('${studentId}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                    `}
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

// ==========================================================
// FILTER TABLE
// ==========================================================
function filterTable() {
    const statusFilter  = document.getElementById('statusFilter').value;
    const sectionFilter = document.getElementById('sectionsFilter').value;

    let filtered = clearances;

    if (statusFilter !== 'all') {
        filtered = filtered.filter(c => c.status === statusFilter);
    }

    if (sectionFilter !== 'all' && sectionFilter !== 'sections') {
        filtered = filtered.filter(c => c.course.includes(sectionFilter));
    }

    renderTable(filtered);
}

// ==========================================================
// APPROVE CLEARANCE
// ==========================================================
function approveClearance(studentId) {
    currentStudentId = studentId;
    const clearance = clearances.find(c => c.studentId === studentId);
    if (clearance) {
        document.getElementById('approveMessage').textContent =
            `Are you sure you want to approve clearance for ${clearance.name} (${studentId})?`;
        document.getElementById('approveModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeApproveModal() {
    document.getElementById('approveModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    currentStudentId = null;
}

async function confirmApprove() {
    const clearance = clearances.find(c => c.studentId === currentStudentId);
    if (!clearance) return;

    try {
        const response = await fetch(`${window.API_URL}/library/update-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_id: currentStudentId,
                status: 'approved',
                remarks: 'All books returned. Cleared on ' + new Date().toLocaleDateString('en-US')
            })
        });

        const data = await response.json();

        if (data.success) {
            clearance.status  = 'approved';
            clearance.remarks = 'All books returned. Cleared on ' + new Date().toLocaleDateString('en-US');
            updateStats();
            filterTable();
            closeApproveModal();
            showSuccessMessage('Clearance approved successfully!');
        } else {
            alert('âŒ Failed to approve clearance: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error approving clearance:', error);
        alert('âŒ Failed to approve clearance. Please try again.');
    }
}

// ==========================================================
// REJECT CLEARANCE
// ==========================================================
function rejectClearance(studentId) {
    currentStudentId = studentId;
    const clearance = clearances.find(c => c.studentId === studentId);
    if (clearance) {
        document.getElementById('rejectMessage').textContent =
            `Rejecting clearance for ${clearance.name} (${studentId}). Please provide a reason:`;
        document.getElementById('rejectReason').value = '';
        document.getElementById('rejectModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeRejectModal() {
    document.getElementById('rejectModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    currentStudentId = null;
}

async function confirmReject() {
    const reason = document.getElementById('rejectReason').value.trim();
    if (!reason) {
        alert('Rejection reason cannot be empty.');
        return;
    }

    const clearance = clearances.find(c => c.studentId === currentStudentId);
    if (!clearance) return;

    try {
        const response = await fetch(`${window.API_URL}/library/update-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_id: currentStudentId,
                status: 'rejected',
                remarks: reason
            })
        });

        const data = await response.json();

        if (data.success) {
            clearance.status  = 'rejected';
            clearance.remarks = reason;
            updateStats();
            filterTable();
            closeRejectModal();
            showSuccessMessage('Clearance rejected successfully.');
        } else {
            alert('âŒ Failed to reject clearance: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error rejecting clearance:', error);
        alert('âŒ Failed to reject clearance. Please try again.');
    }
}

// ==========================================================
// VIEW CLEARANCE DETAILS
// ==========================================================
function viewClearance(studentId) {
    const clearance = clearances.find(c => c.studentId === studentId);
    if (!clearance) return;

    const statusIcon = setStatusIcon(clearance.status);

    let courseDisplay = clearance.course || 'N/A';
    if (typeof courseDisplay === 'string') {
        courseDisplay = courseDisplay.replace(/undefined/g, '').replace(/[-\s]+$/, '').trim();
        if (!courseDisplay) courseDisplay = 'N/A';
    }

    let bookItemsHtml = '';
    if (clearance.borrowedBooks && clearance.bookItems && clearance.bookItems.length > 0) {
        bookItemsHtml = `
            <div class="detail-row">
                <strong>Book Items:</strong>
                <div style="margin-top: 10px;">
                    ${clearance.bookItems.map((book, index) => `
                        <div style="background: #f3f4f6; padding: 10px; border-radius: 6px; margin-bottom: 8px;">
                            <strong>Book ${index + 1}:</strong><br>
                            <span style="font-size: 0.9rem;">
                                Title: ${book.title || 'N/A'}<br>
                                Author: ${book.author || 'N/A'}<br>
                                ISBN: ${book.isbn || 'N/A'}<br>
                                Borrowed: ${book.date_borrowed || 'N/A'}<br>
                                Returned: ${book.date_returned || 'N/A'}<br>
                                Status: ${book.status || 'N/A'}
                            </span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    let proofImageHtml = '';
    if (clearance.proofImage) {
        proofImageHtml = `
            <div class="detail-row">
                <strong>Proof Image:</strong>
                <div style="margin-top: 10px;">
                    <img src="${clearance.proofImage}" alt="Proof"
                         style="max-width: 100%; border-radius: 8px; border: 2px solid #e5e7eb;">
                </div>
            </div>
        `;
    }

    document.getElementById('viewContent').innerHTML = `
        <div class="detail-row"><strong>Student ID:</strong><span>${clearance.studentId}</span></div>
        <div class="detail-row"><strong>Name:</strong><span>${clearance.name}</span></div>
        <div class="detail-row"><strong>Email:</strong><span>${clearance.email}</span></div>
        <div class="detail-row"><strong>Course/Section:</strong><span>${courseDisplay}</span></div>
        <div class="detail-row"><strong>Borrowed Books:</strong><span>${clearance.borrowedBooks ? 'Yes' : 'No'}</span></div>
        ${bookItemsHtml}
        ${proofImageHtml}
        <div class="detail-row"><strong>Additional Notes:</strong><span>${clearance.notes || 'N/A'}</span></div>
        <div class="detail-row"><strong>Status:</strong><span>${statusIcon}</span></div>
        <div class="detail-row"><strong>Remarks:</strong><span>${clearance.remarks || 'N/A'}</span></div>
        <div class="detail-row">
            <strong>Submitted At:</strong>
            <span>${clearance.submittedAt ? new Date(clearance.submittedAt).toLocaleString() : 'N/A'}</span>
        </div>
    `;

    document.getElementById('viewModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeViewModal() {
    document.getElementById('viewModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// ==========================================================
// SUCCESS MESSAGE
// ==========================================================
function showSuccessMessage(message) {
    document.getElementById('successMessage').textContent = message;
    document.getElementById('successModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// ==========================================================
// PROFILE DROPDOWN
// ==========================================================
function toggleProfileDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    dropdown.classList.toggle('show');
}

// Close dropdown when clicking outside
window.addEventListener('click', function(event) {
    if (!event.target.closest('.profile-dropdown-container')) {
        const dropdown = document.getElementById('profileDropdown');
        if (dropdown && dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
        }
    }
});

// ==========================================================
// LOGOUT
// ==========================================================
function logout() {
    document.getElementById('logoutModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeLogoutModal() {
    document.getElementById('logoutModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function confirmLogout() {
    document.body.style.overflow = 'auto';
    setTimeout(() => {
        window.location.href = '../user/studentlogin.html';
    }, 1500);
}

// ==========================================================
// CLOSE MODALS ON OUTSIDE CLICK
// ==========================================================
window.onclick = function(event) {
    const approveModal = document.getElementById('approveModal');
    if (event.target === approveModal) closeApproveModal();

    const rejectModal = document.getElementById('rejectModal');
    if (event.target === rejectModal) closeRejectModal();

    const viewModal = document.getElementById('viewModal');
    if (event.target === viewModal) closeViewModal();

    const successModal = document.getElementById('successModal');
    if (event.target === successModal) closeSuccessModal();

    const logoutModal = document.getElementById('logoutModal');
    if (event.target === logoutModal) closeLogoutModal();
};

// ==========================================================
// INITIALIZE ON PAGE LOAD
// ==========================================================
window.addEventListener('DOMContentLoaded', initDashboard);