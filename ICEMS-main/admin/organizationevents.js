

    // ============================================
    // ORGANIZATIONEVENTS.JS - EVENT MANAGEMENT
    // ============================================

    // Current calendar view
    let currentCalendar = {
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        monthName: new Date().toLocaleString('default', { month: 'long' })
    };

    // Event Data - loaded from database
    let mockEvents = {};
    let eventsLoaded = false;
    let isLoadingEvents = false;
    let eventsInitialized = false;

    // ============================================
    // DATABASE API FUNCTIONS
    // ============================================

    async function loadEventsFromDatabase() {
        // ⭐ CRITICAL: Prevent multiple loads
        if (isLoadingEvents) {
            console.log('⏳ [Events] Already loading, BLOCKED');
            return;
        }

        if (eventsLoaded) {
            console.log('✅ [Events] Events already loaded, using cache');
            return;
        }

        // ⭐ Check if AppState and currentOrgId exist
        if (typeof AppState === 'undefined' || !AppState.currentOrgId) {
            console.error('❌ [Events] AppState.currentOrgId is not defined!');
            mockEvents = {};
            eventsLoaded = true;
            return;
        }

        // ⭐ Check if API_BASE_URL exists
        if (typeof API_BASE_URL === 'undefined') {
            console.error('❌ [Events] API_BASE_URL is not defined!');
            mockEvents = {};
            eventsLoaded = true;
            return;
        }

        isLoadingEvents = true;
        console.log('🔍 [Events] Loading events for organization:', AppState.currentOrgId);

        try {
            const response = await fetch(`${API_BASE_URL}/organizations/${AppState.currentOrgId}/events`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();

            if (data.success && data.events) {
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
                console.log('✅ [Events] Loaded', data.events.length, 'events');
                eventsLoaded = true;
                updateEventsBadge();
            } else {
                console.warn('⚠️ [Events] No events found');
                mockEvents = {};
                eventsLoaded = true;
            }
        } catch (error) {
            console.error('❌ [Events] Failed to load events:', error);
            console.error('❌ [Events] Error details:', error.message);
            mockEvents = {};
            eventsLoaded = true;
        } finally {
            isLoadingEvents = false;
        }
    }

    async function createEventInDatabase(eventData) {
        try {
            const dataWithOrg = {
                ...eventData,
                organization_id: AppState.currentOrgId
            };

            const response = await fetch(`${API_BASE_URL}/organizations/${AppState.currentOrgId}/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataWithOrg)
            });

            const data = await response.json();

            if (data.success) {
                console.log('✅ [Events] Event created in database:', data.event);
                return data.event;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('❌ [Events] Failed to create event:', error);
            throw error;
        }
    }

    async function updateEventInDatabase(eventId, eventData) {
        try {
            const response = await fetch(`${API_BASE_URL}/organizations/${AppState.currentOrgId}/events/${eventId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(eventData)
            });

            const data = await response.json();

            if (data.success) {
                console.log('✅ [Events] Event updated in database:', data.event);
                return data.event;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('❌ [Events] Failed to update event:', error);
            throw error;
        }
    }

    async function deleteEventFromDatabase(eventId) {
        try {
            const response = await fetch(`${API_BASE_URL}/organizations/${AppState.currentOrgId}/events/${eventId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();

            if (data.success) {
                console.log('✅ [Events] Event deleted from database');
                return true;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('❌ [Events] Failed to delete event:', error);
            throw error;
        }
    }

    // ============================================
    // CALENDAR RENDERING
    // ============================================

    function renderCalendar() {
        const calendarGrid = document.querySelector('.calendar-grid');
        if (!calendarGrid) {
            console.warn('⚠️ [Events] Calendar grid not found');
            return;
        }

        const calendarHeader = document.querySelector('.calendar-header h3');
        if (calendarHeader) {
            calendarHeader.textContent = `${currentCalendar.monthName} ${currentCalendar.year}`;
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
        const firstDay = new Date(currentCalendar.year, currentCalendar.month - 1, 1).getDay();
        const daysInMonth = new Date(currentCalendar.year, currentCalendar.month, 0).getDate();

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

            const formattedMonth = String(currentCalendar.month).padStart(2, '0');
            const formattedDay = String(day).padStart(2, '0');
            const dateKey = `${currentCalendar.year}-${formattedMonth}-${formattedDay}`;

            dayElement.setAttribute('data-date', dateKey);
            dayElement.textContent = day;

            // Check if there's an event on this day
            if (mockEvents[dateKey]) {
                dayElement.classList.add('event');
                dayElement.style.cursor = 'pointer';

                // Create a click handler with closure to capture dateKey
                (function (date) {
                    dayElement.addEventListener('click', function () {
                        showEventDetailsModal(date);
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
                        openQuickCreateModal(date);
                    });
                })(dateKey);
            }

            calendarGrid.appendChild(dayElement);
        }

        console.log('✅ [Events] Calendar rendered for', currentCalendar.monthName, currentCalendar.year);
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
    // BADGE UPDATES
    // ============================================

    function updateEventsBadge() {
        // ⭐ CRITICAL: Only update badge if events are loaded
        if (!eventsLoaded) {
            console.log('⏸️ [Events] Badge update skipped - events not loaded yet');
            return;
        }
        
        const badge = document.getElementById('eventsBadge');
        if (badge) {
            const eventCount = Object.keys(mockEvents).length;
            badge.textContent = eventCount;
            badge.style.display = eventCount > 0 ? 'inline-block' : 'none';
        }
    }

    // ============================================
    // EVENT DETAILS MODAL
    // ============================================

    function showEventDetailsModal(dateKey) {
        const event = mockEvents[dateKey];
        if (!event) return;

        const eventDate = new Date(dateKey + 'T00:00:00');
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
                            ${event.admin || 'Organization'}
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

        const simpleEventModal = document.getElementById('simpleEventModal');
        const quickEditEventModal = document.getElementById('quickEditEventModal');

        if (quickEditEventModal) {
            document.getElementById('quickEditDate').value = dateKey;
            document.getElementById('quickEditEventTitle').value = event.title || '';
            document.getElementById('quickEditStartTime').value = event.startTime || '';
            document.getElementById('quickEditEndTime').value = event.endTime || '';
            document.getElementById('quickEditEventAudienceInput').value = event.audience || 'All Students';
            document.getElementById('quickEditEventIsClearance').checked = event.isClearance || false;

            const quickEditTitleDisplay = document.getElementById('quickEditTitleDisplay');
            if (quickEditTitleDisplay) quickEditTitleDisplay.textContent = event.title;

            const deleteEventButton = document.getElementById('deleteQuickEventBtn');
            if (deleteEventButton) {
                deleteEventButton.onclick = () => deleteQuickEvent(dateKey);
            }

            openQuickEditEventModal();
        }
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
            updateEventsBadge();

            alert('Event deleted successfully!');
        } catch (error) {
            alert('Failed to delete event: ' + error.message);
        }
    }

    // ============================================
    // CREATE EVENT MODAL
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
                            <input type="text" class="form-input" id="dynamicEventOrganizer" value="Organization" readonly style="background-color: #f3f4f6; cursor: not-allowed;">
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
                    updateEventsBadge();

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
    // QUICK CREATE/EDIT MODALS
    // ============================================

    function openQuickCreateModal(dateKey) {
        const eventDate = new Date(dateKey + 'T00:00:00');
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
            admin: "Organization",
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
                admin: "Organization",
                isClearance: isClearance
            };

            closeSimpleEventModal();
            document.getElementById('simpleEventForm').reset();

            renderCalendar();
            loadAllEventsTable();
            updateEventsBadge();

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
                updateEventsBadge();

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
    // MODAL FUNCTIONS
    // ============================================

    function openSimpleEventModal() {
        const modal = document.getElementById('simpleEventModal');
        if (modal) modal.style.display = 'flex';
    }

    function closeSimpleEventModal() {
        const modal = document.getElementById('simpleEventModal');
        if (modal) modal.style.display = 'none';
    }

    function openQuickEditEventModal() {
        const modal = document.getElementById('quickEditEventModal');
        if (modal) modal.style.display = 'flex';
    }

    function closeQuickEditEventModal() {
        const modal = document.getElementById('quickEditEventModal');
        if (modal) modal.style.display = 'none';
    }

    // ============================================
    // SECTION INITIALIZATION
    // ============================================

    async function initializeEventsSection() {
        console.log('🎨 [Events] initializeEventsSection called');

        // ⭐ CRITICAL: Verify Events section is visible before proceeding
        const eventsSection = document.getElementById('eventsSection');
        if (!eventsSection || eventsSection.style.display === 'none') {
            console.warn('⚠️ [Events] Section not visible, aborting initialization');
            return;
        }

        // ⭐ Setup event listeners on first call only
        if (!eventsInitialized) {
            console.log('🚀 [Events] First time setup - initializing event listeners...');

            // Setup calendar navigation
            const prevBtn = document.querySelector('.calendar-nav button:nth-child(1)');
            const todayBtn = document.querySelector('.calendar-nav button:nth-child(2)');
            const nextBtn = document.querySelector('.calendar-nav button:nth-child(3)');

            if (prevBtn) prevBtn.onclick = () => changeMonth(-1);
            if (todayBtn) todayBtn.onclick = goToToday;
            if (nextBtn) nextBtn.onclick = () => changeMonth(1);

            // Setup event forms
            const simpleEventForm = document.getElementById('simpleEventForm');
            if (simpleEventForm) {
                simpleEventForm.onsubmit = handleSimpleEvent;
            }

            const quickEditEventForm = document.getElementById('quickEditEventForm');
            if (quickEditEventForm) {
                quickEditEventForm.onsubmit = handleQuickEditEvent;
            }

            console.log('✅ [Events] Event listeners set up');
            eventsInitialized = true;
        }

        // ⭐ LAZY LOAD: Only load events when section is viewed
        if (!eventsLoaded && !isLoadingEvents) {
            console.log('📥 [Events] Loading events for the first time...');
            await loadEventsFromDatabase();
        } else if (eventsLoaded) {
            console.log('✅ [Events] Events already loaded, refreshing UI only');
        }

        // Always render UI when section is opened
        renderCalendar();
        loadAllEventsTable();
        updateEventsBadge();

        console.log('✅ [Events] Events Section ready');
    }

    // ============================================
    // DASHBOARD STATS UPDATE (EXTERNAL CALL)
    // ============================================

    // ⭐ Function for dashboard to get event count WITHOUT loading events
    function getEventCountForDashboard() {
        // Only return count if events are already loaded
        if (eventsLoaded) {
            return Object.keys(mockEvents).length;
        }
        return 0; // Return 0 if not loaded yet, don't trigger load
    }

    // Export for use in organization.js
    window.initializeEventsSection = initializeEventsSection;
    window.getEventCountForDashboard = getEventCountForDashboard;