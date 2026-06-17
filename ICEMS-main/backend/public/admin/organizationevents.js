// ORGANIZATIONEVENTS.JS - EVENT MANAGEMENT
// ============================================

let currentCalendar = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    monthName: new Date().toLocaleString('default', { month: 'long' })
};

let mockEvents = {};
let eventsLoaded = false;
let eventsInitialized = false;

// ============================================
// INIT EVENTS SECTION
// ============================================
async function initEventsSection() {
    if (!eventsInitialized) {
        const prevBtn = document.querySelector('.calendar-nav button:nth-child(1)');
        const todayBtn = document.querySelector('.calendar-nav button:nth-child(2)');
        const nextBtn = document.querySelector('.calendar-nav button:nth-child(3)');
        if (prevBtn) prevBtn.onclick = () => changeMonth(-1);
        if (todayBtn) todayBtn.onclick = goToToday;
        if (nextBtn) nextBtn.onclick = () => changeMonth(1);

        const simpleForm = document.getElementById('simpleEventForm');
        if (simpleForm) simpleForm.onsubmit = handleSimpleEvent;

        const quickEditForm = document.getElementById('quickEditEventForm');
        if (quickEditForm) quickEditForm.onsubmit = handleQuickEditEvent;

        eventsInitialized = true;
    }

    renderCalendar();
    loadAllEventsTable();
}

// ============================================
// CALENDAR
// ============================================
function renderCalendar() {
    const grid = document.querySelector('.calendar-grid');
    if (!grid) return;

    const header = document.querySelector('.calendar-header h3');
    if (header) header.textContent = `${currentCalendar.monthName} ${currentCalendar.year}`;

    grid.innerHTML = '';
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
        const h = document.createElement('div');
        h.className = 'calendar-day header';
        h.textContent = day;
        grid.appendChild(h);
    });

    const firstDay = new Date(currentCalendar.year, currentCalendar.month - 1, 1).getDay();
    const daysInMonth = new Date(currentCalendar.year, currentCalendar.month, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day';
        grid.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const el = document.createElement('div');
        el.className = 'calendar-day';
        const dateKey = `${currentCalendar.year}-${String(currentCalendar.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        el.setAttribute('data-date', dateKey);
        el.textContent = '';

        if (mockEvents[dateKey]) {
            const event = mockEvents[dateKey];
            const category = event.category || 'optional';
            el.classList.add('event', category);
            el.style.cursor = 'pointer';
            el.addEventListener('click', () => showEventDetailsModal(dateKey));

            // Category label
            const label = document.createElement('div');
            label.className = 'event-label';
            label.textContent = category === 'mandatory' ? 'MANDATORY' : category === 'special' ? 'SPECIAL' : 'OPTIONAL';
            el.appendChild(label);

            // Dot indicator
            const dot = document.createElement('div');
            dot.className = 'event-dot';
            el.appendChild(dot);
        } else {
            el.style.cursor = 'pointer';
            el.textContent = day;
        }
        grid.appendChild(el);
    }
}

function changeMonth(dir) {
    currentCalendar.month += dir;
    if (currentCalendar.month > 12) { currentCalendar.month = 1; currentCalendar.year++; }
    else if (currentCalendar.month < 1) { currentCalendar.month = 12; currentCalendar.year--; }
    currentCalendar.monthName = new Date(currentCalendar.year, currentCalendar.month - 1, 1).toLocaleString('default', { month: 'long' });
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
// ALL EVENTS TABLE
// ============================================
function loadAllEventsTable() {
    const container = document.getElementById('eventsTableContent');
    if (!container) return;

    const events = Object.entries(mockEvents);
    if (events.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon"><i class="fa-solid fa-calendar-days"></i></div>
                <h2>No Events Created</h2>
                <p>Click on any calendar date to create an event</p>
            </div>`;
        return;
    }

    let html = `<table><thead><tr>
        <th>Event Name</th><th>Date</th><th>Time</th>
        <th>Location</th><th>Type</th><th>Audience</th><th>Actions</th>
    </tr></thead><tbody>`;

    events.forEach(([date, event]) => {
        const badge = event.isClearance
            ? '<span style="color:#dc2626;font-weight:600;">MANDATORY</span>'
            : '<span style="color:#059669;font-weight:600;">OPTIONAL</span>';
        html += `
            <tr>
                <td>${event.title}</td>
                <td>${date}</td>
                <td>${event.time || '-'}</td>
                <td>${event.location || '-'}</td>
                <td>${badge}</td>
                <td>${event.audience || 'All Students'}</td>
                <td>
                    <button class="btn btn-primary" style="padding:6px 10px;font-size:0.8rem;"
                        onclick="showEventDetailsModal('${date}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            </tr>`;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

// ============================================
// EVENT DETAILS MODAL
// ============================================
function showEventDetailsModal(dateKey) {
    const event = mockEvents[dateKey];
    if (!event) return;

    const formattedDate = new Date(dateKey + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const color = event.isClearance ? '#dc2626' : '#059669';
    const label = event.isClearance ? 'MANDATORY' : 'OPTIONAL';

    document.body.insertAdjacentHTML('beforeend', `
        <div class="modal active" id="eventDetailsModal" style="display:flex;z-index:10000;">
            <div class="modal-content" style="max-width:600px;">
                <span class="close-modal" onclick="closeEventDetailsModal()">&times;</span>
                <div style="text-align:center;margin-bottom:20px;">
                    <div style="display:inline-block;background:${color};color:white;padding:8px 20px;border-radius:20px;font-size:0.85rem;font-weight:700;margin-bottom:15px;">${label}</div>
                    <h2 class="modal-title" style="color:#800020;margin:0;">${event.title}</h2>
                </div>
                <div style="background:#f9fafb;padding:20px;border-radius:10px;margin-bottom:20px;">
                    <p style="margin-bottom:10px;"><i class="fas fa-calendar" style="color:#800020;width:25px;"></i> <strong>${formattedDate}</strong></p>
                    <p style="margin-bottom:10px;"><i class="fas fa-clock" style="color:#800020;width:25px;"></i> ${event.time || 'TBA'}</p>
                    <p style="margin-bottom:10px;"><i class="fas fa-map-marker-alt" style="color:#800020;width:25px;"></i> ${event.location || 'TBA'}</p>
                    <p style="margin-bottom:10px;"><i class="fas fa-users" style="color:#800020;width:25px;"></i> ${event.audience || 'All Students'}</p>
                    <p><i class="fas fa-user-tie" style="color:#800020;width:25px;"></i> ${event.admin || 'Student Council'}</p>
                </div>
                ${event.description ? `<div style="margin-bottom:20px;"><h3 style="color:#800020;margin-bottom:10px;">Description</h3><p style="color:#666;line-height:1.6;">${event.description}</p></div>` : ''}
                ${event.isClearance ? `<div style="background:#dcfce7;padding:15px;border-radius:10px;margin-bottom:20px;border-left:4px solid #059669;"><i class="fas fa-check-circle" style="color:#059669;"></i> <strong style="color:#166534;">This event counts toward clearance requirements</strong></div>` : ''}
                <div style="display:flex;gap:10px;justify-content:center;border-top:1px solid #e5e7eb;padding-top:20px;">
                    <button class="btn btn-primary" onclick="editEventFromModal('${dateKey}')" style="flex:1;"><i class="fas fa-edit"></i> Edit</button>
                    <button onclick="deleteEventFromModal('${dateKey}')" style="flex:1;padding:10px;background:#dc2626;color:white;border:none;border-radius:8px;cursor:pointer;"><i class="fas fa-trash"></i> Delete</button>
                </div>
            </div>
        </div>`);
}

function closeEventDetailsModal() {
    const m = document.getElementById('eventDetailsModal');
    if (m) m.remove();
}

function editEventFromModal(dateKey) {
    closeEventDetailsModal();
    const event = mockEvents[dateKey];
    if (!event) return;

    const modal = document.getElementById('quickEditEventModal');
    if (modal) {
        document.getElementById('quickEditDate').value = dateKey;
        document.getElementById('quickEditEventTitle').value = event.title || '';
        document.getElementById('quickEditStartTime').value = event.startTime || '';
        document.getElementById('quickEditEndTime').value = event.endTime || '';
        document.getElementById('quickEditEventAudienceInput').value = event.audience || '';
        document.getElementById('quickEditEventIsClearance').checked = event.isClearance || false;
        const titleDisplay = document.getElementById('quickEditTitleDisplay');
        if (titleDisplay) titleDisplay.textContent = event.title;
        const deleteBtn = document.getElementById('deleteQuickEventBtn');
        if (deleteBtn) deleteBtn.onclick = () => deleteQuickEvent(dateKey);
        modal.style.display = 'flex';
    }
}

async function deleteEventFromModal(dateKey) {
    const event = mockEvents[dateKey];
    if (!confirm(`Delete "${event.title}"?`)) return;
    try {
        const res = await fetch(`${API_BASE_URL}/student-councils/${SC_ID}/events/${event.id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            delete mockEvents[dateKey];
            scEvents = scEvents.filter(e => e.id !== event.id);
            closeEventDetailsModal();
            renderCalendar();
            loadAllEventsTable();
            updateBadges();
            updateDashboardStats();
            alert('Event deleted!');
        } else {
            alert('❌ Failed: ' + data.message);
        }
    } catch (e) {
        alert('❌ Server error.');
    }
}

// ============================================
// CREATE EVENT MODAL
// ============================================
function openCreateEventModal() {
    const today = new Date().toISOString().split('T')[0];
    document.body.insertAdjacentHTML('beforeend', `
        <div class="modal" id="createEventModalDynamic" style="display:flex;">
            <div class="modal-content">
                <span class="close-modal" onclick="closeCreateEventModalDynamic()">&times;</span>
                <h2 class="modal-title"><i class="fa-solid fa-calendar-plus"></i> Create New Event</h2>
                <form id="createEventFormDynamic">
                    <div class="form-group"><label>Event Title *</label>
                        <input type="text" class="form-input" id="dynTitle" required></div>
                    <div class="form-group"><label>Description *</label>
                        <textarea class="form-textarea" id="dynDesc" required></textarea></div>
                    <div class="form-group"><label>Location *</label>
                        <input type="text" class="form-input" id="dynLocation" required></div>
                    <div class="form-row">
                        <div class="form-group"><label>Date *</label>
                            <input type="date" class="form-input" id="dynDate" required min="${today}"></div>
                        <div class="form-group"><label>Start Time *</label>
                            <input type="time" class="form-input" id="dynStart" required></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>End Time *</label>
                            <input type="time" class="form-input" id="dynEnd" required></div>
                        <div class="form-group"><label>Category *</label>
                            <select class="form-select" id="dynCategory" required>
                                <option value="">Select</option>
                                <option value="mandatory">Mandatory</option>
                                <option value="optional">Optional</option>
                                <option value="special">Special</option>
                            </select></div>
                    </div>
                    <div class="form-group"><label>Audience *</label>
                        <input type="text" class="form-input" id="dynAudience" placeholder="e.g., All Students" required></div>
                    <div class="form-group" style="padding-top:10px;">
                        <input type="checkbox" id="dynIsClearance" style="width:auto;margin-right:10px;">
                        <label for="dynIsClearance" style="display:inline;font-weight:normal;">Event counts toward Clearance Requirement</label>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width:100%;padding:15px;margin-top:10px;">
                        <i class="fa-solid fa-plus"></i> Create Event
                    </button>
                </form>
            </div>
        </div>`);

    document.getElementById('createEventFormDynamic').addEventListener('submit', async e => {
        e.preventDefault();
        const dateKey = document.getElementById('dynDate').value;
        const startTime = document.getElementById('dynStart').value;
        const endTime = document.getElementById('dynEnd').value;
        const eventData = {
            event_date: dateKey,
            title: document.getElementById('dynTitle').value,
            description: document.getElementById('dynDesc').value,
            location: document.getElementById('dynLocation').value,
            time: `${startTime} - ${endTime}`,
            start_time: startTime,
            end_time: endTime,
            category: document.getElementById('dynCategory').value,
            audience: document.getElementById('dynAudience').value,
            admin: 'Student Council',
            is_clearance: document.getElementById('dynIsClearance').checked,
        };

        try {
            const res = await fetch(`${API_BASE_URL}/student-councils/${SC_ID}/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventData)
            });
            const data = await res.json();
            if (data.success) {
                const ev = data.event;
                mockEvents[dateKey] = { id: ev.id, ...eventData, isClearance: eventData.is_clearance };
                scEvents.push(ev);
                closeCreateEventModalDynamic();
                renderCalendar();
                loadAllEventsTable();
                updateBadges();
                updateDashboardStats();
                alert(`Event "${eventData.title}" created!`);
            } else {
                alert('❌ Failed: ' + data.message);
            }
        } catch (err) {
            alert('❌ Server error: ' + err.message);
        }
    });
}

function closeCreateEventModalDynamic() {
    const m = document.getElementById('createEventModalDynamic');
    if (m) m.remove();
}

// ============================================
// QUICK CREATE / EDIT
// ============================================
function openQuickCreateModal(dateKey) {
    const formattedDate = new Date(dateKey + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
    document.getElementById('simpleEventDate').value = dateKey;
    document.getElementById('eventDateDisplay').textContent = formattedDate;
    document.getElementById('simpleEventModal').style.display = 'flex';
}

async function handleSimpleEvent(e) {
    e.preventDefault();
    const dateKey = document.getElementById('simpleEventDate').value;
    const startTime = document.getElementById('simpleStartTime').value;
    const endTime = document.getElementById('simpleEndTime').value;
    const audience = document.getElementById('simpleEventAudienceInput').value;
    const isClearance = document.getElementById('simpleEventIsClearance').checked;
    const title = document.getElementById('simpleEventTitle').value;

    const eventData = {
        event_date: dateKey,
        title,
        time: `${startTime} - ${endTime}`,
        start_time: startTime,
        end_time: endTime,
        description: `Quick Post. Target: ${audience}`,
        location: 'TBA',
        category: isClearance ? 'mandatory' : 'optional',
        audience,
        admin: 'Student Council',
        is_clearance: isClearance,
    };

    try {
        const res = await fetch(`${API_BASE_URL}/student-councils/${SC_ID}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
        });
        const data = await res.json();
        if (data.success) {
            mockEvents[dateKey] = { id: data.event.id, ...eventData, isClearance };
            scEvents.push(data.event);
            closeSimpleEventModal();
            document.getElementById('simpleEventForm').reset();
            renderCalendar();
            loadAllEventsTable();
            updateBadges();
            updateDashboardStats();
            alert(`Event "${title}" created!`);
        } else {
            alert('❌ Failed: ' + data.message);
        }
    } catch (err) {
        alert('❌ Server error: ' + err.message);
    }
}

async function handleQuickEditEvent(e) {
    e.preventDefault();
    const dateKey = document.getElementById('quickEditDate').value;
    const event = mockEvents[dateKey];
    if (!event) return;

    const startTime = document.getElementById('quickEditStartTime').value;
    const endTime = document.getElementById('quickEditEndTime').value;
    const audience = document.getElementById('quickEditEventAudienceInput').value;
    const isClearance = document.getElementById('quickEditEventIsClearance').checked;
    const title = document.getElementById('quickEditEventTitle').value;

    const updateData = {
        title, time: `${startTime} - ${endTime}`,
        start_time: startTime, end_time: endTime,
        audience, is_clearance: isClearance,
        category: isClearance ? 'mandatory' : 'optional'
    };

    try {
        const res = await fetch(`${API_BASE_URL}/student-councils/${SC_ID}/events/${event.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });
        const data = await res.json();
        if (data.success) {
            Object.assign(mockEvents[dateKey], updateData, { isClearance });
            closeQuickEditEventModal();
            renderCalendar();
            loadAllEventsTable();
            alert(`Event "${title}" updated!`);
        } else {
            alert('❌ Failed: ' + data.message);
        }
    } catch (err) {
        alert('❌ Server error: ' + err.message);
    }
}

async function deleteQuickEvent(dateKey) {
    const event = mockEvents[dateKey];
    if (!event || !confirm(`Delete "${event.title}"?`)) return;
    try {
        const res = await fetch(`${API_BASE_URL}/student-councils/${SC_ID}/events/${event.id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            delete mockEvents[dateKey];
            scEvents = scEvents.filter(e => e.id !== event.id);
            closeQuickEditEventModal();
            renderCalendar();
            loadAllEventsTable();
            updateBadges();
            updateDashboardStats();
            alert('Event deleted!');
        } else {
            alert('❌ Failed: ' + data.message);
        }
    } catch (err) {
        alert('❌ Server error.');
    }
}

// ============================================
// MODAL HELPERS
// ============================================
function openSimpleEventModal() { document.getElementById('simpleEventModal').style.display = 'flex'; }
function closeSimpleEventModal() { document.getElementById('simpleEventModal').style.display = 'none'; }
function openQuickEditEventModal() { document.getElementById('quickEditEventModal').style.display = 'flex'; }
function closeQuickEditEventModal() { document.getElementById('quickEditEventModal').style.display = 'none'; }

// Export for organization.js
window.initializeEventsSection = initEventsSection;
window.getEventCountForDashboard = () => Object.keys(mockEvents).length;
