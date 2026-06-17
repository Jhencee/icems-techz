// ============================================
// CONFIG.JS - SHARED CONFIGURATION
// ============================================
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:8000/api'
  : window.location.origin + '/api';

const SC_ID = 1;
const AppState = {
    currentOrgId: SC_ID,
    currentUser: null,
    organizationName: 'Student Council',
    organizationType: 'Student Organization'
};
console.log('Config API_BASE_URL set to:', API_BASE_URL);
