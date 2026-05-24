// ============================================
// NURSE CLEARANCE - STUDENT SIDE
// With Real-Time Validation & Dynamic Loading
// ============================================

window.API_URL = window.API_URL || 'http://127.0.0.1:8000';

let healthQuestions = [];
let nurseClearanceStatus = null;
let healthAnswers = {};
let medicalCertBase64 = null;
let vaccinationRecordBase64 = null;

// ============================================
// CHECK IF NURSE CLEARANCE IS ASSIGNED
// ============================================
async function checkNurseClearanceAssignment(studentNumber) {
    try {
        console.log('🔍 Checking if nurse clearance is assigned to student:', studentNumber);
        
        // For now, always return true since nurse clearance is available to all students
        // You can modify this later to check against a clearance_assignments table
        console.log('✅ Nurse clearance is available to all students');
        return true;
        
        /* OPTIONAL: If you have a clearance assignments system, use this instead:
        const response = await fetch(`${window.API_URL}/clearances/student/${studentNumber}`);
        
        if (!response.ok) {
            console.warn('⚠️ Failed to fetch clearance assignments');
            return true; // Default to showing it
        }
        
        const data = await response.json();
        
        if (data.success && data.clearances) {
            const nurseClearance = data.clearances.find(c => 
                c.name && (
                    c.name.toLowerCase().includes('nurse') || 
                    c.name.toLowerCase().includes('health') ||
                    c.name.toLowerCase().includes('medical')
                )
            );
            
            if (nurseClearance) {
                console.log('✅ Nurse clearance is assigned to this student');
                return true;
            } else {
                console.log('ℹ️ Nurse clearance is NOT assigned to this student');
                return false;
            }
        }
        
        return true; // Default to showing it
        */
    } catch (error) {
        console.error('❌ Error checking nurse clearance assignment:', error);
        return true; // Default to showing the clearance if check fails
    }
}

// ============================================
// FETCH HEALTH QUESTIONS
// ============================================
async function fetchHealthQuestions() {
    try {
        console.log('🏥 Fetching health questions...');
        const response = await fetch(`${window.API_URL}/api/nurse/questions`);
        const data = await response.json();

        if (data.success && data.questions) {
            healthQuestions = data.questions;
            console.log('✅ Loaded', healthQuestions.length, 'health questions');

            healthAnswers = {};
            healthQuestions.forEach(q => {
                healthAnswers[q.id] = '';
            });

            return healthQuestions;
        } else {
            console.warn('⚠️ No health questions found');
            healthQuestions = [];
            return [];
        }
    } catch (error) {
        console.error('❌ Error fetching health questions:', error);
        healthQuestions = [];
        return [];
    }
}

// ============================================
// FETCH STUDENT'S NURSE CLEARANCE STATUS
// ============================================
async function fetchNurseClearanceStatus(studentNumber) {
    try {
        console.log('🏥 Fetching nurse clearance status for:', studentNumber);

        const response = await fetch(`${window.API_URL}/api/nurse/clearance/${studentNumber}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        }).catch(() => null);

        if (!response) {
            console.log('ℹ️ No nurse clearance submission found');
            return { status: 'not_submitted', remarks: null, healthAnswers: {} };
        }

        if (response.status === 404) {
            console.log('ℹ️ No nurse clearance submission found (student has not submitted yet)');
            return { status: 'not_submitted', remarks: null, healthAnswers: {} };
        }

        if (!response.ok) {
            console.warn(`⚠️ Unexpected response: ${response.status}`);
            return { status: 'not_submitted', remarks: null, healthAnswers: {} };
        }

        const data = await response.json();

        if (data.success && data.clearance) {
            nurseClearanceStatus = data.clearance;

            if (data.clearance.health_answers) {
                healthAnswers = data.clearance.health_answers;
            }

            console.log('✅ Nurse clearance status:', data.clearance.status);
            return {
                status: data.clearance.status,
                remarks: data.clearance.remarks,
                healthAnswers: data.clearance.health_answers
            };
        } else {
            console.log('ℹ️ No nurse clearance submission found');
            return { status: 'not_submitted', remarks: null, healthAnswers: {} };
        }
    } catch (error) {
        console.log('ℹ️ No nurse clearance submission found');
        return { status: 'not_submitted', remarks: null, healthAnswers: {} };
    }
}

// ============================================
// DISPLAY NURSE CLEARANCE CARD
// ============================================
async function displayNurseClearanceCard() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        console.log('⚠️ No user logged in');
        return;
    }

    const clearanceContainer = document.getElementById('clearanceContainer');
    if (!clearanceContainer) {
        console.log('⚠️ Clearance container not found');
        return;
    }

    // ✅ CHECK IF NURSE CLEARANCE IS ASSIGNED TO THIS STUDENT
    const isAssigned = await checkNurseClearanceAssignment(currentUser.student_number);
    
    if (!isAssigned) {
        console.log('ℹ️ Nurse clearance not assigned to this student - skipping card display');
        return; // Don't show the card if not assigned
    }

    await fetchHealthQuestions();
    const statusData = await fetchNurseClearanceStatus(currentUser.student_number);

    const status = statusData.status;
    const remarks = statusData.remarks;

    let statusBadge = '';
    if (status === 'approved') {
        statusBadge = '<span class="clearance-status completed"><i class="fas fa-check-circle"></i> Approved</span>';
    } else if (status === 'rejected') {
        statusBadge = '<span class="clearance-status required"><i class="fas fa-times-circle"></i> Rejected</span>';
    } else if (status === 'pending') {
        statusBadge = '<span class="clearance-status" style="background: #d97706;"><i class="fas fa-clock"></i> Pending Review</span>';
    } else {
        statusBadge = '<span class="clearance-status required"><i class="fas fa-circle-exclamation"></i> Not Submitted</span>';
    }

    const nurseCard = document.createElement('div');
    nurseCard.className = `clearance-card ${status === 'approved' ? 'completed' : 'required'}`;
    nurseCard.setAttribute('data-status', status === 'approved' ? 'completed' : 'required');
    nurseCard.setAttribute('data-clearance-type', 'nurse');

    nurseCard.innerHTML = `
        <div class="clearance-header">
            <div class="clearance-title">
                <i class="fas fa-heartbeat" style="margin-right: 8px;"></i>
                Nurse Clearance 
            </div>
            ${statusBadge}
        </div>
        <div class="clearance-details">
            Complete your health clearance by answering the health questionnaire and submitting medical documents.
        </div>
        ${status === 'rejected' && remarks ? `
            <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 12px; margin: 15px 0; border-radius: 6px;">
                <strong style="color: #991b1b;"><i class="fas fa-exclamation-triangle"></i> Rejection Reason:</strong>
                <p style="color: #991b1b; margin: 5px 0 0 0;">${remarks}</p>
            </div>
        ` : ''}
        ${status === 'approved' && remarks ? `
            <div style="background: #d1fae5; border-left: 4px solid #059669; padding: 12px; margin: 15px 0; border-radius: 6px;">
                <strong style="color: #065f46;"><i class="fas fa-check-circle"></i> Remarks:</strong>
                <p style="color: #065f46; margin: 5px 0 0 0;">${remarks}</p>
            </div>
        ` : ''}
        <div class="clearance-requirements">
            <h4>Requirements:</h4>
            <ul class="requirement-list">
                <li class="requirement-item"><i class="fas fa-circle-check"></i> Complete health questionnaire (${healthQuestions.length} questions)</li>
                <li class="requirement-item"><i class="fas fa-circle-check"></i> Upload medical certificate (optional)</li>
                <li class="requirement-item"><i class="fas fa-circle-check"></i> Upload vaccination record (optional)</li>
            </ul>
        </div>
        <div class="clearance-actions">
            ${status === 'not_submitted'
            ? '<button class="btn btn-primary" onclick="openNurseClearanceModal()"><i class="fas fa-upload"></i> Submit Clearance</button>'
            : status === 'pending'
                ? '<button class="btn btn-secondary" disabled style="opacity: 0.5;"><i class="fas fa-clock"></i> Pending Review</button>'
                : status === 'rejected'
                    ? '<button class="btn btn-primary" onclick="openNurseClearanceModal()"><i class="fas fa-redo"></i> Resubmit Clearance</button>'
                    : '<button class="btn btn-secondary" disabled style="opacity: 0.5;"><i class="fas fa-check"></i> Approved</button>'}
        </div>
    `;

    // Insert card in the container
    clearanceContainer.appendChild(nurseCard);

    console.log('✅ Nurse clearance card added');
}

// ============================================
// CHECK IF ALL QUESTIONS ARE ANSWERED
// ✅ Real-time validation
// ============================================
function validateNurseForm() {
    let allAnswered = true;

    healthQuestions.forEach(question => {
        const questionType = question.type.toLowerCase().replace(/\s+/g, '');
        
        if (questionType === 'yes/no') {
            const radio = document.querySelector(`input[name="answer_${question.id}"]:checked`);
            if (!radio) {
                allAnswered = false;
            }
        } else {
            const input = document.getElementById(`answer_${question.id}`);
            if (!input || !input.value.trim()) {
                allAnswered = false;
            }
        }
    });

    // Enable/disable submit button
    const submitBtn = document.getElementById('nurseSubmitBtn');
    if (submitBtn) {
        if (allAnswered) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
        } else {
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.5';
            submitBtn.style.cursor = 'not-allowed';
        }
    }
}

// ============================================
// OPEN NURSE CLEARANCE SUBMISSION MODAL
// ============================================
function openNurseClearanceModal() {
    if (healthQuestions.length === 0) {
        alert('❌ No health questions available yet.\n\nPlease contact the nurse office to set up the health questionnaire first.');
        return;
    }

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    let questionsHTML = healthQuestions.map((question, index) => {
        const currentAnswer = healthAnswers[question.id] || '';
        const questionType = question.type.toLowerCase().replace(/\s+/g, '');

        let inputHTML = '';
        if (questionType === 'textinput' || questionType === 'text') {
            inputHTML = `<input type="text" id="answer_${question.id}" value="${currentAnswer}" class="form-input" placeholder="Enter your answer" oninput="validateNurseForm()" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;">`;
        } else if (questionType === 'textarea') {
            inputHTML = `<textarea id="answer_${question.id}" rows="3" class="form-input" placeholder="Enter your answer" oninput="validateNurseForm()" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; resize: vertical;">${currentAnswer}</textarea>`;
        } else if (questionType === 'yes/no') {
            inputHTML = `
                <div style="display: flex; gap: 15px; margin-top: 8px;">
                    <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                        <input type="radio" name="answer_${question.id}" value="Yes" ${currentAnswer === 'Yes' ? 'checked' : ''} onchange="validateNurseForm()" style="width: 18px; height: 18px;">
                        <span>Yes</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                        <input type="radio" name="answer_${question.id}" value="No" ${currentAnswer === 'No' ? 'checked' : ''} onchange="validateNurseForm()" style="width: 18px; height: 18px;">
                        <span>No</span>
                    </label>
                </div>
            `;
        }

        return `
            <div style="background: #f9fafb; padding: 15px; border-radius: 10px; margin-bottom: 15px; border: 1px solid #e5e7eb;">
                <div style="font-weight: 600; color: #111827; margin-bottom: 8px;">
                    ${index + 1}. ${question.question}
                    <span style="color: #dc2626;">*</span>
                </div>
                ${question.description ? `<div style="font-size: 0.9rem; color: #6b7280; margin-bottom: 10px;">${question.description}</div>` : ''}
                ${inputHTML}
            </div>
        `;
    }).join('');

    const modalHTML = `
        <div class="modal active" id="nurseClearanceModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; justify-content: center; align-items: center; overflow-y: auto; padding: 20px;">
            <div class="modal-content" style="background: white; border-radius: 12px; padding: 0; max-width: 700px; width: 100%; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column;">
                
                <div style="background: linear-gradient(135deg, #800020 0%, #600018 100%); color: white; padding: 25px; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
                    <div>
                        <h2 style="margin: 0; font-size: 1.5rem; font-weight: 700;">
                            <i class="fas fa-heartbeat"></i> Nurse Clearance 
                        </h2>
                        <p style="margin: 5px 0 0 0; font-size: 0.9rem; opacity: 0.9;">School Nurse Office</p>
                    </div>
                    <button onclick="closeNurseClearanceModal()" style="background: none; border: none; color: white; font-size: 2rem; cursor: pointer; line-height: 1; padding: 0; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center;">&times;</button>
                </div>

                <div style="flex: 1; overflow-y: auto; padding: 25px;">
                    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin-bottom: 20px; border-radius: 6px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-info-circle" style="color: #f59e0b;"></i>
                            <strong style="color: #92400e;">All questions are required</strong>
                        </div>
                        <p style="color: #92400e; margin: 5px 0 0 0; font-size: 0.9rem;">Please answer all questions before you can submit.</p>
                    </div>

                    <div style="margin-bottom: 30px;">
                        <h3 style="color: #800020; margin-bottom: 15px; font-size: 1.1rem; font-weight: 600;">
                            <i class="fas fa-clipboard-list"></i> Health Questionnaire
                        </h3>
                        ${questionsHTML}
                    </div>

                    <div style="margin-bottom: 30px;">
                        <h3 style="color: #800020; margin-bottom: 15px; font-size: 1.1rem; font-weight: 600;">
                            <i class="fas fa-file-medical"></i> Medical Documents (Optional)
                        </h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div>
                                <label style="display: block; font-weight: 600; margin-bottom: 8px; font-size: 0.9rem;">Medical Certificate</label>
                                <input type="file" id="medicalCertFile" accept="image/*" style="width: 100%; padding: 8px; border: 2px dashed #e0e0e0; border-radius: 8px; font-size: 0.85rem;">
                                <div id="medicalCertPreview" style="margin-top: 8px; font-size: 0.85rem; color: #059669;"></div>
                            </div>
                            <div>
                                <label style="display: block; font-weight: 600; margin-bottom: 8px; font-size: 0.9rem;">Vaccination Record</label>
                                <input type="file" id="vaccinationFile" accept="image/*" style="width: 100%; padding: 8px; border: 2px dashed #e0e0e0; border-radius: 8px; font-size: 0.85rem;">
                                <div id="vaccinationPreview" style="margin-top: 8px; font-size: 0.85rem; color: #059669;"></div>
                            </div>
                        </div>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 8px; font-size: 0.9rem;">Additional Notes (Optional)</label>
                        <textarea id="nurseNotes" rows="3" placeholder="Any additional health information..." style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; resize: vertical;"></textarea>
                    </div>
                </div>

                <div style="padding: 20px 25px; background: #f9fafb; border-top: 1px solid #e5e7eb; display: flex; gap: 10px; flex-shrink: 0;">
                    <button onclick="closeNurseClearanceModal()" class="btn btn-secondary" style="flex: 1; padding: 12px;">
                        Cancel
                    </button>
                    <button id="nurseSubmitBtn" onclick="submitNurseClearance()" class="btn btn-primary" disabled style="flex: 2; padding: 12px; opacity: 0.5; cursor: not-allowed;">
                        <i class="fas fa-paper-plane"></i> Submit Clearance
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    document.getElementById('medicalCertFile').addEventListener('change', (e) => handleNurseFileUpload(e, 'medical'));
    document.getElementById('vaccinationFile').addEventListener('change', (e) => handleNurseFileUpload(e, 'vaccination'));
    
    // Initial validation check
    validateNurseForm();
}

function closeNurseClearanceModal() {
    const modal = document.getElementById('nurseClearanceModal');
    if (modal) modal.remove();
    
    medicalCertBase64 = null;
    vaccinationRecordBase64 = null;
}

// ============================================
// HANDLE FILE UPLOAD
// ============================================
function handleNurseFileUpload(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
        if (type === 'medical') {
            medicalCertBase64 = reader.result;
            document.getElementById('medicalCertPreview').innerHTML = '<i class="fas fa-check-circle"></i> File uploaded';
        } else {
            vaccinationRecordBase64 = reader.result;
            document.getElementById('vaccinationPreview').innerHTML = '<i class="fas fa-check-circle"></i> File uploaded';
        }
    };
    reader.readAsDataURL(file);
}

// ============================================
// SUBMIT NURSE CLEARANCE
// ============================================
async function submitNurseClearance() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        alert('❌ Please log in to submit clearance');
        return;
    }

    // Collect answers
    const collectedAnswers = {};
    healthQuestions.forEach(question => {
        const questionType = question.type.toLowerCase().replace(/\s+/g, '');
        
        if (questionType === 'yes/no') {
            const radio = document.querySelector(`input[name="answer_${question.id}"]:checked`);
            collectedAnswers[question.id] = radio ? radio.value : '';
        } else {
            const input = document.getElementById(`answer_${question.id}`);
            collectedAnswers[question.id] = input ? input.value.trim() : '';
        }
    });

    const notes = document.getElementById('nurseNotes').value.trim();

    const confirmed = confirm('Are you sure you want to submit your health clearance?\n\nOnce submitted, this will be sent to the nurse for review.');
    if (!confirmed) return;

    const submitBtn = document.getElementById('nurseSubmitBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

    try {
        const response = await fetch(`${window.API_URL}/api/nurse/submit-clearance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                student_id: currentUser.student_number,
                student_name: `${currentUser.first_name} ${currentUser.last_name}`,
                section: `${currentUser.course} ${currentUser.year}`,
                health_answers: collectedAnswers,
                medical_certificate: medicalCertBase64,
                vaccination_record: vaccinationRecordBase64,
                notes: notes
            })
        });

        const data = await response.json();

        if (data.success) {
            alert('✅ Health clearance submitted successfully!\n\nYour submission is pending nurse approval.');
            closeNurseClearanceModal();

            // Refresh the clearance card
            const existingCard = document.querySelector('[data-clearance-type="nurse"]');
            if (existingCard) {
                existingCard.remove();
            }
            await displayNurseClearanceCard();
            
            if (typeof updateClearanceStats === 'function') {
                await updateClearanceStats();
            }
        } else {
            alert('❌ Failed to submit clearance: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error submitting nurse clearance:', error);
        alert('❌ Failed to submit clearance. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// ============================================
// INITIALIZE ON CLEARANCE PAGE
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    if (!window.location.pathname.includes('studentclearance.html')) {
        console.log('ℹ️ Not on clearance page, skipping nurse clearance');
        return;
    }

    console.log('🏥 Initializing nurse clearance module...');

    const waitForContainer = setInterval(async () => {
        const container = document.getElementById('clearanceContainer');
        if (container) {
            clearInterval(waitForContainer);

            setTimeout(async () => {
                await displayNurseClearanceCard();
                if (typeof updateClearanceStats === 'function') {
                    await updateClearanceStats();
                }
            }, 500);
        }
    }, 100);
});