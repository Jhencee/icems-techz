// ⭐ CRITICAL: Prevent duplicate script execution
if (window.studentCouncilsScriptLoaded) {
    console.warn('⚠️ Student Councils script already loaded, blocking duplicate');
    throw new Error('Duplicate script load blocked');
}
window.studentCouncilsScriptLoaded = true;

// ============================================
// STUDENTCOUNCILS.JS - DATABASE INTEGRATION
// ============================================

// Data storage
let studentCouncils = [];
let councilEvents = [];
let councilClearances = [];
let councilPayments = [];

// ⭐ CRITICAL: Single load per browser session
const SC_SESSION_KEY = 'scModuleInitialized';
const SC_SESSION_TIMESTAMP = 'scModuleTimestamp';

// Check if module was initialized in the last 5 minutes (same session)
function isSCRecentlyInitialized() {
    const timestamp = sessionStorage.getItem(SC_SESSION_TIMESTAMP);
    if (!timestamp) return false;
    
    const now = Date.now();
    const lastInit = parseInt(timestamp, 10);
    const fiveMinutes = 5 * 60 * 1000;
    
    return (now - lastInit) < fiveMinutes;
}

let studentCouncilsModuleInitialized = isSCRecentlyInitialized();

// ============================================
// DATABASE API FUNCTIONS
// ============================================

// Load student councils from database
async function loadStudentCouncilsFromDatabase() {
    // Check if we already have data in sessionStorage
    const cachedCouncils = sessionStorage.getItem('studentCouncilsData');
    const cachedClearances = sessionStorage.getItem('councilClearancesData');
    const cachedPayments = sessionStorage.getItem('councilPaymentsData');
    
    if (cachedCouncils && cachedClearances && cachedPayments && studentCouncilsModuleInitialized) {
        console.log('✅ [Student Councils] Using cached session data');
        studentCouncils = JSON.parse(cachedCouncils);
        councilClearances = JSON.parse(cachedClearances);
        councilPayments = JSON.parse(cachedPayments);
        updateCouncilDisplay();
        return studentCouncils;
    }

    console.log('🔍 [Student Councils] Loading student councils from database...');

    try {
        const response = await fetch(`${API_BASE_URL}/student-councils`);
        const data = await response.json();

        if (data.success) {
            studentCouncils = data.councils.map(council => ({
                id: council.id,
                name: council.name,
                acronym: council.acronym,
                description: council.description,
                logo: council.logo,
                createdAt: council.created_at,
                totalEvents: 0,
                totalMembers: 0
            }));

            console.log('✅ [Student Councils] Loaded', studentCouncils.length, 'councils');

            // Cache the data
            sessionStorage.setItem('studentCouncilsData', JSON.stringify(studentCouncils));

            // Load clearances and payments
            if (studentCouncils.length > 0) {
                await loadAllStudentCouncilData();
            }

            updateCouncilDisplay();
            return studentCouncils;
        } else {
            console.error('❌ [Student Councils] Failed to load councils:', data.message);
            return [];
        }
    } catch (error) {
        console.error('❌ [Student Councils] Error loading councils:', error);
        console.warn('⚠️ [Student Councils] Student councils endpoint not available yet');
        return [];
    }
}

// Load all clearances and payments for all student councils
async function loadAllStudentCouncilData() {
    console.log('🔍 [Student Councils] Loading all council data...');

    // Clear existing data
    councilClearances = [];
    councilPayments = [];

    // Load clearances and payments for each council
    for (const council of studentCouncils) {
        await loadCouncilClearancesForCouncil(council.id);
        await loadCouncilPaymentsForCouncil(council.id);
    }

    // Cache data
    sessionStorage.setItem('councilClearancesData', JSON.stringify(councilClearances));
    sessionStorage.setItem('councilPaymentsData', JSON.stringify(councilPayments));

    console.log('✅ [Student Councils] Loaded total:', councilClearances.length, 'clearances');
    console.log('✅ [Student Councils] Loaded total:', councilPayments.length, 'payments');
}

// Load clearances for a specific student council
async function loadCouncilClearancesForCouncil(councilId) {
    try {
        const response = await fetch(`${API_BASE_URL}/student-councils/${councilId}/clearances`);
        const data = await response.json();

        if (data.success && data.submissions) {
            const clearances = data.submissions.map(clearance => ({
                id: clearance.id,
                councilId: councilId,
                councilName: studentCouncils.find(c => c.id === councilId)?.name || 'Unknown',
                studentId: clearance.student_number,
                studentName: clearance.student_name,
                eventTitle: clearance.event_title,
                status: capitalizeFirst(clearance.status),
                submittedAt: clearance.submitted_at,
                proofImage: clearance.proof_image
            }));

            councilClearances.push(...clearances);
            console.log(`✅ [Student Councils] Loaded ${clearances.length} clearances for council ${councilId}`);
        }
    } catch (error) {
        console.warn(`⚠️ [Student Councils] Could not load clearances for council ${councilId}:`, error.message);
    }
}

// Load payments for a specific student council
async function loadCouncilPaymentsForCouncil(councilId) {
    try {
        const response = await fetch(`${API_BASE_URL}/student-councils/${councilId}/payments`);
        const data = await response.json();

        if (data.success && data.payments) {
            const payments = data.payments.map(payment => ({
                id: payment.id,
                councilId: councilId,
                councilName: studentCouncils.find(c => c.id === councilId)?.name || 'Unknown',
                studentId: payment.student_number,
                studentName: payment.student_name,
                amount: parseFloat(payment.amount),
                reference: payment.reference_number,
                status: capitalizeFirst(payment.status),
                submittedAt: payment.submitted_at,
                proofImage: payment.proof_image
            }));

            councilPayments.push(...payments);
            console.log(`✅ [Student Councils] Loaded ${payments.length} payments for council ${councilId}`);
        }
    } catch (error) {
        console.warn(`⚠️ [Student Councils] Could not load payments for council ${councilId}:`, error.message);
    }
}

// ============================================
// TAB SWITCHING
// ============================================
function showCouncilTab(tabName, event) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.getElementById(tabName + '-tab').classList.remove('hidden');

    if (event) {
        event.currentTarget.classList.add('active');
    }

    updateCouncilDisplay();
}

// ============================================
// SIDEBAR TOGGLE (MOBILE)
// ============================================
function toggleCouncilSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}

// ============================================
// UPDATE ALL DISPLAYS
// ============================================
function updateCouncilDisplay() {
    updateCouncilDashboard();
    updateStudentCouncilsTable();
    updateCouncilClearancesTable();
    updateCouncilPaymentsTable();
}

// ============================================
// DASHBOARD STATISTICS
// ============================================
function updateCouncilDashboard() {
    const totalCouncils = studentCouncils.length;
    const totalEvents = councilEvents.length;
    const pendingClearances = councilClearances.filter(c => c.status === 'Pending').length;
    const totalPayments = councilPayments.reduce((sum, p) => sum + p.amount, 0);
    const pendingPayments = councilPayments.filter(p => p.status === 'Pending').length;

    const dashCouncilsCount = document.getElementById('dashCouncilsCount');
    const dashEventsCount = document.getElementById('dashCouncilEventsCount');
    const dashClearancesCount = document.getElementById('dashCouncilClearancesCount');
    const dashPaymentsTotal = document.getElementById('dashCouncilPaymentsTotal');

    if (dashCouncilsCount) dashCouncilsCount.textContent = totalCouncils;
    if (dashEventsCount) dashEventsCount.textContent = totalEvents;
    if (dashClearancesCount) dashClearancesCount.textContent = pendingClearances;
    if (dashPaymentsTotal) dashPaymentsTotal.textContent = `₱${totalPayments.toFixed(2)}`;

    displayDashboardCouncils();
}

// ============================================
// DISPLAY DASHBOARD COUNCILS
// ============================================
function displayDashboardCouncils() {
    const dashboardSection = document.querySelector('#council-dashboard-tab');
    if (!dashboardSection) return;

    if (studentCouncils.length === 0) {
        return;
    }

    const existingTable = dashboardSection.querySelector('.councils-dashboard-table');
    if (existingTable) {
        existingTable.remove();
    }

    const html = `
    <div class="councils-dashboard-table" style="margin-top: 40px;">
      <div style="margin-bottom: 20px;">
        <h2 style="color: #800020; font-size: 1.3rem; margin: 0 0 20px 0;">
          <i class="fas fa-landmark"></i> Active Student Councils
        </h2>
      </div>
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
              <th style="padding: 12px; text-align: left; color: #800020; font-weight: 600;">Council</th>
              <th style="padding: 12px; text-align: left; color: #800020; font-weight: 600;">Acronym</th>
              <th style="padding: 12px; text-align: left; color: #800020; font-weight: 600;">Total Events</th>
              <th style="padding: 12px; text-align: left; color: #800020; font-weight: 600;">Pending Clearances</th>
              <th style="padding: 12px; text-align: center; color: #800020; font-weight: 600;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${studentCouncils.slice(0, 5).map(council => {
        const eventCount = councilEvents.filter(e => e.councilId === council.id).length;
        const pendingCount = councilClearances.filter(c => c.councilId === council.id && c.status === 'Pending').length;
        return `
                <tr style="border-bottom: 1px solid #e5e7eb; transition: background 0.2s;">
                  <td style="padding: 12px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                      ${council.logo ? `<img src="${council.logo}" alt="${council.name}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">` : `<div style="width: 40px; height: 40px; border-radius: 50%; background: #800020; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">${council.acronym.charAt(0)}</div>`}
                      <span style="font-weight: 500;">${council.name}</span>
                    </div>
                  </td>
                  <td style="padding: 12px; color: #666;">${council.acronym}</td>
                  <td style="padding: 12px; color: #666;">${eventCount} events</td>
                  <td style="padding: 12px; color: #666;">${pendingCount} pending</td>
                  <td style="padding: 12px; text-align: center;">
                    <button onclick="viewCouncilDetails(${council.id})" style="background: #800020; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">
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
// STUDENT COUNCILS TABLE
// ============================================
function updateStudentCouncilsTable() {
    const tbody = document.getElementById('councilsTableBody');
    if (!tbody) return;

    if (studentCouncils.length === 0) {
        tbody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="table-empty">
            <div class="table-empty-icon maroon"><i class="fas fa-landmark"></i></div>
            <h3>No Student Councils Yet</h3>
            <p>Registered student councils will appear here.</p>
          </div>
        </td>
      </tr>`;
    } else {
        tbody.innerHTML = studentCouncils.map(council => {
            const eventCount = councilEvents.filter(e => e.councilId === council.id).length;
            const clearanceCount = councilClearances.filter(c => c.councilId === council.id).length;

            return `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 10px;">
              ${council.logo ? `<img src="${council.logo}" alt="${council.name}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">` : `<div style="width: 40px; height: 40px; border-radius: 50%; background: #800020; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">${council.acronym.charAt(0)}</div>`}
              <span style="font-weight: 500;">${council.name}</span>
            </div>
          </td>
          <td>${council.acronym}</td>
          <td>${eventCount}</td>
          <td>${clearanceCount}</td>
          <td>
            <button class="btn btn-primary" onclick="viewCouncilDetails(${council.id})" style="padding: 6px 10px; font-size: 0.8rem;">
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
function updateCouncilClearancesTable() {
    const tbody = document.getElementById('councilClearancesTableBody');
    if (!tbody) return;

    if (councilClearances.length === 0) {
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
        tbody.innerHTML = councilClearances.map(clearance => {
            const submittedDate = new Date(clearance.submittedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });

            return `
        <tr>
          <td>${clearance.studentId}</td>
          <td style="font-weight:500;">${clearance.studentName}</td>
          <td>${clearance.councilName}</td>
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
// PAYMENTS TABLE
// ============================================
function updateCouncilPaymentsTable() {
    const tbody = document.getElementById('councilPaymentsTableBody');
    if (!tbody) return;

    if (councilPayments.length === 0) {
        tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="table-empty">
            <div class="table-empty-icon maroon"><i class="fas fa-peso-sign"></i></div>
            <h3>No Payment Transactions</h3>
            <p>Payment submissions will appear here once students submit them.</p>
          </div>
        </td>
      </tr>`;
    } else {
        tbody.innerHTML = councilPayments.map(payment => {
            const submittedDate = new Date(payment.submittedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });

            const statusBadge = payment.status === 'Verified' ?
                '<span style="color:#059669; font-weight: 600;">VERIFIED</span>' :
                '<span style="color:#f59e0b; font-weight: 600;">PENDING</span>';

            const actionButton = payment.status === 'Pending' ?
                `<button class="btn btn-primary" style="padding: 6px 10px; font-size: 0.8rem;" onclick="verifyCouncilPayment(${payment.id})">
                    <i class="fas fa-check"></i> Verify
                </button>` :
                '<span style="color: #999;">Verified</span>';

            return `
        <tr>
          <td>${payment.studentId}</td>
          <td style="font-weight:500;">${payment.studentName}</td>
          <td>${payment.councilName}</td>
          <td>₱${payment.amount.toFixed(2)}</td>
          <td>${payment.reference}</td>
          <td>${submittedDate}</td>
          <td>${statusBadge}</td>
          <td>${actionButton}</td>
        </tr>`;
        }).join('');
    }
}

// ============================================
// VERIFY PAYMENT FUNCTION
// ============================================
async function verifyCouncilPayment(paymentId) {
    const payment = councilPayments.find(p => p.id === paymentId);
    if (!payment) {
        alert("Payment not found!");
        return;
    }

    if (confirm(`Verify payment of ₱${payment.amount.toFixed(2)} from ${payment.studentName}?`)) {
        try {
            const response = await fetch(`${API_BASE_URL}/student-councils/${payment.councilId}/payments/${paymentId}/verify`, {
                method: 'POST'
            });
            const data = await response.json();

            if (data.success) {
                payment.status = 'Verified';
                alert('Payment verified successfully!');
                updateCouncilPaymentsTable();
                updateCouncilDashboard();
                
                // Update cache
                sessionStorage.setItem('councilPaymentsData', JSON.stringify(councilPayments));
            } else {
                alert('Failed to verify payment: ' + data.message);
            }
        } catch (error) {
            console.error('Error verifying payment:', error);
            alert('Error verifying payment. Please try again.');
        }
    }
}

// ============================================
// VIEW COUNCIL DETAILS MODAL
// ============================================
function viewCouncilDetails(councilId) {
    const council = studentCouncils.find(c => c.id === councilId);
    if (!council) return;

    const councilEventsList = councilEvents.filter(e => e.councilId === councilId);
    const councilClearancesList = councilClearances.filter(c => c.councilId === councilId);
    const councilPaymentsList = councilPayments.filter(p => p.councilId === councilId);
    const totalPayments = councilPaymentsList.reduce((sum, p) => sum + p.amount, 0);

    const eventsHTML = councilEventsList.length > 0 ? `
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
        ${councilEventsList.map(event => {
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
    <div class="modal active" id="councilDetailsModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; justify-content: center; align-items: center; overflow-y: auto; padding: 20px;">
      <div class="modal-content" style="background: white; border-radius: 12px; padding: 30px; max-width: 900px; width: 90%; max-height: 90vh; overflow-y: auto; position: relative;">
        <span onclick="closeCouncilDetailsModal()" style="position: absolute; top: 15px; right: 20px; font-size: 2rem; cursor: pointer; color: #666;">&times;</span>
        
        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 30px;">
          ${council.logo ? `<img src="${council.logo}" alt="${council.name}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;">` : `<div style="width: 80px; height: 80px; border-radius: 50%; background: #800020; display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem; font-weight: 600;">${council.acronym.charAt(0)}</div>`}
          <div>
            <h2 style="color: #800020; margin: 0;">${council.name}</h2>
            <p style="color: #666; margin: 5px 0 0 0;">${council.acronym}</p>
          </div>
        </div>
        
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #800020; margin-bottom: 10px;">Description</h3>
          <p style="color: #666;">${council.description || 'No description available.'}</p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 30px;">
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 2rem; color: #800020; font-weight: 600;">${councilEventsList.length}</div>
            <div style="color: #666; font-size: 0.9rem;">Total Events</div>
          </div>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 2rem; color: #800020; font-weight: 600;">${councilClearancesList.length}</div>
            <div style="color: #666; font-size: 0.9rem;">Clearances</div>
          </div>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 2rem; color: #800020; font-weight: 600;">₱${totalPayments.toFixed(2)}</div>
            <div style="color: #666; font-size: 0.9rem;">Total Payments</div>
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

function closeCouncilDetailsModal() {
    const modal = document.getElementById('councilDetailsModal');
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
async function refreshCouncilData() {
    console.log('🔄 [Student Councils] Refreshing data...');
    // Clear cache to force reload
    sessionStorage.removeItem('studentCouncilsData');
    sessionStorage.removeItem('councilClearancesData');
    sessionStorage.removeItem('councilPaymentsData');
    await loadStudentCouncilsFromDatabase();
    updateCouncilDisplay();
}

// ============================================
// INITIALIZE - ONLY RUNS ONCE PER SESSION
// ============================================
if (!studentCouncilsModuleInitialized) {
    console.log('🚀 [Student Councils] Module initializing for the FIRST TIME...');
    
    // Mark as initialized with timestamp
    sessionStorage.setItem(SC_SESSION_TIMESTAMP, Date.now().toString());
    studentCouncilsModuleInitialized = true;

    // Use 'once' option to ensure it only runs once per page load
    document.addEventListener('DOMContentLoaded', async () => {
        await loadStudentCouncilsFromDatabase();
        updateCouncilDisplay();
        console.log('✅ [Student Councils] Module initialized successfully');
    }, { once: true });
} else {
    console.log('✅ [Student Councils] Module already initialized in this session, loading cached data only');
    // Just load from cache on subsequent page loads within same session
    document.addEventListener('DOMContentLoaded', async () => {
        // Only load from cache, don't fetch from database
        const cachedCouncils = sessionStorage.getItem('studentCouncilsData');
        const cachedClearances = sessionStorage.getItem('councilClearancesData');
        const cachedPayments = sessionStorage.getItem('councilPaymentsData');
        
        if (cachedCouncils && cachedClearances && cachedPayments) {
            studentCouncils = JSON.parse(cachedCouncils);
            councilClearances = JSON.parse(cachedClearances);
            councilPayments = JSON.parse(cachedPayments);
            console.log('📦 [Student Councils] Loaded from cache:', studentCouncils.length, 'councils');
            updateCouncilDisplay();
        } else {
            // Cache expired or cleared, reload from database
            console.log('🔄 [Student Councils] Cache missing, reloading...');
            studentCouncilsModuleInitialized = false;
            sessionStorage.removeItem(SC_SESSION_TIMESTAMP);
            await loadStudentCouncilsFromDatabase();
            updateCouncilDisplay();
        }
    }, { once: true });
}