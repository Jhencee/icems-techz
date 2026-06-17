// ============================================
// SCEVENT.JS - STUDENT COUNCIL EVENT MANAGEMENT (PART 2)
// Modals: Create, Edit, Delete, View Event Details
// ============================================

// ============================================
// EVENT DETAILS MODAL
// ============================================

function showSCEventDetailsModal(dateKey) {
    const event = scMockEvents[dateKey];
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
        <div class="modal active" id="scEventDetailsModal" style="display: flex; z-index: 10000;">
            <div class="modal-content" style="max-width: 600px;">
                <span class="close-modal" onclick="closeSCEventDetailsModal()">&times;</span>
                
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
                        ${event.admin || 'Student Council'}
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
                    <button class="btn btn-primary" onclick="editSCEventFromModal('${dateKey}')" style="flex: 1;">
                        <i class="fas fa-edit"></i> Edit Event
                    </button>
                    <button class="btn btn-danger" onclick="deleteSCEventFromModal('${dateKey}')" style="flex: 1; background: #dc2626;">
                        <i class="fas fa-trash"></i> Delete Event
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeSCEventDetailsModal() {
    const modal = document.getElementById('scEventDetailsModal');
    if (modal) modal.remove();
}

function editSCEventFromModal(dateKey) {
    closeSCEventDetailsModal();
    const event = scMockEvents[dateKey];

    const quickEditEventModal = document.getElementById('scQuickEditEventModal');

    if (quickEditEventModal) {
        document.getElementById('scQuickEditDate').value = dateKey;
        document.getElementById('scQuickEditEventTitle').value = event.title || '';
        document.getElementById('scQuickEditStartTime').value = event.startTime || '';
        document.getElementById('scQuickEditEndTime').value = event.endTime || '';
        document.getElementById('scQuickEditEventAudienceInput').value = event.audience || 'All Students';
        document.getElementById('scQuickEditEventIsClearance').checked = event.isClearance || false;

        const quickEditTitleDisplay = document.getElementById('scQuickEditTitleDisplay');
        if (quickEditTitleDisplay) quickEditTitleDisplay.textContent = event.title;

        const deleteEventButton = document.getElementById('scDeleteQuickEventBtn');
        if (deleteEventButton) {
            deleteEventButton.onclick = () => deleteSCQuickEvent(dateKey);
        }

        openSCQuickEditEventModal();
    }
}

async function deleteSCEventFromModal(dateKey) {
    const event = scMockEvents[dateKey];

    if (!confirm(`Are you sure you want to delete "${event.title}"?`)) {
        return;
    }

    try {
        await deleteSCEventFromDatabase(event.id);
        delete scMockEvents[dateKey];

        closeSCEventDetailsModal();
        renderSCCalendar();
        loadAllSCEventsTable();
        updateSCEventsBadge();

        alert('Event deleted successfully!');
    } catch (error) {
        alert('Failed to delete event: ' + error.message);
    }
}

// ============================================
// CREATE EVENT MODAL
// ============================================

function openCreateSCEventModal() {
    const today = new Date().toISOString().split('T')[0];

    const modalHTML = `
        <div class="modal" id="createSCEventModalDynamic" style="display: flex;">
            <div class="modal-content">
                <span class="close-modal" onclick="closeCreateSCEventModalDynamic()">&times;</span>
                <h2 class="modal-title"><i class="fa-solid fa-calendar-plus"></i> Create New Event</h2>

                <form id="createSCEventFormDynamic">
                    <div class="form-group">
                        <label>Event Title *</label>
                        <input type="text" class="form-input" id="scDynamicEventTitle" placeholder="Enter event title" required>
                    </div>

                    <div class="form-group">
                        <label>Description *</label>
                        <textarea class="form-textarea" id="scDynamicEventDescription" placeholder="Enter event description" required></textarea>
                    </div>

                    <div class="form-group">
                        <label>Location *</label>
                        <input type="text" class="form-input" id="scDynamicEventLocation" placeholder="Enter event location" required>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Date *</label>
                            <input type="date" class="form-input" id="scDynamicEventDate" required min="${today}">
                        </div>

                        <div class="form-group">
                            <label>Start Time *</label>
                            <input type="time" class="form-input" id="scDynamicEventStartTime" required>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>End Time *</label>
                            <input type="time" class="form-input" id="scDynamicEventEndTime" required>
                        </div>

                        <div class="form-group">
                            <label>Category *</label>
                            <select class="form-select" id="scDynamicEventCategory" required>
                                <option value="">Select category</option>
                                <option value="mandatory">Mandatory</option>
                                <option value="optional">Optional</option>
                                <option value="special">Special</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Organizer *</label>
                        <input type="text" class="form-input" id="scDynamicEventOrganizer" value="Student Council" readonly style="background-color: #f3f4f6; cursor: not-allowed;">
                    </div>

                    <div class="form-group">
                        <label>Audience *</label>
                        <input type="text" class="form-input" id="scDynamicEventAudience" placeholder="e.g., All Students, BSIT 3-1" required>
                    </div>

                    <div class="form-group" style="padding-top: 10px;">
                        <input type="checkbox" id="scDynamicEventIsClearance" style="width: auto; margin-right: 10px;">
                        <label for="scDynamicEventIsClearance" style="display: inline; font-weight: normal;">**Event counts toward Clearance Requirement**</label>
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
        const titleInput = document.getElementById('scDynamicEventTitle');
        if (titleInput) titleInput.focus();
    }, 100);

    const form = document.getElementById('createSCEventFormDynamic');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const dateKey = document.getElementById('scDynamicEventDate').value;
            const title = document.getElementById('scDynamicEventTitle').value;
            const description = document.getElementById('scDynamicEventDescription').value;
            const location = document.getElementById('scDynamicEventLocation').value;
            const startTime = document.getElementById('scDynamicEventStartTime').value;
            const endTime = document.getElementById('scDynamicEventEndTime').value;
            const category = document.getElementById('scDynamicEventCategory').value;
            const organizer = document.getElementById('scDynamicEventOrganizer').value;
            const audience = document.getElementById('scDynamicEventAudience').value;
            const isClearance = document.getElementById('scDynamicEventIsClearance').checked;

            if (scMockEvents[dateKey]) {
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
                const createdEvent = await createSCEventInDatabase(eventData);

                scMockEvents[dateKey] = {
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

                closeCreateSCEventModalDynamic();
                form.reset();

                renderSCCalendar();
                loadAllSCEventsTable();
                updateSCEventsBadge();

                alert(`Event "${title}" created successfully for ${dateKey}!`);
            } catch (error) {
                alert('Failed to create event: ' + error.message);
            }
        });
    }
}

function closeCreateSCEventModalDynamic() {
    const modal = document.getElementById('createSCEventModalDynamic');
    if (modal) modal.remove();
}

// ============================================
// QUICK CREATE MODAL
// ============================================

function openSCQuickCreateModal(dateKey) {
    const eventDate = new Date(dateKey + 'T00:00:00');
    const formattedDate = eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    document.getElementById('scSimpleEventDate').value = dateKey;
    document.getElementById('scEventDateDisplay').textContent = formattedDate;
    openSCSimpleEventModal();
}

async function handleSCSimpleEvent(e) {
    e.preventDefault();

    const title = document.getElementById('scSimpleEventTitle').value;
    const startTime = document.getElementById('scSimpleStartTime').value;
    const endTime = document.getElementById('scSimpleEndTime').value;
    const dateKey = document.getElementById('scSimpleEventDate').value;
    const finalAudience = document.getElementById('scSimpleEventAudienceInput').value;
    const isClearance = document.getElementById('scSimpleEventIsClearance').checked;

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
        admin: "Student Council",
        is_clearance: isClearance
    };

    try {
        const createdEvent = await createSCEventInDatabase(eventData);

        scMockEvents[dateKey] = {
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
            admin: "Student Council",
            isClearance: isClearance
        };

        closeSCSimpleEventModal();
        document.getElementById('scSimpleEventForm').reset();

        renderSCCalendar();
        loadAllSCEventsTable();
        updateSCEventsBadge();

        alert(`Event "${title}" created successfully!`);
    } catch (error) {
        alert('Failed to create event: ' + error.message);
    }
}

// ============================================
// QUICK EDIT MODAL
// ============================================

async function handleSCQuickEditEvent(e) {
    e.preventDefault();

    const dateKey = document.getElementById('scQuickEditDate').value;
    const title = document.getElementById('scQuickEditEventTitle').value;
    const startTime = document.getElementById('scQuickEditStartTime').value;
    const endTime = document.getElementById('scQuickEditEndTime').value;
    const finalAudience = document.getElementById('scQuickEditEventAudienceInput').value;
    const isClearance = document.getElementById('scQuickEditEventIsClearance').checked;

    const event = scMockEvents[dateKey];
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
        await updateSCEventInDatabase(event.id, updateData);

        scMockEvents[dateKey].title = title;
        scMockEvents[dateKey].time = `${startTime} - ${endTime}`;
        scMockEvents[dateKey].startTime = startTime;
        scMockEvents[dateKey].endTime = endTime;
        scMockEvents[dateKey].audience = finalAudience;
        scMockEvents[dateKey].isClearance = isClearance;
        scMockEvents[dateKey].category = isClearance ? "mandatory" : "optional";

        closeSCQuickEditEventModal();
        document.getElementById('scQuickEditEventForm').reset();

        renderSCCalendar();
        loadAllSCEventsTable();

        alert(`Event "${title}" updated successfully!`);
    } catch (error) {
        alert('Failed to update event: ' + error.message);
    }
}

async function deleteSCQuickEvent(dateKey) {
    const event = scMockEvents[dateKey];
    if (!event) {
        alert("Error: No event selected for deletion.");
        return;
    }

    if (confirm(`Are you sure you want to delete "${event.title}"?`)) {
        try {
            await deleteSCEventFromDatabase(event.id);
            delete scMockEvents[dateKey];

            closeSCQuickEditEventModal();
            renderSCCalendar();
            loadAllSCEventsTable();
            updateSCEventsBadge();

            alert(`Event "${event.title}" deleted successfully.`);
        } catch (error) {
            alert('Failed to delete event: ' + error.message);
        }
    }
}