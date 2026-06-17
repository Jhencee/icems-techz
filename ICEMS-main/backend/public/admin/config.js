/*
// ============================================
// CONFIG.JS - SHARED CONFIGURATION - Organization
// ============================================

const API_BASE_URL = 'https://icems-techz-production.up.railway.app/api';

// Shared Application State

const AppState = {
    currentOrgId: 1, 
    currentUser: null,
    organizationName: 'Student Council',
    organizationType: 'Student Organization'
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_BASE_URL, AppState };
}*/

// ============================================
// CONFIG.JS - SHARED CONFIGURATION
// ============================================
const API_BASE_URL = 'https://icems-techz-production.up.railway.app/api';
const SC_ID = 1; // Student Council ID

const AppState = {
    currentOrgId: SC_ID,
    currentUser: null,
    organizationName: 'Student Council',
    organizationType: 'Student Organization'
};
