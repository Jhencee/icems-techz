// ============================================
// STUDENT CLEARANCE PAGE - LOAD CLEARANCE EVENTS
// (Gymnasium code removed - now in gymnasiumclearance.js)
// ============================================

window.API_URL = window.API_URL || 'http://127.0.0.1:8000';

let clearanceEvents = [];

// ============================================
// LOAD USER PROFILE DATA
// ============================================
function loadUserProfileData() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (!currentUser) {
        console.error('❌ No user logged in');
        window.location.href = 'studentlogin.html';
        return null;
    }

    // Update sidebar profile
    const fullName = `${currentUser.first_name} ${currentUser.last_name}`;
    const initials = `${currentUser.first_name.charAt(0)}${currentUser.last_name.charAt(0)}`.toUpperCase();
    const courseYear = `${currentUser.course || 'N/A'} ${currentUser.year || ''}`.trim();
    const studentNumber = currentUser.student_number || 'N/A';

    // Update sidebar elements
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    const sidebarName = document.getElementById('sidebarName');
    const sidebarId = document.getElementById('sidebarId');

    if (sidebarAvatar) sidebarAvatar.textContent = initials;
    if (sidebarName) sidebarName.textContent = fullName;
    if (sidebarId) sidebarId.textContent = `${courseYear} | ${studentNumber}`;

    // Load saved avatar if exists
    const savedAvatar = localStorage.getItem(`avatar_${currentUser.id}`);
    if (savedAvatar && sidebarAvatar) {
        sidebarAvatar.style.backgroundImage = `url(${savedAvatar})`;
        sidebarAvatar.style.backgroundSize = 'cover';
        sidebarAvatar.style.backgroundPosition = 'center';
        sidebarAvatar.style.color = 'transparent';
    }

    console.log('✅ User profile loaded:', fullName);
    return currentUser;
}

// ============================================
// LOAD CLEARANCE EVENTS FROM DATABASE
// Only events where is_clearance = true
// ============================================
async function loadClearanceEvents() {
    console.log('🔍 Loading clearance-required events...');

    const clearanceContainer = document.getElementById('clearanceContainer');
    if (clearanceContainer) {
        clearanceContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; grid-column: 1/-1;">
                <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #800020;"></i>
                <p style="margin-top: 15px; color: #666;">Loading clearance requirements...</p>
            </div>
        `;
    }

    try {
        const response = await fetch(`${window.API_URL}/api/events`);
        const data = await response.json();

        if (data.success) {
            // Filter only events that count toward clearance
            clearanceEvents = data.events.filter(event => event.is_clearance === true || event.is_clearance === 1);

            console.log('✅ Clearance events loaded:', clearanceEvents.length);
            console.log('Events:', clearanceEvents);

            await displayClearanceEvents(clearanceEvents);
            await updateClearanceStats();
        } else {
            showEmptyClearanceState('Failed to load clearance requirements');
        }
    } catch (error) {
        console.error('❌ Error loading clearance events:', error);
        showEmptyClearanceState('Cannot connect to server. Make sure Laravel is running.');
    }
}

// ============================================
// DISPLAY CLEARANCE EVENTS AS CARDS + GYMNASIUM CARD
// ============================================
async function displayClearanceEvents(events) {
    const clearanceContainer = document.getElementById('clearanceContainer');
    if (!clearanceContainer) return;

    clearanceContainer.innerHTML = '';

    // ============================================
    // FIXED GYMNASIUM CLEARANCE CARD (ALWAYS FIRST)
    // Using fetchGymnasiumClearanceStatus() from gymnasiumclearance.js
    // ============================================
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    // Get gymnasium clearance status
    const gymData = await fetchGymnasiumClearanceStatus(currentUser.student_number);
    const gymStatus = gymData.status;
    const gymRemarks = gymData.remarks;

    const gymCard = document.createElement('div');
    gymCard.className = `clearance-card ${gymStatus === 'approved' ? 'completed' : 'required'}`;
    gymCard.setAttribute('data-status', gymStatus === 'approved' ? 'completed' : 'required');

    // Determine status badge
    let statusBadge = '';
    if (gymStatus === 'approved') {
        statusBadge = '<span class="clearance-status completed"><i class="fas fa-check-circle"></i> Approved</span>';
    } else if (gymStatus === 'rejected') {
        statusBadge = '<span class="clearance-status required"><i class="fas fa-times-circle"></i> Rejected</span>';
    } else if (gymStatus === 'pending') {
        statusBadge = '<span class="clearance-status" style="background: #d97706;"><i class="fas fa-clock"></i> Pending Review</span>';
    } else {
        // not_submitted
        statusBadge = '<span class="clearance-status required"><i class="fas fa-circle-exclamation"></i> Not Submitted</span>';
    }

    gymCard.innerHTML = `
        <div class="clearance-header">
            <div class="clearance-title">
                <i class="fas fa-dumbbell" style="margin-right: 8px;"></i>
                Gymnasium Clearance
            </div>
            ${statusBadge}
        </div>
        <div class="clearance-details">
            Submit clearance for sports equipment, uniforms, or any borrowed items from the gymnasium.
        </div>
        ${gymStatus === 'rejected' && gymRemarks ? `
            <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 12px; margin: 15px 0; border-radius: 6px;">
                <strong style="color: #991b1b;"><i class="fas fa-exclamation-triangle"></i> Rejection Reason:</strong>
                <p style="color: #991b1b; margin: 5px 0 0 0;">${gymRemarks}</p>
            </div>
        ` : ''}
        ${gymStatus === 'approved' && gymRemarks ? `
            <div style="background: #d1fae5; border-left: 4px solid #059669; padding: 12px; margin: 15px 0; border-radius: 6px;">
                <strong style="color: #065f46;"><i class="fas fa-check-circle"></i> Remarks:</strong>
                <p style="color: #065f46; margin: 5px 0 0 0;">${gymRemarks}</p>
            </div>
        ` : ''}
        <div class="clearance-requirements">
            <h4>Requirements:</h4>
            <ul class="requirement-list">
                <li class="requirement-item"><i class="fas fa-circle-check"></i> Return all borrowed equipment</li>
                <li class="requirement-item"><i class="fas fa-circle-check"></i> Return PE uniforms (if applicable)</li>
                <li class="requirement-item"><i class="fas fa-circle-check"></i> Settle any outstanding fines</li>
                <li class="requirement-item"><i class="fas fa-circle-check"></i> Submit proof of return</li>
            </ul>
        </div>
        <div class="clearance-actions">
            ${gymStatus === 'not_submitted'
            ? '<button class="btn btn-primary" onclick="submitGymnasiumClearance()"><i class="fas fa-upload"></i> Submit Clearance</button>'
            : gymStatus === 'pending'
                ? '<button class="btn btn-secondary" disabled style="opacity: 0.5;"><i class="fas fa-clock"></i> Pending Review</button>'
                : gymStatus === 'rejected'
                    ? '<button class="btn btn-primary" onclick="submitGymnasiumClearance()"><i class="fas fa-redo"></i> Resubmit Clearance</button>'
                    : '<button class="btn btn-secondary" disabled style="opacity: 0.5;"><i class="fas fa-check"></i> Approved</button>'}
        </div>
    `;

    clearanceContainer.appendChild(gymCard);

    // ============================================
    // EVENT-BASED CLEARANCES
    // ============================================
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    events.forEach(event => {
        const eventDate = new Date(event.event_date);
        const isPast = eventDate < today;
        const status = isPast ? 'completed' : 'required';

        const card = document.createElement('div');
        card.className = `clearance-card ${status}`;
        card.setAttribute('data-status', status);

        const statusBadge = isPast
            ? '<span class="clearance-status completed"><i class="fas fa-check-circle"></i> Completed</span>'
            : '<span class="clearance-status required"><i class="fas fa-circle-exclamation"></i> Required</span>';

        const formattedDate = eventDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        card.innerHTML = `
            <div class="clearance-header">
                <div class="clearance-title">${event.title}</div>
                ${statusBadge}
            </div>
            <div class="clearance-details">
                ${event.description}
            </div>
            <div class="clearance-requirements">
                <h4>Event Details:</h4>
                <ul class="requirement-list">
                    <li class="requirement-item"><i class="fas fa-calendar"></i> Date: ${formattedDate}</li>
                    <li class="requirement-item"><i class="fas fa-clock"></i> Time: ${event.time}</li>
                    <li class="requirement-item"><i class="fas fa-map-marker-alt"></i> Location: ${event.location}</li>
                    <li class="requirement-item"><i class="fas fa-users"></i> Audience: ${event.audience || 'All Students'}</li>
                </ul>
            </div>
            <div class="clearance-actions">
                <button class="btn btn-primary" onclick="viewClearanceEventDetails(${event.id})">
                    <i class="fas fa-info-circle"></i> View Details
                </button>
                ${!isPast ? '<button class="btn btn-secondary" onclick="submitAttendanceProof(' + event.id + ')"><i class="fas fa-upload"></i> Submit Proof</button>' : '<button class="btn btn-secondary" disabled style="opacity: 0.5;"><i class="fas fa-check"></i> Event Passed</button>'}
            </div>
        `;

        clearanceContainer.appendChild(card);
    });

    // Note: updateClearanceStats() is called separately after this function
}

// ============================================
// VIEW CLEARANCE EVENT DETAILS MODAL
// ============================================
function viewClearanceEventDetails(eventId) {
    const event = clearanceEvents.find(e => e.id === eventId);
    if (!event) return;

    const eventDate = new Date(event.event_date);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const modalHTML = `
        <div class="modal active" id="clearanceEventModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; justify-content: center; align-items: center;">
            <div class="modal-content" style="background: white; border-radius: 12px; padding: 30px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto; position: relative;">
                <span onclick="closeClearanceEventModal()" style="position: absolute; top: 15px; right: 20px; font-size: 2rem; cursor: pointer; color: #666;">&times;</span>
                
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="display: inline-block; background: #dc2626; color: white; padding: 8px 20px; border-radius: 20px; font-size: 0.85rem; font-weight: 700; margin-bottom: 15px;">
                        CLEARANCE REQUIREMENT
                    </div>
                    <h2 style="color: #800020; margin: 0;">${event.title}</h2>
                </div>
                
                <div style="background: #f9fafb; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                    <div style="margin-bottom: 12px;">
                        <i class="fas fa-calendar" style="color: #800020; width: 25px;"></i>
                        <strong>${formattedDate}</strong>
                    </div>
                    <div style="margin-bottom: 12px;">
                        <i class="fas fa-clock" style="color: #800020; width: 25px;"></i>
                        ${event.time}
                    </div>
                    <div style="margin-bottom: 12px;">
                        <i class="fas fa-map-marker-alt" style="color: #800020; width: 25px;"></i>
                        ${event.location}
                    </div>
                    <div style="margin-bottom: 12px;">
                        <i class="fas fa-users" style="color: #800020; width: 25px;"></i>
                        ${event.audience || 'All Students'}
                    </div>
                    <div>
                        <i class="fas fa-user-tie" style="color: #800020; width: 25px;"></i>
                        ${event.admin}
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #800020; margin-bottom: 10px;">Description</h3>
                    <p style="color: #666; line-height: 1.6;">${event.description}</p>
                </div>
                
                <div style="background: #dcfce7; padding: 15px; border-radius: 10px; border-left: 4px solid #059669;">
                    <i class="fas fa-check-circle" style="color: #059669;"></i>
                    <strong style="color: #166534;"> Attendance to this event is required for clearance</strong>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeClearanceEventModal() {
    const modal = document.getElementById('clearanceEventModal');
    if (modal) modal.remove();
}

// ============================================
// SUBMIT ATTENDANCE PROOF
// ============================================
function submitAttendanceProof(eventId) {
    const event = clearanceEvents.find(e => e.id === eventId);
    if (!event) return;

    const currentDate = new Date();
    const eventDate = new Date(event.event_date);
    const hasStarted = currentDate >= eventDate;

    const modalHTML = `
        <div class="modal active" id="submitProofModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; justify-content: center; align-items: center;">
            <div class="modal-content" style="background: white; border-radius: 12px; padding: 30px; max-width: 500px; width: 90%; position: relative;">
                <span onclick="closeSubmitProofModal()" style="position: absolute; top: 15px; right: 20px; font-size: 2rem; cursor: pointer; color: #666; line-height: 1;">&times;</span>
                
                <h2 style="color: #800020; margin-bottom: 20px;">
                    <i class="fas fa-upload"></i> Submit Attendance Proof
                </h2>
                
                <p style="color: #666; margin-bottom: 20px;">
                    Upload proof of attendance for: <strong>${event.title}</strong>
                </p>
                
                <form id="proofForm" onsubmit="handleProofSubmit(event, ${eventId})">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 8px;">Upload Photo/Document</label>
                        <input type="file" id="proofFile" accept="image/*,.pdf" required style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;">
                        <p style="font-size: 0.85rem; color: #666; margin-top: 5px;">Accepted: Images (JPG, PNG) or PDF</p>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 8px;">Notes (Optional)</label>
                        <textarea id="proofNotes" rows="3" placeholder="Add any additional notes..." style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; resize: vertical;"></textarea>
                    </div>
                    
                    ${!hasStarted ? `
                    <p id="eventNotStartedWarning" style="color: #dc2626; text-align: center; margin-bottom: 15px; font-size: 0.9rem;">
                        <i class="fas fa-info-circle"></i> Upload will be available when the event starts (${eventDate.toLocaleDateString()})
                    </p>
                    ` : ''}
                    
                    <button type="submit" id="submitProofBtn" class="btn btn-primary" style="width: 100%; padding: 15px; opacity: ${hasStarted ? '1' : '0.5'}; cursor: ${hasStarted ? 'pointer' : 'not-allowed'};" ${!hasStarted ? 'disabled' : ''}>
                        <i class="fas fa-paper-plane"></i> Submit Proof
                    </button>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeSubmitProofModal() {
    const modal = document.getElementById('submitProofModal');
    if (modal) modal.remove();
}

async function handleProofSubmit(e, eventId) {
    e.preventDefault();

    const fileInput = document.getElementById('proofFile');
    const notesInput = document.getElementById('proofNotes');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (!currentUser) {
        alert('Please log in to submit proof');
        return;
    }

    if (fileInput.files.length === 0) {
        alert('Please select a file to upload');
        return;
    }

    const event = clearanceEvents.find(e => e.id === eventId);

    const confirmed = confirm(`Are you sure you want to submit proof for "${event.title}"?\n\nThis action cannot be undone.`);

    if (!confirmed) {
        return;
    }

    const file = fileInput.files[0];
    const notes = notesInput.value.trim();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

    try {
        const base64Image = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        const response = await fetch(`${window.API_URL}/api/clearance/submit-proof`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                student_email: currentUser.email,
                event_id: eventId,
                proof_image: base64Image,
                notes: notes
            })
        });

        const data = await response.json();

        if (data.success) {
            alert('✅ Attendance proof submitted successfully!\n\nYour submission is pending admin approval.');
            closeSubmitProofModal();

            await loadClearanceEvents();
        } else {
            alert('❌ ' + (data.message || 'Failed to submit proof'));
        }

    } catch (error) {
        console.error('Error submitting proof:', error);
        alert('❌ Failed to submit proof. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// ============================================
// UPDATE CLEARANCE STATISTICS
// ============================================
async function updateClearanceStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completed = clearanceEvents.filter(e => new Date(e.event_date) < today).length;
    const required = clearanceEvents.filter(e => new Date(e.event_date) >= today).length;
    const total = clearanceEvents.length;

    // Use cached gymnasium status (already fetched in displayClearanceEvents)
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const gymData = await fetchGymnasiumClearanceStatus(currentUser.student_number);
    const gymPending = gymData.status === 'approved' ? 0 : 1;

    document.getElementById('completedCount').textContent = completed;
    document.getElementById('pendingCount').textContent = required + gymPending;
    document.getElementById('requiredCount').textContent = total + 1; // +1 for gymnasium

    console.log('📊 Clearance stats:', { completed, pending: required + gymPending, total: total + 1 });
}

// ============================================
// FILTER CLEARANCES
// ============================================
function filterClearances(filter) {
    const cards = document.querySelectorAll('.clearance-card');
    const buttons = document.querySelectorAll('.filter-btn');

    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    cards.forEach(card => {
        if (filter === 'all') {
            card.style.display = 'block';
        } else {
            card.style.display = card.dataset.status === filter ? 'block' : 'none';
        }
    });
}

// ============================================
// SHOW EMPTY STATE
// ============================================
function showEmptyClearanceState(message) {
    const clearanceContainer = document.getElementById('clearanceContainer');
    if (!clearanceContainer) return;

    clearanceContainer.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: #666; grid-column: 1/-1;">
            <div style="font-size: 4rem; color: #800020; margin-bottom: 20px;">
                <i class="fas fa-clipboard-list"></i>
            </div>
            <h2 style="color: #800020; margin-bottom: 10px;">No Clearance Requirements</h2>
            <p>${message}</p>
        </div>
    `;
}

// ============================================
// LOGOUT FUNCTIONS
// ============================================
function logout() {
    const modal = document.getElementById('logoutModal');
    if (modal) modal.style.display = 'flex';
}

function closeLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if (modal) modal.style.display = 'none';
}

function confirmLogout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'studentlogin.html';
}

window.onclick = function (event) {
    const logoutModal = document.getElementById('logoutModal');
    if (event.target === logoutModal) {
        closeLogoutModal();
    }
};

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📋 Student Clearance Page Loading...');

    const currentUser = loadUserProfileData();
    if (!currentUser) return;

    await loadClearanceEvents();

    console.log('✅ Clearance page initialized');
});