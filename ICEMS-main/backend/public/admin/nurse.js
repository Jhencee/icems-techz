// ============================================
// NURSE ADMIN DASHBOARD - WITH API INTEGRATION
// ============================================

// Configure API URL
if (typeof window.API_URL === 'undefined') {
    window.API_URL = 'http://localhost:8000/api';
    console.log('⚙️ Using default API_URL:', window.API_URL);
}

let clearances = [];
let questions = [];
let currentStudentId = null;

// ============================================
// FETCH CLEARANCES FROM API
// ============================================
async function fetchNurseClearances() {
    try {
        console.log('🔍 Fetching clearances from:', `${window.API_URL}/nurse/all-clearances`);
        const response = await fetch(`${window.API_URL}/nurse/all-clearances`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📦 Clearances response:', data);

        if (data.success && data.clearances) {
            clearances = data.clearances.map(clearance => ({
                studentId: clearance.student_id,
                name: clearance.student_name,
                course: clearance.section,
                description: 'Nurse Clearance',
                status: clearance.status,
                remarks: clearance.remarks || 'N/A',
                healthAnswers: clearance.health_answers || {},
                medicalCert: clearance.medical_certificate,
                vaccinationRecord: clearance.vaccination_record,
                notes: clearance.notes || '',
                submittedAt: clearance.submitted_at
            }));

            console.log('✅ Loaded', clearances.length, 'nurse clearances');
            return clearances;
        } else {
            console.warn('⚠️ No clearances found');
            clearances = [];
            return [];
        }
    } catch (error) {
        console.error('❌ Error fetching nurse clearances:', error);
        clearances = [];
        return [];
    }
}

// ============================================
// FETCH QUESTIONS FROM API
// ============================================
async function fetchHealthQuestions() {
    try {
        console.log('🔍 Fetching questions from:', `${window.API_URL}/nurse/questions`);
        const response = await fetch(`${window.API_URL}/nurse/questions`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📦 Questions response:', data);

        if (data.success && data.questions) {
            questions = data.questions;
            console.log('✅ Loaded', questions.length, 'health questions');
            return questions;
        } else {
            console.warn('⚠️ No questions found');
            questions = [];
            return [];
        }
    } catch (error) {
        console.error('❌ Error fetching questions:', error);
        questions = [];
        return [];
    }
}

// ============================================
// INITIALIZE DASHBOARD
// ============================================
async function initDashboard() {
    console.log('🏥 Initializing Nurse Dashboard...');
    
    // Show loading state
    const tableBody = document.getElementById('tableBody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #800020;"></i>
                    <p style="margin-top: 10px; color: #666;">Loading clearances...</p>
                </td>
            </tr>
        `;
    }

    const qasBody = document.getElementById('qasBody');
    if (qasBody) {
        qasBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #800020;"></i>
                    <p style="margin-top: 10px; color: #666;">Loading questions...</p>
                </td>
            </tr>
        `;
    }

    // Fetch data from API
    await fetchNurseClearances();
    await fetchHealthQuestions();
    
    // Update UI
    updateStats();
    renderTable(clearances);
    renderQASTable(questions);
    showSection('dashboard');
    
    console.log('✅ Nurse Dashboard initialized');
}

// ============================================
// UPDATE STATISTICS
// ============================================
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

// ============================================
// STATUS ICON
// ============================================
function setStatusIcon(status) {
    let iconClass = '';
    let colorClass = `status-badge status-${status}`;
    let title = status.charAt(0).toUpperCase() + status.slice(1);

    if (status === 'pending') {
        iconClass = 'fa-solid fa-clock';
    } else if (status === 'approved') {
        iconClass = 'fa-solid fa-check-circle';
    } else if (status === 'rejected') {
        iconClass = 'fa-solid fa-times-circle';
    }

    return `<span class="${colorClass}" title="${title}"><i class="${iconClass}"></i></span>`;
}

// ============================================
// RENDER CLEARANCES TABLE
// ============================================
function renderTable(data) {
    const tbody = document.getElementById('tableBody');

    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <div class="empty-icon"><i class="fa-solid fa-user-nurse"></i></div>
                        <h3>No Clearances Yet</h3>
                        <p>Clearance submissions will appear here</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = data.map(clearance => `
        <tr data-status="${clearance.status}" data-section="${clearance.course}">
            <td>${clearance.studentId}</td>
            <td>${clearance.name}</td>
            <td>${clearance.course}</td>
            <td>${clearance.description}</td>
            <td>${setStatusIcon(clearance.status)}</td>
            <td>${clearance.remarks}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-view" onclick="viewClearance('${clearance.studentId}')">
                        <i class="fa-solid fa-eye"></i> View
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ============================================
// FILTER TABLE
// ============================================
function filterTable() {
    const statusFilter = document.getElementById('statusFilter').value;
    const sections = document.getElementById('sections').value;

    let filtered = clearances;

    if (statusFilter !== 'all') {
        filtered = filtered.filter(c => c.status === statusFilter);
    }

    if (sections !== 'sections') {
        filtered = filtered.filter(c => c.course.includes(sections));
    }

    renderTable(filtered);
}

// ============================================
// APPROVE/REJECT/VIEW FUNCTIONS
// ============================================
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
        const response = await fetch(`${window.API_URL}/nurse/update-status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                student_id: currentStudentId,
                status: 'approved',
                remarks: 'Health clearance approved on ' + new Date().toLocaleDateString('en-US')
            })
        });

        const data = await response.json();

        if (data.success) {
            clearance.status = 'approved';
            clearance.remarks = 'Health clearance approved on ' + new Date().toLocaleDateString('en-US');
            updateStats();
            filterTable();
            closeApproveModal();
            showSuccessMessage('Clearance approved successfully!');
        } else {
            alert('❌ Failed to approve clearance: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error approving clearance:', error);
        alert('❌ Failed to approve clearance. Please try again.');
    }
}

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
        showSuccessMessage('Rejection reason cannot be empty.');
        return;
    }

    const clearance = clearances.find(c => c.studentId === currentStudentId);
    if (!clearance) return;

    try {
        const response = await fetch(`${window.API_URL}/nurse/update-status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                student_id: currentStudentId,
                status: 'rejected',
                remarks: reason
            })
        });

        const data = await response.json();

        if (data.success) {
            clearance.status = 'rejected';
            clearance.remarks = reason;
            updateStats();
            filterTable();
            closeRejectModal();
            showSuccessMessage('Clearance rejected successfully.');
        } else {
            alert('❌ Failed to reject clearance: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error rejecting clearance:', error);
        alert('❌ Failed to reject clearance. Please try again.');
    }
}

function viewClearance(studentId) {
    const clearance = clearances.find(c => c.studentId === studentId);
    if (clearance) {
        const statusIcon = setStatusIcon(clearance.status);
        
        // Build health answers display with better formatting
        let healthAnswersHTML = '';
        if (clearance.healthAnswers && Object.keys(clearance.healthAnswers).length > 0) {
            healthAnswersHTML = `
                <div style="margin: 20px 0;">
                    <h3 style="color: #800020; margin-bottom: 15px; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-clipboard-list"></i> Health Questionnaire Responses
                    </h3>
            `;
            
            let questionNumber = 1;
            for (const [questionId, answer] of Object.entries(clearance.healthAnswers)) {
                const question = questions.find(q => q.id == questionId);
                const questionText = question ? question.question : `Question ${questionId}`;
                const questionDesc = question && question.description ? question.description : '';
                
                // Determine answer styling based on yes/no
                let answerStyle = 'color: #1f2937;';
                if (answer.toLowerCase() === 'yes') {
                    answerStyle = 'color: #059669; font-weight: 600;';
                } else if (answer.toLowerCase() === 'no') {
                    answerStyle = 'color: #dc2626; font-weight: 600;';
                }
                
                healthAnswersHTML += `
                    <div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                        <div style="display: flex; gap: 10px; margin-bottom: 8px;">
                            <span style="background: #800020; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.85rem; flex-shrink: 0;">
                                ${questionNumber}
                            </span>
                            <div style="flex: 1;">
                                <strong style="color: #111827; font-size: 1rem; display: block; margin-bottom: 4px;">
                                    ${questionText}
                                </strong>
                                ${questionDesc ? `<p style="color: #6b7280; font-size: 0.875rem; margin: 0 0 8px 0;">${questionDesc}</p>` : ''}
                                <div style="background: #f9fafb; padding: 10px; border-radius: 6px; border-left: 3px solid #800020; margin-top: 8px;">
                                    <span style="color: #6b7280; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Answer:</span>
                                    <span style="${answerStyle} font-size: 1rem;">${answer}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                questionNumber++;
            }
            healthAnswersHTML += '</div>';
        } else {
            healthAnswersHTML = `
                <div style="margin: 20px 0; padding: 20px; background: #fef3c7; border-radius: 8px; text-align: center;">
                    <i class="fas fa-info-circle" style="color: #d97706; font-size: 1.5rem; margin-bottom: 8px;"></i>
                    <p style="color: #92400e; margin: 0;">No health questionnaire responses provided</p>
                </div>
            `;
        }
        
        document.getElementById('viewContent').innerHTML = `
            <div style="max-height: 600px; overflow-y: auto; padding-right: 10px;">
                <div style="background: linear-gradient(135deg, #800020 0%, #600018 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="margin: 0 0 10px 0; font-size: 1.2rem;">Student Information</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <div style="opacity: 0.8; font-size: 0.85rem; margin-bottom: 4px;">Student ID</div>
                            <div style="font-weight: 600; font-size: 1rem;">${clearance.studentId}</div>
                        </div>
                        <div>
                            <div style="opacity: 0.8; font-size: 0.85rem; margin-bottom: 4px;">Name</div>
                            <div style="font-weight: 600; font-size: 1rem;">${clearance.name}</div>
                        </div>
                        <div>
                            <div style="opacity: 0.8; font-size: 0.85rem; margin-bottom: 4px;">Section</div>
                            <div style="font-weight: 600; font-size: 1rem;">${clearance.course}</div>
                        </div>
                        <div>
                            <div style="opacity: 0.8; font-size: 0.85rem; margin-bottom: 4px;">Status</div>
                            <div>${statusIcon}</div>
                        </div>
                    </div>
                </div>

                ${healthAnswersHTML}

                ${clearance.medicalCert || clearance.vaccinationRecord ? `
                    <div style="margin: 20px 0;">
                        <h3 style="color: #800020; margin-bottom: 15px; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-file-medical"></i> Medical Documents
                        </h3>
                        <div style="display: grid; grid-template-columns: ${clearance.medicalCert && clearance.vaccinationRecord ? '1fr 1fr' : '1fr'}; gap: 15px;">
                            ${clearance.medicalCert ? `
                                <div style="background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
                                    <strong style="color: #111827; display: block; margin-bottom: 10px; font-size: 0.9rem;">
                                        <i class="fas fa-file-medical" style="color: #800020;"></i> Medical Certificate
                                    </strong>
                                    <img src="${clearance.medicalCert}" alt="Medical Certificate" 
                                         style="max-width: 100%; border-radius: 6px; border: 2px solid #e5e7eb; cursor: pointer;"
                                         onclick="window.open(this.src, '_blank')">
                                    <p style="color: #6b7280; font-size: 0.75rem; margin: 8px 0 0 0; text-align: center;">
                                        <i class="fas fa-expand"></i> Click to enlarge
                                    </p>
                                </div>
                            ` : ''}
                            ${clearance.vaccinationRecord ? `
                                <div style="background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
                                    <strong style="color: #111827; display: block; margin-bottom: 10px; font-size: 0.9rem;">
                                        <i class="fas fa-syringe" style="color: #800020;"></i> Vaccination Record
                                    </strong>
                                    <img src="${clearance.vaccinationRecord}" alt="Vaccination Record" 
                                         style="max-width: 100%; border-radius: 6px; border: 2px solid #e5e7eb; cursor: pointer;"
                                         onclick="window.open(this.src, '_blank')">
                                    <p style="color: #6b7280; font-size: 0.75rem; margin: 8px 0 0 0; text-align: center;">
                                        <i class="fas fa-expand"></i> Click to enlarge
                                    </p>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}

                ${clearance.notes ? `
                    <div style="margin: 20px 0;">
                        <h3 style="color: #800020; margin-bottom: 10px; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-note-sticky"></i> Additional Notes
                        </h3>
                        <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 6px;">
                            <p style="color: #92400e; margin: 0; white-space: pre-wrap;">${clearance.notes}</p>
                        </div>
                    </div>
                ` : ''}

                ${clearance.remarks && clearance.remarks !== 'N/A' ? `
                    <div style="margin: 20px 0;">
                        <h3 style="color: #800020; margin-bottom: 10px; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-comment-medical"></i> Nurse Remarks
                        </h3>
                        <div style="background: ${clearance.status === 'approved' ? '#d1fae5' : '#fee2e2'}; 
                                    border-left: 4px solid ${clearance.status === 'approved' ? '#059669' : '#dc2626'}; 
                                    padding: 15px; border-radius: 6px;">
                            <p style="color: ${clearance.status === 'approved' ? '#065f46' : '#991b1b'}; margin: 0; white-space: pre-wrap;">${clearance.remarks}</p>
                        </div>
                    </div>
                ` : ''}
            </div>

            <!-- Action Buttons in Modal -->
            <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; display: flex; gap: 10px; justify-content: flex-end;">
                ${clearance.status === 'pending' ? `
                    <button onclick="approveClearanceFromModal('${clearance.studentId}')" 
                            class="btn btn-approve" 
                            style="padding: 12px 24px; font-size: 1rem; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-check-circle"></i> Approve Clearance
                    </button>
                    <button onclick="rejectClearanceFromModal('${clearance.studentId}')" 
                            class="btn btn-reject" 
                            style="padding: 12px 24px; font-size: 1rem; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-times-circle"></i> Reject Clearance
                    </button>
                ` : clearance.status === 'approved' ? `
                ` : `
                    <button onclick="approveClearanceFromModal('${clearance.studentId}')" 
                            class="btn btn-approve" 
                            style="padding: 12px 24px; font-size: 1rem; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-redo"></i> Reapprove
                    </button>
                `}
            </div>
        `;
        document.getElementById('viewModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeViewModal() {
    document.getElementById('viewModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// ============================================
// APPROVE/REJECT FROM VIEW MODAL
// ============================================
function approveClearanceFromModal(studentId) {
    currentStudentId = studentId;
    const clearance = clearances.find(c => c.studentId === studentId);
    if (clearance) {
        document.getElementById('approveMessage').textContent =
            `Are you sure you want to approve clearance for ${clearance.name} (${studentId})?`;
        
        // Close view modal first
        closeViewModal();
        
        // Open approve confirmation modal
        document.getElementById('approveModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function rejectClearanceFromModal(studentId) {
    currentStudentId = studentId;
    const clearance = clearances.find(c => c.studentId === studentId);
    if (clearance) {
        document.getElementById('rejectMessage').textContent =
            `Rejecting clearance for ${clearance.name} (${studentId}). Please provide a reason:`;
        document.getElementById('rejectReason').value = '';
        
        // Close view modal first
        closeViewModal();
        
        // Open reject modal
        document.getElementById('rejectModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function showSuccessMessage(message) {
    document.getElementById('successMessage').textContent = message;
    document.getElementById('successModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// ============================================
// QAS SECTION
// ============================================
function showSection(section) {
    const dashboard = document.getElementById('dashboardSection');
    const qas = document.getElementById('qasSection');
    const navBtns = document.querySelectorAll('.nav-btn');

    navBtns.forEach(btn => btn.classList.remove('active'));

    closeApproveModal();
    closeRejectModal();
    closeViewModal();
    closeSuccessModal();

    if (section === 'dashboard') {
        dashboard.style.display = 'block';
        qas.style.display = 'none';
        document.querySelector('.nav-btn:nth-child(1)').classList.add('active');
    } else {
        dashboard.style.display = 'none';
        qas.style.display = 'block';
        document.querySelector('.nav-btn:nth-child(2)').classList.add('active');
    }
}

function openQASModal(isEdit = false, questionId = null) {
    const modalTitle = document.getElementById('qasModalTitle');
    const submitButton = document.getElementById('qasSubmitButton');

    if (isEdit && questionId) {
        const question = questions.find(q => q.id === questionId);
        if (question) {
            modalTitle.textContent = 'Edit Question';
            submitButton.textContent = 'Save Changes';
            document.getElementById('question').value = question.question;
            document.getElementById('description').value = question.description || '';
            document.getElementById('type').value = question.type;
            document.getElementById('qasIndex').value = questionId;
        }
    } else {
        modalTitle.textContent = 'Create New Question';
        submitButton.textContent = 'Save Question';
        document.getElementById('qasForm').reset();
        document.getElementById('qasIndex').value = '';
    }
    document.getElementById('qasModal').style.display = 'block';
}

function closeQASModal() {
    document.getElementById('qasModal').style.display = 'none';
    document.getElementById('qasForm').reset();
    document.getElementById('qasIndex').value = '';
}

function editQAS(id) {
    openQASModal(true, id);
}

function renderQASTable(data) {
    const tbody = document.getElementById('qasBody');

    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <div class="empty-icon"><i class="fa-solid fa-circle-question"></i></div>
                        <h3>No Questions Yet</h3>
                        <p>Created questions will appear here</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = data.map((q, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${q.question}</td>
            <td>${q.description || '-'}</td>
            <td><span class="qas-type-badge">${q.type}</span></td>
            <td>
                <button class="btn btn-view" onclick="editQAS(${q.id})">
                    <i class="fa-solid fa-pen-to-square"></i> Edit
                </button>
            </td>
        </tr>
    `).join('');
}

// ============================================
// QAS FORM SUBMISSION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const qasForm = document.getElementById('qasForm');
    if (qasForm) {
        qasForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target;
            const question = form.question.value.trim();
            const description = form.description.value.trim();
            const type = form.type.value;
            const questionId = form.qasIndex.value;

            if (!question) {
                showSuccessMessage('Please enter a question.');
                return;
            }

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

            try {
                // Map frontend question types to backend format
                const typeMap = {
                    'Text Input': 'text',
                    'Textarea': 'textarea',
                    'Yes/No': 'yes/no'
                };
                const backendType = typeMap[type] || type.toLowerCase();

                const payload = {
                    question,
                    description: description || '',
                    type: backendType
                };

                console.log('📤 Sending question data:', payload);

                let response;
                if (questionId) {
                    // UPDATE
                    response = await fetch(`${window.API_URL}/nurse/questions/${questionId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                } else {
                    // CREATE
                    response = await fetch(`${window.API_URL}/nurse/questions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                }

                const data = await response.json();
                console.log('📥 Response from server:', data);
                console.log('📥 Response status:', response.status);

                if (!response.ok) {
                    console.error('❌ Server error details:', data);
                    if (data.errors) {
                        console.error('❌ Validation errors:', data.errors);
                    }
                    alert('❌ Failed to save question:\n' + JSON.stringify(data, null, 2));
                    return;
                }

                if (data.success) {
                    await fetchHealthQuestions();
                    renderQASTable(questions);
                    closeQASModal();
                    showSuccessMessage(questionId ? 'Question updated successfully!' : 'Question added successfully!');
                } else {
                    alert('❌ ' + (data.message || 'Failed to save question'));
                }
            } catch (error) {
                console.error('Error saving question:', error);
                alert('❌ Failed to save question. Please try again.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }

    initDashboard();
});

// ============================================
// LOGOUT & NAVIGATION
// ============================================
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

function logout() {
    document.getElementById("logoutModal").style.display = "flex";
    document.body.style.overflow = "hidden";
}

function closeLogoutModal() {
    document.getElementById("logoutModal").style.display = "none";
    document.body.style.overflow = "auto";
}

function confirmLogout() {
    document.body.style.overflow = "auto";
    window.location.href = "../user/studentlogin.html";
}

window.onclick = function (event) {
    const qasModal = document.getElementById('qasModal');
    if (event.target === qasModal) closeQASModal();
    const logoutModal = document.getElementById('logoutModal');
    if (event.target === logoutModal) closeLogoutModal();
    const approveModal = document.getElementById('approveModal');
    if (event.target === approveModal) closeApproveModal();
    const rejectModal = document.getElementById('rejectModal');
    if (event.target === rejectModal) closeRejectModal();
    const viewModal = document.getElementById('viewModal');
    if (event.target === viewModal) closeViewModal();
    const successModal = document.getElementById('successModal');
    if (event.target === successModal) closeSuccessModal();
};