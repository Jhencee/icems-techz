// Block Live Server auto-reload
if (typeof WebSocket !== 'undefined') {
  const _OrigWS = WebSocket;
  window.WebSocket = function (url) {
    if (url && url.includes('5500')) return { send: function () { }, close: function () { }, addEventListener: function () { } };
    return new _OrigWS(url);
  };
  window.WebSocket.prototype = _OrigWS.prototype;
}
if (typeof EventSource !== 'undefined') {
  const _OrigES = EventSource;
  window.EventSource = function (url) {
    if (url && url.includes('5500')) return { close: function () { }, addEventListener: function () { } };
    return new _OrigES(url);
  };
}




// ============================================
// GLOBAL CONFIGURATION
// ============================================
window.API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? `${window.location.protocol}//${window.location.hostname}:8000` : 'https://icems-techz-production.up.railway.app';

// Store fetched events
let allEvents = [];
let filteredEvents = [];
let currentFilter = 'all';

// ============================================
// LOAD CURRENT USER PROFILE FROM DATABASE
// ============================================
async function loadUserProfileData() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'studentlogin.html';
        return;
    }

    const token = currentUser?.token || null;

    try {
        console.log('Loading user profile from database...');
        const response = await fetch(window.API_URL + '/api/auth/me?email=' + encodeURIComponent((JSON.parse(localStorage.getItem('currentUser') || '{}').email || '')), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? 'Bearer ' + token : ''
            }
        });
        const data = await response.json();
        if (data.success) {
            displayUserProfile(data.user);
            localStorage.setItem('currentUser', JSON.stringify(Object.assign({}, currentUser, data.user, { token: token })));
        } else {
            displayUserProfile(currentUser);
        }
    } catch (error) {
        console.warn('No /api/auth/me endpoint, using localStorage data instead');
        displayUserProfile(currentUser);
    }
}














// ============================================
// DISPLAY USER DATA IN THE DASHBOARD
// Matches exact column names from allowed_students table:
// first_name, last_name, email, student_number, course, year, section, profile_picture
// ============================================
function displayUserProfile(user) {
    if (!user) return;

    // Full name â€” combines first_name + last_name from DB
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ')
        || user.name || user.full_name || '';

    document.querySelectorAll('.student-name, #studentName').forEach(el => {
        el.textContent = fullName;
    });

    // First name only
    document.querySelectorAll('.student-firstname, #studentFirstName').forEach(el => {
        el.textContent = user.first_name || '';
    });

    // Last name only
    document.querySelectorAll('.student-lastname, #studentLastName').forEach(el => {
        el.textContent = user.last_name || '';
    });

    // Email
    document.querySelectorAll('.student-email, #studentEmail').forEach(el => {
        el.textContent = user.email || '';
    });

    // Student Number â€” DB column: student_number
    document.querySelectorAll('.student-id, #studentId, .student-number, #studentNumber').forEach(el => {
        el.textContent = user.student_number || '';
    });

    // Course â€” DB column: course
    document.querySelectorAll('.student-course, #studentCourse').forEach(el => {
        el.textContent = user.course || '';
    });

    // Year Level â€” DB column: year
    document.querySelectorAll('.student-year, #studentYear').forEach(el => {
        el.textContent = user.year || '';
    });

    // Section â€” DB column: section (from students table)
    document.querySelectorAll('.student-section, #studentSection').forEach(el => {
        el.textContent = user.section || '';
    });

    // Profile picture â€” DB column: profile_picture
    document.querySelectorAll('.student-avatar, #studentAvatar').forEach(el => {
        if (user.profile_picture) {
            el.src = user.profile_picture;
        }
    });

    console.log('âœ… Dashboard UI updated:', {
        name: fullName,
        student_number: user.student_number,
        email: user.email,
        course: user.course,
        year: user.year,
        section: user.section
    });
}

// ============================================
// FETCH REAL EVENTS FROM DATABASE
// ============================================

async function loadEventsFromDatabase() {
    console.log('ðŸ” Fetching real events from database...');

    const eventsContainer = document.getElementById('eventsContainer');
    if (eventsContainer) {
        eventsContainer.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #800020;"></i><p>Loading events...</p></div>';
    }

    try {
        const response = await fetch(`${window.API_URL}/api/events`);
        const data = await response.json();

        if (data.success) {
            console.log('âœ… Real events fetched from database:', data.events.length);
            allEvents = data.events;
            filteredEvents = allEvents;
            displayEvents(filteredEvents);
            updateEventCounts();
            return data.events;
        } else {
            console.error('âŒ Failed to fetch events:', data.message);
            showEmptyState('Failed to load events from database');
            return [];
        }
    } catch (error) {
        console.error('âŒ Error connecting to database:', error);
        showEmptyState('Cannot connect to server. Make sure Laravel is running at ' + window.API_URL);
        return [];
    }
}

// ============================================
// DISPLAY EVENTS (NO HARDCODED EXAMPLES)
// ============================================

function displayEvents(events) {
    const eventsContainer = document.getElementById('eventsContainer');

    if (!eventsContainer) {
        console.warn('âš ï¸ Events container not found - this is normal for dashboard page');
        return;
    }

    eventsContainer.innerHTML = '';

    if (events.length === 0) {
        showEmptyState('No events found. SSO admin needs to create events first.');
        return;
    }

    // Sort by date (newest first)
    const sortedEvents = [...events].sort((a, b) => {
        return new Date(b.event_date) - new Date(a.event_date);
    });

    console.log('ðŸ“… Displaying', sortedEvents.length, 'real events from database');

    sortedEvents.forEach(event => {
        const eventCard = createEventCard(event);
        eventsContainer.appendChild(eventCard);
    });
}

// ============================================
// CREATE EVENT CARD
// ============================================

function createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'event-card';

    const eventDate = new Date(event.event_date);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isUpcoming = eventDate >= today;

    const categoryColor = event.category === 'mandatory' || event.is_clearance ? '#dc2626' : '#059669';
    const categoryLabel = event.category === 'mandatory' || event.is_clearance ? 'MANDATORY' : 'OPTIONAL';
    const statusLabel = isUpcoming ? 'UPCOMING' : 'PAST';
    const statusColor = isUpcoming ? '#0ea5e9' : '#6b7280';

    card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <div style="display: flex; gap: 8px;">
                <span style="padding: 4px 12px; border-radius: 12px; color: white; font-size: 0.75rem; font-weight: 600; background: ${categoryColor};">
                    ${categoryLabel}
                </span>
                <span style="padding: 4px 12px; border-radius: 12px; color: white; font-size: 0.75rem; font-weight: 600; background: ${statusColor};">
                    ${statusLabel}
                </span>
            </div>
            ${event.is_clearance ? '<i class="fas fa-check-circle" style="color: #059669; font-size: 1.5rem;" title="Counts toward clearance"></i>' : ''}
        </div>
        
        <h3 style="color: #800020; font-size: 1.5rem; margin-bottom: 15px;">${event.title}</h3>
        
        <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 15px;">
            <div style="display: flex; align-items: center; gap: 10px; color: #666;">
                <i class="fas fa-calendar" style="color: #800020; width: 20px;"></i>
                <span>${formattedDate}</span>
            </div>
            
            <div style="display: flex; align-items: center; gap: 10px; color: #666;">
                <i class="fas fa-clock" style="color: #800020; width: 20px;"></i>
                <span>${event.time}</span>
            </div>
            
            <div style="display: flex; align-items: center; gap: 10px; color: #666;">
                <i class="fas fa-map-marker-alt" style="color: #800020; width: 20px;"></i>
                <span>${event.location}</span>
            </div>
            
            <div style="display: flex; align-items: center; gap: 10px; color: #666;">
                <i class="fas fa-users" style="color: #800020; width: 20px;"></i>
                <span>${event.audience || 'All Students'}</span>
            </div>
            
            <div style="display: flex; align-items: center; gap: 10px; color: #666;">
                <i class="fas fa-user-tie" style="color: #800020; width: 20px;"></i>
                <span>${event.admin}</span>
            </div>
        </div>
        
        <div style="color: #666; line-height: 1.6; padding: 15px; background: #f9fafb; border-radius: 8px; margin-bottom: 15px;">
            <p>${event.description}</p>
        </div>
        
        <button onclick="viewEventDetails(${event.id})" style="width: 100%; padding: 12px; background: #800020; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: background 0.2s;">
            <i class="fas fa-info-circle"></i> View Details
        </button>
    `;

    card.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        transition: transform 0.2s, box-shadow 0.2s;
    `;

    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-4px)';
        card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    });

    return card;
}

// ============================================
// FILTER EVENTS
// ============================================

function filterEvents(filterType) {
    currentFilter = filterType;
    console.log('ðŸ” Filtering events:', filterType);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (filterType) {
        case 'all':
            filteredEvents = allEvents;
            break;
        case 'upcoming':
            filteredEvents = allEvents.filter(event => {
                const eventDate = new Date(event.event_date);
                return eventDate >= today;
            });
            break;
        case 'past':
            filteredEvents = allEvents.filter(event => {
                const eventDate = new Date(event.event_date);
                return eventDate < today;
            });
            break;
        case 'mandatory':
            filteredEvents = allEvents.filter(event =>
                event.category === 'mandatory' || event.is_clearance
            );
            break;
        case 'optional':
            filteredEvents = allEvents.filter(event =>
                event.category === 'optional' && !event.is_clearance
            );
            break;
        default:
            filteredEvents = allEvents;
    }

    displayEvents(filteredEvents);
    updateActiveFilter(filterType);
}

function updateActiveFilter(filterType) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const activeBtn = document.querySelector(`[onclick="filterEvents('${filterType}')"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

function updateEventCounts() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalEvents = allEvents.length;
    const upcomingEvents = allEvents.filter(e => new Date(e.event_date) >= today).length;
    const mandatoryEvents = allEvents.filter(e => e.category === 'mandatory' || e.is_clearance).length;

    const totalBadge = document.getElementById('totalEventsCount');
    const upcomingBadge = document.getElementById('upcomingEventsCount');
    const mandatoryBadge = document.getElementById('mandatoryEventsCount');

    if (totalBadge) totalBadge.textContent = totalEvents;
    if (upcomingBadge) upcomingBadge.textContent = upcomingEvents;
    if (mandatoryBadge) mandatoryBadge.textContent = mandatoryEvents;

    console.log('ðŸ“Š Event counts:', { totalEvents, upcomingEvents, mandatoryEvents });
}

function showEmptyState(message) {
    const eventsContainer = document.getElementById('eventsContainer');
    if (!eventsContainer) return;

    eventsContainer.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: #666;">
            <div style="font-size: 4rem; color: #800020; margin-bottom: 20px;">
                <i class="fas fa-calendar-times"></i>
            </div>
            <h2 style="color: #800020; margin-bottom: 10px;">No Events Available</h2>
            <p>${message}</p>
            <button onclick="refreshEvents()" style="margin-top: 20px; padding: 10px 20px; background: #800020; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                <i class="fas fa-sync-alt"></i> Refresh Events
            </button>
        </div>
    `;
}

// ============================================
// VIEW EVENT DETAILS MODAL
// ============================================

function viewEventDetails(eventId) {
    const event = allEvents.find(e => e.id === eventId);
    if (!event) return;

    const eventDate = new Date(event.event_date);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const categoryColor = event.category === 'mandatory' || event.is_clearance ? '#dc2626' : '#059669';
    const categoryLabel = event.category === 'mandatory' || event.is_clearance ? 'MANDATORY' : 'OPTIONAL';

    const modalHTML = `
        <div class="modal active" id="eventDetailsModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; justify-content: center; align-items: center;">
            <div class="modal-content" style="background: white; border-radius: 12px; padding: 30px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto; position: relative;">
                <span onclick="closeEventDetailsModal()" style="position: absolute; top: 15px; right: 20px; font-size: 2rem; cursor: pointer; color: #666;">&times;</span>
                
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="display: inline-block; background: ${categoryColor}; color: white; padding: 8px 20px; border-radius: 20px; font-size: 0.85rem; font-weight: 700; margin-bottom: 15px;">
                        ${categoryLabel}
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
                
                ${event.is_clearance ? `
                <div style="background: #dcfce7; padding: 15px; border-radius: 10px; border-left: 4px solid #059669;">
                    <i class="fas fa-check-circle" style="color: #059669;"></i>
                    <strong style="color: #166534;"> This event counts toward clearance requirements</strong>
                </div>
                ` : ''}
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeEventDetailsModal() {
    const modal = document.getElementById('eventDetailsModal');
    if (modal) modal.remove();
}

// ============================================
// SEARCH EVENTS
// ============================================

function searchEvents(searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
        filteredEvents = allEvents;
    } else {
        const term = searchTerm.toLowerCase();
        filteredEvents = allEvents.filter(event =>
            event.title.toLowerCase().includes(term) ||
            event.description.toLowerCase().includes(term) ||
            event.location.toLowerCase().includes(term) ||
            (event.audience && event.audience.toLowerCase().includes(term))
        );
    }

    displayEvents(filteredEvents);
    console.log('ðŸ” Search results:', filteredEvents.length);
}

// ============================================
// REFRESH EVENTS
// ============================================

async function refreshEvents() {
    console.log('ðŸ”„ Refreshing events from database...');
    await loadEventsFromDatabase();
    filterEvents(currentFilter);
}

// ============================================
// INITIALIZE
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('ðŸ“… Student Dashboard/Events Page Loading...');
    // Skip if studentdashboard.html handles its own init
    if (document.getElementById('dashboardPaymentsContainer')) return;

    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        console.error('âŒ No user logged in');
        window.location.href = 'studentlogin.html';
        return;
    }

    console.log('âœ… User logged in:', currentUser.email);

    // Always load fresh user profile data from DB
    await loadUserProfileData();

    // Only load events if we're on the events page (check for eventsContainer)
    if (document.getElementById('eventsContainer')) {
        // Load REAL events from database (NO EXAMPLES)
        await loadEventsFromDatabase();

        // Setup search functionality
        const searchInput = document.getElementById('eventSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchEvents(e.target.value);
            });
        }

        // Add filter button styling
        const style = document.createElement('style');
        style.textContent = `
            .filter-btn {
                padding: 8px 16px;
                border: 2px solid #800020;
                background: white;
                color: #800020;
                border-radius: 20px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.2s;
                margin: 5px;
            }
            .filter-btn:hover {
                background: #800020;
                color: white;
            }
            .filter-btn.active {
                background: #800020;
                color: white;
            }
        `;
        document.head.appendChild(style);

        console.log('âœ… Student Events Page Initialized - Showing REAL events from database');
    }
});







