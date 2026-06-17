// ==============================================
// GLOBAL VARIABLES AND INITIAL SETUP
// ==============================================

// Get all the section elements in the main wrapper
const sections = {
    'dashboard': document.getElementById('dashboardSection'),
    'events': document.getElementById('eventsSection'),
    'clearance': document.getElementById('clearanceSection'),
    'payments': document.getElementById('paymentsSection')
};

// Get modal elements
const createEventModal = document.getElementById('createEventModal');
const profileModal = document.getElementById('profileModal');
const paymentSettingsModal = document.getElementById('paymentSettingsModal');
const logoutModal = document.getElementById('logoutModal');
const simpleEventModal = document.getElementById('simpleEventModal');
const eventDateDisplay = document.getElementById('eventDateDisplay');
const quickEditEventModal = document.getElementById('quickEditEventModal');
const quickEditTitleDisplay = document.getElementById('quickEditTitleDisplay');
const deleteEventButton = document.getElementById('deleteQuickEventBtn');

// Get the sidebar element
const sidebar = document.getElementById('sidebar');

// Simple data structure for the current calendar view (hardcoded for Oct 2025)
const currentCalendar = {
    year: 2025,
    month: 10,
    monthName: "October"
};

// Empty data structures - to be populated from database
const mockEvents = {};
const studentClearanceData = {};
const paymentTransactions = [];

// ==============================================
// NAVIGATION AND SIDEBAR FUNCTIONS
// ==============================================

function toggleSidebar() {
    sidebar.classList.toggle('active');
}

function showSection(sectionId) {
    // Hide all sections
    for (let id in sections) {
        if (sections[id]) {
            sections[id].style.display = 'none';
        }
    }

    // Show target section
    const targetSection = sections[sectionId];
    if (targetSection) {
        targetSection.style.display = 'block';
    }

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    const activeLink = document.querySelector(`.nav-link[onclick*="${sectionId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // Close sidebar on mobile
    if (sidebar && sidebar.classList.contains('active')) {
        toggleSidebar();
    }

    // Initialize sections based on which one is shown
    if (sectionId === 'dashboard') {
        loadRecentActivity();
        updateDashboardStats();
    }

    // ⭐ ADD THIS: Initialize events section when it's shown
    if (sectionId === 'events') {
        console.log('📅 [Events] Switching to Events section...');

        // Give the DOM time to render
        setTimeout(() => {
            if (typeof initializeSCEventsSection === 'function') {
                console.log('✅ [Events] Calling initializeSCEventsSection()');
                initializeSCEventsSection();
            } else if (typeof initializeEventsSection === 'function') {
                console.log('✅ [Events] Calling initializeEventsSection()');
                initializeEventsSection();
            } else {
                console.error('❌ [Events] No initialization function found!');
            }
        }, 100);
    }

    if (sectionId === 'payments') {
        loadPaymentTransactions();
        updatePaymentStats();
    }
}

// ==============================================
// DASHBOARD FUNCTIONS
// ==============================================

function loadRecentActivity() {
    const activityContent = document.getElementById('eventsTableContent') ||
        document.querySelector('#dashboardSection .table-container');

    if (!activityContent) return;

    const events = Object.entries(mockEvents);

    if (events.length === 0) {
        const dashboardContainer = document.querySelector('#dashboardSection .table-container');
        if (dashboardContainer) {
            dashboardContainer.innerHTML = `
                    <div class="table-header">
                        <h2 class="table-title">Recent Activity</h2>
                    </div>
                    <div class="empty-state">
                        <div class="empty-icon"><i class="fa-solid fa-chart-column"></i></div>
                        <h2>No Recent Activity</h2>
                        <p>Start creating events and managing clearances to see activity here</p>
                    </div>
                `;
        }
        return;
    }

    let html = '<table><thead><tr><th>Event Name</th><th>Date</th><th>Time</th><th>Location</th><th>Category</th></tr></thead><tbody>';

    events.forEach(([date, event]) => {
        const categoryBadge = event.category === 'mandatory' ?
            '<span style="color:#dc2626; font-weight: 600;">MANDATORY</span>' :
            '<span style="color:#059669; font-weight: 600;">OPTIONAL</span>';

        html += `
                <tr>
                    <td>${event.title}</td>
                    <td>${date}</td>
                    <td>${event.time}</td>
                    <td>${event.location}</td>
                    <td>${categoryBadge}</td>
                </tr>
            `;
    });

    html += '</tbody></table>';

    const dashboardContainer = document.querySelector('#dashboardSection .table-container');
    if (dashboardContainer) {
        dashboardContainer.innerHTML = `
                <div class="table-header">
                    <h2 class="table-title">Recent Activity</h2>
                </div>
                ${html}
            `;
    }
}

function updateDashboardStats() {
    document.getElementById('totalEvents').textContent = Object.keys(mockEvents).length;
    document.getElementById('totalClearance').textContent = Object.keys(studentClearanceData).length;

    const totalPayments = paymentTransactions.reduce((sum, p) => sum + p.amount, 0);
    document.getElementById('totalPayments').textContent = `₱${totalPayments}`;
    document.getElementById('totalStudents').textContent = Object.keys(studentClearanceData).length;
}

// ==============================================
// ALL EVENTS TABLE FUNCTION
// ==============================================

function loadAllEventsTable() {
    const eventsTableContent = document.getElementById('eventsTableContent');

    if (!eventsTableContent) return;

    const events = Object.entries(mockEvents);

    if (events.length === 0) {
        eventsTableContent.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><i class="fa-solid fa-calendar-days"></i></div>
                    <h2>No Events Created</h2>
                    <p>Click "Create Event" to add your first event</p>
                </div>
            `;
        return;
    }

    let html = '<table><thead><tr><th>Event Name</th><th>Date</th><th>Time</th><th>Location</th><th>Category</th><th>Audience</th><th>Actions</th></tr></thead><tbody>';

    events.forEach(([date, event]) => {
        const categoryBadge = event.category === 'mandatory' ?
            '<span style="color:#dc2626; font-weight: 600;">MANDATORY</span>' :
            '<span style="color:#059669; font-weight: 600;">OPTIONAL</span>';

        html += `
                <tr>
                    <td>${event.title}</td>
                    <td>${date}</td>
                    <td>${event.time}</td>
                    <td>${event.location}</td>
                    <td>${categoryBadge}</td>
                    <td>${event.audience}</td>
                    <td>
                        <button class="btn btn-primary" style="padding: 6px 10px; font-size: 0.8rem;" onclick="editEvent('${date}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                    </td>
                </tr>
            `;
    });

    html += '</tbody></table>';
    eventsTableContent.innerHTML = html;
}

// ==============================================
// STUDENT CLEARANCE DETAILS MODAL
// ==============================================

function viewStudentDetails(studentId) {
    const student = studentClearanceData[studentId];

    if (!student) {
        alert("Student data not found!");
        return;
    }

    let modalHTML = `
            <div class="modal active" id="studentDetailsModal" style="display: flex;">
                <div class="modal-content" style="max-width: 800px;">
                    <span class="close-modal" onclick="closeStudentDetailsModal()">&times;</span>
                    <h2 class="modal-title">Student Clearance Details</h2>
                    
                    <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 10px;">
                        <h3 style="margin-bottom: 10px; color: #800020;">${student.name}</h3>
                        <p><strong>Student ID:</strong> ${studentId}</p>
                        <p><strong>Course & Year:</strong> ${student.course}</p>
                        <p><strong>Email:</strong> ${student.email}</p>
                        <p><strong>Current Status:</strong> <span style="color: ${student.status === 'CLEARED' ? '#059669' : '#f59e0b'}; font-weight: 600;">${student.status}</span></p>
                    </div>
                    
                    <h3 style="margin-bottom: 15px;">Event Attendance Records</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; margin-bottom: 20px;">`;

    if (student.eventAttendance && student.eventAttendance.length > 0) {
        student.eventAttendance.forEach(event => {
            modalHTML += `
                    <div style="border: 2px solid #e5e5e5; border-radius: 10px; padding: 10px; text-align: center;">
                        <img src="${event.photoUrl}" alt="${event.eventName}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;">
                        <p style="font-weight: 600; font-size: 0.9rem; margin-bottom: 5px;">${event.eventName}</p>
                        <p style="font-size: 0.85rem; color: #666;">${event.date}</p>
                        <span style="color: #059669; font-weight: 600; font-size: 0.85rem;">${event.status}</span>
                    </div>
                `;
        });
    } else {
        modalHTML += `<p style="text-align: center; color: #666;">No event attendance records found.</p>`;
    }

    modalHTML += `
                    </div>
                    
                    <div style="display: flex; gap: 15px; justify-content: center; padding-top: 20px; border-top: 1px solid #e5e5e5;">
                        <button class="btn btn-primary" onclick="approveClearance('${studentId}')" style="background: #059669;">
                            <i class="fas fa-check"></i> Approve Clearance
                        </button>
                        <button class="btn" onclick="rejectClearance('${studentId}')" style="background: #dc2626; color: white;">
                            <i class="fas fa-times"></i> Reject Clearance
                        </button>
                        <button class="btn btn-secondary" onclick="closeStudentDetailsModal()">
                            <i class="fas fa-arrow-left"></i> Close
                        </button>
                    </div>
                </div>
            </div>
        `;

    const existingModal = document.getElementById('studentDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeStudentDetailsModal() {
    const modal = document.getElementById('studentDetailsModal');
    if (modal) {
        modal.remove();
    }
}

function approveClearance(studentId) {
    if (confirm(`Approve clearance for ${studentClearanceData[studentId].name}?`)) {
        studentClearanceData[studentId].status = "CLEARED";
        alert(`Clearance approved for ${studentClearanceData[studentId].name}!`);
        closeStudentDetailsModal();
        if (sections['clearance'].style.display !== 'none') {
            location.reload();
        }
    }
}

function rejectClearance(studentId) {
    const reason = prompt(`Enter reason for rejecting clearance for ${studentClearanceData[studentId].name}:`);
    if (reason) {
        studentClearanceData[studentId].status = "REJECTED";
        alert(`Clearance rejected for ${studentClearanceData[studentId].name}.\nReason: ${reason}`);
        closeStudentDetailsModal();
        if (sections['clearance'].style.display !== 'none') {
            location.reload();
        }
    }
}

// ==============================================
// PAYMENT TRANSACTIONS FUNCTIONS
// ==============================================

function loadPaymentTransactions() {
    const paymentsTableContainer = document.querySelector('#paymentsSection .table-container');

    if (!paymentsTableContainer) return;

    if (paymentTransactions.length === 0) {
        paymentsTableContainer.innerHTML = `
                <div class="table-header">
                    <h2 class="table-title">Payment Transactions</h2>
                    <div class="search-box">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <input type="text" placeholder="Search transactions...">
                    </div>
                </div>
                <div class="empty-state">
                    <div class="empty-icon"><i class="fa-solid fa-peso-sign"></i></div>
                    <h2>No Payment Transactions</h2>
                    <p>Student payment submissions will appear here</p>
                </div>
            `;
        return;
    }

    let html = `
            <div class="table-header">
                <h2 class="table-title">Payment Transactions</h2>
                <div class="search-box">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" placeholder="Search transactions..." id="paymentSearch">
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Student ID</th>
                        <th>Name</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Reference</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

    paymentTransactions.forEach(payment => {
        const statusBadge = payment.status === 'Verified' ?
            '<span style="color:#059669; font-weight: 600;">VERIFIED</span>' :
            '<span style="color:#f59e0b; font-weight: 600;">PENDING</span>';

        const actionButton = payment.status === 'Pending' ?
            `<button class="btn btn-primary" style="padding: 6px 10px; font-size: 0.8rem;" onclick="openVerifyPaymentModal(${payment.id})">
                    <i class="fas fa-check"></i> Verify
                </button>` :
            '<span style="color: #999;">Verified</span>';

        html += `
                <tr>
                    <td>${payment.studentId}</td>
                    <td>${payment.name}</td>
                    <td>₱${payment.amount}</td>
                    <td>${payment.date}</td>
                    <td>${payment.reference}</td>
                    <td>${statusBadge}</td>
                    <td>${actionButton}</td>
                </tr>
            `;
    });

    html += '</tbody></table>';
    paymentsTableContainer.innerHTML = html;

    const searchInput = document.getElementById('paymentSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            const searchTerm = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#paymentsSection table tbody tr');

            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }
}

function openVerifyPaymentModal(paymentId) {
    const payment = paymentTransactions.find(p => p.id === paymentId);

    if (!payment) {
        alert("Payment not found!");
        return;
    }

    let modalHTML = `
            <div class="modal active" id="verifyPaymentModal" style="display: flex !important; z-index: 10000;">
                <div class="modal-content" style="max-width: 500px;">
                    <span class="close-modal" onclick="closeVerifyPaymentModal()">&times;</span>
                    <h2 class="modal-title">Verify Payment</h2>
                    
                    <p style="margin-bottom: 20px; color: #666; text-align: center;">
                        Are you sure you want to verify this payment?
                    </p>
                    
                    <div style="display: flex; gap: 15px; justify-content: center;">
                        <button class="btn btn-primary" onclick="confirmVerifyPayment(${payment.id})" style="background: #059669;">
                            <i class="fas fa-check"></i> Confirm Verification
                        </button>
                        <button class="btn btn-secondary" onclick="closeVerifyPaymentModal()">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;

    const existingModal = document.getElementById('verifyPaymentModal');
    if (existingModal) {
        existingModal.remove();
    }

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeVerifyPaymentModal() {
    const modal = document.getElementById('verifyPaymentModal');
    if (modal) {
        modal.remove();
    }
}

function confirmVerifyPayment(paymentId) {
    const payment = paymentTransactions.find(p => p.id === paymentId);
    if (payment) {
        payment.status = 'Verified';
        alert('Payment verified successfully!');
        closeVerifyPaymentModal();
        loadPaymentTransactions();
        updatePaymentStats();
    }
}

function verifyPayment(paymentId) {
    openVerifyPaymentModal(paymentId);
}

function updatePaymentStats() {
    const totalCollected = paymentTransactions
        .filter(p => p.status === 'Verified')
        .reduce((sum, p) => sum + p.amount, 0);

    const pendingCount = paymentTransactions.filter(p => p.status === 'Pending').length;
    const verifiedCount = paymentTransactions.filter(p => p.status === 'Verified').length;

    const statsCards = document.querySelectorAll('#paymentsSection .stat-card');
    if (statsCards[0]) statsCards[0].querySelector('.stat-value').textContent = `₱${totalCollected}`;
    if (statsCards[1]) statsCards[1].querySelector('.stat-value').textContent = pendingCount;
    if (statsCards[2]) statsCards[2].querySelector('.stat-value').textContent = verifiedCount;
}

// ==============================================
// MODAL MANAGEMENT FUNCTIONS
// ==============================================

function openProfileModal() { if (profileModal) profileModal.style.display = 'flex'; }
function closeProfileModal() { if (profileModal) profileModal.style.display = 'none'; }
function openCreateEventModal() {
    if (createEventModal) {
        const form = document.getElementById('createEventForm');
        form.removeAttribute('data-mode');
        form.removeAttribute('data-edit-date');
        form.reset();

        createEventModal.querySelector('.modal-title').textContent = 'Create New Event';
        createEventModal.querySelector('button[type="submit"]').innerHTML = '<span><i class="fa-solid fa-plus"></i></span><span>Create Event</span>';

        document.getElementById('eventDate').removeAttribute('disabled');

        createEventModal.style.display = 'flex';
    }
}
function closeCreateEventModal() {
    if (createEventModal) {
        document.getElementById('eventDate').removeAttribute('disabled');
        createEventModal.style.display = 'none';
    }
}
function openPaymentSettingsModal() { if (paymentSettingsModal) paymentSettingsModal.style.display = 'flex'; }
function closePaymentSettingsModal() { if (paymentSettingsModal) paymentSettingsModal.style.display = 'none'; }
function logout() { if (logoutModal) logoutModal.style.display = 'flex'; }
function closeLogoutModal() { if (logoutModal) logoutModal.style.display = 'none'; }
function confirmLogout() { window.location.href = '../user/studentlogin.html'; }

function openSimpleEventModal() { if (simpleEventModal) simpleEventModal.style.display = 'flex'; }
function closeSimpleEventModal() { if (simpleEventModal) simpleEventModal.style.display = 'none'; }

function openQuickEditEventModal() {
    if (quickEditEventModal) quickEditEventModal.style.display = 'flex';
}
function closeQuickEditEventModal() {
    if (quickEditEventModal) quickEditEventModal.style.display = 'none';
}

// ==============================================
// FORM UTILITY FUNCTIONS
// ==============================================

function toggleSpecificAudience(context) {
    let audienceSelect, specificDiv;

    if (context === 'event') {
        audienceSelect = document.getElementById('eventAudience');
        specificDiv = document.getElementById('specificEventAudienceGroup');
    } else {
        // Add other contexts if needed
        return;
    }

    if (!specificDiv || !audienceSelect) {
        console.error('Required elements not found');
        return;
    }

    if (audienceSelect.value === 'Other (Specify)') {
        specificDiv.style.display = 'block';
    } else {
        specificDiv.style.display = 'none';
    }
}

// ==============================================
// EDIT EVENT FUNCTIONALITY
// ==============================================

function editEvent(dateKey) {
    const eventData = mockEvents[dateKey];

    if (!eventData) {
        alert("Error: Event details not found!");
        return;
    }

    closeSimpleEventModal();

    document.getElementById('quickEditDate').value = dateKey;
    document.getElementById('quickEditEventTitle').value = eventData.title || '';
    document.getElementById('quickEditStartTime').value = eventData.startTime || '';
    document.getElementById('quickEditEndTime').value = eventData.endTime || '';
    document.getElementById('quickEditEventAudienceInput').value = eventData.audience || 'All Students';

    quickEditTitleDisplay.textContent = eventData.title;

    if (deleteEventButton) {
        deleteEventButton.onclick = null;
        deleteEventButton.onclick = () => deleteQuickEvent(dateKey);
    }

    openQuickEditEventModal();
}

function deleteQuickEvent(dateKey) {
    if (!dateKey || !mockEvents[dateKey]) {
        alert("Error: No event selected for deletion.");
        return;
    }

    if (confirm(`Are you sure you want to delete the event: "${mockEvents[dateKey].title}" on ${dateKey}? This action cannot be undone.`)) {

        const deletedTitle = mockEvents[dateKey].title;

        delete mockEvents[dateKey];

        closeQuickEditEventModal();

        const dayElement = document.querySelector(`.calendar-day[data-date="${dateKey}"]`);
        if (dayElement) {
            dayElement.classList.remove('event');

            const backFace = dayElement.querySelector('.event-back-face');
            const editBtn = dayElement.querySelector('.edit-event-icon-btn');
            if (backFace) backFace.remove();
            if (editBtn) editBtn.remove();

            if (dayElement.textContent.trim() !== '') {
                dayElement.addEventListener('click', handleDayClickForAdminWrapper);
            }
        }

        loadAllEventsTable();
        loadRecentActivity();
        updateDashboardStats();

        alert(`Event "${deletedTitle}" on ${dateKey} has been successfully deleted.`);
    }
}

// ==============================================
// EVENT/FORM HANDLING
// ==============================================

function handleCreateEvent(e) {
    e.preventDefault();

    const form = document.getElementById('createEventForm');
    const mode = form.getAttribute('data-mode');

    const dateKey = form.getAttribute('data-edit-date') || document.getElementById('eventDate').value;

    const selectedAudience = document.getElementById('eventAudience').value;
    const specificAudienceInput = document.getElementById('specificEventAudience');
    let finalAudience = selectedAudience;
    if ((selectedAudience === 'Other (Specify)' || selectedAudience === 'Clearance Requirement') && specificAudienceInput.value) {
        finalAudience = specificAudienceInput.value;
    }

    const eventTitle = document.getElementById('eventTitle').value;
    const description = document.getElementById('eventDescription').value;
    const location = document.getElementById('eventLocation').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const duration = document.getElementById('eventDuration').value;
    const eventCategory = document.getElementById('eventCategory').value;
    const organizer = document.getElementById('eventOrganizer').value;
    const isClearance = document.getElementById('eventIsClearance').checked;

    mockEvents[dateKey] = {
        title: eventTitle,
        time: `${startTime} - ${endTime}`,
        startTime: startTime,
        endTime: endTime,
        duration: duration,
        description: description,
        location: location,
        category: eventCategory,
        audience: finalAudience,
        admin: organizer,
        isClearance: isClearance
    };

    let message = (mode === 'edit')
        ? `Event "${eventTitle}" for ${dateKey} SAVED successfully!`
        : `New Event "${eventTitle}" CREATED for ${dateKey}!`;

    alert(message);

    closeCreateEventModal();
    form.reset();
    form.removeAttribute('data-mode');
    form.removeAttribute('data-edit-date');

    updateCalendarDayStatus(dateKey);
    populateEventFlipFaces();
    loadAllEventsTable();
    loadRecentActivity();
    updateDashboardStats();
}

function handleSimpleEvent(e) {
    e.preventDefault();

    const title = document.getElementById('simpleEventTitle').value;
    const startTime = document.getElementById('simpleStartTime').value;
    const endTime = document.getElementById('simpleEndTime').value;
    const dateKey = document.getElementById('simpleEventDate').value;
    const finalAudience = document.getElementById('simpleEventAudienceInput').value;
    const isClearance = document.getElementById('simpleEventIsClearance').checked;

    mockEvents[dateKey] = {
        title: title,
        time: `${startTime} - ${endTime}`,
        startTime: startTime,
        endTime: endTime,
        duration: "N/A",
        description: `Quick Post. Target: ${finalAudience}`,
        location: "TBA",
        category: "optional",
        audience: finalAudience,
        admin: "Student Council",
        isClearance: isClearance
    };

    closeSimpleEventModal();
    document.getElementById('simpleEventForm').reset();

    updateCalendarDayStatus(dateKey);
    populateEventFlipFaces();
    loadAllEventsTable();
    loadRecentActivity();
    updateDashboardStats();

    alert(`Quick Event "${title}" posted for ${dateKey}.`);
}

function handleQuickEditEvent(e) {
    e.preventDefault();

    const dateKey = document.getElementById('quickEditDate').value;
    const title = document.getElementById('quickEditEventTitle').value;
    const startTime = document.getElementById('quickEditStartTime').value;
    const endTime = document.getElementById('quickEditEndTime').value;
    const finalAudience = document.getElementById('quickEditEventAudienceInput').value;
    const isClearance = document.getElementById('quickEditEventIsClearance').checked;

    const existingData = mockEvents[dateKey];

    if (existingData) {
        existingData.title = title;
        existingData.time = `${startTime} - ${endTime}`;
        existingData.startTime = startTime;
        existingData.endTime = endTime;
        existingData.audience = finalAudience;
        existingData.isClearance = isClearance;

        existingData.description = existingData.description.startsWith('Quick Post')
            ? `Quick Post. Target: ${finalAudience}`
            : existingData.description;
    }

    closeQuickEditEventModal();
    document.getElementById('quickEditEventForm').reset();

    closeSimpleEventModal();
    closeCreateEventModal();

    populateEventFlipFaces();
    loadAllEventsTable();
    loadRecentActivity();

    alert(`Event "${title}" updated successfully!`);
}

function handlePaymentSettings(e) {
    e.preventDefault();
    const title = document.getElementById('paymentTitle').value;
    const amount = document.getElementById('paymentAmount').value;
    console.log(`Payment Setting Saved: ${title} (₱${amount})`);
    alert(`Payment setting for "${title}" saved successfully!`);
    closePaymentSettingsModal();
    document.getElementById('paymentSettingsForm').reset();
}

// ==============================================
// CALENDAR DYNAMIC UPDATE FUNCTIONS
// ==============================================

function updateCalendarDayStatus(dateKey) {
    const dayElement = document.querySelector(`.calendar-day[data-date="${dateKey}"]`);

    if (dayElement && !dayElement.classList.contains('event')) {
        dayElement.classList.add('event');

        if (!dayElement.querySelector('.event-back-face')) {
            const backFaceDiv = document.createElement('div');
            backFaceDiv.className = 'event-back-face';
            dayElement.appendChild(backFaceDiv);
        }

        if (!dayElement.querySelector('.edit-event-icon-btn')) {
            const editButton = document.createElement('button');
            editButton.className = 'edit-event-icon-btn';
            editButton.setAttribute('data-date', dateKey);
            editButton.innerHTML = '<i class="fas fa-pencil-alt"></i>';
            dayElement.appendChild(editButton);
        }
    }
}

function setupCalendarClickForAdmin() {
    const calendarDays = document.querySelectorAll('.calendar-day:not(.header)');

    calendarDays.forEach(day => {
        const dateKey = day.getAttribute('data-date');

        if (!day.classList.contains('event') && day.textContent.trim() !== '') {
            day.removeEventListener('click', handleDayClickForAdminWrapper);
            day.addEventListener('click', handleDayClickForAdminWrapper);
        }

        if (day.classList.contains('event')) {
            day.removeEventListener('click', handleDayClickForAdminWrapper);
        }
    });
}

function handleDayClickForAdminWrapper(e) {
    const clickedDayElement = e.currentTarget;
    const dayNumber = clickedDayElement.textContent.trim();

    const year = currentCalendar.year;
    const month = currentCalendar.month;

    const formattedMonth = String(month).padStart(2, '0');
    const formattedDay = String(dayNumber).padStart(2, '0');
    const fullDate = `${year}-${formattedMonth}-${formattedDay}`;

    document.getElementById('simpleEventDate').value = fullDate;
    document.getElementById('eventDateDisplay').textContent = `${currentCalendar.monthName} ${dayNumber}, ${year}`;

    openSimpleEventModal();
}

function populateEventFlipFaces() {
    const calendarDays = document.querySelectorAll('.calendar-day.event');

    calendarDays.forEach(day => {
        const fullDate = day.getAttribute('data-date');
        const eventData = mockEvents[fullDate];
        const backFace = day.querySelector('.event-back-face');
        let editButton = day.querySelector('.edit-event-icon-btn');
        if (!editButton) {
            editButton = document.createElement('button');
            editButton.className = 'edit-event-icon-btn';
            editButton.setAttribute('data-date', fullDate);
            editButton.innerHTML = '<i class="fas fa-pencil-alt"></i>';
            day.appendChild(editButton);
        } else {
            editButton.setAttribute('data-date', fullDate);
        }

        if (eventData && backFace) {
            backFace.innerHTML = `
                <p class="event-title">${eventData.title}</p>
                <p class="event-time"><i class="fa-regular fa-clock"></i> ${eventData.time}</p>
                <p class="event-admin">By: ${eventData.admin}</p>
                <p class="event-description">${eventData.description.substring(0, 50)}...</p>
            `;
        } else if (backFace) {
            backFace.innerHTML = '<p class="event-title">No Details Found</p>';
        }
    });
}
// ==============================================
// EVENT DELEGATION FOR DYNAMIC ELEMENTS
// ==============================================
document.addEventListener('click', function (e) {
    const targetButton = e.target.closest('.edit-event-icon-btn');
    if (targetButton) {
        e.stopPropagation();

        const dateToEdit = targetButton.getAttribute('data-date');
        editEvent(dateToEdit);
    }
});
// ==============================================
// EVENT LISTENERS (Run on page load)
// ==============================================
document.addEventListener('DOMContentLoaded', () => {
    showSection('dashboard');
    document.querySelectorAll('.close-modal').forEach(span => {
        span.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal') || e.target.closest('.logout-modal');
            if (modal) {
                if (modal.id === 'createEventModal') {
                    closeCreateEventModal();
                } else if (modal.id === 'quickEditEventModal') {
                    closeQuickEditEventModal();
                } else if (modal.id === 'simpleEventModal') {
                    closeSimpleEventModal();
                } else {
                    modal.style.display = 'none';
                }
            }
        });
    });

    const createEventForm = document.getElementById('createEventForm');
    if (createEventForm) {
        createEventForm.addEventListener('submit', handleCreateEvent);
    }

    const simpleEventForm = document.getElementById('simpleEventForm');
    if (simpleEventForm) {
        simpleEventForm.addEventListener('submit', handleSimpleEvent);
    }

    const quickEditEventForm = document.getElementById('quickEditEventForm');
    if (quickEditEventForm) {
        quickEditEventForm.addEventListener('submit', handleQuickEditEvent);
    }

    const paymentSettingsForm = document.getElementById('paymentSettingsForm');
    if (paymentSettingsForm) {
        paymentSettingsForm.addEventListener('submit', handlePaymentSettings);
    }

    const openPaymentSettingsBtn = document.getElementById('openPaymentSettings');
    if (openPaymentSettingsBtn) {
        openPaymentSettingsBtn.addEventListener('click', openPaymentSettingsModal);
    }

    window.onclick = function (event) {
        if (event.target.id === 'createEventModal') {
            closeCreateEventModal();
        } else if (event.target.id === 'quickEditEventModal') {
            closeQuickEditEventModal();
        } else if (event.target.id === 'simpleEventModal') {
            closeSimpleEventModal();
        } else if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    }
});