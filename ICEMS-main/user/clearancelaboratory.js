// ============================================
// LABORATORY CLEARANCE MODULE - FIXED
// Handles all laboratory equipment clearance functionality
// with proper error handling
// ============================================

let labEquipmentCounter = 0;
let laboratoryStatusCache = new Map();
let labPendingRequests = new Map();

// ============================================
// CLEAR LABORATORY CACHE
// ============================================
function clearLaboratoryCache(studentNumber = null) {
    if (studentNumber) {
        laboratoryStatusCache.delete(studentNumber);
    } else {
        laboratoryStatusCache.clear();
    }
}

// ============================================
// FETCH LABORATORY CLEARANCE STATUS (FIXED)
// ============================================
async function fetchLaboratoryClearanceStatus(studentNumber, forceRefresh = false) {
    if (!forceRefresh && laboratoryStatusCache.has(studentNumber)) {
        console.log('📦 Using cached laboratory status for:', studentNumber);
        return laboratoryStatusCache.get(studentNumber);
    }

    if (labPendingRequests.has(studentNumber)) {
        console.log('⏳ Waiting for existing request for:', studentNumber);
        return await labPendingRequests.get(studentNumber);
    }

    const requestPromise = (async () => {
        let result;
        
        try {
            const response = await fetch(`${window.API_URL}/api/laboratory/clearance/${studentNumber}`);
            const data = await response.json();

            // API now ALWAYS returns 200 with exists flag
            if (response.ok && data.success) {
                if (data.exists && data.clearance) {
                    console.log('✅ Laboratory clearance found:', data.clearance.status);
                    result = {
                        status: data.clearance.status,
                        remarks: data.clearance.remarks || '',
                        exists: true
                    };
                } else {
                    // exists is false - no clearance submitted yet
                    console.log('ℹ️ No laboratory clearance submitted yet');
                    result = {
                        status: 'not_submitted',
                        remarks: '',
                        exists: false
                    };
                }
            } else {
                console.log('ℹ️ Unexpected response, treating as not submitted');
                result = {
                    status: 'not_submitted',
                    remarks: '',
                    exists: false
                };
            }

        } catch (error) {
            console.log('ℹ️ Could not fetch clearance status (network error)');
            result = {
                status: 'not_submitted',
                remarks: '',
                exists: false
            };
        } finally {
            laboratoryStatusCache.set(studentNumber, result);
            labPendingRequests.delete(studentNumber);
        }
        
        return result;
    })();

    labPendingRequests.set(studentNumber, requestPromise);
    return await requestPromise;
}

// ============================================
// ADD LABORATORY CLEARANCE CARD TO PAGE
// ============================================
async function addLaboratoryClearanceCard() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    const labStatus = await fetchLaboratoryClearanceStatus(currentUser.student_number);
    
    let statusClass = 'required';
    let statusText = 'Required';
    let statusIcon = 'fa-circle-exclamation';
    
    if (labStatus.status === 'approved') {
        statusClass = 'completed';
        statusText = 'Completed';
        statusIcon = 'fa-circle-check';
    } else if (labStatus.status === 'pending') {
        statusClass = 'pending';
        statusText = 'Pending';
        statusIcon = 'fa-hourglass-half';
    } else if (labStatus.status === 'rejected') {
        statusClass = 'required';
        statusText = 'Rejected';
        statusIcon = 'fa-circle-xmark';
    }

    const labCardHTML = `
        <div class="clearance-card ${statusClass}" data-status="${statusClass}">
            <div class="clearance-header">
                <div class="clearance-title">
                    <i class="fas fa-flask"></i> Laboratory Clearance
                </div>
                <span class="clearance-status ${statusClass}">
                    <i class="fas ${statusIcon}"></i> ${statusText}
                </span>
            </div>
            <div class="clearance-details">
                Complete all laboratory equipment clearance requirements
            </div>
            ${labStatus.remarks ? `
                <div class="clearance-remarks" style="margin: 10px 0; padding: 10px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                    <strong style="color: #92400e;">Remarks:</strong> <span style="color: #78350f;">${labStatus.remarks}</span>
                </div>
            ` : ''}
            <div class="clearance-requirements">
                <h4>Requirements:</h4>
                <ul class="requirement-list">
                    <li class="requirement-item">Return all borrowed laboratory equipment</li>
                    <li class="requirement-item">Submit proof of equipment return</li>
                    <li class="requirement-item">Clear any damaged equipment charges</li>
                </ul>
            </div>
            <div class="clearance-actions">
                ${labStatus.status === 'not_submitted' || labStatus.status === 'rejected' ? `
                    <button class="btn btn-primary" onclick="submitLaboratoryClearance()">
                        <i class="fas fa-paper-plane"></i> Submit Clearance
                    </button>
                ` : labStatus.status === 'pending' ? `
                    <button class="btn btn-secondary" disabled>
                        <i class="fas fa-hourglass-half"></i> Pending Approval
                    </button>
                ` : `
                    <button class="btn btn-success" disabled style="background: #10b981; cursor: not-allowed;">
                        <i class="fas fa-check-circle"></i> Approved
                    </button>
                `}
            </div>
        </div>
    `;

    const container = document.getElementById('clearanceContainer');
    if (container) {
        container.insertAdjacentHTML('beforeend', labCardHTML);
    }

    updateClearanceStats();
}

// ============================================
// UPDATE CLEARANCE STATISTICS
// ============================================
function updateClearanceStats() {
    const cards = document.querySelectorAll('.clearance-card');
    let completed = 0;
    let pending = 0;
    let required = 0;

    cards.forEach(card => {
        const status = card.getAttribute('data-status');
        if (status === 'completed') completed++;
        else if (status === 'pending') pending++;
        else if (status === 'required') required++;
    });

    const completedCount = document.getElementById('completedCount');
    const pendingCount = document.getElementById('pendingCount');
    const requiredCount = document.getElementById('requiredCount');

    if (completedCount) completedCount.textContent = completed;
    if (pendingCount) pendingCount.textContent = pending;
    if (requiredCount) requiredCount.textContent = cards.length;
}

// ============================================
// SUBMIT LABORATORY CLEARANCE MODAL
// ============================================
function submitLaboratoryClearance() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    const modalHTML = `
        <div class="modal active" id="labClearanceModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; justify-content: center; align-items: center;">
            <div class="modal-content" style="background: white; border-radius: 12px; padding: 30px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto; position: relative;">
                <span onclick="closeLaboratoryModal()" style="position: absolute; top: 15px; right: 20px; font-size: 2rem; cursor: pointer; color: #666; line-height: 1;">&times;</span>
                
                <h2 style="color: #800020; margin-bottom: 20px;">
                    <i class="fas fa-flask"></i> Laboratory Equipment Clearance
                </h2>
                
                <p style="color: #666; margin-bottom: 20px;">
                    Please select how you want to process your laboratory clearance.
                </p>
                
                <form id="labClearanceForm" onsubmit="handleLaboratorySubmit(event)">
                    <!-- Clearance Type Selection -->
                    <div style="margin-bottom: 25px; padding: 15px; background: #f0f9ff; border-radius: 8px; border: 2px solid #0ea5e9;">
                        <label style="display: block; font-weight: 600; margin-bottom: 12px; color: #0c4a6e;">
                            <i class="fas fa-route"></i> Choose Clearance Method *
                        </label>
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <label style="display: flex; align-items: start; cursor: pointer; padding: 12px; background: white; border-radius: 6px; border: 2px solid #e0e0e0; transition: all 0.2s;">
                                <input type="radio" name="clearanceType" value="online" onchange="toggleClearanceMethod('online')" checked style="margin-right: 10px; margin-top: 4px;">
                                <div>
                                    <strong style="display: block; color: #800020;">📤 Submit Online</strong>
                                    <span style="font-size: 0.85rem; color: #666;">Upload documents and submit clearance online</span>
                                </div>
                            </label>
                            <label style="display: flex; align-items: start; cursor: pointer; padding: 12px; background: white; border-radius: 6px; border: 2px solid #e0e0e0; transition: all 0.2s;">
                                <input type="radio" name="clearanceType" value="direct_visit" onchange="toggleClearanceMethod('direct_visit')" style="margin-right: 10px; margin-top: 4px;">
                                <div>
                                    <strong style="display: block; color: #800020;">🏢 Direct Laboratory Visit</strong>
                                    <span style="font-size: 0.85rem; color: #666;">Visit the laboratory in person for consultation/clearance</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <!-- Direct Visit Message (Hidden by default) -->
                    <div id="directVisitMessage" style="display: none; margin-bottom: 20px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px;">
                        <p style="margin: 0; color: #78350f; font-weight: 600;">
                            <i class="fas fa-info-circle"></i> Please visit the laboratory office during office hours:
                        </p>
                        <ul style="margin: 10px 0 0 20px; color: #78350f;">
                            <li>Monday to Friday: 8:00 AM - 5:00 PM</li>
                            <li>Bring Student ID and any required documents</li>
                            <li>Location: Laboratory Office</li>
                        </ul>
                    </div>

                    <!-- Online Submission Form (Default visible) -->
                    <div id="onlineSubmissionForm">
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; font-weight: 600; margin-bottom: 8px;">
                                <i class="fas fa-microscope"></i> Did you borrow any laboratory equipment?
                            </label>
                        <div style="display: flex; gap: 15px;">
                            <label style="display: flex; align-items: center; cursor: pointer;">
                                <input type="radio" name="borrowedLabEquipment" value="yes" onchange="toggleLabEquipmentDetails(true)" style="margin-right: 8px;">
                                <span>Yes</span>
                            </label>
                            <label style="display: flex; align-items: center; cursor: pointer;">
                                <input type="radio" name="borrowedLabEquipment" value="no" onchange="toggleLabEquipmentDetails(false)" checked style="margin-right: 8px;">
                                <span>No</span>
                            </label>
                        </div>
                    </div>

                    <div id="labEquipmentDetailsSection" style="display: none; background: #f9fafb; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                        <h3 style="color: #800020; margin-bottom: 15px; font-size: 1rem;">
                            <i class="fas fa-clipboard-list"></i> Equipment Details
                        </h3>
                        
                        <div id="labEquipmentList"></div>
                        
                        <button type="button" onclick="addLabEquipmentItem()" class="btn btn-secondary" style="margin-top: 10px; padding: 8px 15px; font-size: 0.9rem;">
                            <i class="fas fa-plus"></i> Add Equipment
                        </button>
                    </div>
                    
                    <div id="labProofSection" style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 8px;">
                            Upload Proof (Optional)
                            <span id="labProofRequired" style="display: none; color: #dc2626;">*</span>
                        </label>
                        <input type="file" id="labProofFile" accept="image/*,.pdf" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;">
                        <p style="font-size: 0.85rem; color: #666; margin-top: 5px;">Accepted: Images (JPG, PNG) or PDF</p>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 8px;">Additional Notes (Optional)</label>
                        <textarea id="labNotes" rows="3" placeholder="Any additional information..." style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; resize: vertical;"></textarea>
                    </div>
                    
                    <button type="submit" class="btn btn-primary" style="width: 100%; padding: 15px;">
                        <i class="fas fa-paper-plane"></i> <span id="submitBtnText">Submit Clearance</span>
                    </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// ============================================
// TOGGLE CLEARANCE METHOD
// ============================================
function toggleClearanceMethod(method) {
    const onlineForm = document.getElementById('onlineSubmissionForm');
    const directMessage = document.getElementById('directVisitMessage');
    const submitBtnText = document.getElementById('submitBtnText');

    if (method === 'direct_visit') {
        onlineForm.style.display = 'none';
        directMessage.style.display = 'block';
        submitBtnText.textContent = 'Request Direct Visit';
    } else {
        onlineForm.style.display = 'block';
        directMessage.style.display = 'none';
        submitBtnText.textContent = 'Submit Clearance';
    }
}

// ============================================
// CLOSE LABORATORY MODAL
// ============================================
function closeLaboratoryModal() {
    const modal = document.getElementById('labClearanceModal');
    if (modal) modal.remove();
}

// ============================================
// TOGGLE EQUIPMENT DETAILS SECTION
// ============================================
function toggleLabEquipmentDetails(show) {
    const equipmentSection = document.getElementById('labEquipmentDetailsSection');
    const proofRequired = document.getElementById('labProofRequired');
    const proofFile = document.getElementById('labProofFile');

    if (show) {
        equipmentSection.style.display = 'block';
        proofRequired.style.display = 'inline';
        proofFile.required = true;
    } else {
        equipmentSection.style.display = 'none';
        proofRequired.style.display = 'none';
        proofFile.required = false;
        document.getElementById('labEquipmentList').innerHTML = '';
    }
}

// ============================================
// ADD EQUIPMENT ITEM
// ============================================
function addLabEquipmentItem() {
    const equipmentList = document.getElementById('labEquipmentList');
    const itemId = labEquipmentCounter++;

    const itemHTML = `
        <div class="lab-equipment-item" id="lab_equipment_${itemId}" style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 2px solid #e0e0e0; position: relative;">
            <button type="button" onclick="removeLabEquipmentItem(${itemId})" style="position: absolute; top: 10px; right: 10px; background: #dc2626; color: white; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer; font-size: 0.9rem;">×</button>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; font-weight: 600; margin-bottom: 5px; font-size: 0.9rem;">Equipment Name *</label>
                <select class="lab-equipment-name" required style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                    <option value="">Select equipment</option>
                    <option value="Beaker Set">Beaker Set</option>
                    <option value="Test Tubes">Test Tubes</option>
                    <option value="Microscope">Microscope</option>
                    <option value="Bunsen Burner">Bunsen Burner</option>
                    <option value="Pipettes">Pipettes</option>
                    <option value="Graduated Cylinder">Graduated Cylinder</option>
                    <option value="Petri Dishes">Petri Dishes</option>
                    <option value="Safety Goggles">Safety Goggles</option>
                    <option value="Lab Coat">Lab Coat</option>
                    <option value="Thermometer">Thermometer</option>
                    <option value="Flask">Flask</option>
                    <option value="Stirring Rod">Stirring Rod</option>
                    <option value="Funnel">Funnel</option>
                    <option value="Scale/Balance">Scale/Balance</option>
                    <option value="Other">Other (specify in notes)</option>
                </select>
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; font-weight: 600; margin-bottom: 5px; font-size: 0.9rem;">Quantity *</label>
                <input type="number" class="lab-equipment-quantity" min="1" value="1" required style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; font-weight: 600; margin-bottom: 5px; font-size: 0.9rem;">Date Borrowed *</label>
                <input type="date" class="lab-equipment-borrow-date" required style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; font-weight: 600; margin-bottom: 5px; font-size: 0.9rem;">Date Returned *</label>
                <input type="date" class="lab-equipment-return-date" required style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
            </div>
            
            <div>
                <label style="display: block; font-weight: 600; margin-bottom: 5px; font-size: 0.9rem;">Return Status *</label>
                <select class="lab-equipment-status" required style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                    <option value="">Select status</option>
                    <option value="returned_on_time">Returned on Time</option>
                    <option value="returned_late">Returned Late</option>
                    <option value="returned_damaged">Returned with Damage</option>
                    <option value="not_returned">Not Yet Returned</option>
                </select>
            </div>
        </div>
    `;

    equipmentList.insertAdjacentHTML('beforeend', itemHTML);
}

// ============================================
// REMOVE EQUIPMENT ITEM
// ============================================
function removeLabEquipmentItem(itemId) {
    const item = document.getElementById(`lab_equipment_${itemId}`);
    if (item) item.remove();
}

// ============================================
// HANDLE LABORATORY CLEARANCE SUBMISSION
// ============================================
async function handleLaboratorySubmit(e) {
    e.preventDefault();

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const clearanceType = document.querySelector('input[name="clearanceType"]:checked').value;

    if (!currentUser) {
        alert('Please log in to submit clearance');
        return;
    }

    // Handle Direct Visit Request
    if (clearanceType === 'direct_visit') {
        const confirmed = confirm('Are you sure you want to request a direct laboratory visit?\n\nYou will need to visit the laboratory office in person.');
        if (!confirmed) return;

        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

        try {
            const response = await fetch(`${window.API_URL}/api/laboratory/submit-clearance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    student_id: currentUser.student_number,
                    student_name: `${currentUser.first_name} ${currentUser.last_name}`,
                    student_email: currentUser.email,
                    section: `${currentUser.year}-${currentUser.section}`,
                    clearance_type: 'direct_visit',
                    borrowed_equipment: false,
                    equipment_items: [],
                    proof_image: null,
                    notes: 'Student requested direct laboratory visit for consultation',
                    submitted_at: new Date().toISOString()
                })
            });

            const data = await response.json();

            if (data.success) {
                alert('✅ Direct visit request submitted successfully!\n\nPlease visit the laboratory office during office hours:\nMonday to Friday: 8:00 AM - 5:00 PM\nLocation: Laboratory Office, 3rd Floor');
                closeLaboratoryModal();
                clearLaboratoryCache(currentUser.student_number);
                location.reload();
            } else {
                alert('❌ ' + (data.message || 'Failed to submit request'));
            }
        } catch (error) {
            console.error('Error submitting direct visit request:', error);
            alert('❌ Failed to submit request. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
        return;
    }

    // Handle Online Submission (original logic)
    const fileInput = document.getElementById('labProofFile');
    const notesInput = document.getElementById('labNotes');
    const borrowedEquipment = document.querySelector('input[name="borrowedLabEquipment"]:checked').value;

    let equipmentData = [];
    if (borrowedEquipment === 'yes') {
        const equipmentItems = document.querySelectorAll('.lab-equipment-item');

        if (equipmentItems.length === 0) {
            alert('Please add at least one equipment item or select "No" if you did not borrow any equipment.');
            return;
        }

        for (let item of equipmentItems) {
            const name = item.querySelector('.lab-equipment-name').value;
            const quantity = item.querySelector('.lab-equipment-quantity').value;
            const borrowDate = item.querySelector('.lab-equipment-borrow-date').value;
            const returnDate = item.querySelector('.lab-equipment-return-date').value;
            const status = item.querySelector('.lab-equipment-status').value;

            if (!name || !quantity || !borrowDate || !returnDate || !status) {
                alert('Please fill in all required fields for each equipment item.');
                return;
            }

            equipmentData.push({
                name: name,
                quantity: parseInt(quantity),
                date_borrowed: borrowDate,
                date_returned: returnDate,
                status: status
            });
        }

        if (fileInput.files.length === 0) {
            alert('Please upload proof of equipment return.');
            return;
        }
    }

    const confirmed = confirm('Are you sure you want to submit your Laboratory Equipment Clearance?\n\nThis action cannot be undone.');
    if (!confirmed) return;

    const notes = notesInput.value.trim();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

    try {
        let base64Image = null;
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            base64Image = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }

        const response = await fetch(`${window.API_URL}/api/laboratory/submit-clearance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                student_id: currentUser.student_number,
                student_name: `${currentUser.first_name} ${currentUser.last_name}`,
                student_email: currentUser.email,
                section: `${currentUser.year}-${currentUser.section}`,
                clearance_type: 'online',
                borrowed_equipment: borrowedEquipment === 'yes',
                equipment_items: equipmentData,
                proof_image: base64Image,
                notes: notes,
                submitted_at: new Date().toISOString()
            })
        });

        const data = await response.json();

        if (data.success) {
            alert('✅ Laboratory clearance submitted successfully!\n\nYour submission is pending admin approval.');
            closeLaboratoryModal();
            clearLaboratoryCache(currentUser.student_number);
            location.reload();
        } else {
            alert('❌ ' + (data.message || 'Failed to submit clearance'));
        }

    } catch (error) {
        console.error('Error submitting laboratory clearance:', error);
        alert('❌ Failed to submit clearance. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🧪 Laboratory module: DOMContentLoaded fired');
    console.log('🧪 Current path:', window.location.pathname);
    
    if (window.location.pathname.includes('studentclearance.html')) {
        console.log('🧪 Loading laboratory clearance card...');
        await addLaboratoryClearanceCard();
        console.log('🧪 Laboratory clearance card loaded');
    } else {
        console.log('🧪 Not on clearance page, skipping');
    }
});