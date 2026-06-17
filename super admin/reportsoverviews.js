// ============================================
// REPORTS OVERVIEW - reportsoverviews.js (FIXED)
// ============================================

const REPORTS_API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? `${window.location.protocol}//${window.location.hostname}:8000/api` : 'https://icems-techz-production.up.railway.app/api';
let userChart = null;
let adminChart = null;

// ============================================
// SAFE FETCH â€” handles 405 / 429 / network errors
// ============================================
async function safeFetch(url, retries = 2, delayMs = 600) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const res = await fetch(url);

            if (res.status === 405) {
                console.warn(`âš ï¸ 405 Method Not Allowed: ${url} â€” skipping.`);
                return null;
            }
            if (res.status === 429) {
                if (attempt < retries) {
                    const wait = delayMs * (attempt + 1);
                    console.warn(`âš ï¸ 429 Too Many Requests: ${url} â€” retrying in ${wait}ms...`);
                    await sleep(wait);
                    continue;
                }
                console.warn(`âŒ 429: ${url} â€” giving up after ${retries} retries.`);
                return null;
            }
            if (!res.ok) {
                console.warn(`âš ï¸ HTTP ${res.status} for ${url} â€” skipping.`);
                return null;
            }

            return await res.json();
        } catch (err) {
            if (attempt < retries) {
                await sleep(delayMs * (attempt + 1));
            } else {
                console.error(`âŒ Failed to fetch ${url}:`, err.message);
                return null;
            }
        }
    }
    return null;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// FETCH IN BATCHES â€” avoids rate limiting
// ============================================
async function fetchInBatches(requests, batchSize = 3, batchDelay = 400) {
    const results = [];
    for (let i = 0; i < requests.length; i += batchSize) {
        const batch = requests.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(({ url }) => safeFetch(url)));
        results.push(...batchResults);
        if (i + batchSize < requests.length) await sleep(batchDelay);
    }
    return results;
}

// ============================================
// INITIALIZE REPORTS
// ============================================
async function initializeReports() {
    console.log('ðŸš€ Initializing Reports Overview...');
    try {
        await loadReportStatistics();

        if (typeof Chart !== 'undefined') {
            initializeReportCharts();
        } else {
            waitForChartJSThenInit();
        }
    } catch (error) {
        console.error('âŒ Error initializing reports:', error);
    }
}

function waitForChartJSThenInit() {
    if (typeof Chart !== 'undefined') {
        initializeReportCharts();
    } else {
        setTimeout(waitForChartJSThenInit, 150);
    }
}

// ============================================
// LOAD STATISTICS
// ============================================
async function loadReportStatistics() {
    console.log('ðŸ“Š Loading report statistics (batched)...');

    const endpoints = [
        { key: 'students', url: `${REPORTS_API_URL}/admin/allowed-students` },
        { key: 'admins', url: `${REPORTS_API_URL}/admin/admins` },
        { key: 'events', url: `${REPORTS_API_URL}/events` },
        { key: 'clearance', url: `${REPORTS_API_URL}/clearance/submissions` },
        { key: 'gym', url: `${REPORTS_API_URL}/gymnasium/clearances` },
        { key: 'lab', url: `${REPORTS_API_URL}/laboratory/all-clearances` },
        { key: 'library', url: `${REPORTS_API_URL}/library/all-clearances` },
        { key: 'nurse', url: `${REPORTS_API_URL}/nurse/all-clearances` },
        { key: 'organizations', url: `${REPORTS_API_URL}/organizations` }
    ];

    const rawResults = await fetchInBatches(endpoints, 3, 400);

    const byKey = {};
    endpoints.forEach(({ key }, i) => { byKey[key] = rawResults[i]; });

    // Admins fallback
    let adminsData = byKey.admins;
    if (!adminsData || !adminsData.success) {
        console.warn('âš ï¸ Admins endpoint unavailable â€” using fallback.');
        adminsData = {
            success: true,
            admins: [
                { id: 1, email: 'accounting.pupsmb@gmail.com', department: 'Accounting' },
                { id: 2, email: 'director.pupsmb@gmail.com', department: 'Administration' },
                { id: 3, email: 'nurse.pupsmb@gmail.com', department: 'Medical' },
                { id: 4, email: 'library.pupsmb@gmail.com', department: 'Library' },
                { id: 5, email: 'laboratory.pupsmb@gmail.com', department: 'Laboratory' },
                { id: 6, email: 'gymnasium.pupsmb@gmail.com', department: 'Sports' },
                { id: 7, email: 'sso.pupsmb@gmail.com', department: 'Student Services' },
                { id: 8, email: 'organization.pupsmb@gmail.com', department: 'Student Affairs' },
                { id: 9, email: 'studentcouncil.pupsmb@gmail.com', department: 'Student Government' },
                { id: 10, email: 'publication.pupsmb@gmail.com', department: 'Media' }
            ]
        };
    }

    const students = byKey.students?.success ? byKey.students.students : [];
    const admins = adminsData.success ? adminsData.admins : [];
    const events = byKey.events?.success ? byKey.events.events : [];

    const totalUsers = students.length;
    const registeredUsers = students.filter(s => s.is_registered).length;
    const notRegisteredUsers = totalUsers - registeredUsers;
    const totalAdmins = admins.length;
    const totalEvents = events.length;

    const approvedSSO = (byKey.clearance?.success ? byKey.clearance.submissions : []).filter(c => c.status === 'approved').length;
    const approvedGym = (byKey.gym?.success ? byKey.gym.clearances : []).filter(c => c.status === 'approved').length;
    const approvedLab = (byKey.lab?.success ? byKey.lab.clearances : []).filter(c => c.status === 'approved').length;
    const approvedLibrary = (byKey.library?.success ? byKey.library.clearances : []).filter(c => c.status === 'approved').length;
    const approvedNurse = (byKey.nurse?.success ? byKey.nurse.clearances : []).filter(c => c.status === 'approved').length;
    const clearancesIssued = approvedSSO + approvedGym + approvedLab + approvedLibrary + approvedNurse;

    console.log('âœ… Statistics:', { totalUsers, registeredUsers, notRegisteredUsers, totalAdmins, totalEvents, clearancesIssued });

    updateStatCard('Total Users', totalUsers);
    updateStatCard('Total Admins', totalAdmins);
    updateStatCard('Total Events', totalEvents);
    updateStatCard('Clearances Issued', clearancesIssued);

    window.reportsData = {
        totalUsers, registeredUsers, notRegisteredUsers,
        admins, totalAdmins, totalEvents, clearancesIssued,
        clearanceBreakdown: { sso: approvedSSO, gym: approvedGym, lab: approvedLab, library: approvedLibrary, nurse: approvedNurse }
    };

    console.log('âœ… Report data stored globally');
}

// ============================================
// UPDATE STAT CARD
// ============================================
function updateStatCard(title, value) {
    document.querySelectorAll('.stat-card').forEach(card => {
        const h3 = card.querySelector('h3');
        if (h3 && h3.textContent.trim() === title) {
            const statNumber = card.querySelector('.stat-number');
            if (statNumber) animateValue(statNumber, parseInt(statNumber.textContent) || 0, value, 500);
        }
    });
}

function animateValue(element, start, end, duration) {
    const startTime = performance.now();
    function update(currentTime) {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        element.textContent = Math.floor(start + (end - start) * progress);
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

// ============================================
// INITIALIZE CHARTS
// ============================================
function initializeReportCharts() {
    console.log('ðŸ“Š Initializing report charts...');

    ['userChart', 'adminChart'].forEach(id => {
        const canvas = document.getElementById(id);
        if (canvas) {
            const existing = Chart.getChart(canvas);
            if (existing) { existing.destroy(); console.log(`ðŸ—‘ï¸ Destroyed existing ${id}`); }
        }
    });

    if (userChart) { try { userChart.destroy(); } catch (_) { } userChart = null; }
    if (adminChart) { try { adminChart.destroy(); } catch (_) { } adminChart = null; }

    initializeUserChart();
    initializeAdminChart();
}

function initializeUserChart() {
    const canvas = document.getElementById('userChart');
    if (!canvas) { console.error('âŒ userChart canvas not found'); return; }

    const data = window.reportsData || { totalUsers: 0, registeredUsers: 0, notRegisteredUsers: 0 };

    try {
        userChart = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Total Allowed', 'Registered', 'Not Registered'],
                datasets: [{
                    label: 'Student Count',
                    data: [data.totalUsers, data.registeredUsers, data.notRegisteredUsers],
                    backgroundColor: ['rgba(59,130,246,0.8)', 'rgba(34,197,94,0.8)', 'rgba(239,68,68,0.8)'],
                    borderColor: ['rgba(37,99,235,1)', 'rgba(22,163,74,1)', 'rgba(220,38,38,1)'],
                    borderWidth: 2, borderRadius: 8, barThickness: 60
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: 'Student Registration Status', font: { size: 16, weight: 'bold' }, padding: { bottom: 20 } },
                    tooltip: { callbacks: { label: ctx => ctx.parsed.y + ' students' } }
                },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.05)' } },
                    x: { grid: { display: false } }
                }
            }
        });
        console.log('âœ… User chart created');
    } catch (err) { console.error('âŒ Error creating user chart:', err); }
}

function initializeAdminChart() {
    const canvas = document.getElementById('adminChart');
    if (!canvas) { console.error('âŒ adminChart canvas not found'); return; }

    const admins = window.reportsData?.admins || [];
    const deptCounts = {};
    admins.forEach(a => {
        const dept = a.department || a.role || 'Other';
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });

    const labels = Object.keys(deptCounts);
    const values = Object.values(deptCounts);
    const colors = [
        'rgba(239,68,68,0.8)', 'rgba(59,130,246,0.8)', 'rgba(34,197,94,0.8)',
        'rgba(234,179,8,0.8)', 'rgba(168,85,247,0.8)', 'rgba(236,72,153,0.8)',
        'rgba(20,184,166,0.8)', 'rgba(251,146,60,0.8)', 'rgba(14,165,233,0.8)',
        'rgba(132,204,22,0.8)'
    ];

    try {
        adminChart = new Chart(canvas.getContext('2d'), {
            type: 'pie',
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors.slice(0, labels.length),
                    borderColor: '#ffffff', borderWidth: 3, hoverOffset: 10
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 15, font: { size: 12 },
                            generateLabels(chart) {
                                return chart.data.labels.map((label, i) => ({
                                    text: `${label} (${chart.data.datasets[0].data[i]})`,
                                    fillStyle: chart.data.datasets[0].backgroundColor[i],
                                    hidden: false, index: i
                                }));
                            }
                        }
                    },
                    title: { display: true, text: 'Admins by Department', font: { size: 16, weight: 'bold' }, padding: { bottom: 20 } },
                    tooltip: {
                        callbacks: {
                            label(ctx) {
                                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                                return `${ctx.label}: ${ctx.parsed} (${((ctx.parsed / total) * 100).toFixed(1)}%)`;
                            }
                        }
                    }
                }
            }
        });
        console.log('âœ… Admin chart created');
    } catch (err) { console.error('âŒ Error creating admin chart:', err); }
}

// ============================================
// REFRESH
// ============================================
async function refreshReports() {
    console.log('ðŸ”„ Refreshing reports...');
    await loadReportStatistics();
    initializeReportCharts();
}

// ============================================
// FIX: DO NOT auto-init on DOMContentLoaded.
// Reports are now initialized only when the
// Reports nav tab is clicked (handled in SystemAdmin.js).
// This prevents the double-initialization and the
// "Reports section found" firing on every page load.
// ============================================

// Export
window.initializeReports = initializeReports;
window.refreshReports = refreshReports;

console.log('âœ… Reports Overview module loaded');
