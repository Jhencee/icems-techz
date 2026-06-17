// ============================================
// CONFIG.JS - SHARED CONFIGURATION
// ============================================
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8000/api'
  : 'https://icems-techz-production.up.railway.app/api';
const SC_ID = 1;
const AppState = {
    currentOrgId: SC_ID,
    currentUser: null,
    organizationName: 'Student Council',
    organizationType: 'Student Organization'
};
console.log('Config API_BASE_URL set to:', API_BASE_URL);

