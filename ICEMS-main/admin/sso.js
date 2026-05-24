// ============================================
// SSO.JS - WITH DATABASE INTEGRATION
// ============================================

const API_BASE_URL = 'http://localhost:8000/api'; // ⚠️ Change to your Laravel API URL

// Get all the section elements
const sections = {
    'dashboard': document.getElementById('dashboardSection'),
    'events': document.getElementById('eventsSection'),
    'clearance': document.getElementById('clearanceSection'),
    'payments': document.getElementById('paymentsSection')
};

// Get modal elements
const profileModal = document.getElementById('profileModal');
const logoutModal = document.getElementById('logoutModal');
const simpleEventModal = document.getElementById('simpleEventModal');
const eventDateDisplay = document.getElementById('eventDateDisplay');
const quickEditEventModal = document.getElementById('quickEditEventModal');
const quickEditTitleDisplay = document.getElementById('quickEditTitleDisplay');
const deleteEventButton = document.getElementById('deleteQuickEventBtn');
const sidebar = document.getElementById('sidebar');

// Current calendar view
let currentCalendar = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    monthName: new Date().toLocaleString('default', { month: 'long' })
};

// Event Data - loaded from database
let mockEvents = {};

// Student Clearance Data (can be moved to database later)
const studentClearanceData = {
    "2023-00126-SM-0": {
        name: "Borjal, Jhencee R.",
        course: "BSIT 3-2",
        status: "CLEARED",
        email: "jhencee.borjal@pupsmb.edu.ph",
        eventAttendance: []
    },
    "2023-00137-SM-0": {
        name: "Estinor, Michaela DG.",
        course: "BSIT 3-2",
        status: "PENDING",
        email: "michaela.estinor@pupsmb.edu.ph",
        eventAttendance: []
    }
};

// ============================================
// DATABASE API FUNCTIONS
// ============================================

async function loadEventsFromDatabase() {
    try {
        const response = await fetch(`${API_BASE_URL}/events`);
        const data = await response.json();

        if (data.success) {
            mockEvents = {};
            data.events.forEach(event => {
                mockEvents[event.event_date] = {
                    id: event.id,
                    title: event.title,
                    time: event.time,
                    startTime: event.start_time,
                    endTime: event.end_time,
                    duration: event.duration,
                    description: event.description,
                    location: event.location,
                    category: event.category,
                    audience: event.audience,
                    admin: event.admin,
                    isClearance: event.is_clearance
                };
            });
            console.log('✅ Loaded', data.events.length, 'events from database');
        }
    } catch (error) {
        console.error('❌ Failed to load events:', error);
        alert('Failed to connect to database. Please check if Laravel server is running.');
    }
}

async function createEventInDatabase(eventData) {
    try {
        const response = await fetch(`${API_BASE_URL}/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData)
        });

        const data = await response.json();

        if (data.success) {
            console.log('✅ Event created in database:', data.event);
            return data.event;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('❌ Failed to create event:', error);
        throw error;
    }
}

async function updateEventInDatabase(eventId, eventData) {
    try {
        const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData)
        });

        const data = await response.json();

        if (data.success) {
            console.log('✅ Event updated in database:', data.event);
            return data.event;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('❌ Failed to update event:', error);
        throw error;
    }
}

async function deleteEventFromDatabase(eventId) {
    try {
        const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const data = await response.json();

        if (data.success) {
            console.log('✅ Event deleted from database');
            return true;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('❌ Failed to delete event:', error);
        throw error;
    }
}

// ============================================
// NAVIGATION
// ============================================

function toggleSidebar() {
    sidebar.classList.toggle('active');
}

function showSection(sectionId) {
    // Hide all sections
    for (let id in sections) {
        if (sections[id]) sections[id].style.display = 'none';
    }

    // Show target section
    const targetSection = sections[sectionId];
    if (targetSection) targetSection.style.display = 'block';

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-link[onclick*="${sectionId}"]`);
    if (activeLink) activeLink.classList.add('active');

    // Close sidebar on mobile
    if (sidebar.classList.contains('active')) toggleSidebar();

    // Load section-specific data
    if (sectionId === 'dashboard') {
        loadRecentActivity();
        updateDashboardStats();
    }

    if (sectionId === 'events') {
        renderCalendar();
        loadAllEventsTable();
    }

    // ✨ FIX: Load clearance submissions when clearance section is shown
    if (sectionId === 'clearance') {
        console.log('📋 Loading clearance section...');
        loadClearanceSubmissions();
    }
}

// ============================================
// DASHBOARD FUNCTIONS
// ============================================

function loadRecentActivity() {
    const dashboardContainer = document.querySelector('#dashboardSection .table-container');
    if (!dashboardContainer) return;

    const events = Object.entries(mockEvents);

    if (events.length === 0) {
        dashboardContainer.innerHTML = `
            <div class="table-header"><h2 class="table-title">Recent Activity</h2></div>
            <div class="empty-state">
                <div class="empty-icon"><i class="fa-solid fa-chart-column"></i></div>
                <h2>No Recent Activity</h2>
                <p>Start creating events to see activity here</p>
            </div>
        `;
        return;
    }

    let html = '<div class="table-header"><h2 class="table-title">Recent Activity</h2></div>';
    html += '<table><thead><tr><th>Event Name</th><th>Date</th><th>Time</th><th>Location</th><th>Category</th></tr></thead><tbody>';

    events.forEach(([date, event]) => {
        const categoryBadge = event.category === 'mandatory' || event.isClearance ?
            '<span style="color:#dc2626; font-weight: 600;">Mandatory</span>' :
            '<span style="color:#059669; font-weight: 600;">Optional</span>';

        html += `<tr><td>${event.title}</td><td>${date}</td><td>${event.time}</td><td>${event.location}</td><td>${categoryBadge}</td></tr>`;
    });

    html += '</tbody></table>';
    dashboardContainer.innerHTML = html;
}

function updateDashboardStats() {
    document.getElementById('totalEvents').textContent = Object.keys(mockEvents).length;
    const clearanceElement = document.getElementById('totalClearance');
    if (clearanceElement) {
        clearanceElement.textContent = Object.keys(studentClearanceData).length;
    }
}

// ============================================
// CALENDAR RENDERING
// ============================================

function renderCalendar() {
    const calendarGrid = document.querySelector('.calendar-grid');
    if (!calendarGrid) return;

    const calendarHeader = document.querySelector('.calendar-header h3');
    if (calendarHeader) {
        calendarHeader.textContent = `${currentCalendar.monthName} ${currentCalendar.year}`;
    }

    calendarGrid.innerHTML = '';

    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day header';
        header.textContent = day;
        calendarGrid.appendChild(header);
    });

    const firstDay = new Date(currentCalendar.year, currentCalendar.month - 1, 1).getDay();
    const daysInMonth = new Date(currentCalendar.year, currentCalendar.month, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day';
        calendarGrid.appendChild(emptyDay);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';

        const formattedMonth = String(currentCalendar.month).padStart(2, '0');
        const formattedDay = String(day).padStart(2, '0');
        const dateKey = `${currentCalendar.year}-${formattedMonth}-${formattedDay}`;

        dayElement.setAttribute('data-date', dateKey);
        dayElement.textContent = day;

        if (mockEvents[dateKey]) {
            dayElement.classList.add('event');
            dayElement.style.cursor = 'pointer';
            dayElement.addEventListener('click', () => showEventDetailsModal(dateKey));
        } else {
            dayElement.style.cursor = 'pointer';
            dayElement.addEventListener('click', () => openQuickCreateModal(dateKey));
        }

        calendarGrid.appendChild(dayElement);
    }
}

function changeMonth(direction) {
    currentCalendar.month += direction;

    if (currentCalendar.month > 12) {
        currentCalendar.month = 1;
        currentCalendar.year++;
    } else if (currentCalendar.month < 1) {
        currentCalendar.month = 12;
        currentCalendar.year--;
    }

    currentCalendar.monthName = new Date(currentCalendar.year, currentCalendar.month - 1, 1)
        .toLocaleString('default', { month: 'long' });

    renderCalendar();
}

function goToToday() {
    const today = new Date();
    currentCalendar.year = today.getFullYear();
    currentCalendar.month = today.getMonth() + 1;
    currentCalendar.monthName = today.toLocaleString('default', { month: 'long' });
    renderCalendar();
}

// ============================================
// EVENT DETAILS MODAL
// ============================================

function showEventDetailsModal(dateKey) {
    const event = mockEvents[dateKey];
    if (!event) return;

    const eventDate = new Date(dateKey);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const categoryColor = event.category === 'mandatory' || event.isClearance ? '#dc2626' : '#059669';
    const categoryLabel = event.category === 'mandatory' || event.isClearance ? 'MANDATORY' : 'OPTIONAL';

    let modalHTML = `
        <div class="modal active" id="eventDetailsModal" style="display: flex; z-index: 10000;">
            <div class="modal-content" style="max-width: 600px;">
                <span class="close-modal" onclick="closeEventDetailsModal()">&times;</span>
                
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="display: inline-block; background: ${categoryColor}; color: white; padding: 8px 20px; border-radius: 20px; font-size: 0.85rem; font-weight: 700; margin-bottom: 15px;">
                        ${categoryLabel}
                    </div>
                    <h2 class="modal-title" style="color: #800020; margin: 0;">${event.title}</h2>
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
                
                ${event.isClearance ? `
                <div style="background: #dcfce7; padding: 15px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #059669;">
                    <i class="fas fa-check-circle" style="color: #059669;"></i>
                    <strong style="color: #166534;">This event counts toward clearance requirements</strong>
                </div>
                ` : ''}
                
                <div style="display: flex; gap: 10px; justify-content: center; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                    <button class="btn btn-primary" onclick="editEventFromModal('${dateKey}')" style="flex: 1;">
                        <i class="fas fa-edit"></i> Edit Event
                    </button>
                    <button class="btn btn-danger" onclick="deleteEventFromModal('${dateKey}')" style="flex: 1; background: #dc2626;">
                        <i class="fas fa-trash"></i> Delete Event
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeEventDetailsModal() {
    const modal = document.getElementById('eventDetailsModal');
    if (modal) modal.remove();
}

function editEventFromModal(dateKey) {
    closeEventDetailsModal();
    const event = mockEvents[dateKey];

    document.getElementById('quickEditDate').value = dateKey;
    document.getElementById('quickEditEventTitle').value = event.title || '';
    document.getElementById('quickEditStartTime').value = event.startTime || '';
    document.getElementById('quickEditEndTime').value = event.endTime || '';
    document.getElementById('quickEditEventAudienceInput').value = event.audience || 'All Students';
    document.getElementById('quickEditEventIsClearance').checked = event.isClearance || false;

    quickEditTitleDisplay.textContent = event.title;
    deleteEventButton.onclick = () => deleteQuickEvent(dateKey);

    openQuickEditEventModal();
}

async function deleteEventFromModal(dateKey) {
    const event = mockEvents[dateKey];

    if (!confirm(`Are you sure you want to delete "${event.title}"?`)) {
        return;
    }

    try {
        await deleteEventFromDatabase(event.id);
        delete mockEvents[dateKey];

        closeEventDetailsModal();
        renderCalendar();
        loadAllEventsTable();
        loadRecentActivity();
        updateDashboardStats();

        alert('Event deleted successfully!');
    } catch (error) {
        alert('Failed to delete event: ' + error.message);
    }
}

// ============================================
// CREATE EVENT MODAL (For "Create Event" button)
// ============================================

function openCreateEventModal() {
    const today = new Date().toISOString().split('T')[0];

    const modalHTML = `
        <div class="modal" id="createEventModalDynamic" style="display: flex;">
            <div class="modal-content">
                <span class="close-modal" onclick="closeCreateEventModalDynamic()">&times;</span>
                <h2 class="modal-title"><i class="fa-solid fa-calendar-plus"></i> Create New Event</h2>

                <form id="createEventFormDynamic">
                    <div class="form-group">
                        <label>Event Title *</label>
                        <input type="text" class="form-input" id="dynamicEventTitle" placeholder="Enter event title" required>
                    </div>

                    <div class="form-group">
                        <label>Description *</label>
                        <textarea class="form-textarea" id="dynamicEventDescription" placeholder="Enter event description" required></textarea>
                    </div>

                    <div class="form-group">
                        <label>Location *</label>
                        <input type="text" class="form-input" id="dynamicEventLocation" placeholder="Enter event location" required>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Date *</label>
                            <input type="date" class="form-input" id="dynamicEventDate" required min="${today}">
                        </div>

                        <div class="form-group">
                            <label>Start Time *</label>
                            <input type="time" class="form-input" id="dynamicEventStartTime" required>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>End Time *</label>
                            <input type="time" class="form-input" id="dynamicEventEndTime" required>
                        </div>

                        <div class="form-group">
                            <label>Category *</label>
                            <select class="form-select" id="dynamicEventCategory" required>
                                <option value="">Select category</option>
                                <option value="mandatory">Mandatory</option>
                                <option value="optional">Optional</option>
                                <option value="special">Special</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Organizer *</label>
                        <input type="text" class="form-input" id="dynamicEventOrganizer" value="Student Services Office" readonly style="background-color: #f3f4f6; cursor: not-allowed;">
                    </div>

                    <div class="form-group">
                        <label>Audience *</label>
                        <input type="text" class="form-input" id="dynamicEventAudience" placeholder="e.g., All Students, BSIT 3-1" required>
                    </div>

                    <div class="form-group" style="padding-top: 10px;">
                        <input type="checkbox" id="dynamicEventIsClearance" style="width: auto; margin-right: 10px;">
                        <label for="dynamicEventIsClearance" style="display: inline; font-weight: normal;">**Event counts toward Clearance Requirement**</label>
                    </div>

                    <button type="submit" class="btn btn-primary" style="width: 100%; padding: 15px; margin-top: 10px;">
                        <span><i class="fa-solid fa-plus"></i></span>
                        <span>Create Event</span>
                    </button>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    setTimeout(() => {
        const titleInput = document.getElementById('dynamicEventTitle');
        if (titleInput) titleInput.focus();
    }, 100);

    const form = document.getElementById('createEventFormDynamic');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const dateKey = document.getElementById('dynamicEventDate').value;
            const title = document.getElementById('dynamicEventTitle').value;
            const description = document.getElementById('dynamicEventDescription').value;
            const location = document.getElementById('dynamicEventLocation').value;
            const startTime = document.getElementById('dynamicEventStartTime').value;
            const endTime = document.getElementById('dynamicEventEndTime').value;
            const category = document.getElementById('dynamicEventCategory').value;
            const organizer = document.getElementById('dynamicEventOrganizer').value;
            const audience = document.getElementById('dynamicEventAudience').value;
            const isClearance = document.getElementById('dynamicEventIsClearance').checked;

            if (mockEvents[dateKey]) {
                if (!confirm(`An event already exists on ${dateKey}. Do you want to replace it?`)) {
                    return;
                }
            }

            const eventData = {
                event_date: dateKey,
                title: title,
                description: description,
                location: location,
                time: `${startTime} - ${endTime}`,
                start_time: startTime,
                end_time: endTime,
                duration: "N/A",
                category: category,
                audience: audience,
                admin: organizer,
                is_clearance: isClearance
            };

            try {
                const createdEvent = await createEventInDatabase(eventData);

                mockEvents[dateKey] = {
                    id: createdEvent.id,
                    title: title,
                    time: `${startTime} - ${endTime}`,
                    startTime: startTime,
                    endTime: endTime,
                    duration: "N/A",
                    description: description,
                    location: location,
                    category: category,
                    audience: audience,
                    admin: organizer,
                    isClearance: isClearance
                };

                closeCreateEventModalDynamic();
                form.reset();

                renderCalendar();
                loadAllEventsTable();
                loadRecentActivity();
                updateDashboardStats();

                alert(`Event "${title}" created successfully for ${dateKey}!`);
            } catch (error) {
                alert('Failed to create event: ' + error.message);
            }
        });
    }
}

function closeCreateEventModalDynamic() {
    const modal = document.getElementById('createEventModalDynamic');
    if (modal) modal.remove();
}

// ============================================
// QUICK CREATE MODAL (Click empty day)
// ============================================

function openQuickCreateModal(dateKey) {
    const eventDate = new Date(dateKey);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    document.getElementById('simpleEventDate').value = dateKey;
    document.getElementById('eventDateDisplay').textContent = formattedDate;
    openSimpleEventModal();
}

async function handleSimpleEvent(e) {
    e.preventDefault();

    const title = document.getElementById('simpleEventTitle').value;
    const startTime = document.getElementById('simpleStartTime').value;
    const endTime = document.getElementById('simpleEndTime').value;
    const dateKey = document.getElementById('simpleEventDate').value;
    const finalAudience = document.getElementById('simpleEventAudienceInput').value;
    const isClearance = document.getElementById('simpleEventIsClearance').checked;

    const eventData = {
        event_date: dateKey,
        title: title,
        time: `${startTime} - ${endTime}`,
        start_time: startTime,
        end_time: endTime,
        duration: "N/A",
        description: `Quick Post. Target: ${finalAudience}`,
        location: "TBA",
        category: isClearance ? "mandatory" : "optional",
        audience: finalAudience,
        admin: "Student Services Office",
        is_clearance: isClearance
    };

    try {
        const createdEvent = await createEventInDatabase(eventData);

        mockEvents[dateKey] = {
            id: createdEvent.id,
            title: title,
            time: `${startTime} - ${endTime}`,
            startTime: startTime,
            endTime: endTime,
            duration: "N/A",
            description: `Quick Post. Target: ${finalAudience}`,
            location: "TBA",
            category: isClearance ? "mandatory" : "optional",
            audience: finalAudience,
            admin: "Student Services Office",
            isClearance: isClearance
        };

        closeSimpleEventModal();
        document.getElementById('simpleEventForm').reset();

        renderCalendar();
        loadAllEventsTable();
        loadRecentActivity();
        updateDashboardStats();

        alert(`Event "${title}" created successfully!`);
    } catch (error) {
        alert('Failed to create event: ' + error.message);
    }
}

async function handleQuickEditEvent(e) {
    e.preventDefault();

    const dateKey = document.getElementById('quickEditDate').value;
    const title = document.getElementById('quickEditEventTitle').value;
    const startTime = document.getElementById('quickEditStartTime').value;
    const endTime = document.getElementById('quickEditEndTime').value;
    const finalAudience = document.getElementById('quickEditEventAudienceInput').value;
    const isClearance = document.getElementById('quickEditEventIsClearance').checked;

    const event = mockEvents[dateKey];
    if (!event) return;

    const updateData = {
        title: title,
        time: `${startTime} - ${endTime}`,
        start_time: startTime,
        end_time: endTime,
        audience: finalAudience,
        is_clearance: isClearance,
        category: isClearance ? "mandatory" : "optional"
    };

    try {
        await updateEventInDatabase(event.id, updateData);

        mockEvents[dateKey].title = title;
        mockEvents[dateKey].time = `${startTime} - ${endTime}`;
        mockEvents[dateKey].startTime = startTime;
        mockEvents[dateKey].endTime = endTime;
        mockEvents[dateKey].audience = finalAudience;
        mockEvents[dateKey].isClearance = isClearance;
        mockEvents[dateKey].category = isClearance ? "mandatory" : "optional";

        closeQuickEditEventModal();
        document.getElementById('quickEditEventForm').reset();

        renderCalendar();
        loadAllEventsTable();
        loadRecentActivity();

        alert(`Event "${title}" updated successfully!`);
    } catch (error) {
        alert('Failed to update event: ' + error.message);
    }
}

async function deleteQuickEvent(dateKey) {
    const event = mockEvents[dateKey];
    if (!event) {
        alert("Error: No event selected for deletion.");
        return;
    }

    if (confirm(`Are you sure you want to delete "${event.title}"?`)) {
        try {
            await deleteEventFromDatabase(event.id);
            delete mockEvents[dateKey];

            closeQuickEditEventModal();
            renderCalendar();
            loadAllEventsTable();
            loadRecentActivity();
            updateDashboardStats();

            alert(`Event "${event.title}" deleted successfully.`);
        } catch (error) {
            alert('Failed to delete event: ' + error.message);
        }
    }
}

// ============================================
// ALL EVENTS TABLE
// ============================================

function loadAllEventsTable() {
    const eventsTableContent = document.getElementById('eventsTableContent');
    if (!eventsTableContent) return;

    const events = Object.entries(mockEvents);

    if (events.length === 0) {
        eventsTableContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon"><i class="fa-solid fa-calendar-days"></i></div>
                <h2>No Events Created</h2>
                <p>Click on any calendar date to create an event</p>
            </div>
        `;
        return;
    }

    let html = '<table><thead><tr><th>Event Name</th><th>Date</th><th>Time</th><th>Location</th><th>Category</th><th>Audience</th><th>Actions</th></tr></thead><tbody>';

    events.forEach(([date, event]) => {
        const categoryBadge = event.category === 'mandatory' || event.isClearance ?
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
                    <button class="btn btn-primary" style="padding: 6px 10px; font-size: 0.8rem;" onclick="showEventDetailsModal('${date}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    eventsTableContent.innerHTML = html;
}


// ============================================
// SSO CLEARANCE MANAGEMENT - REAL SUBMISSIONS
// Add this to your sso.js file
// ============================================

let clearanceSubmissions = [];

// ============================================
// LOAD CLEARANCE SUBMISSIONS FROM DATABASE
// ============================================
async function loadClearanceSubmissions() {
    console.log('🔍 Loading clearance submissions from:', `${API_BASE_URL}/clearance/submissions`);

    // Show loading state
    const clearanceSection = document.querySelector('#clearanceSection .table-container tbody');
    if (clearanceSection) {
        clearanceSection.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 3rem; color: #800020; margin-bottom: 10px;">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                    <h3>Loading submissions...</h3>
                </td>
            </tr>
        `;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/clearance/submissions`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📦 Raw API response:', data);
        console.log('📊 Stats breakdown:');
        console.log('   - Total submissions:', data.total);
        console.log('   - Pending:', data.pending);
        console.log('   - Approved:', data.approved);
        console.log('   - Rejected:', data.rejected);
        console.log('   - Actual submissions array length:', data.submissions?.length);

        if (data.success) {
            clearanceSubmissions = data.submissions || [];
            console.log('✅ Loaded', clearanceSubmissions.length, 'submissions');

            // Update stats
            updateClearanceStats({
                total: data.total || 0,
                pending: data.pending || 0,
                approved: data.approved || 0,
                rejected: data.rejected || 0
            });

            // Display submissions table
            displayClearanceSubmissions(clearanceSubmissions);

            // Update sidebar badge
            updateClearanceBadge(data.pending || 0);
        } else {
            console.error('❌ API returned success: false', data.message);
            showEmptyClearanceState('Server returned an error: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('❌ Error loading submissions:', error);
        showEmptyClearanceState('Failed to connect to server. Please check if Laravel is running on port 8000.');
    }
}

// ============================================
// DISPLAY CLEARANCE SUBMISSIONS
// ============================================
function displayClearanceSubmissions(submissions) {
    const clearanceSection = document.querySelector('#clearanceSection .table-container tbody');

    if (!clearanceSection) {
        console.error('❌ Clearance table not found');
        return;
    }

    if (submissions.length === 0) {
        clearanceSection.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 3rem; color: #800020; margin-bottom: 10px;">
                        <i class="fas fa-inbox"></i>
                    </div>
                    <h3>No Clearance Submissions</h3>
                    <p>Student proof submissions will appear here</p>
                </td>
            </tr>
        `;
        return;
    }

    let html = '';

    submissions.forEach(submission => {
        const statusBadge = getStatusBadge(submission.status);
        const submittedDate = new Date(submission.submitted_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        html += `
            <tr>
                <td>${submission.student_number}</td>
                <td>${submission.student_name}</td>
                <td>
                    <strong>${submission.event_title}</strong><br>
                    <small style="color: #666;">${new Date(submission.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</small>
                </td>
                <td>
                    <small style="color: #666;">${submittedDate}</small><br>
                    ${statusBadge}
                </td>
                <td>
                    <button class="btn btn-primary" style="padding: 6px 10px; font-size: 0.8rem;" onclick="viewSubmissionDetails(${submission.id})">
                        <i class="fas fa-eye"></i> Review
                    </button>
                </td>
            </tr>
        `;
    });

    clearanceSection.innerHTML = html;
}

// ============================================
// STATUS BADGE HELPER
// ============================================
function getStatusBadge(status) {
    switch (status) {
        case 'pending':
            return '<span style="color:#f59e0b; font-weight: 600;">⏳ PENDING</span>';
        case 'approved':
            return '<span style="color:#059669; font-weight: 600;">✅ APPROVED</span>';
        case 'rejected':
            return '<span style="color:#dc2626; font-weight: 600;">❌ REJECTED</span>';
        default:
            return '<span style="color:#666; font-weight: 600;">UNKNOWN</span>';
    }
}

// ============================================
// UPDATE CLEARANCE STATISTICS
// ============================================
function updateClearanceStats(data) {
    console.log('📊 Updating clearance stats:', data);

    // Update clearance section stats (4 cards)
    const clearanceStats = {
        totalClearance: data.total || 0,
        pendingClearance: data.pending || 0,
        approvedClearance: data.approved || 0,
        rejectedClearance: data.rejected || 0
    };

    for (const [elementId, value] of Object.entries(clearanceStats)) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
            console.log(`  ✅ ${elementId}: ${value}`);
        }
    }

    // Update dashboard section stats (2 cards with different IDs)
    const dashboardTotalElement = document.getElementById('dashboardTotalClearance');
    if (dashboardTotalElement) {
        dashboardTotalElement.textContent = data.total || 0;
        console.log(`  ✅ dashboardTotalClearance: ${data.total || 0}`);
    }

    const dashboardPendingElement = document.getElementById('dashboardPendingClearance');
    if (dashboardPendingElement) {
        dashboardPendingElement.textContent = data.pending || 0;
        console.log(`  ✅ dashboardPendingClearance: ${data.pending || 0}`);
    }

    console.log('✅ Stats update complete');
}

// ============================================
// UPDATE SIDEBAR BADGE
// ============================================
function updateClearanceBadge(pendingCount) {
    const clearanceBadge = document.getElementById('clearanceBadge');
    if (clearanceBadge) {
        clearanceBadge.textContent = pendingCount || 0;
        clearanceBadge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
    }
}

// ============================================
// VIEW SUBMISSION DETAILS MODAL
// ============================================
function viewSubmissionDetails(submissionId) {
    const submission = clearanceSubmissions.find(s => s.id === submissionId);
    if (!submission) return;

    const submittedDate = new Date(submission.submitted_at).toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const eventDate = new Date(submission.event_date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    const statusBadge = getStatusBadge(submission.status);

    const modalHTML = `
        <div class="modal active" id="submissionDetailsModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; justify-content: center; align-items: center;">
            <div class="modal-content" style="background: white; border-radius: 12px; padding: 30px; max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto; position: relative;">
                <span onclick="closeSubmissionModal()" style="position: absolute; top: 15px; right: 20px; font-size: 2rem; cursor: pointer; color: #666;">&times;</span>
                
                <h2 style="color: #800020; margin-bottom: 20px;">
                    <i class="fas fa-clipboard-check"></i> Clearance Submission Review
                </h2>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div>
                        <h3 style="color: #800020; margin-bottom: 10px;">Student Information</h3>
                        <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
                            <p><strong>Name:</strong> ${submission.student_name}</p>
                            <p><strong>Student No:</strong> ${submission.student_number}</p>
                            <p><strong>Email:</strong> ${submission.student_email}</p>
                            <p><strong>Course:</strong> ${submission.course} ${submission.year}</p>
                        </div>
                    </div>
                    
                    <div>
                        <h3 style="color: #800020; margin-bottom: 10px;">Event Information</h3>
                        <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
                            <p><strong>Event:</strong> ${submission.event_title}</p>
                            <p><strong>Date:</strong> ${eventDate}</p>
                            <p><strong>Submitted:</strong> ${submittedDate}</p>
                            <p><strong>Status:</strong> ${statusBadge}</p>
                        </div>
                    </div>
                </div>
                
                ${submission.notes ? `
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #800020; margin-bottom: 10px;">Student Notes</h3>
                    <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
                        <p>${submission.notes}</p>
                    </div>
                </div>
                ` : ''}
                
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #800020; margin-bottom: 10px;">Proof of Attendance</h3>
                    <div style="border: 2px solid #e0e0e0; border-radius: 8px; padding: 10px; background: #f9fafb; text-align: center;">
                        <img src="${submission.proof_image}" alt="Proof" style="max-width: 100%; max-height: 400px; border-radius: 8px;">
                    </div>
                </div>
                
                ${submission.status === 'pending' ? `
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #800020; margin-bottom: 10px;">Admin Notes (Optional)</h3>
                    <textarea id="adminNotes" rows="3" placeholder="Add notes for the student..." style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; resize: vertical;"></textarea>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: center; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                    <button class="btn btn-primary" onclick="approveSubmission(${submission.id})" style="flex: 1; background: #059669;">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn btn-danger" onclick="rejectSubmission(${submission.id})" style="flex: 1; background: #dc2626;">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </div>
                ` : submission.admin_notes ? `
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #800020; margin-bottom: 10px;">Admin Notes</h3>
                    <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
                        <p>${submission.admin_notes}</p>
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeSubmissionModal() {
    const modal = document.getElementById('submissionDetailsModal');
    if (modal) modal.remove();
}

// ============================================
// APPROVE SUBMISSION
// ============================================
async function approveSubmission(submissionId) {
    const adminNotes = document.getElementById('adminNotes')?.value.trim();

    if (!confirm('Approve this clearance submission?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/clearance/submissions/${submissionId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: 'approved',
                admin_notes: adminNotes
            })
        });

        const data = await response.json();

        if (data.success) {
            alert('✅ Submission approved successfully!');
            closeSubmissionModal();
            await loadClearanceSubmissions();
        } else {
            alert('❌ ' + (data.message || 'Failed to approve submission'));
        }
    } catch (error) {
        console.error('Error approving submission:', error);
        alert('❌ Failed to approve submission. Please try again.');
    }
}

// ============================================
// REJECT SUBMISSION
// ============================================
async function rejectSubmission(submissionId) {
    const adminNotes = document.getElementById('adminNotes')?.value.trim();

    if (!adminNotes) {
        alert('Please provide a reason for rejection in the admin notes.');
        return;
    }

    if (!confirm('Reject this clearance submission?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/clearance/submissions/${submissionId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: 'rejected',
                admin_notes: adminNotes
            })
        });

        const data = await response.json();

        if (data.success) {
            alert('❌ Submission rejected.');
            closeSubmissionModal();
            await loadClearanceSubmissions();
        } else {
            alert('❌ ' + (data.message || 'Failed to reject submission'));
        }
    } catch (error) {
        console.error('Error rejecting submission:', error);
        alert('❌ Failed to reject submission. Please try again.');
    }
}

// ============================================
// SHOW EMPTY STATE
// ============================================
function showEmptyClearanceState(errorMessage = 'Cannot load submissions') {
    const clearanceSection = document.querySelector('#clearanceSection .table-container tbody');
    if (!clearanceSection) return;

    clearanceSection.innerHTML = `
        <tr>
            <td colspan="5" style="text-align: center; padding: 40px; color: #666;">
                <div style="font-size: 3rem; color: #800020; margin-bottom: 10px;">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Cannot Load Submissions</h3>
                <p style="margin-bottom: 15px;">${errorMessage}</p>
                <button class="btn btn-primary" onclick="loadClearanceSubmissions()" style="padding: 10px 20px;">
                    <i class="fas fa-sync"></i> Retry
                </button>
            </td>
        </tr>
    `;

    // Reset ALL stats to 0
    updateClearanceStats({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0
    });

    // Hide badge
    updateClearanceBadge(0);
}

// ============================================
// SEARCH CLEARANCE SUBMISSIONS
// ============================================
function searchClearanceSubmissions(searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
        displayClearanceSubmissions(clearanceSubmissions);
        return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = clearanceSubmissions.filter(sub =>
        sub.student_number.toLowerCase().includes(term) ||
        sub.student_name.toLowerCase().includes(term) ||
        sub.event_title.toLowerCase().includes(term)
    );

    displayClearanceSubmissions(filtered);
}

// ============================================
// MODAL FUNCTIONS
// ============================================

function openProfileModal() { if (profileModal) profileModal.style.display = 'flex'; }
function closeProfileModal() { if (profileModal) profileModal.style.display = 'none'; }
function openSimpleEventModal() { if (simpleEventModal) simpleEventModal.style.display = 'flex'; }
function closeSimpleEventModal() { if (simpleEventModal) simpleEventModal.style.display = 'none'; }
function openQuickEditEventModal() { if (quickEditEventModal) quickEditEventModal.style.display = 'flex'; }
function closeQuickEditEventModal() { if (quickEditEventModal) quickEditEventModal.style.display = 'none'; }
function logout() { if (logoutModal) logoutModal.style.display = 'flex'; }
function closeLogoutModal() { if (logoutModal) logoutModal.style.display = 'none'; }
function confirmLogout() { window.location.href = '../user/studentlogin.html'; }

// Stub functions
function viewStudentDetails(id) { alert('View student: ' + id); }
function loadPaymentTransactions() { }
function updatePaymentStats() { }

// ============================================
// INITIALIZE
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing SSO Dashboard...');

    // Load events from database
    await loadEventsFromDatabase();

    // Load clearance submissions on startup
    await loadClearanceSubmissions();

    // Show dashboard by default
    showSection('dashboard');

    // Setup calendar navigation
    const prevBtn = document.querySelector('.calendar-nav button:nth-child(1)');
    const todayBtn = document.querySelector('.calendar-nav button:nth-child(2)');
    const nextBtn = document.querySelector('.calendar-nav button:nth-child(3)');

    if (prevBtn) prevBtn.onclick = () => changeMonth(-1);
    if (todayBtn) todayBtn.onclick = goToToday;
    if (nextBtn) nextBtn.onclick = () => changeMonth(1);

    // Setup event forms
    const simpleEventForm = document.getElementById('simpleEventForm');
    if (simpleEventForm) simpleEventForm.addEventListener('submit', handleSimpleEvent);

    const quickEditEventForm = document.getElementById('quickEditEventForm');
    if (quickEditEventForm) quickEditEventForm.addEventListener('submit', handleQuickEditEvent);

    // Setup modal close buttons
    document.querySelectorAll('.close-modal').forEach(span => {
        span.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) modal.style.display = 'none';
        });
    });

    // Setup clearance search if it exists
    const clearanceSearchInput = document.getElementById('clearanceSearch');
    if (clearanceSearchInput) {
        clearanceSearchInput.addEventListener('input', (e) => {
            searchClearanceSubmissions(e.target.value);
        });
    }

    console.log('✅ SSO Dashboard initialized successfully');
});