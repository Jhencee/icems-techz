// ⭐ CRITICAL: Prevent duplicate script execution
if (window.organizationsScriptLoaded) {
    console.warn('⚠️ Organizations script already loaded, blocking duplicate');
    throw new Error('Duplicate script load blocked');
}
window.organizationsScriptLoaded = true;

// ============================================
// ORGANIZATIONS.JS - DATABASE INTEGRATION
// ============================================

// Data storage
let organizations = [];
let orgEvents = [];
let orgClearances = [];

// ⭐ CRITICAL: Single load per browser session
const SESSION_KEY = 'orgsModuleInitialized';
const SESSION_TIMESTAMP = 'orgsModuleTimestamp';

// Check if module was initialized in the last 5 minutes (same session)
function isRecentlyInitialized() {
    const timestamp = sessionStorage.getItem(SESSION_TIMESTAMP);
    if (!timestamp) return false;
    
    const now = Date.now();
    const lastInit = parseInt(timestamp, 10);
    const fiveMinutes = 5 * 60 * 1000;
    
    return (now - lastInit) < fiveMinutes;
}

let organizationsModuleInitialized = isRecentlyInitialized();

// ============================================
// DATABASE API FUNCTIONS
// ============================================

// Load organizations from database
async function loadOrganizationsFromDatabase() {
    // Check if we already have data in sessionStorage
    const cachedOrgs = sessionStorage.getItem('organizationsData');
    const cachedClearances = sessionStorage.getItem('organizationsClearancesData');
    
    if (cachedOrgs && cachedClearances && organizationsModuleInitialized) {
        console.log('✅ [Organizations] Using cached session data');
        organizations = JSON.parse(cachedOrgs);
        orgClearances = JSON.parse(cachedClearances);
        updateOrgDisplay();
        return organizations;
    }

    console.log('🔍 [Organizations] Loading organizations from database...');

    try {
        const response = await fetch(`${API_BASE_URL}/organizations`);
        const data = await response.json();

        if (data.success) {
            organizations = data.organizations.map(org => ({
                id: org.id,
                name: org.name,
                acronym: org.acronym,
                description: org.description,
                logo: org.logo,
                createdAt: org.created_at,
                totalEvents: 0,
                totalMembers: 0
            }));

            console.log('✅ [Organizations] Loaded', organizations.length, 'organizations');

            // Cache the data
            sessionStorage.setItem('organizationsData', JSON.stringify(organizations));

            // Load clearances only
            if (organizations.length > 0) {
                await loadAllOrganizationData();
            }

            updateOrgDisplay();
            return organizations;
        } else {
            console.error('❌ [Organizations] Failed to load organizations:', data.message);
            return [];
        }
    } catch (error) {
        console.error('❌ [Organizations] Error loading organizations:', error);
        console.warn('⚠️ [Organizations] Organizations endpoint not available yet');
        return [];
    }
}

// Load all clearances for all organizations
async function loadAllOrganizationData() {
    console.log('🔍 [Organizations] Loading all organization data...');

    // Clear existing data
    orgClearances = [];

    // Load clearances for each organization
    for (const org of organizations) {
        await loadOrgClearancesForOrganization(org.id);
    }

    // Cache clearances data
    sessionStorage.setItem('organizationsClearancesData', JSON.stringify(orgClearances));

    console.log('✅ [Organizations] Loaded total:', orgClearances.length, 'clearances');
}

// Load clearances for a specific organization
async function loadOrgClearancesForOrganization(orgId) {
    try {
        const response = await fetch(`${API_BASE_URL}/organizations/${orgId}/clearances`);
        const data = await response.json();

        if (data.success && data.submissions) {
            const clearances = data.submissions.map(clearance => ({
                id: clearance.id,
                organizationId: orgId,
                organizationName: organizations.find(o => o.id === orgId)?.name || 'Unknown',
                studentId: clearance.student_number,
                studentName: clearance.student_name,
                eventTitle: clearance.event_title,
                status: capitalizeFirst(clearance.status),
                submittedAt: clearance.submitted_at,
                proofImage: clearance.proof_image
            }));

            orgClearances.push(...clearances);
            console.log(`✅ [Organizations] Loaded ${clearances.length} clearances for org ${orgId}`);
        }
    } catch (error) {
        console.warn(`⚠️ [Organizations] Could not load clearances for org ${orgId}:`, error.message);
    }
}

// ============================================
// TAB SWITCHING
// ============================================
function showOrgTab(tabName, event) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.getElementById(tabName + '-tab').classList.remove('hidden');

    if (event) {
        event.currentTarget.classList.add('active');
    }

    updateOrgDisplay();
}

// ============================================
// SIDEBAR TOGGLE (MOBILE)
// ============================================
function toggleOrgSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}

// ============================================
// UPDATE ALL DISPLAYS
// ============================================
function updateOrgDisplay() {
    updateOrgDashboard();
    updateOrganizationsTable();
    updateOrgClearancesTable();
}

// ============================================
// DASHBOARD STATISTICS
// ============================================
function updateOrgDashboard() {
    const totalOrgs = organizations.length;
    const totalEvents = orgEvents.length;
    const pendingClearances = orgClearances.filter(c => c.status === 'Pending').length;

    const dashOrgsCount = document.getElementById('dashOrgsCount');
    const dashEventsCount = document.getElementById('dashEventsCount');
    const dashClearancesCount = document.getElementById('dashClearancesCount');

    if (dashOrgsCount) dashOrgsCount.textContent = totalOrgs;
    if (dashEventsCount) dashEventsCount.textContent = totalEvents;
    if (dashClearancesCount) dashClearancesCount.textContent = pendingClearances;

    displayDashboardOrganizations();
}

// ============================================
// DISPLAY DASHBOARD ORGANIZATIONS
// ============================================
function displayDashboardOrganizations() {
    const dashboardSection = document.querySelector('#dashboard-tab');
    if (!dashboardSection) return;

    if (organizations.length === 0) {
        return;
    }

    const existingTable = dashboardSection.querySelector('.organizations-dashboard-table');
    if (existingTable) {
        existingTable.remove();
    }

    const html = `
    <div class="organizations-dashboard-table" style="margin-top: 40px;">
      <div style="margin-bottom: 20px;">
        <h2 style="color: #800020; font-size: 1.3rem; margin: 0 0 20px 0;">
          <i class="fas fa-users"></i> Active Organizations
        </h2>
      </div>
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
              <th style="padding: 12px; text-align: left; color: #800020; font-weight: 600;">Organization</th>
              <th style="padding: 12px; text-align: left; color: #800020; font-weight: 600;">Acronym</th>
              <th style="padding: 12px; text-align: left; color: #800020; font-weight: 600;">Total Events</th>
              <th style="padding: 12px; text-align: center; color: #800020; font-weight: 600;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${organizations.slice(0, 5).map(org => {
        const eventCount = 0;
        return `
                <tr style="border-bottom: 1px solid #e5e7eb; transition: background 0.2s;">
                  <td style="padding: 12px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                      ${org.logo ? `<img src="${org.logo}" alt="${org.name}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">` : `<div style="width: 40px; height: 40px; border-radius: 50%; background: #800020; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">${org.acronym.charAt(0)}</div>`}
                      <span style="font-weight: 500;">${org.name}</span>
                    </div>
                  </td>
                  <td style="padding: 12px; color: #666;">${org.acronym}</td>
                  <td style="padding: 12px; color: #666;">${eventCount} events</td>
                  <td style="padding: 12px; text-align: center;">
                    <button onclick="viewOrganizationDetails(${org.id})" style="background: #800020; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">
                      <i class="fas fa-eye"></i> View
                    </button>
                  </td>
                </tr>
              `;
    }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

    const emptyState = dashboardSection.querySelector('.empty-state');
    if (emptyState) {
        emptyState.insertAdjacentHTML('afterend', html);
    } else {
        dashboardSection.insertAdjacentHTML('beforeend', html);
    }
}

// ============================================
// ORGANIZATIONS TABLE
// ============================================
function updateOrganizationsTable() {
    const tbody = document.getElementById('organizationsTableBody');
    if (!tbody) return;

    if (organizations.length === 0) {
        tbody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="table-empty">
            <div class="table-empty-icon maroon"><i class="fas fa-users"></i></div>
            <h3>No Organizations Yet</h3>
            <p>Registered organizations will appear here.</p>
          </div>
        </td>
      </tr>`;
    } else {
        tbody.innerHTML = organizations.map(org => {
            const eventCount = orgEvents.filter(e => e.organizationId === org.id).length;
            const clearanceCount = orgClearances.filter(c => c.organizationId === org.id).length;

            return `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 10px;">
              ${org.logo ? `<img src="${org.logo}" alt="${org.name}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">` : `<div style="width: 40px; height: 40px; border-radius: 50%; background: #800020; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">${org.acronym.charAt(0)}</div>`}
              <span style="font-weight: 500;">${org.name}</span>
            </div>
          </td>
          <td>${org.acronym}</td>
          <td>${eventCount}</td>
          <td>${clearanceCount}</td>
          <td>
            <button class="btn btn-primary" onclick="viewOrganizationDetails(${org.id})" style="padding: 6px 10px; font-size: 0.8rem;">
              <i class="fas fa-eye"></i> View
            </button>
          </td>
        </tr>`;
        }).join('');
    }
}

// ============================================
// CLEARANCES TABLE
// ============================================
function updateOrgClearancesTable() {
    const tbody = document.getElementById('clearancesTableBody');
    if (!tbody) return;

    if (orgClearances.length === 0) {
        tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="table-empty">
            <div class="table-empty-icon maroon"><i class="fas fa-clipboard-check"></i></div>
            <h3>No Clearance Submissions</h3>
            <p>Clearance submissions will appear here once students submit them.</p>
          </div>
        </td>
      </tr>`;
    } else {
        tbody.innerHTML = orgClearances.map(clearance => {
            const submittedDate = new Date(clearance.submittedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });

            return `
        <tr>
          <td>${clearance.studentId}</td>
          <td style="font-weight:500;">${clearance.studentName}</td>
          <td>${clearance.organizationName}</td>
          <td>${clearance.eventTitle}</td>
          <td>${submittedDate}</td>
          <td>
            <span class="status-badge status-${clearance.status.toLowerCase()}">${clearance.status}</span>
          </td>
        </tr>`;
        }).join('');
    }
}

// ============================================
// VIEW ORGANIZATION DETAILS MODAL
// ============================================
function viewOrganizationDetails(orgId) {
    const org = organizations.find(o => o.id === orgId);
    if (!org) return;

    const orgEventsList = orgEvents.filter(e => e.organizationId === orgId);
    const orgClearancesList = orgClearances.filter(c => c.organizationId === orgId);

    const eventsHTML = orgEventsList.length > 0 ? `
    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
      <thead>
        <tr style="background: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
          <th style="padding: 10px; text-align: left; color: #800020;">Event Title</th>
          <th style="padding: 10px; text-align: left; color: #800020;">Date</th>
          <th style="padding: 10px; text-align: left; color: #800020;">Location</th>
          <th style="padding: 10px; text-align: center; color: #800020;">Type</th>
        </tr>
      </thead>
      <tbody>
        ${orgEventsList.map(event => {
        const eventDate = new Date(event.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        const eventType = event.isClearance
            ? '<span style="color:#dc2626; font-weight: 600;">MANDATORY</span>'
            : '<span style="color:#059669; font-weight: 600;">OPTIONAL</span>';

        return `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px;">${event.title}</td>
              <td style="padding: 10px;">${eventDate}</td>
              <td style="padding: 10px;">${event.location || 'TBA'}</td>
              <td style="padding: 10px; text-align: center;">${eventType}</td>
            </tr>
          `;
    }).join('')}
      </tbody>
    </table>
  ` : '<p style="color: #666; text-align: center; padding: 20px;">No events created yet.</p>';

    const modalHTML = `
    <div class="modal active" id="organizationDetailsModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; justify-content: center; align-items: center; overflow-y: auto; padding: 20px;">
      <div class="modal-content" style="background: white; border-radius: 12px; padding: 30px; max-width: 900px; width: 90%; max-height: 90vh; overflow-y: auto; position: relative;">
        <span onclick="closeOrganizationDetailsModal()" style="position: absolute; top: 15px; right: 20px; font-size: 2rem; cursor: pointer; color: #666;">&times;</span>
        
        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 30px;">
          ${org.logo ? `<img src="${org.logo}" alt="${org.name}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;">` : `<div style="width: 80px; height: 80px; border-radius: 50%; background: #800020; display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem; font-weight: 600;">${org.acronym.charAt(0)}</div>`}
          <div>
            <h2 style="color: #800020; margin: 0;">${org.name}</h2>
            <p style="color: #666; margin: 5px 0 0 0;">${org.acronym}</p>
          </div>
        </div>
        
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #800020; margin-bottom: 10px;">Description</h3>
          <p style="color: #666;">${org.description || 'No description available.'}</p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px;">
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 2rem; color: #800020; font-weight: 600;">${orgEventsList.length}</div>
            <div style="color: #666; font-size: 0.9rem;">Total Events</div>
          </div>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 2rem; color: #800020; font-weight: 600;">${orgClearancesList.length}</div>
            <div style="color: #666; font-size: 0.9rem;">Clearance Submissions</div>
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #800020; margin-bottom: 15px;">
            <i class="fas fa-calendar-alt"></i> Events
          </h3>
          ${eventsHTML}
        </div>
      </div>
    </div>
  `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeOrganizationDetailsModal() {
    const modal = document.getElementById('organizationDetailsModal');
    if (modal) modal.remove();
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// ============================================
// REFRESH DATA FUNCTION
// ============================================
async function refreshOrganizationData() {
    console.log('🔄 [Organizations] Refreshing data...');
    // Clear cache to force reload
    sessionStorage.removeItem('organizationsData');
    sessionStorage.removeItem('organizationsClearancesData');
    await loadOrganizationsFromDatabase();
    updateOrgDisplay();
}

// ============================================
// INITIALIZE - ONLY RUNS ONCE PER SESSION
// ============================================
if (!organizationsModuleInitialized) {
    console.log('🚀 [Organizations] Module initializing for the FIRST TIME...');
    
    // Mark as initialized with timestamp
    sessionStorage.setItem(SESSION_TIMESTAMP, Date.now().toString());
    organizationsModuleInitialized = true;

    // Use 'once' option to ensure it only runs once per page load
    document.addEventListener('DOMContentLoaded', async () => {
        await loadOrganizationsFromDatabase();
        updateOrgDisplay();
        console.log('✅ [Organizations] Module initialized successfully');
    }, { once: true });
} else {
    console.log('✅ [Organizations] Module already initialized in this session, loading cached data only');
    // Just load from cache on subsequent page loads within same session
    document.addEventListener('DOMContentLoaded', async () => {
        // Only load from cache, don't fetch from database
        const cachedOrgs = sessionStorage.getItem('organizationsData');
        const cachedClearances = sessionStorage.getItem('organizationsClearancesData');
        
        if (cachedOrgs && cachedClearances) {
            organizations = JSON.parse(cachedOrgs);
            orgClearances = JSON.parse(cachedClearances);
            console.log('📦 [Organizations] Loaded from cache:', organizations.length, 'orgs');
            updateOrgDisplay();
        } else {
            // Cache expired or cleared, reload from database
            console.log('🔄 [Organizations] Cache missing, reloading...');
            organizationsModuleInitialized = false;
            sessionStorage.removeItem(SESSION_TIMESTAMP);
            await loadOrganizationsFromDatabase();
            updateOrgDisplay();
        }
    }, { once: true });
}