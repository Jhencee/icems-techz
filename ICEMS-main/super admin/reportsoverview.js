// ============================================
// REPORTS OVERVIEW - reportsoverview.js
// ============================================

const REPORTS_API_URL = 'http://127.0.0.1:8000/api';

let userChart = null;
let adminChart = null;

// ============================================
// INITIALIZE REPORTS
// ============================================
async function initializeReports() {
    console.log('🚀 Initializing Reports Overview...');
    
    try {
        // Load statistics
        await loadReportStatistics();
        
        // Wait for Chart.js to be loaded
        if (typeof Chart !== 'undefined') {
            initializeReportCharts();
        } else {
            console.log('⏳ Waiting for Chart.js to load...');
            setTimeout(initializeReports, 100);
        }
    } catch (error) {
        console.error('❌ Error initializing reports:', error);
    }
}

// ============================================
// LOAD REPORT STATISTICS FROM ALL ENDPOINTS
// ============================================
async function loadReportStatistics() {
    try {
        console.log('📊 Loading comprehensive report statistics from backend...');

        // Fetch data from all controllers in parallel
        const [
            studentsResponse,
            adminsResponse,
            eventsResponse,
            clearanceResponse,
            gymResponse,
            labResponse,
            libraryResponse,
            nurseResponse,
            organizationsResponse
        ] = await Promise.all([
            fetch(`${REPORTS_API_URL}/admin/allowed-students`).catch(() => ({ ok: false })),
            fetch(`${REPORTS_API_URL}/admin/admins`).catch(() => ({ ok: false })),
            fetch(`${REPORTS_API_URL}/events`).catch(() => ({ ok: false })),
            fetch(`${REPORTS_API_URL}/clearance/submissions`).catch(() => ({ ok: false })),
            fetch(`${REPORTS_API_URL}/gymnasium/clearances`).catch(() => ({ ok: false })),
            fetch(`${REPORTS_API_URL}/laboratory/all-clearances`).catch(() => ({ ok: false })),
            fetch(`${REPORTS_API_URL}/library/all-clearances`).catch(() => ({ ok: false })),
            fetch(`${REPORTS_API_URL}/nurse/all-clearances`).catch(() => ({ ok: false })),
            fetch(`${REPORTS_API_URL}/organizations`).catch(() => ({ ok: false }))
        ]);

        // Parse responses safely
        const studentsData = studentsResponse.ok ? await studentsResponse.json() : { success: false, students: [] };
        
        // Handle admins with fallback
        let adminsData;
        if (adminsResponse.ok) {
            try {
                adminsData = await adminsResponse.json();
            } catch (e) {
                console.error('Failed to parse admins response:', e);
                adminsData = { success: false, admins: [] };
            }
        } else {
            console.warn('⚠️ Admins endpoint failed, using fallback data');
            // Fallback admin data
            adminsData = {
                success: true,
                admins: [
                    { id: 1, email: 'accounting.pupsmb@gmail.com', role: 'Admin', department: 'Accounting', status: 'active' },
                    { id: 2, email: 'director.pupsmb@gmail.com', role: 'Admin', department: 'Administration', status: 'active' },
                    { id: 3, email: 'nurse.pupsmb@gmail.com', role: 'Admin', department: 'Medical', status: 'active' },
                    { id: 4, email: 'library.pupsmb@gmail.com', role: 'Admin', department: 'Library', status: 'active' },
                    { id: 5, email: 'laboratory.pupsmb@gmail.com', role: 'Admin', department: 'Laboratory', status: 'active' },
                    { id: 6, email: 'gymnasium.pupsmb@gmail.com', role: 'Admin', department: 'Sports', status: 'active' },
                    { id: 7, email: 'sso.pupsmb@gmail.com', role: 'Admin', department: 'Student Services', status: 'active' },
                    { id: 8, email: 'organization.pupsmb@gmail.com', role: 'Admin', department: 'Student Affairs', status: 'active' },
                    { id: 9, email: 'studentcouncil.pupsmb@gmail.com', role: 'Admin', department: 'Student Government', status: 'active' },
                    { id: 10, email: 'publication.pupsmb@gmail.com', role: 'Admin', department: 'Media', status: 'active' }
                ]
            };
        }
        
        const eventsData = eventsResponse.ok ? await eventsResponse.json() : { success: false, events: [] };
        const clearanceData = clearanceResponse.ok ? await clearanceResponse.json() : { success: false, submissions: [] };
        const gymData = gymResponse.ok ? await gymResponse.json() : { success: false, clearances: [] };
        const labData = labResponse.ok ? await labResponse.json() : { success: false, clearances: [] };
        const libraryData = libraryResponse.ok ? await libraryResponse.json() : { success: false, clearances: [] };
        const nurseData = nurseResponse.ok ? await nurseResponse.json() : { success: false, clearances: [] };
        const organizationsData = organizationsResponse.ok ? await organizationsResponse.json() : { success: false, organizations: [] };

        console.log('📥 Data received:', {
            students: studentsData.students?.length || 0,
            admins: adminsData.admins?.length || 0,
            events: eventsData.events?.length || 0,
            clearances: clearanceData.submissions?.length || 0,
            gym: gymData.clearances?.length || 0,
            lab: labData.clearances?.length || 0,
            library: libraryData.clearances?.length || 0,
            nurse: nurseData.clearances?.length || 0,
            organizations: organizationsData.organizations?.length || 0
        });

        // Calculate comprehensive statistics
        const students = studentsData.success ? studentsData.students : [];
        const admins = adminsData.success ? adminsData.admins : [];
        const events = eventsData.success ? eventsData.events : [];
        
        // Total students
        const totalUsers = students.length;
        const registeredUsers = students.filter(s => s.is_registered).length;
        const notRegisteredUsers = totalUsers - registeredUsers;

        // Total admins (all from database since super admin is hardcoded)
        const totalAdmins = admins.length;

        // Total events from all sources
        const totalEvents = events.length;

        // Total clearances issued (approved clearances from all departments)
        const clearanceSubmissions = clearanceData.success ? clearanceData.submissions : [];
        const gymClearances = gymData.success ? gymData.clearances : [];
        const labClearances = labData.success ? labData.clearances : [];
        const libraryClearances = libraryData.success ? libraryData.clearances : [];
        const nurseClearances = nurseData.success ? nurseData.clearances : [];

        // Count approved clearances
        const approvedSSO = clearanceSubmissions.filter(c => c.status === 'approved').length;
        const approvedGym = gymClearances.filter(c => c.status === 'approved').length;
        const approvedLab = labClearances.filter(c => c.status === 'approved').length;
        const approvedLibrary = libraryClearances.filter(c => c.status === 'approved').length;
        const approvedNurse = nurseClearances.filter(c => c.status === 'approved').length;

        const clearancesIssued = approvedSSO + approvedGym + approvedLab + approvedLibrary + approvedNurse;

        console.log('✅ Statistics calculated:', {
            totalUsers,
            registeredUsers,
            notRegisteredUsers,
            totalAdmins,
            totalEvents,
            clearancesIssued,
            breakdown: {
                sso: approvedSSO,
                gym: approvedGym,
                lab: approvedLab,
                library: approvedLibrary,
                nurse: approvedNurse
            }
        });

        // Update stat cards
        updateStatCard('Total Users', totalUsers);
        updateStatCard('Total Admins', totalAdmins);
        updateStatCard('Total Events', totalEvents);
        updateStatCard('Clearances Issued', clearancesIssued);

        // Store data for charts
        window.reportsData = {
            totalUsers,
            registeredUsers,
            notRegisteredUsers,
            admins: admins,
            totalAdmins,
            totalEvents,
            clearancesIssued,
            clearanceBreakdown: {
                sso: approvedSSO,
                gym: approvedGym,
                lab: approvedLab,
                library: approvedLibrary,
                nurse: approvedNurse
            }
        };

        console.log('✅ Report data stored globally');

    } catch (error) {
        console.error('❌ Error loading report statistics:', error);
        
        // Set default values on error
        updateStatCard('Total Users', 0);
        updateStatCard('Total Admins', 0);
        updateStatCard('Total Events', 0);
        updateStatCard('Clearances Issued', 0);
    }
}

// ============================================
// UPDATE STAT CARD
// ============================================
function updateStatCard(title, value) {
    const statCards = document.querySelectorAll('.stat-card');
    
    statCards.forEach(card => {
        const h3 = card.querySelector('h3');
        if (h3 && h3.textContent.trim() === title) {
            const statNumber = card.querySelector('.stat-number');
            if (statNumber) {
                // Animate number change
                const currentValue = parseInt(statNumber.textContent) || 0;
                animateValue(statNumber, currentValue, value, 500);
            }
        }
    });
}

// ============================================
// ANIMATE NUMBER CHANGE
// ============================================
function animateValue(element, start, end, duration) {
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = Math.floor(start + (end - start) * progress);
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// ============================================
// INITIALIZE REPORT CHARTS
// ============================================
function initializeReportCharts() {
    console.log('📊 Initializing report charts...');
    
    // Destroy ALL existing Chart.js instances on these canvases
    const userCanvas = document.getElementById('userChart');
    const adminCanvas = document.getElementById('adminChart');
    
    if (userCanvas) {
        const existingUserChart = Chart.getChart(userCanvas);
        if (existingUserChart) {
            existingUserChart.destroy();
            console.log('🗑️ Destroyed existing user chart');
        }
    }
    
    if (adminCanvas) {
        const existingAdminChart = Chart.getChart(adminCanvas);
        if (existingAdminChart) {
            existingAdminChart.destroy();
            console.log('🗑️ Destroyed existing admin chart');
        }
    }
    
    // Also destroy our stored references
    if (userChart) {
        try {
            userChart.destroy();
        } catch (e) {
            console.log('User chart already destroyed');
        }
        userChart = null;
    }
    if (adminChart) {
        try {
            adminChart.destroy();
        } catch (e) {
            console.log('Admin chart already destroyed');
        }
        adminChart = null;
    }

    // Initialize User Statistics Bar Chart
    initializeUserChart();
    
    // Initialize Admin Distribution Pie Chart
    initializeAdminChart();
}

// ============================================
// USER STATISTICS BAR CHART
// ============================================
function initializeUserChart() {
    const userCtx = document.getElementById('userChart');
    
    if (!userCtx) {
        console.error('❌ User chart canvas not found');
        return;
    }

    const ctx = userCtx.getContext('2d');
    const data = window.reportsData || {
        totalUsers: 0,
        registeredUsers: 0,
        notRegisteredUsers: 0
    };

    try {
        userChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Total Allowed', 'Registered', 'Not Registered'],
                datasets: [{
                    label: 'Student Count',
                    data: [
                        data.totalUsers,
                        data.registeredUsers,
                        data.notRegisteredUsers
                    ],
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',   // Blue - Total
                        'rgba(34, 197, 94, 0.8)',    // Green - Registered
                        'rgba(239, 68, 68, 0.8)'     // Red - Not Registered
                    ],
                    borderColor: [
                        'rgba(37, 99, 235, 1)',
                        'rgba(22, 163, 74, 1)',
                        'rgba(220, 38, 38, 1)'
                    ],
                    borderWidth: 2,
                    borderRadius: 8,
                    barThickness: 60
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Student Registration Status',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        padding: {
                            bottom: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: {
                            size: 14
                        },
                        bodyFont: {
                            size: 13
                        },
                        callbacks: {
                            label: function(context) {
                                return context.parsed.y + ' students';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            font: {
                                size: 12
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                size: 12,
                                weight: '500'
                            }
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });

        console.log('✅ User chart created successfully');
    } catch (error) {
        console.error('❌ Error creating user chart:', error);
    }
}

// ============================================
// ADMIN DISTRIBUTION PIE CHART
// ============================================
function initializeAdminChart() {
    const adminCtx = document.getElementById('adminChart');
    
    if (!adminCtx) {
        console.error('❌ Admin chart canvas not found');
        return;
    }

    const ctx = adminCtx.getContext('2d');
    const admins = window.reportsData?.admins || [];

    // Count admins by department/role
    const departmentCounts = {};
    admins.forEach(admin => {
        const dept = admin.department || admin.role || 'Other';
        departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
    });

    const labels = Object.keys(departmentCounts);
    const data = Object.values(departmentCounts);

    // Generate colors for pie chart
    const colors = [
        'rgba(239, 68, 68, 0.8)',   // Red
        'rgba(59, 130, 246, 0.8)',  // Blue
        'rgba(34, 197, 94, 0.8)',   // Green
        'rgba(234, 179, 8, 0.8)',   // Yellow
        'rgba(168, 85, 247, 0.8)',  // Purple
        'rgba(236, 72, 153, 0.8)',  // Pink
        'rgba(20, 184, 166, 0.8)',  // Teal
        'rgba(251, 146, 60, 0.8)',  // Orange
        'rgba(14, 165, 233, 0.8)',  // Sky
        'rgba(132, 204, 22, 0.8)'   // Lime
    ];

    try {
        adminChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderColor: '#ffffff',
                    borderWidth: 3,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12
                            },
                            generateLabels: function(chart) {
                                const data = chart.data;
                                if (data.labels.length && data.datasets.length) {
                                    return data.labels.map((label, i) => {
                                        const value = data.datasets[0].data[i];
                                        return {
                                            text: `${label} (${value})`,
                                            fillStyle: data.datasets[0].backgroundColor[i],
                                            hidden: false,
                                            index: i
                                        };
                                    });
                                }
                                return [];
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Admins by Department',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        padding: {
                            bottom: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: {
                            size: 14
                        },
                        bodyFont: {
                            size: 13
                        },
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        console.log('✅ Admin chart created successfully');
    } catch (error) {
        console.error('❌ Error creating admin chart:', error);
    }
}

// ============================================
// REFRESH REPORTS
// ============================================
async function refreshReports() {
    console.log('🔄 Refreshing reports...');
    await loadReportStatistics();
    initializeReportCharts();
}

// ============================================
// AUTO-INITIALIZE ON PAGE LOAD
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the reports page
    const reportsSection = document.getElementById('reports');
    if (reportsSection) {
        console.log('📋 Reports section found, initializing...');
        
        // Wait a bit for Chart.js to load
        setTimeout(initializeReports, 500);
    }
});

// ============================================
// INITIALIZE WHEN REPORTS TAB IS CLICKED
// ============================================
const reportsNavItem = document.querySelector('[data-section="reports"]');
if (reportsNavItem) {
    reportsNavItem.addEventListener('click', function() {
        console.log('📊 Reports tab clicked, loading reports...');
        setTimeout(initializeReports, 300);
    });
}

// Export functions
window.initializeReports = initializeReports;
window.refreshReports = refreshReports;

console.log('✅ Reports Overview module loaded');