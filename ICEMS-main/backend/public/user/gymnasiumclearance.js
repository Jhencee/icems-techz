// ============================================
// GYMNASIUM CLEARANCE MODULE - OPTIMIZED
// Handles all gymnasium equipment clearance functionality
// with improved caching and reduced API calls
// ============================================

let equipmentCounter = 0;
let gymnasiumStatusCache = new Map(); // Cache per student number
let pendingRequests = new Map(); // Prevent duplicate simultaneous requests

// ============================================
// CLEAR GYMNASIUM CACHE
// ============================================
function clearGymnasiumCache(studentNumber = null) {
    if (studentNumber) {
        gymnasiumStatusCache.delete(studentNumber);
    } else {
        gymnasiumStatusCache.clear();
    }
}

// ============================================
// FETCH GYMNASIUM CLEARANCE STATUS (WITH CACHING)
// Returns the status and remarks for a student
// ============================================
async function fetchGymnasiumClearanceStatus(studentNumber, forceRefresh = false) {
    // Return cached result if available and not forcing refresh
    if (!forceRefresh && gymnasiumStatusCache.has(studentNumber)) {
        console.log('📦 Using cached gymnasium status for:', studentNumber);
        return gymnasiumStatusCache.get(studentNumber);
    }

    // If there's already a pending request for this student, wait for it
    if (pendingRequests.has(studentNumber)) {
        console.log('⏳ Waiting for existing request for:', studentNumber);
        return await pendingRequests.get(studentNumber);
    }

    // Create new request promise
    const requestPromise = (async () => {
        let result;
        
        try {
            const response = await fetch(`${window.API_URL}/api/gymnasium/clearance/${studentNumber}`);

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.clearance) {
                    console.log('✅ Gymnasium clearance found:', data.clearance.status);
                    result = {
                        status: data.clearance.status,
                        remarks: data.clearance.remarks || '',
                        exists: true
                    };
                } else {
                    result = {
                        status: 'not_submitted',
                        remarks: '',
                        exists: false
                    };
                }
            } else if (response.status === 404) {
                // 404 is expected when no clearance has been submitted yet (suppress error)
                console.log('ℹ️ No gymnasium clearance submitted yet');
                result = {
                    status: 'not_submitted',
                    remarks: '',
                    exists: false
                };
            } else {
                console.warn('⚠️ Unexpected response status:', response.status);
                result = {
                    status: 'not_submitted',
                    remarks: '',
                    exists: false
                };
            }

        } catch (error) {
            // Network error or other fetch failure
            console.log('ℹ️ Could not connect to server (network error)');
            result = {
                status: 'not_submitted',
                remarks: '',
                exists: false
            };
        } finally {
            // Cache the result
            gymnasiumStatusCache.set(studentNumber, result);
            // Remove from pending requests
            pendingRequests.delete(studentNumber);
        }
        
        return result;
    })();

    // Store the pending request
    pendingRequests.set(studentNumber, requestPromise);

    return await requestPromise;
}

// ============================================
// SUBMIT GYMNASIUM CLEARANCE MODAL
// ============================================
function submitGymnasiumClearance() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    const modalHTML = `
        <div class="modal active" id="gymClearanceModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; justify-content: center; align-items: center;">
            <div class="modal-content" style="background: white; border-radius: 12px; padding: 30px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto; position: relative;">
                <span onclick="closeGymnasiumModal()" style="position: absolute; top: 15px; right: 20px; font-size: 2rem; cursor: pointer; color: #666; line-height: 1;">&times;</span>
                
                <h2 style="color: #800020; margin-bottom: 20px;">
                    <i class="fas fa-dumbbell"></i> Gymnasium Clearance
                </h2>
                
                <p style="color: #666; margin-bottom: 20px;">
                    Please provide information about borrowed equipment and returns.
                </p>
                
                <form id="gymClearanceForm" onsubmit="handleGymnasiumSubmit(event)">
                    <!-- Borrowed Selection -->
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 8px;">
                            <i class="fas fa-basketball-ball"></i> Did you borrow any equipment?
                        </label>
                        <div style="display: flex; gap: 15px;">
                            <label style="display: flex; align-items: center; cursor: pointer;">
                                <input type="radio" name="borrowedEquipment" value="yes" onchange="toggleEquipmentDetails(true)" style="margin-right: 8px;">
                                <span>Yes</span>
                            </label>
                            <label style="display: flex; align-items: center; cursor: pointer;">
                                <input type="radio" name="borrowedEquipment" value="no" onchange="toggleEquipmentDetails(false)" checked style="margin-right: 8px;">
                                <span>No</span>
                            </label>
                        </div>
                    </div>

                    <!-- Equipment Details (Hidden by default) -->
                    <div id="equipmentDetailsSection" style="display: none; background: #f9fafb; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                        <h3 style="color: #800020; margin-bottom: 15px; font-size: 1rem;">
                            <i class="fas fa-clipboard-list"></i> Equipment Details
                        </h3>
                        
                        <div id="equipmentList">
                            <!-- Equipment items will be added here -->
                        </div>
                        
                        <button type="button" onclick="addEquipmentItem()" class="btn btn-secondary" style="margin-top: 10px; padding: 8px 15px; font-size: 0.9rem;">
                            <i class="fas fa-plus"></i> Add Equipment
                        </button>
                    </div>
                    
                    <!-- Upload Proof (Optional if no borrowed equipment) -->
                    <div id="proofSection" style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 8px;">
                            Upload Proof (Optional)
                            <span id="proofRequired" style="display: none; color: #dc2626;">*</span>
                        </label>
                        <input type="file" id="gymProofFile" accept="image/*,.pdf" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;">
                        <p style="font-size: 0.85rem; color: #666; margin-top: 5px;">Accepted: Images (JPG, PNG) or PDF</p>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 8px;">Additional Notes (Optional)</label>
                        <textarea id="gymNotes" rows="3" placeholder="Any additional information..." style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; resize: vertical;"></textarea>
                    </div>
                    
                    <button type="submit" class="btn btn-primary" style="width: 100%; padding: 15px;">
                        <i class="fas fa-paper-plane"></i> Submit Clearance
                    </button>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// ============================================
// CLOSE GYMNASIUM MODAL
// ============================================
function closeGymnasiumModal() {
    const modal = document.getElementById('gymClearanceModal');
    if (modal) modal.remove();
}

// ============================================
// TOGGLE EQUIPMENT DETAILS SECTION
// ============================================
function toggleEquipmentDetails(show) {
    const equipmentSection = document.getElementById('equipmentDetailsSection');
    const proofRequired = document.getElementById('proofRequired');
    const proofFile = document.getElementById('gymProofFile');

    if (show) {
        equipmentSection.style.display = 'block';
        proofRequired.style.display = 'inline';
        proofFile.required = true;
    } else {
        equipmentSection.style.display = 'none';
        proofRequired.style.display = 'none';
        proofFile.required = false;
        // Clear equipment list
        document.getElementById('equipmentList').innerHTML = '';
    }
}

// ============================================
// ADD EQUIPMENT ITEM
// ============================================
function addEquipmentItem() {
    const equipmentList = document.getElementById('equipmentList');
    const itemId = equipmentCounter++;

    const itemHTML = `
        <div class="equipment-item" id="equipment_${itemId}" style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 2px solid #e0e0e0; position: relative;">
            <button type="button" onclick="removeEquipmentItem(${itemId})" style="position: absolute; top: 10px; right: 10px; background: #dc2626; color: white; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer; font-size: 0.9rem;">×</button>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; font-weight: 600; margin-bottom: 5px; font-size: 0.9rem;">Equipment Name *</label>
                <select class="equipment-name" required style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                    <option value="">Select equipment</option>
                    <option value="Basketball">Basketball</option>
                    <option value="Volleyball">Volleyball</option>
                    <option value="Football">Football</option>
                    <option value="Badminton Racket">Badminton Racket</option>
                    <option value="Tennis Racket">Tennis Racket</option>
                    <option value="Volleyball Net">Volleyball Net</option>
                    <option value="Badminton Net">Badminton Net</option>
                    <option value="Cones">Cones</option>
                    <option value="Jump Rope">Jump Rope</option>
                    <option value="PE Uniform">PE Uniform</option>
                    <option value="Other">Other (specify in notes)</option>
                </select>
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; font-weight: 600; margin-bottom: 5px; font-size: 0.9rem;">Quantity *</label>
                <input type="number" class="equipment-quantity" min="1" value="1" required style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; font-weight: 600; margin-bottom: 5px; font-size: 0.9rem;">Date Borrowed *</label>
                <input type="date" class="equipment-borrow-date" required style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; font-weight: 600; margin-bottom: 5px; font-size: 0.9rem;">Date Returned *</label>
                <input type="date" class="equipment-return-date" required style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
            </div>
            
            <div>
                <label style="display: block; font-weight: 600; margin-bottom: 5px; font-size: 0.9rem;">Return Status *</label>
                <select class="equipment-status" required style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
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
function removeEquipmentItem(itemId) {
    const item = document.getElementById(`equipment_${itemId}`);
    if (item) {
        item.remove();
    }
}

// ============================================
// HANDLE GYMNASIUM CLEARANCE SUBMISSION
// ============================================
async function handleGymnasiumSubmit(e) {
    e.preventDefault();

    const fileInput = document.getElementById('gymProofFile');
    const notesInput = document.getElementById('gymNotes');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const borrowedEquipment = document.querySelector('input[name="borrowedEquipment"]:checked').value;

    if (!currentUser) {
        alert('Please log in to submit clearance');
        return;
    }

    // Collect equipment data if borrowed
    let equipmentData = [];
    if (borrowedEquipment === 'yes') {
        const equipmentItems = document.querySelectorAll('.equipment-item');

        if (equipmentItems.length === 0) {
            alert('Please add at least one equipment item or select "No" if you did not borrow any equipment.');
            return;
        }

        // Validate and collect equipment data
        for (let item of equipmentItems) {
            const name = item.querySelector('.equipment-name').value;
            const quantity = item.querySelector('.equipment-quantity').value;
            const borrowDate = item.querySelector('.equipment-borrow-date').value;
            const returnDate = item.querySelector('.equipment-return-date').value;
            const status = item.querySelector('.equipment-status').value;

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

        // Require proof if equipment was borrowed
        if (fileInput.files.length === 0) {
            alert('Please upload proof of equipment return.');
            return;
        }
    }

    const confirmed = confirm('Are you sure you want to submit your Gymnasium Clearance?\n\nThis action cannot be undone.');

    if (!confirmed) {
        return;
    }

    const notes = notesInput.value.trim();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

    try {
        // Convert image to base64 if file exists
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

        const response = await fetch(`${window.API_URL}/api/gymnasium/submit-clearance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                student_id: currentUser.student_number,
                student_name: `${currentUser.first_name} ${currentUser.last_name}`,
                student_email: currentUser.email,
                section: `${currentUser.year}-${currentUser.section}`,
                borrowed_equipment: borrowedEquipment === 'yes',
                equipment_items: equipmentData,
                proof_image: base64Image,
                notes: notes,
                submitted_at: new Date().toISOString()
            })
        });

        const data = await response.json();

        if (data.success) {
            alert('✅ Gymnasium clearance submitted successfully!\n\nYour submission is pending admin approval.');
            closeGymnasiumModal();

            // Clear cache for this student and reload
            clearGymnasiumCache(currentUser.student_number);
            if (typeof loadClearanceEvents === 'function') {
                await loadClearanceEvents();
            }
        } else {
            alert('❌ ' + (data.message || 'Failed to submit clearance'));
        }

    } catch (error) {
        console.error('Error submitting gymnasium clearance:', error);
        alert('❌ Failed to submit clearance. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}