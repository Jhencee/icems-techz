// ============================================
// GLOBAL CONFIGURATION
// ============================================
window.API_URL = 'http://127.0.0.1:8000';

// Store fetched events
let allEvents = [];
let filteredEvents = [];
let currentFilter = 'all';

// ============================================
// FETCH REAL EVENTS FROM DATABASE
// ============================================

async function loadEventsFromDatabase() {
    console.log('🔍 Fetching real events from database...');

    const eventsContainer = document.getElementById('eventsContainer');
    if (eventsContainer) {
        eventsContainer.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #800020;"></i><p>Loading events...</p></div>';
    }

    try {
        const response = await fetch(`${window.API_URL}/api/events`);
        const data = await response.json();

        if (data.success) {
            console.log('✅ Real events fetched from database:', data.events.length);
            allEvents = data.events;
            filteredEvents = allEvents;
            displayEvents(filteredEvents);
            updateEventCounts();
            return data.events;
        } else {
            console.error('❌ Failed to fetch events:', data.message);
            showEmptyState('Failed to load events from database');
            return [];
        }
    } catch (error) {
        console.error('❌ Error connecting to database:', error);
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
        console.warn('⚠️ Events container not found - this is normal for dashboard page');
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

    console.log('📅 Displaying', sortedEvents.length, 'real events from database');

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

    // Add hover effect
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
    console.log('🔍 Filtering events:', filterType);

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

    console.log('📊 Event counts:', { totalEvents, upcomingEvents, mandatoryEvents });
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
    console.log('🔍 Search results:', filteredEvents.length);
}

// ============================================
// REFRESH EVENTS
// ============================================

async function refreshEvents() {
    console.log('🔄 Refreshing events from database...');
    await loadEventsFromDatabase();
    filterEvents(currentFilter);
}

// ============================================
// INITIALIZE
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('📅 Student Events Page Loading...');

    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        console.error('❌ No user logged in');
        window.location.href = 'studentlogin.html';
        return;
    }

    console.log('✅ User logged in:', currentUser.email);

    // Load user profile data if on dashboard page
    if (typeof loadUserProfileData === 'function') {
        loadUserProfileData();
    }

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

        console.log('✅ Student Events Page Initialized - Showing REAL events from database');
    }
});