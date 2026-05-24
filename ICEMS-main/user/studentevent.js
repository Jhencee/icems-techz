let mockEvents = []; // Will be populated from database
let currentUser = null; // Store logged-in user data

// ============================================
// LOAD USER DATA FROM LOCALSTORAGE (same as dashboard)
// ============================================
function loadUserData() {
    // Get current user from localStorage
    const storedUser = localStorage.getItem('currentUser');

    if (!storedUser) {
        console.error('❌ No user logged in');
        window.location.href = 'studentlogin.html';
        return null;
    }

    currentUser = JSON.parse(storedUser);
    console.log('👤 User data loaded from localStorage:', currentUser);

    // Update sidebar with user data
    updateUserProfile(currentUser);
    return currentUser;
}

// Update user profile in sidebar (same structure as dashboard)
function updateUserProfile(user) {
    console.log('🔄 Updating profile with user data:', user);

    // Build full name from first_name and last_name
    const fullName = `${user.first_name} ${user.last_name}`;
    const initials = `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    const courseYear = `${user.course || 'N/A'} ${user.year || ''}`.trim();
    const studentNumber = user.student_number || 'N/A';

    // Update sidebar avatar
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    if (sidebarAvatar) {
        sidebarAvatar.textContent = initials;
        
        // Load saved avatar if exists
        const savedAvatar = localStorage.getItem(`avatar_${user.id}`);
        if (savedAvatar) {
            sidebarAvatar.style.backgroundImage = `url(${savedAvatar})`;
            sidebarAvatar.style.backgroundSize = 'cover';
            sidebarAvatar.style.backgroundPosition = 'center';
            sidebarAvatar.style.color = 'transparent';
        }
        
        console.log('✅ Updated sidebar avatar:', initials);
    }

    // Update sidebar name
    const sidebarName = document.getElementById('sidebarName');
    if (sidebarName) {
        sidebarName.textContent = fullName;
        console.log('✅ Updated sidebar name:', fullName);
    }

    // Update sidebar ID
    const sidebarId = document.getElementById('sidebarId');
    if (sidebarId) {
        sidebarId.textContent = `${courseYear} | ${studentNumber}`;
        console.log('✅ Updated sidebar ID:', `${courseYear} | ${studentNumber}`);
    }

    // Update profile modal fields
    const editName = document.getElementById('editName');
    if (editName) {
        editName.value = fullName;
        console.log('✅ Updated profile modal name');
    }

    const editCourse = document.getElementById('editCourse');
    if (editCourse) {
        editCourse.value = courseYear;
        console.log('✅ Updated profile modal course');
    }

    const editStudentId = document.getElementById('editStudentId');
    if (editStudentId) {
        editStudentId.value = studentNumber;
        console.log('✅ Updated profile modal student ID');
    }

    const editEmail = document.getElementById('editEmail');
    if (editEmail) {
        editEmail.value = user.email;
        console.log('✅ Updated profile modal email');
    }

    // Update header greeting if it exists
    const headerGreeting = document.querySelector('.header-left h1');
    if (headerGreeting) {
        headerGreeting.innerHTML = `Events <i class="fas fa-calendar-alt"></i>`;
        console.log('✅ Updated header');
    }
}// --- studentevent.js (WITH USER DATA FROM DATABASE) ---

// 1. Configuration
window.API_URL = window.API_URL || 'http://127.0.0.1:8000';
const MOCK_CURRENT_DATE = new Date();

// Current calendar view
let currentCalendar = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    monthName: new Date().toLocaleString('default', { month: 'long' })
};

// ============================================
// LOAD USER DATA FROM DATABASE
// ============================================
async function loadUserData() {
    // Get current user from localStorage
    const storedUser = localStorage.getItem('currentUser');
    
    if (!storedUser) {
        console.error('❌ No user logged in');
        window.location.href = 'studentlogin.html';
        return null;
    }

    const userData = JSON.parse(storedUser);
    console.log('👤 Loading user data:', userData.email);

    try {
        // Fetch user details from database
        const response = await fetch(`${window.API_URL}/api/students/${userData.student_number}`);
        const data = await response.json();

        if (data.success) {
            currentUser = data.student;
            console.log('✅ User data loaded:', currentUser);
            
            // Update sidebar with user data
            updateUserProfile(currentUser);
            return currentUser;
        } else {
            console.error('❌ Failed to load user data:', data.message);
            // Use stored data as fallback
            currentUser = userData;
            updateUserProfile(currentUser);
            return currentUser;
        }
    } catch (error) {
        console.error('❌ Error loading user data:', error);
        // Use stored data as fallback
        currentUser = userData;
        updateUserProfile(currentUser);
        return currentUser;
    }
}

// Update user profile in sidebar (same structure as dashboard)
function updateUserProfile(user) {
    console.log('🔄 Updating profile with user data:', user);

    // Build full name from first_name and last_name
    const fullName = `${user.first_name} ${user.last_name}`;
    const initials = `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    const courseYear = `${user.course || 'N/A'} ${user.year || ''}`.trim();
    const studentNumber = user.student_number || 'N/A';

    // Update sidebar avatar
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    if (sidebarAvatar) {
        sidebarAvatar.textContent = initials;
        
        // Load saved avatar if exists
        const savedAvatar = localStorage.getItem(`avatar_${user.id}`);
        if (savedAvatar) {
            sidebarAvatar.style.backgroundImage = `url(${savedAvatar})`;
            sidebarAvatar.style.backgroundSize = 'cover';
            sidebarAvatar.style.backgroundPosition = 'center';
            sidebarAvatar.style.color = 'transparent';
        }
        
        console.log('✅ Updated sidebar avatar:', initials);
    }

    // Update sidebar name
    const sidebarName = document.getElementById('sidebarName');
    if (sidebarName) {
        sidebarName.textContent = fullName;
        console.log('✅ Updated sidebar name:', fullName);
    }

    // Update sidebar ID
    const sidebarId = document.getElementById('sidebarId');
    if (sidebarId) {
        sidebarId.textContent = `${courseYear} | ${studentNumber}`;
        console.log('✅ Updated sidebar ID:', `${courseYear} | ${studentNumber}`);
    }

    // Update profile modal fields
    const editName = document.getElementById('editName');
    if (editName) {
        editName.value = fullName;
        console.log('✅ Updated profile modal name');
    }

    const editCourse = document.getElementById('editCourse');
    if (editCourse) {
        editCourse.value = courseYear;
        console.log('✅ Updated profile modal course');
    }

    const editStudentId = document.getElementById('editStudentId');
    if (editStudentId) {
        editStudentId.value = studentNumber;
        console.log('✅ Updated profile modal student ID');
    }

    const editEmail = document.getElementById('editEmail');
    if (editEmail) {
        editEmail.value = user.email;
        console.log('✅ Updated profile modal email');
    }

    // Update header greeting if it exists
    const headerGreeting = document.querySelector('.header-left h1');
    if (headerGreeting) {
        headerGreeting.innerHTML = `Events <i class="fas fa-calendar-alt"></i>`;
        console.log('✅ Updated header');
    }
}

// Get initials from name
function getInitials(name) {
    if (!name) return 'ST';
    const names = name.split(' ');
    if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

// ============================================
// FETCH EVENTS FROM DATABASE
// ============================================
async function loadEventsFromDatabase() {
    console.log('🔍 Fetching events from database...');

    try {
        const response = await fetch(`${window.API_URL}/api/events`);
        const data = await response.json();

        if (data.success) {
            console.log('✅ Events loaded from database:', data.events.length);
            
            // Transform database events to match our mockEvents structure
            mockEvents = data.events.map(event => ({
                id: event.id,
                title: event.title,
                location: event.location,
                dateStart: new Date(`${event.event_date} ${event.start_time}`),
                dateEnd: new Date(`${event.event_date} ${event.end_time}`),
                organizer: event.admin,
                audience: event.audience || 'All Students',
                description: event.description,
                eventDate: event.event_date,
                isClearance: event.is_clearance,
                category: event.category,
                status: new Date(event.event_date) < new Date() ? 'attended' : 'upcoming'
            }));

            console.log('📅 Transformed events:', mockEvents);
            return mockEvents;
        } else {
            console.error('❌ Failed to load events:', data.message);
            return [];
        }
    } catch (error) {
        console.error('❌ Error loading events:', error);
        alert('Failed to connect to database. Please check if Laravel server is running.');
        return [];
    }
}

// Utility function to format date/time for display
function formatEventDateTime(dateStart, dateEnd) {
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    const datePart = dateStart.toLocaleDateString('en-US', options);

    const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
    const timeStart = dateStart.toLocaleTimeString('en-US', timeOptions);
    const timeEnd = dateEnd.toLocaleTimeString('en-US', timeOptions);

    return `${datePart} | ${timeStart} - ${timeEnd}`;
}

// Utility function to calculate time remaining
function getTimeRemaining(endDate) {
    const total = endDate - MOCK_CURRENT_DATE;
    if (total <= 0) return 'Event Ended';

    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((total / 1000 / 60) % 60);

    let output = '';
    if (days > 0) output += `${days}d `;
    if (hours > 0) output += `${hours}h `;
    output += `${minutes}m`;

    return output.trim() + ' left';
}

// Utility function to generate the back-face HTML for the calendar flip
function createEventBackFaceHtml(event) {
    const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
    const timeStart = event.dateStart.toLocaleTimeString('en-US', timeOptions);
    const timeEnd = event.dateEnd.toLocaleTimeString('en-US', timeOptions);

    const truncatedDescription = event.description.length > 80
        ? event.description.substring(0, 80) + '...'
        : event.description;

    return `
    <div class="calendar-day-back-face">
        <p class="back-face-title">${event.title}</p>
        <p class="back-face-time"><i class="fas fa-clock"></i> ${timeStart} - ${timeEnd}</p>
        <p class="back-face-organizer">By: ${event.organizer}</p>
        <p class="back-face-audience"><i class="fas fa-bullhorn"></i> Audience: ${event.audience}</p> 
        <p class="back-face-description">${truncatedDescription}</p>
    </div>
    `;
}

// Check if event has started
function hasEventStarted(eventId) {
    const event = mockEvents.find(e => e.id === eventId);
    if (!event) return false;
    return MOCK_CURRENT_DATE >= event.dateStart;
}

// Event Card Rendering Function
function createEventCard(event) {
    const dateTimeFormatted = formatEventDateTime(event.dateStart, event.dateEnd);
    let timerHTML = '';
    let actionButton = '';

    if (event.status === 'upcoming') {
        const timeRemaining = getTimeRemaining(event.dateStart);
        timerHTML = `<div class="event-timer"><i class="fas fa-stopwatch"></i> ${timeRemaining}</div>`;
        actionButton = `<button class="btn btn-primary" onclick="openUploadModal('${event.id}', '${event.title.replace(/'/g, "\\'")}')">Upload Proof</button>`;
    } else {
        timerHTML = `<div class="event-timer" style="background-color: #d1fae5; color: #059669;"><i class="fas fa-check-circle"></i> Completed</div>`;
        actionButton = `<button class="btn btn-primary" disabled>Proof Uploaded</button>`;
    }

    const clearanceBadge = event.isClearance ? 
        '<span style="background: #059669; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; margin-left: 10px;">CLEARANCE</span>' : '';

    return `
    <div class="event-card">
        <div class="event-header">
            <div>
                <div class="event-title">${event.title} ${clearanceBadge}</div>
                <div class="event-info">
                    <div class="event-info-item"><i class="fas fa-location-dot"></i> ${event.location}</div>
                    <div class="event-info-item"><i class="fas fa-calendar-days"></i> ${dateTimeFormatted}</div>
                    <div class="event-info-item"><i class="fas fa-users"></i> ${event.organizer}</div>
                    <div class="event-info-item"><i class="fas fa-bullhorn"></i> Audience: ${event.audience}</div> 
                </div>
            </div>
            ${timerHTML}
        </div>
        <div class="event-description">${event.description}</div>
        <div class="event-actions">
            ${actionButton}
            <button class="btn btn-secondary" onclick="viewDetails(
                '${event.title.replace(/'/g, "\\'")}',
                '${event.location.replace(/'/g, "\\'")}',
                '${dateTimeFormatted}',
                '${event.organizer.replace(/'/g, "\\'")}',
                '${event.description.replace(/'/g, "\\'")}',
                '${event.audience.replace(/'/g, "\\'")}'
            )">View Details</button>
        </div>
    </div>
    `;
}

// Tab Switching Logic
function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    document.querySelector(`.tab-btn[onclick="switchTab('${tabId}')"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

// Main Rendering Function
async function renderEvents() {
    const upcomingContainer = document.getElementById('upcoming');
    const attendedContainer = document.getElementById('attended');
    const allContainer = document.getElementById('all');

    // Show loading state
    if (upcomingContainer) upcomingContainer.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #800020;"></i><p>Loading events...</p></div>';
    if (attendedContainer) attendedContainer.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #800020;"></i><p>Loading events...</p></div>';
    if (allContainer) allContainer.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #800020;"></i><p>Loading events...</p></div>';

    // Load events from database
    await loadEventsFromDatabase();

    // Clear containers
    if (upcomingContainer) upcomingContainer.innerHTML = '';
    if (attendedContainer) attendedContainer.innerHTML = '';
    if (allContainer) allContainer.innerHTML = '';

    let upcomingHtml = '';
    let attendedHtml = '';

    // Sort events by date
    const sortedEvents = [...mockEvents].sort((a, b) => b.dateStart.getTime() - a.dateStart.getTime());

    sortedEvents.forEach(event => {
        const cardHtml = createEventCard(event);
        if (allContainer) allContainer.innerHTML += cardHtml;

        if (event.status === 'upcoming') {
            upcomingHtml += cardHtml;
        } else if (event.status === 'attended') {
            attendedHtml += cardHtml;
        }
    });

    // Populate upcoming tab
    if (upcomingContainer) {
        if (upcomingHtml) {
            upcomingContainer.innerHTML = upcomingHtml;
        } else {
            upcomingContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><i class="fas fa-calendar-alt"></i></div>
                    <h2>No Upcoming Events</h2>
                    <p>There are currently no scheduled events. Check back later!</p>
                </div>
            `;
        }
    }

    // Populate attended tab
    if (attendedContainer) {
        if (attendedHtml) {
            attendedContainer.innerHTML = attendedHtml;
        } else {
            attendedContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><i class="fas fa-calendar-check"></i></div>
                    <h2>No Attended Events</h2>
                    <p>You haven't attended any events yet. Start by attending upcoming events!</p>
                </div>
            `;
        }
    }

    // Update badges
    if (document.getElementById('eventsBadge')) {
        document.getElementById('eventsBadge').textContent = mockEvents.filter(e => e.status === 'upcoming').length;
    }

    renderCalendar();
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

    // Clear existing calendar (keep day headers)
    while (calendarGrid.children.length > 7) {
        calendarGrid.removeChild(calendarGrid.lastChild);
    }

    const firstDayOfMonth = new Date(currentCalendar.year, currentCalendar.month - 1, 1);
    const daysInMonth = new Date(currentCalendar.year, currentCalendar.month, 0).getDate();
    const startDayIndex = firstDayOfMonth.getDay();

    // Add empty cells
    for (let i = 0; i < startDayIndex; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('calendar-day', 'empty');
        emptyDiv.innerHTML = '<div class="calendar-day-inner"></div>';
        calendarGrid.appendChild(emptyDiv);
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('calendar-day');

        const flipInner = document.createElement('div');
        flipInner.classList.add('calendar-day-inner');

        const frontFace = document.createElement('div');
        frontFace.classList.add('calendar-day-front-face');
        frontFace.textContent = day;

        const backFace = document.createElement('div');
        backFace.classList.add('calendar-day-back-face');

        const formattedMonth = String(currentCalendar.month).padStart(2, '0');
        const formattedDay = String(day).padStart(2, '0');
        const dateKey = `${currentCalendar.year}-${formattedMonth}-${formattedDay}`;

        const eventsOnDay = mockEvents.filter(e => e.eventDate === dateKey);

        if (eventsOnDay.length > 0) {
            dayDiv.classList.add('event');
            dayDiv.setAttribute('data-date', dateKey);
            dayDiv.style.cursor = 'pointer';
            dayDiv.addEventListener('click', () => showEventDetailsModal(dateKey, eventsOnDay[0]));
            backFace.innerHTML = createEventBackFaceHtml(eventsOnDay[0]);
        } else {
            backFace.innerHTML = '<p class="back-face-message" style="text-align:center;">No Events Scheduled</p>';
        }

        flipInner.appendChild(frontFace);
        flipInner.appendChild(backFace);
        dayDiv.appendChild(flipInner);
        calendarGrid.appendChild(dayDiv);
    }
}

// Calendar Navigation
function changeMonth(direction) {
    currentCalendar.month += direction;
    if (currentCalendar.month > 12) {
        currentCalendar.month = 1;
        currentCalendar.year++;
    } else if (currentCalendar.month < 1) {
        currentCalendar.month = 12;
        currentCalendar.year--;
    }
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
// EVENT DETAILS MODAL
// ============================================
function showEventDetailsModal(dateKey, event) {
    const eventDate = new Date(dateKey);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
    const timeStart = event.dateStart.toLocaleTimeString('en-US', timeOptions);
    const timeEnd = event.dateEnd.toLocaleTimeString('en-US', timeOptions);

    const categoryColor = event.status === 'upcoming' ? '#800020' : '#059669';
    const categoryLabel = event.status === 'upcoming' ? 'UPCOMING EVENT' : 'COMPLETED EVENT';

    let modalHTML = `
        <div class="modal active" id="calendarEventModal" style="display: flex; z-index: 10000;">
            <div class="modal-content" style="max-width: 600px;">
                <span class="close-modal" onclick="closeCalendarEventModal()">&times;</span>
                
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
                        ${timeStart} - ${timeEnd}
                    </div>
                    <div style="margin-bottom: 12px;">
                        <i class="fas fa-map-marker-alt" style="color: #800020; width: 25px;"></i>
                        ${event.location}
                    </div>
                    <div style="margin-bottom: 12px;">
                        <i class="fas fa-users" style="color: #800020; width: 25px;"></i>
                        ${event.audience}
                    </div>
                    <div>
                        <i class="fas fa-user-tie" style="color: #800020; width: 25px;"></i>
                        Organized by: ${event.organizer}
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #800020; margin-bottom: 10px;">Description</h3>
                    <p style="color: #666; line-height: 1.6;">${event.description}</p>
                </div>
                
                ${event.status === 'upcoming' ? `
                <div style="display: flex; gap: 10px; justify-content: center; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                    <button class="btn btn-primary" onclick="closeCalendarEventModal(); openUploadModal('${event.id}', '${event.title.replace(/'/g, "\\'")}');" style="flex: 1;">
                        <i class="fas fa-upload"></i> Upload Proof
                    </button>
                    <button class="btn btn-secondary" onclick="closeCalendarEventModal()" style="flex: 1;">
                        Close
                    </button>
                </div>
                ` : `
                <div style="background: #dcfce7; padding: 15px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #059669;">
                    <i class="fas fa-check-circle" style="color: #059669;"></i>
                    <strong style="color: #166534;">Event completed</strong>
                </div>
                <button class="btn btn-secondary" onclick="closeCalendarEventModal()" style="width: 100%;">Close</button>
                `}
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeCalendarEventModal() {
    const modal = document.getElementById('calendarEventModal');
    if (modal) modal.remove();
}

// Modal Functions
function openUploadModal(eventId, eventTitle) {
    document.getElementById('modalEventTitle').textContent = `Upload Proof for: ${eventTitle}`;
    document.getElementById('uploadModal').style.display = 'flex';
    document.getElementById('uploadModal').setAttribute('data-event-id', eventId);

    const submitBtn = document.getElementById('submitProofBtn');
    if (hasEventStarted(eventId)) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
    } else {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
        submitBtn.style.cursor = 'not-allowed';
    }
}

function closeUploadModal() {
    document.getElementById('uploadModal').style.display = 'none';
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    const previewArea = document.getElementById('previewArea');
    const imagePreview = document.getElementById('imagePreview');
    const fileInfo = document.getElementById('fileInfo');

    if (file) {
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            alert('File size exceeds the 5MB limit.');
            event.target.value = '';
            previewArea.style.display = 'none';
            return;
        }
        imagePreview.src = URL.createObjectURL(file);
        fileInfo.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
        previewArea.style.display = 'flex';
    }
}

function submitProof() {
    const fileInput = document.getElementById('fileInput');
    const eventId = document.getElementById('uploadModal').getAttribute('data-event-id');

    if (!hasEventStarted(eventId)) {
        alert('Cannot submit proof. The event has not started yet.');
        return;
    }

    if (!fileInput.files.length) {
        alert('Please select a file to upload.');
        return;
    }

    const eventTitle = document.getElementById('modalEventTitle').textContent.replace('Upload Proof for: ', '');
    const confirmed = confirm(`Are you sure you want to submit proof for "${eventTitle}"?`);

    if (confirmed) {
        alert(`✅ Proof for "${eventTitle}" submitted successfully!`);
        closeUploadModal();
    }
}

function viewDetails(title, location, dateTime, organizer, description, audience) {
    document.getElementById('detailsTitle').textContent = title;
    document.getElementById('detailsLocation').textContent = location;
    document.getElementById('detailsDate').textContent = dateTime;
    document.getElementById('detailsOrganizer').textContent = organizer;
    document.getElementById('detailsDescription').textContent = description;
    document.getElementById('detailsModal').style.display = 'flex';
}

function closeDetailsModal() {
    document.getElementById('detailsModal').style.display = 'none';
}

function openProfileModal() {
    document.getElementById('profileModal').style.display = 'flex';
}

function closeProfileModal() {
    document.getElementById('profileModal').style.display = 'none';
}

function saveProfile() {
    alert('Profile updated successfully!');
    closeProfileModal();
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

function logout() {
    document.getElementById('logoutModal').style.display = 'flex';
}

function closeLogoutModal() {
    document.getElementById('logoutModal').style.display = 'none';
}

function confirmLogout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'studentlogin.html';
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing Student Events...');

    // Load user data from localStorage (no need for async)
    loadUserData();

    // Load events
    await renderEvents();

    // Setup calendar navigation
    const calendarButtons = document.querySelectorAll('.calendar-nav button');
    if (calendarButtons.length >= 3) {
        calendarButtons[0].onclick = () => changeMonth(-1);
        calendarButtons[1].onclick = goToToday;
        calendarButtons[2].onclick = () => changeMonth(1);
    }

    console.log('✅ Student Events initialized with user:', currentUser?.first_name);
});