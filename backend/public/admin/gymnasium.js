window.API_URL = window.API_URL || 'http://127.0.0.1:8000';

const customModal = document.getElementById('customModal');
const promptModal = document.getElementById('promptModal');
const promptInput = document.getElementById('promptInput');
const promptOkBtn = document.getElementById('promptOkBtn');
const promptCancelBtn = document.getElementById('promptCancelBtn');
const tableBody = document.getElementById('tableBody');

let gymnasiumClearances = [];
let currentActionType = null;
let currentStudentRow = null;

// ============================================
// LOAD GYMNASIUM CLEARANCE SUBMISSIONS
// ============================================
async function loadGymnasiumClearances() {
    console.log('🔍 Loading gymnasium clearance submissions...');

    try {
        const response = await fetch(`${window.API_URL}/api/gymnasium/clearances`);
        const data = await response.json();

        if (data.success) {
            gymnasiumClearances = data.clearances || [];
            console.log('✅ Loaded clearances:', gymnasiumClearances.length);
            loadTableData();
            updateStats();
        } else {
            console.error('❌ Failed to load clearances');
            gymnasiumClearances = [];
            loadTableData();
        }
    } catch (error) {
        console.error('❌ Error loading clearances:', error);
        gymnasiumClearances = [];
        loadTableData();
    }
}

// ============================================
// UPDATE STATISTICS
// ============================================
function updateStats() {
    const pending = gymnasiumClearances.filter(c => c.status === 'pending').length;
    const approved = gymnasiumClearances.filter(c => c.status === 'approved').length;
    const rejected = gymnasiumClearances.filter(c => c.status === 'rejected').length;
    const total = gymnasiumClearances.length;

    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('approvedCount').textContent = approved;
    document.getElementById('rejectedCount').textContent = rejected;
    document.getElementById('totalCount').textContent = total;
}

// ============================================
// SHOW PROMPT MODAL
// ============================================
function showPrompt(actionType, buttonElement) {
    currentStudentRow = buttonElement.closest('tr');
    currentActionType = actionType;
    const studentId = currentStudentRow.children[0].textContent;
    const clearance = gymnasiumClearances.find(c => c.student_id === studentId);

    if (actionType === 'view') {
        // View details
        document.getElementById('promptTitle').textContent = "Clearance Details";

        const submittedDate = clearance.submitted_at
            ? new Date(clearance.submitted_at).toLocaleString()
            : 'N/A';

        // Clean up section display - remove only "N/A" text
        let sectionDisplay = clearance.section || '';
        sectionDisplay = sectionDisplay.replace(/N\/A/g, '').replace(/^-+|-+$/g, '').trim();
        if (sectionDisplay === '') {
            sectionDisplay = 'Not specified';
        }

        // Build equipment list HTML
        let equipmentHTML = '';
        if (clearance.borrowed_equipment && clearance.equipment_items && clearance.equipment_items.length > 0) {
            equipmentHTML = '<div style="margin-top: 15px;"><strong>Borrowed Equipment:</strong><ul style="margin-top: 8px; padding-left: 20px;">';
            clearance.equipment_items.forEach((item, index) => {
                const statusColor = item.status === 'returned_on_time' ? '#059669' :
                    item.status === 'returned_late' ? '#d97706' :
                        item.status === 'not_returned' ? '#dc2626' : '#6b7280';

                const statusText = item.status.replace(/_/g, ' ').replace(/\b\w/g, l => l);

                equipmentHTML += `
                    <li style="margin-bottom: 10px; padding: 10px; background: #f9fafb; border-radius: 6px; list-style: none;">
                        <strong>${item.name}</strong> (Qty: ${item.quantity})<br>
                        <span style="font-size: 0.9rem; color: #666;">
                            Borrowed: ${new Date(item.date_borrowed).toLocaleDateString()}<br>
                            Returned: ${new Date(item.date_returned).toLocaleDateString()}<br>
                            <span style="color: ${statusColor}; font-weight: 600;">Status: ${statusText}</span>
                        </span>
                    </li>
                `;
            });
            equipmentHTML += '</ul></div>';
        } else {
            equipmentHTML = '<p style="margin-top: 10px; color: #666;"><em>No equipment was borrowed</em></p>';
        }

        document.getElementById('promptMessage').innerHTML = `
            <div style="text-align: left;">
                <p><strong>Student ID:</strong> ${clearance.student_id}</p>
                <p><strong>Name:</strong> ${clearance.student_name}</p>
                <p><strong>Section:</strong> ${sectionDisplay}</p>
                <p><strong>Status:</strong> <span style="color: ${clearance.status === 'approved' ? '#059669' : clearance.status === 'rejected' ? '#dc2626' : '#d97706'}; font-weight: 600;">${clearance.status.toUpperCase()}</span></p>
                <p><strong>Submitted:</strong> ${submittedDate}</p>
                ${equipmentHTML}
                <p style="margin-top: 10px;"><strong>Student Notes:</strong> ${clearance.notes || 'N/A'}</p>
                <p><strong>Admin Remarks:</strong> ${clearance.remarks || 'N/A'}</p>
                ${clearance.proof_image ? `<p style="margin-top: 10px;"><a href="${clearance.proof_image}" target="_blank" style="color: #800020; text-decoration: underline;"><i class="fas fa-image"></i> View Proof Image</a></p>` : '<p style="color: #666;"><em>No proof image uploaded</em></p>'}
            </div>
        `;
        promptInput.style.display = 'none';
        promptOkBtn.textContent = 'Close';
        promptOkBtn.onclick = () => promptModal.style.display = 'none';
        promptCancelBtn.style.display = 'none';
        promptModal.style.display = 'flex';
        return;
    }

    // Approve/Reject
    const clearanceData = gymnasiumClearances.find(c => c.student_id === studentId);

    promptInput.style.display = 'block';
    promptInput.value = '';
    promptModal.style.display = 'flex';
    promptOkBtn.textContent = 'Submit';
    promptCancelBtn.style.display = 'inline-block';

    if (actionType === 'approve') {
        document.getElementById('promptTitle').textContent = 'Approve Clearance';
        document.getElementById('promptMessage').textContent = 'Enter approval remarks (optional):';
    } else {
        document.getElementById('promptTitle').textContent = 'Reject Clearance';

        // Auto-suggest rejection reason based on equipment status
        let suggestedReason = '';
        if (clearanceData.borrowed_equipment && clearanceData.equipment_items) {
            const lateReturns = clearanceData.equipment_items.filter(item => item.status === 'returned_late');
            const notReturned = clearanceData.equipment_items.filter(item => item.status === 'not_returned');
            const damaged = clearanceData.equipment_items.filter(item => item.status === 'returned_damaged');

            if (notReturned.length > 0) {
                suggestedReason = `Equipment not returned: ${notReturned.map(i => i.name).join(', ')}`;
            } else if (damaged.length > 0) {
                suggestedReason = `Equipment returned with damage: ${damaged.map(i => i.name).join(', ')}`;
            } else if (lateReturns.length > 0) {
                suggestedReason = `Equipment returned late: ${lateReturns.map(i => i.name).join(', ')}`;
            }
        }

        document.getElementById('promptMessage').innerHTML = `
            Enter reason for rejection:<br>
            ${suggestedReason ? `<small style="color: #666;">Suggested: ${suggestedReason}</small>` : ''}
        `;

        if (suggestedReason) {
            promptInput.value = suggestedReason;
        }
    }

    promptOkBtn.onclick = handlePromptSubmission;
    promptCancelBtn.onclick = () => promptModal.style.display = 'none';
}

// ============================================
// HANDLE APPROVAL/REJECTION
// ============================================
async function handlePromptSubmission() {
    const remarks = promptInput.value.trim();

    if (currentActionType === 'reject' && !remarks) {
        return alert("Please enter reason for rejection.");
    }

    const studentId = currentStudentRow.children[0].textContent;
    const clearance = gymnasiumClearances.find(c => c.student_id === studentId);

    const newStatus = currentActionType === 'approve' ? 'approved' : 'rejected';

    try {
        const response = await fetch(`${window.API_URL}/api/gymnasium/update-clearance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clearance_id: clearance.id,
                status: newStatus,
                remarks: remarks
            })
        });

        const data = await response.json();

        if (data.success) {
            clearance.status = newStatus;
            clearance.remarks = remarks;

            promptModal.style.display = 'none';
            loadTableData();
            updateStats();

            showCustomModal(
                'Action Complete',
                `Student ${studentId} clearance is now ${newStatus.toUpperCase()}.`,
                'success'
            );
        } else {
            alert('❌ Failed to update clearance: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error updating clearance:', error);
        alert('❌ Failed to update clearance. Please try again.');
    }
}

// ============================================
// SHOW CUSTOM MODAL
// ============================================
function showCustomModal(title, message, type) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;
    const iconDiv = document.getElementById('modalIcon');
    let iconColor = type === 'success' ? '#059669' : type === 'error' ? '#dc2626' : '#d97706';
    let iconClass = type === 'success' ? 'fas fa-check-circle' : type === 'error' ? 'fas fa-times-circle' : 'fas fa-info-circle';
    iconDiv.innerHTML = `<i class="${iconClass}" style="color:${iconColor}"></i>`;
    document.getElementById('modalCancelBtn').style.display = 'none';
    document.getElementById('modalOkBtn').textContent = 'Close';
    document.getElementById('modalOkBtn').onclick = () => customModal.style.display = 'none';
    customModal.style.display = 'flex';
}

// ============================================
// LOAD TABLE DATA
// ============================================
// ============================================
// LOAD TABLE DATA - UPDATED VERSION
// ============================================
function loadTableData() {
    let html = '';

    if (gymnasiumClearances.length === 0) {
        html = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-inbox" style="font-size: 3rem; color: #800020; display: block; margin-bottom: 15px;"></i>
                    <strong>No clearance submissions yet</strong>
                    <p style="margin-top: 10px;">Students will appear here when they submit gymnasium clearances.</p>
                </td>
            </tr>
        `;
        tableBody.innerHTML = html;
        return;
    }

    gymnasiumClearances.forEach(item => {
        // Status icon instead of text
        let statusIcon = '';
        if (item.status === 'pending') {
            statusIcon = '<i class="fas fa-clock" style="color: #f59e0b; font-size: 1.2rem;" title="Pending"></i>';
        } else if (item.status === 'approved') {
            statusIcon = '<i class="fas fa-check-circle" style="color: #10b981; font-size: 1.2rem;" title="Approved"></i>';
        } else if (item.status === 'rejected') {
            statusIcon = '<i class="fas fa-times-circle" style="color: #ef4444; font-size: 1.2rem;" title="Rejected"></i>';
        }
        const statusHtml = statusIcon;

        // Generate remarks based on equipment status
        let displayRemarks = item.remarks || '';

        if (!displayRemarks && item.borrowed_equipment && item.equipment_items) {
            const issues = [];
            item.equipment_items.forEach(eq => {
                if (eq.status === 'returned_late') {
                    issues.push(`${eq.name}: Returned late`);
                } else if (eq.status === 'not_returned') {
                    issues.push(`${eq.name}: Not returned`);
                } else if (eq.status === 'returned_damaged') {
                    issues.push(`${eq.name}: Returned damaged`);
                }
            });

            if (issues.length > 0) {
                displayRemarks = issues.join('; ');
            } else if (!item.borrowed_equipment) {
                displayRemarks = 'No equipment borrowed';
            } else {
                displayRemarks = 'All equipment returned on time';
            }
        } else if (!item.borrowed_equipment) {
            displayRemarks = displayRemarks || 'No equipment borrowed';
        }

        // ACTION BUTTONS - NO VIEW BUTTON FOR PENDING
        let actionHtml = '';
        if (item.status === 'pending') {
            actionHtml = `
                <div class="action-buttons">
                    <button class="btn btn-approve" onclick="showPrompt('approve',this)">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn btn-reject" onclick="showPrompt('reject',this)">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </div>
            `;
        } else {
            actionHtml = `
                <div class="action-buttons">
                    <button class="btn btn-view" onclick="showPrompt('view',this)">
                        <i class="fas fa-eye"></i> View
                    </button>
                </div>
            `;
        }

        // Clean up section display - remove only "N/A" text but keep valid sections
        let sectionDisplay = item.section || '';
        // Remove "N/A" text and clean up hyphens
        sectionDisplay = sectionDisplay.replace(/N\/A/g, '').replace(/^-+|-+$/g, '').trim();
        if (sectionDisplay === '') {
            sectionDisplay = '—';
        }

        html += `<tr>
            <td>${item.student_id}</td>
            <td>${item.student_name}</td>
            <td>${sectionDisplay}</td>
            <td>${statusHtml}</td>
            <td>${displayRemarks || 'N/A'}</td>
            <td>${actionHtml}</td>
        </tr>`;
    });

    tableBody.innerHTML = html;
    updateStats();
}

// ============================================
// SEARCH TABLE
// ============================================
function searchTable() {
    const input = document.getElementById('searchInput');
    const filter = input.value.toUpperCase();
    const table = document.getElementById('clearanceTable');
    const rows = table.getElementsByTagName('tr');

    for (let i = 1; i < rows.length; i++) {
        const studentNo = rows[i].getElementsByTagName('td')[0];
        const name = rows[i].getElementsByTagName('td')[1];

        if (studentNo && name) {
            const studentNoText = studentNo.textContent || studentNo.innerText;
            const nameText = name.textContent || name.innerText;

            if (studentNoText.toUpperCase().indexOf(filter) > -1 || nameText.toUpperCase().indexOf(filter) > -1) {
                rows[i].style.display = '';
            } else {
                rows[i].style.display = 'none';
            }
        }
    }
}

// ============================================
// FILTER TABLE BY STATUS AND SECTION
// ============================================
function filterTable() {
    const statusFilter = document.getElementById('statusFilter').value;
    const sectionFilter = document.getElementById('sectionsFilter').value;
    const table = document.getElementById('clearanceTable');
    const rows = table.getElementsByTagName('tr');

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const sectionCell = row.getElementsByTagName('td')[2];
        const statusBadge = row.querySelector('.status-badge');

        if (!sectionCell || !statusBadge) continue;

        const sectionText = sectionCell.textContent || sectionCell.innerText;
        const statusText = statusBadge.textContent.toLowerCase();

        let showRow = true;

        // Status filter
        if (statusFilter !== 'all' && statusText !== statusFilter) {
            showRow = false;
        }

        // Section filter
        if (sectionFilter !== 'sections' && sectionText !== sectionFilter) {
            showRow = false;
        }

        row.style.display = showRow ? '' : 'none';
    }
}

// ============================================
// PROFILE DROPDOWN
// ============================================
function toggleProfileDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    dropdown.classList.toggle('show');
}

// Close dropdown when clicking outside
window.onclick = function (event) {
    if (!event.target.matches('.user-avatar-large')) {
        const dropdowns = document.getElementsByClassName('profile-dropdown-content');
        for (let i = 0; i < dropdowns.length; i++) {
            const openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}

// ============================================
// LOGOUT
// ============================================
function logout() {
    window.location.href = '../user/studentlogin.html';
}

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🏋️ Gymnasium Dashboard Loading...');
    await loadGymnasiumClearances();
    console.log('✅ Gymnasium dashboard initialized');
});

window.showPrompt = showPrompt;