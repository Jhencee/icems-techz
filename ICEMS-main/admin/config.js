// ============================================
// CONFIG.JS - SHARED CONFIGURATION - Organization
// ============================================

const API_BASE_URL = 'http://localhost:8000/api';

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
}