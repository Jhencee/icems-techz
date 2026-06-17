// ==========================================================
// MODAL SYSTEM
// ==========================================================
function showModal(title, message, type = 'info', callback = null) {
    const modal = document.getElementById('customModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalIcon = document.getElementById('modalIcon');
    const modalOkBtn = document.getElementById('modalOkBtn');
    const modalCancelBtn = document.getElementById('modalCancelBtn');

    modalTitle.textContent = title;
    modalMessage.textContent = message;

    // Set icon and color based on type
    let iconHTML = '';
    let iconColor = '';
    
    if (type === 'success') {
        iconHTML = '<i class="fas fa-check-circle"></i>';
        iconColor = '#025238';
    } else if (type === 'error' || type === 'danger') {
        iconHTML = '<i class="fas fa-times-circle"></i>';
        iconColor = '#8A0303';
    } else if (type === 'warning') {
        iconHTML = '<i class="fas fa-exclamation-triangle"></i>';
        iconColor = '#A95A01';
    } else if (type === 'confirm') {
        iconHTML = '<i class="fas fa-question-circle"></i>';
        iconColor = '#800020';
    } else {
        iconHTML = '<i class="fas fa-info-circle"></i>';
        iconColor = '#666';
    }
    
    modalIcon.innerHTML = iconHTML;
    modalIcon.style.color = iconColor;

    // Show/hide cancel button for confirm dialogs
    if (type === 'confirm') {
        modalCancelBtn.style.display = 'inline-block';
        modalOkBtn.textContent = 'Confirm';
    } else {
        modalCancelBtn.style.display = 'none';
        modalOkBtn.textContent = 'OK';
    }

    modal.style.display = 'flex';

    // Handle OK button
    modalOkBtn.onclick = function() {
        modal.style.display = 'none';
        if (callback) callback(true);
    };

    // Handle Cancel button
    modalCancelBtn.onclick = function() {
        modal.style.display = 'none';
        if (callback) callback(false);
    };

    // Close on clicking outside
    modal.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
            if (callback) callback(false);
        }
    };
}

function showPromptModal(title, message, defaultValue = '', callback = null) {
    const modal = document.getElementById('promptModal');
    const promptTitle = document.getElementById('promptTitle');
    const promptMessage = document.getElementById('promptMessage');
    const promptInput = document.getElementById('promptInput');
    const promptOkBtn = document.getElementById('promptOkBtn');
    const promptCancelBtn = document.getElementById('promptCancelBtn');

    promptTitle.textContent = title;
    promptMessage.textContent = message;
    promptInput.value = defaultValue;

    modal.style.display = 'flex';
    promptInput.focus();

    // Handle OK button
    promptOkBtn.onclick = function() {
        const value = promptInput.value.trim();
        modal.style.display = 'none';
        if (callback) callback(value);
    };

    // Handle Cancel button
    promptCancelBtn.onclick = function() {
        modal.style.display = 'none';
        if (callback) callback(null);
    };

    // Handle Enter key
    promptInput.onkeypress = function(event) {
        if (event.key === 'Enter') {
            const value = promptInput.value.trim();
            modal.style.display = 'none';
            if (callback) callback(value);
        }
    };

    // Close on clicking outside
    modal.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
            if (callback) callback(null);
        }
    };
}

// ==========================================================
// CLEARANCE DATA ARRAY - WILL BE POPULATED FROM API
// ==========================================================
let clearances = [];

// ==========================================================
// FETCH CLEARANCES FROM API
// ==========================================================
async function fetchClearances() {
    try {
        // Check if API_URL is defined
        if (!window.API_URL) {
            console.error('❌ API_URL is not defined!');
            showModal('Configuration Error', 'API URL is not configured. Please contact administrator.', 'error');
            clearances = [];
            initDashboard();
            return;
        }

        console.log('🔄 Fetching laboratory clearances from API...');
        console.log('📍 API URL:', window.API_URL);
        
        // CHANGED: Use /clearances instead of /all-clearances to match routes
        const apiEndpoint = `${window.API_URL}/api/laboratory/clearances`;
        console.log('🌐 Full endpoint:', apiEndpoint);
        
        const response = await fetch(apiEndpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        console.log('📡 Response status:', response.status);

        // Check if response is OK
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.error('❌ Response is not JSON:', contentType);
            throw new Error('Invalid response format from server');
        }

        const data = await response.json();
        console.log('📦 Received data:', data);

        if (data.success && data.clearances) {
            console.log(`✅ Fetched ${data.clearances.length} clearances`);
            
            // Transform API data to match expected format
            clearances = data.clearances.map(c => ({
                studentId: c.student_id,
                name: c.student_name,
                course: c.section || 'N/A',
                description: c.clearance_type === 'direct_visit' 
                    ? 'Direct laboratory visit requested' 
                    : (c.borrowed_equipment 
                        ? `Borrowed ${c.equipment_items?.length || 0} equipment item(s)` 
                        : 'No equipment borrowed'),
                status: c.status,
                remarks: c.remarks || '',
                clearanceType: c.clearance_type,
                borrowedEquipment: c.borrowed_equipment,
                equipmentItems: c.equipment_items || [],
                proofImage: c.proof_image,
                notes: c.notes,
                email: c.student_email,
                submittedAt: c.submitted_at
            }));

            initDashboard();
        } else {
            console.log('⚠️ No clearances found or API error');
            clearances = [];
            initDashboard();
        }
    } catch (error) {
        console.error('❌ Error fetching clearances:', error);
        console.error('Error details:', error.message);
        
        // More specific error message
        let errorMsg = 'Failed to load clearances. ';
        if (error.message.includes('Failed to fetch')) {
            errorMsg += 'Cannot connect to server. Make sure Laravel is running on ' + window.API_URL;
        } else if (error.message.includes('status: 404')) {
            errorMsg += 'API endpoint not found. Check your routes configuration.';
        } else {
            errorMsg += error.message;
        }
        
        showModal('Error', errorMsg, 'error');
        clearances = [];
        initDashboard();
    }
}

// ==========================================================
// INITIALIZE DASHBOARD
// ==========================================================
function initDashboard() {
    updateStats();
    renderTable(clearances);
    document.getElementById('sectionsFilter').value = 'sections';
}

// ==========================================================
// UPDATE STATISTICS
// ==========================================================
function updateStats() {
    const pending = clearances.filter(c => c.status === 'pending').length;
    const approved = clearances.filter(c => c.status === 'approved').length;
    const rejected = clearances.filter(c => c.status === 'rejected').length;

    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('approvedCount').textContent = approved;
    document.getElementById('rejectedCount').textContent = rejected;
    document.getElementById('totalCount').textContent = clearances.length;
    document.getElementById('totalProcessed').textContent = clearances.length;
}

// ==========================================================
// RETURNS THE HTML FOR THE STATUS ICON
// ==========================================================
function setStatusIcon(status) {
    let iconClass = '';
    let colorClass = `status-${status}`;
    let title = status.charAt(0).toUpperCase() + status.slice(1);

    if (status === 'pending') {
        iconClass = 'fa-solid fa-clock';
    } else if (status === 'approved') {
        iconClass = 'fa-solid fa-check-circle';
    } else if (status === 'rejected') {
        iconClass = 'fa-solid fa-times-circle';
    }

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
                        <div class="empty-icon"><span class="icon-circle"><i class="fas fa-flask"></i></span></div>
                        <h3>No Clearances Yet</h3>
                        <p>Clearance submissions will appear here</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = data.map(clearance => `
        <tr>
            <td>${clearance.studentId}</td>
            <td>${clearance.name}</td>
            <td>${clearance.course}</td>
            <td>${clearance.description}</td>
            <td>${setStatusIcon(clearance.status)}</td>
            <td>${clearance.remarks}</td>
            <td>
                <div class="action-buttons">
                    ${clearance.status === 'pending' ? `
                        <button class="btn btn-approve" onclick="approveClearance('${clearance.studentId}')">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn btn-reject" onclick="rejectClearance('${clearance.studentId}')">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    ` : `
                        <button class="btn btn-view" onclick="viewClearance('${clearance.studentId}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                    `}
                </div>
            </td>
        </tr>
    `).join('');
}

// ==========================================================
// FILTER TABLE
// ==========================================================
function filterTable() {
    const statusFilter = document.getElementById('statusFilter').value;
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
    showModal(
        'Confirm Approval',
        `Are you sure you want to approve clearance for student ${studentId}?`,
        'confirm',
        async function(confirmed) {
            if (confirmed) {
                try {
                    const response = await fetch(`${window.API_URL}/api/laboratory/update-status`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({
                            student_id: studentId,
                            status: 'approved',
                            remarks: 'Cleared. All lab responsibilities finalized on ' + new Date().toLocaleDateString('en-US')
                        })
                    });

                    const data = await response.json();

                    if (data.success) {
                        showModal('Success', 'Clearance approved successfully!', 'success');
                        await fetchClearances(); // Refresh data
                    } else {
                        showModal('Error', data.message || 'Failed to approve clearance', 'error');
                    }
                } catch (error) {
                    console.error('Error approving clearance:', error);
                    showModal('Error', 'Failed to approve clearance. Please try again.', 'error');
                }
            }
        }
    );
}

// ==========================================================
// REJECT CLEARANCE
// ==========================================================
function rejectClearance(studentId) {
    showPromptModal(
        'Reject Clearance',
        'Enter rejection reason (e.g., Missing equipment: "Safety Goggles"):',
        '',
        async function(reason) {
            if (reason) {
                try {
                    const response = await fetch(`${window.API_URL}/api/laboratory/update-status`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({
                            student_id: studentId,
                            status: 'rejected',
                            remarks: reason
                        })
                    });

                    const data = await response.json();

                    if (data.success) {
                        showModal('Clearance Rejected', 'The clearance has been rejected.', 'error');
                        await fetchClearances(); // Refresh data
                    } else {
                        showModal('Error', data.message || 'Failed to reject clearance', 'error');
                    }
                } catch (error) {
                    console.error('Error rejecting clearance:', error);
                    showModal('Error', 'Failed to reject clearance. Please try again.', 'error');
                }
            }
        }
    );
}

// ==========================================================
// VIEW CLEARANCE DETAILS
// ==========================================================
function viewClearance(studentId) {
    const clearance = clearances.find(c => c.studentId === studentId);
    if (!clearance) return;

    let detailsHTML = `
        <div style="text-align: left; max-height: 70vh; overflow-y: auto;">
            <h3 style="color: #800020; margin-bottom: 15px; border-bottom: 2px solid #800020; padding-bottom: 10px;">
                <i class="fas fa-flask"></i> Laboratory Clearance Details
            </h3>
            
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <h4 style="color: #666; margin-bottom: 10px;"><i class="fas fa-user"></i> Student Information</h4>
                <p><strong>Student ID:</strong> ${clearance.studentId}</p>
                <p><strong>Name:</strong> ${clearance.name}</p>
                <p><strong>Email:</strong> ${clearance.email}</p>
                <p><strong>Section:</strong> ${clearance.course}</p>
                <p><strong>Submitted:</strong> ${new Date(clearance.submittedAt).toLocaleString()}</p>
            </div>

            <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <h4 style="color: #666; margin-bottom: 10px;"><i class="fas fa-info-circle"></i> Clearance Information</h4>
                <p><strong>Clearance Type:</strong> ${clearance.clearanceType === 'direct_visit' ? '🏢 Direct Laboratory Visit' : '📤 Online Submission'}</p>
                <p><strong>Status:</strong> <span style="color: ${clearance.status === 'approved' ? '#10b981' : clearance.status === 'rejected' ? '#ef4444' : '#f59e0b'}; font-weight: 600;">${clearance.status.toUpperCase()}</span></p>
                <p><strong>Remarks:</strong> ${clearance.remarks || 'None'}</p>
            </div>

            ${clearance.clearanceType === 'online' ? `
                <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <p><strong>Borrowed Equipment:</strong> ${clearance.borrowedEquipment ? 'Yes' : 'No'}</p>
                    
                    ${clearance.borrowedEquipment && clearance.equipmentItems?.length > 0 ? `
                        <div style="margin-top: 15px;">
                            <h5 style="color: #78350f; margin-bottom: 10px;">Equipment Items:</h5>
                            ${clearance.equipmentItems.map((item, index) => `
                                <div style="background: white; padding: 12px; border-radius: 6px; margin-bottom: 10px; border-left: 4px solid #f59e0b;">
                                    <p><strong>Item ${index + 1}:</strong> ${item.name} (Qty: ${item.quantity})</p>
                                    <p><strong>Borrowed:</strong> ${item.date_borrowed}</p>
                                    <p><strong>Returned:</strong> ${item.date_returned}</p>
                                    <p><strong>Status:</strong> ${item.status.replace(/_/g, ' ').toUpperCase()}</p>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>

                ${clearance.proofImage ? `
                    <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <h4 style="color: #666; margin-bottom: 10px;"><i class="fas fa-image"></i> Proof of Return</h4>
                        <img src="${clearance.proofImage}" alt="Proof of Return" style="max-width: 100%; border-radius: 8px; border: 2px solid #e0e0e0;">
                    </div>
                ` : ''}

                ${clearance.notes ? `
                    <div style="background: #f0f9ff; padding: 15px; border-radius: 8px;">
                        <h4 style="color: #666; margin-bottom: 10px;"><i class="fas fa-sticky-note"></i> Additional Notes</h4>
                        <p style="white-space: pre-wrap;">${clearance.notes}</p>
                    </div>
                ` : ''}
            ` : `
                <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                    <p style="margin: 0; color: #78350f;">
                        <i class="fas fa-info-circle"></i> <strong>Direct Visit Requested</strong><br>
                        Student requested to visit the laboratory office in person for consultation/clearance.
                    </p>
                </div>
            `}
        </div>
    `;

    // Create modal
    const modal = document.createElement('div');
    modal.style.cssText = 'display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; justify-content: center; align-items: center;';
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; padding: 30px; max-width: 700px; width: 90%; max-height: 90vh; overflow-y: auto; position: relative;">
            <span onclick="this.closest('div[style*=fixed]').remove()" style="position: absolute; top: 15px; right: 20px; font-size: 2rem; cursor: pointer; color: #666; line-height: 1;">&times;</span>
            ${detailsHTML}
            <button onclick="this.closest('div[style*=fixed]').remove()" class="btn btn-primary" style="width: 100%; margin-top: 20px; padding: 12px;">
                <i class="fas fa-times"></i> Close
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on clicking outside
    modal.onclick = function(event) {
        if (event.target === modal) {
            modal.remove();
        }
    };
}

// ==========================================================
// LOGOUT
// ==========================================================
function logout() {
    showModal(
        'Confirm Logout',
        'Are you sure you want to logout?',
        'confirm',
        function(confirmed) {
            if (confirmed) {
                setTimeout(() => { window.location.href = '../user/studentlogin.html'; }, 1500);
            }
        }
    );
}

// ==========================================================
// INITIALIZE ON PAGE LOAD
// ==========================================================
window.addEventListener('DOMContentLoaded', function() {
    console.log('🧪 Laboratory Admin: Page loaded');
    console.log('🔧 API_URL configured:', window.API_URL || 'NOT SET');
    fetchClearances();
});