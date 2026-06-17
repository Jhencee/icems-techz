// ============================================
// SCEVENTS.JS - STUDENT COUNCIL EVENT MANAGEMENT (PART 1)
// Core: Database, Calendar, Badge Functions
// ============================================

// Current calendar view
let scCurrentCalendar = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    monthName: new Date().toLocaleString('default', { month: 'long' })
};

// Event Data
let scMockEvents = {};
let scEventsLoaded = false;
let scIsLoadingEvents = false;
let scEventsInitialized = false;

// ============================================
// DATABASE API FUNCTIONS
// ============================================

async function loadSCEventsFromDatabase() {
    if (scIsLoadingEvents) {
        console.log('⏳ [SC Events] Already loading, BLOCKED');
        return;
    }

    if (scEventsLoaded) {
        console.log('✅ [SC Events] Events already loaded, using cache');
        return;
    }

    if (typeof AppState === 'undefined' || !AppState.currentCouncilId) {
        console.error('❌ [SC Events] AppState.currentCouncilId is not defined!');
        scMockEvents = {};
        scEventsLoaded = true;
        return;
    }

    if (typeof API_BASE_URL === 'undefined') {
        console.error('❌ [SC Events] API_BASE_URL is not defined!');
        scMockEvents = {};
        scEventsLoaded = true;
        return;
    }

    scIsLoadingEvents = true;
    console.log('🔍 [SC Events] Loading events for council:', AppState.currentCouncilId);

    try {
        const response = await fetch(`${API_BASE_URL}/student-councils/${AppState.currentCouncilId}/events`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.events) {
            scMockEvents = {};
            data.events.forEach(event => {
                scMockEvents[event.event_date] = {
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
            console.log('✅ [SC Events] Loaded', data.events.length, 'events');
            scEventsLoaded = true;
            updateSCEventsBadge();
        } else {
            console.warn('⚠️ [SC Events] No events found');
            scMockEvents = {};
            scEventsLoaded = true;
        }
    } catch (error) {
        console.error('❌ [SC Events] Failed to load events:', error);
        console.error('❌ [SC Events] Error details:', error.message);
        scMockEvents = {};
        scEventsLoaded = true;
    } finally {
        scIsLoadingEvents = false;
    }
}

async function createSCEventInDatabase(eventData) {
    try {
        const dataWithCouncil = {
            ...eventData,
            council_id: AppState.currentCouncilId
        };

        const response = await fetch(`${API_BASE_URL}/student-councils/${AppState.currentCouncilId}/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataWithCouncil)
        });

        const data = await response.json();

        if (data.success) {
            console.log('✅ [SC Events] Event created in database:', data.event);
            return data.event;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('❌ [SC Events] Failed to create event:', error);
        throw error;
    }
}

async function updateSCEventInDatabase(eventId, eventData) {
    try {
        const response = await fetch(`${API_BASE_URL}/student-councils/${AppState.currentCouncilId}/events/${eventId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData)
        });

        const data = await response.json();

        if (data.success) {
            console.log('✅ [SC Events] Event updated in database:', data.event);
            return data.event;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('❌ [SC Events] Failed to update event:', error);
        throw error;
    }
}

async function deleteSCEventFromDatabase(eventId) {
    try {
        const response = await fetch(`${API_BASE_URL}/student-councils/${AppState.currentCouncilId}/events/${eventId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const data = await response.json();

        if (data.success) {
            console.log('✅ [SC Events] Event deleted from database');
            return true;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('❌ [SC Events] Failed to delete event:', error);
        throw error;
    }
}

// ============================================
// CALENDAR RENDERING
// ============================================

// ============================================
// CALENDAR RENDERING
// ============================================

function renderSCCalendar() {
    const calendarGrid = document.querySelector('.sc-calendar-grid');
    if (!calendarGrid) {
        console.warn('⚠️ [SC Events] Calendar grid not found');
        return;
    }

    const calendarHeader = document.querySelector('.sc-calendar-header h3');
    if (calendarHeader) {
        calendarHeader.textContent = `${scCurrentCalendar.monthName} ${scCurrentCalendar.year}`;
    }

    // Clear existing calendar
    calendarGrid.innerHTML = '';

    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day header';
        header.textContent = day;
        calendarGrid.appendChild(header);
    });

    // Calculate calendar layout
    const firstDay = new Date(scCurrentCalendar.year, scCurrentCalendar.month - 1, 1).getDay();
    const daysInMonth = new Date(scCurrentCalendar.year, scCurrentCalendar.month, 0).getDate();

    // Get today's date for highlighting
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day';
        calendarGrid.appendChild(emptyDay);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';

        const formattedMonth = String(scCurrentCalendar.month).padStart(2, '0');
        const formattedDay = String(day).padStart(2, '0');
        const dateKey = `${scCurrentCalendar.year}-${formattedMonth}-${formattedDay}`;

        dayElement.setAttribute('data-date', dateKey);
        dayElement.textContent = day;

        // Highlight today's date
        if (scCurrentCalendar.year === todayYear &&
            scCurrentCalendar.month === todayMonth &&
            day === todayDay) {
            dayElement.classList.add('today');
            dayElement.style.cssText = 'background: #800020; color: white; font-weight: bold;';
        }

        // Check if there's an event on this day
        if (scMockEvents[dateKey]) {
            dayElement.classList.add('event');
            dayElement.style.cursor = 'pointer';

            // If it's today AND has an event, adjust styling
            if (scCurrentCalendar.year === todayYear &&
                scCurrentCalendar.month === todayMonth &&
                day === todayDay) {
                dayElement.style.cssText = 'background: #600018; color: white; font-weight: bold; border: 3px solid #fbbf24;';
            } else {
                dayElement.style.backgroundColor = '#fee2e2';
            }

            // Create a click handler with closure to capture dateKey
            (function (date) {
                dayElement.addEventListener('click', function () {
                    showSCEventDetailsModal(date);
                });
            })(dateKey);

            // Add event indicator
            const eventDot = document.createElement('div');
            eventDot.className = 'event-indicator';
            eventDot.style.cssText = 'width: 6px; height: 6px; background: #800020; border-radius: 50%; margin: 2px auto;';
            dayElement.appendChild(eventDot);
        } else {
            dayElement.style.cursor = 'pointer';

            // Create a click handler with closure to capture dateKey
            (function (date) {
                dayElement.addEventListener('click', function () {
                    openSCQuickCreateModal(date);
                });
            })(dateKey);
        }

        calendarGrid.appendChild(dayElement);
    }

    console.log('✅ [SC Events] Calendar rendered for', scCurrentCalendar.monthName, scCurrentCalendar.year);
}

function changeSCMonth(direction) {
    scCurrentCalendar.month += direction;

    if (scCurrentCalendar.month > 12) {
        scCurrentCalendar.month = 1;
        scCurrentCalendar.year++;
    } else if (scCurrentCalendar.month < 1) {
        scCurrentCalendar.month = 12;
        scCurrentCalendar.year--;
    }

    scCurrentCalendar.monthName = new Date(scCurrentCalendar.year, scCurrentCalendar.month - 1, 1)
        .toLocaleString('default', { month: 'long' });

    renderSCCalendar();
}

function goToSCToday() {
    const today = new Date();
    scCurrentCalendar.year = today.getFullYear();
    scCurrentCalendar.month = today.getMonth() + 1;
    scCurrentCalendar.monthName = today.toLocaleString('default', { month: 'long' });
    renderSCCalendar();
}

// ============================================
// FORM HELPER FUNCTIONS
// ============================================

function toggleSpecificAudience(context) {
    let audienceSelect, specificDiv;

    if (context === 'event') {
        audienceSelect = document.getElementById('eventAudience');
        specificDiv = document.getElementById('specificEventAudienceGroup');
    } else {
        // Add other contexts if needed (e.g., for quick edit or simple event modals)
        console.warn('⚠️ [SC Events] Unknown context for toggleSpecificAudience:', context);
        return;
    }

    if (!specificDiv || !audienceSelect) {
        console.error('❌ [SC Events] Required elements not found for toggleSpecificAudience');
        return;
    }

    if (audienceSelect.value === 'Other (Specify)') {
        specificDiv.style.display = 'block';
    } else {
        specificDiv.style.display = 'none';
    }
}

// ============================================
// BADGE UPDATES
// ============================================

function updateSCEventsBadge() {
    if (!scEventsLoaded) {
        console.log('⏸️ [SC Events] Badge update skipped - events not loaded yet');
        return;
    }

    const badge = document.getElementById('scEventsBadge');
    if (badge) {
        const eventCount = Object.keys(scMockEvents).length;
        badge.textContent = eventCount;
        badge.style.display = eventCount > 0 ? 'inline-block' : 'none';
    }
}

// ============================================
// ALL EVENTS TABLE
// ============================================

function loadAllSCEventsTable() {
    const eventsTableContent = document.getElementById('scEventsTableContent');
    if (!eventsTableContent) return;

    const events = Object.entries(scMockEvents);

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
                    <button class="btn btn-primary" style="padding: 6px 10px; font-size: 0.8rem;" onclick="showSCEventDetailsModal('${date}')">
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
// MODAL UTILITY FUNCTIONS
// ============================================

function openSCSimpleEventModal() {
    const modal = document.getElementById('scSimpleEventModal');
    if (modal) modal.style.display = 'flex';
}

function closeSCSimpleEventModal() {
    const modal = document.getElementById('scSimpleEventModal');
    if (modal) modal.style.display = 'none';
}

function openSCQuickEditEventModal() {
    const modal = document.getElementById('scQuickEditEventModal');
    if (modal) modal.style.display = 'flex';
}

function closeSCQuickEditEventModal() {
    const modal = document.getElementById('scQuickEditEventModal');
    if (modal) modal.style.display = 'none';
}

// ============================================
// SECTION INITIALIZATION
// ============================================

async function initializeSCEventsSection() {
    console.log('🎨 [SC Events] initializeSCEventsSection called');

    const eventsSection = document.getElementById('scEventsSection');
    if (!eventsSection || eventsSection.style.display === 'none') {
        console.warn('⚠️ [SC Events] Section not visible, aborting initialization');
        return;
    }

    if (!scEventsInitialized) {
        console.log('🚀 [SC Events] First time setup - initializing event listeners...');

        const prevBtn = document.querySelector('.sc-calendar-nav button:nth-child(1)');
        const todayBtn = document.querySelector('.sc-calendar-nav button:nth-child(2)');
        const nextBtn = document.querySelector('.sc-calendar-nav button:nth-child(3)');

        if (prevBtn) prevBtn.onclick = () => changeSCMonth(-1);
        if (todayBtn) todayBtn.onclick = goToSCToday;
        if (nextBtn) nextBtn.onclick = () => changeSCMonth(1);

        const simpleEventForm = document.getElementById('scSimpleEventForm');
        if (simpleEventForm) {
            simpleEventForm.onsubmit = handleSCSimpleEvent;
        }

        const quickEditEventForm = document.getElementById('scQuickEditEventForm');
        if (quickEditEventForm) {
            quickEditEventForm.onsubmit = handleSCQuickEditEvent;
        }

        console.log('✅ [SC Events] Event listeners set up');
        scEventsInitialized = true;
    }

    if (!scEventsLoaded && !scIsLoadingEvents) {
        console.log('📥 [SC Events] Loading events for the first time...');
        await loadSCEventsFromDatabase();
    } else if (scEventsLoaded) {
        console.log('✅ [SC Events] Events already loaded, refreshing UI only');
    }

    renderSCCalendar();
    loadAllSCEventsTable();
    updateSCEventsBadge();

    console.log('✅ [SC Events] Events Section ready');
}

function getSCEventCountForDashboard() {
    if (scEventsLoaded) {
        return Object.keys(scMockEvents).length;
    }
    return 0;
}

// Make functions globally available
window.initializeSCEventsSection = initializeSCEventsSection;
window.getSCEventCountForDashboard = getSCEventCountForDashboard;
window.toggleSpecificAudience = toggleSpecificAudience;