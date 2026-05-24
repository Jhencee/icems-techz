// ============================================
// EXPORT TO PDF - exportpdf.js
// ============================================

// Load jsPDF library
const jsPDFScript = document.createElement('script');
jsPDFScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
document.head.appendChild(jsPDFScript);

const PDF_API_URL = 'http://127.0.0.1:8000/api';

// ============================================
// EXPORT REPORT TO PDF
// ============================================
async function exportReportPDF() {
    // Check if jsPDF is loaded
    if (typeof window.jspdf === 'undefined') {
        showAlert('Error', 'PDF library is still loading. Please try again in a moment.', 'warning');
        return;
    }

    try {
        console.log('📄 Generating PDF report...');

        // Show loading indicator
        showLoadingModal();

        // Get report data from backend
        const reportData = await generateReportData();

        // Create PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Add content to PDF
        addPDFHeader(doc);
        addPDFStatistics(doc, reportData);
        addPDFStudentTable(doc, reportData);
        addPDFAdminTable(doc, reportData);
        addPDFClearanceSummary(doc, reportData);
        addPDFFooter(doc);

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `System_Report_${timestamp}.pdf`;

        // Save the PDF
        doc.save(filename);

        // Close loading modal
        closeLoadingModal();

        // Show success message
        showAlert('Success', 'Report exported successfully!', 'success');

        console.log('✅ PDF generated successfully:', filename);

    } catch (error) {
        console.error('❌ Error generating PDF:', error);
        closeLoadingModal();
        showAlert('Error', 'Failed to generate PDF report: ' + error.message, 'error');
    }
}

// ============================================
// GENERATE REPORT DATA FROM BACKEND
// ============================================
async function generateReportData() {
    try {
        console.log('📊 Fetching comprehensive data from backend...');

        // Fetch all data sources
        const [
            studentsResponse,
            adminsResponse,
            eventsResponse,
            clearanceResponse,
            gymResponse,
            labResponse,
            libraryResponse,
            nurseResponse
        ] = await Promise.all([
            fetch(`${PDF_API_URL}/admin/allowed-students`).catch(() => ({ ok: false })),
            fetch(`${PDF_API_URL}/admin/admins`).catch(() => ({ ok: false })),
            fetch(`${PDF_API_URL}/events`).catch(() => ({ ok: false })),
            fetch(`${PDF_API_URL}/clearance/submissions`).catch(() => ({ ok: false })),
            fetch(`${PDF_API_URL}/gymnasium/clearances`).catch(() => ({ ok: false })),
            fetch(`${PDF_API_URL}/laboratory/all-clearances`).catch(() => ({ ok: false })),
            fetch(`${PDF_API_URL}/library/all-clearances`).catch(() => ({ ok: false })),
            fetch(`${PDF_API_URL}/nurse/all-clearances`).catch(() => ({ ok: false }))
        ]);

        // Parse responses
        const studentsData = studentsResponse.ok ? await studentsResponse.json() : { success: false, students: [] };
        const adminsData = adminsResponse.ok ? await adminsResponse.json() : { success: false, admins: [] };
        const eventsData = eventsResponse.ok ? await eventsResponse.json() : { success: false, events: [] };
        const clearanceData = clearanceResponse.ok ? await clearanceResponse.json() : { success: false, submissions: [] };
        const gymData = gymResponse.ok ? await gymResponse.json() : { success: false, clearances: [] };
        const labData = labResponse.ok ? await labResponse.json() : { success: false, clearances: [] };
        const libraryData = libraryResponse.ok ? await libraryResponse.json() : { success: false, clearances: [] };
        const nurseData = nurseResponse.ok ? await nurseResponse.json() : { success: false, clearances: [] };

        // Process data
        const students = studentsData.success ? studentsData.students : [];
        const admins = adminsData.success ? adminsData.admins : [];
        const events = eventsData.success ? eventsData.events : [];

        // Calculate statistics
        const totalUsers = students.length;
        const registeredUsers = students.filter(s => s.is_registered).length;
        const notRegisteredUsers = totalUsers - registeredUsers;
        const totalAdmins = admins.length; // All admins from DB (super admin is hardcoded)
        const totalEvents = events.length;

        // Count approved clearances from all departments
        const clearanceSubmissions = clearanceData.success ? clearanceData.submissions : [];
        const gymClearances = gymData.success ? gymData.clearances : [];
        const labClearances = labData.success ? labData.clearances : [];
        const libraryClearances = libraryData.success ? libraryData.clearances : [];
        const nurseClearances = nurseData.success ? nurseData.clearances : [];

        const approvedSSO = clearanceSubmissions.filter(c => c.status === 'approved').length;
        const approvedGym = gymClearances.filter(c => c.status === 'approved').length;
        const approvedLab = labClearances.filter(c => c.status === 'approved').length;
        const approvedLibrary = libraryClearances.filter(c => c.status === 'approved').length;
        const approvedNurse = nurseClearances.filter(c => c.status === 'approved').length;

        const clearancesIssued = approvedSSO + approvedGym + approvedLab + approvedLibrary + approvedNurse;

        // Group admins by department
        const adminsByDept = {};
        admins.forEach(admin => {
            const dept = admin.department || admin.role || 'Other';
            adminsByDept[dept] = (adminsByDept[dept] || 0) + 1;
        });

        console.log('✅ Report data compiled successfully');

        return {
            timestamp: new Date().toLocaleString(),
            statistics: {
                totalUsers,
                registeredUsers,
                notRegisteredUsers,
                totalAdmins,
                totalEvents,
                clearancesIssued
            },
            clearanceBreakdown: {
                sso: approvedSSO,
                gymnasium: approvedGym,
                laboratory: approvedLab,
                library: approvedLibrary,
                nurse: approvedNurse,
                total: clearancesIssued
            },
            students: students.slice(0, 50), // Limit to first 50 for PDF
            admins: admins, // All admins from database
            adminsByDept,
            events: events.slice(0, 20) // Include recent events
        };
    } catch (error) {
        console.error('❌ Error generating report data:', error);
        throw error;
    }
}

// ============================================
// ADD PDF HEADER
// ============================================
function addPDFHeader(doc) {
    // School name
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('Polytechnic University of the Philippines', 105, 20, { align: 'center' });
    
    // Branch
    doc.setFontSize(14);
    doc.text('Santa Maria, Bulacan Branch', 105, 28, { align: 'center' });
    
    // Report title
    doc.setFontSize(16);
    doc.text('System Administration Report', 105, 40, { align: 'center' });
    
    // Timestamp
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const timestamp = new Date().toLocaleString();
    doc.text(`Generated: ${timestamp}`, 105, 48, { align: 'center' });
    
    // Horizontal line
    doc.setLineWidth(0.5);
    doc.line(20, 52, 190, 52);
}

// ============================================
// ADD PDF STATISTICS
// ============================================
function addPDFStatistics(doc, data) {
    let yPos = 60;
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('System Statistics', 20, yPos);
    
    yPos += 8;
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    
    // Statistics grid
    const stats = [
        ['Total Users (Allowed Students):', data.statistics.totalUsers],
        ['Registered Users:', data.statistics.registeredUsers],
        ['Not Registered Users:', data.statistics.notRegisteredUsers],
        ['Total Admins:', data.statistics.totalAdmins],
        ['Total Events:', data.statistics.totalEvents],
        ['Clearances Issued (All Departments):', data.statistics.clearancesIssued]
    ];
    
    stats.forEach(([label, value]) => {
        doc.text(label, 25, yPos);
        doc.setFont(undefined, 'bold');
        doc.text(String(value), 120, yPos);
        doc.setFont(undefined, 'normal');
        yPos += 7;
    });
}

// ============================================
// ADD PDF STUDENT TABLE
// ============================================
function addPDFStudentTable(doc, data) {
    const yPos = 120;
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Student Records (First 50)', 20, yPos);
    
    // Table headers
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    
    let tableY = yPos + 8;
    const colX = [20, 35, 85, 145, 175];
    
    // Header row
    doc.text('ID', colX[0], tableY);
    doc.text('Name', colX[1], tableY);
    doc.text('Email', colX[2], tableY);
    doc.text('Student #', colX[3], tableY);
    doc.text('Status', colX[4], tableY);
    
    // Header line
    tableY += 2;
    doc.setLineWidth(0.3);
    doc.line(20, tableY, 200, tableY);
    
    // Data rows
    doc.setFont(undefined, 'normal');
    tableY += 5;
    
    data.students.forEach((student, index) => {
        if (tableY > 270) {
            // Add new page if needed
            doc.addPage();
            tableY = 20;
        }
        
        const name = `${student.first_name} ${student.last_name}`;
        const email = student.email.length > 30 ? student.email.substring(0, 27) + '...' : student.email;
        const status = student.is_registered ? 'Reg.' : 'Not Reg.';
        
        doc.text(String(student.id), colX[0], tableY);
        doc.text(name, colX[1], tableY);
        doc.text(email, colX[2], tableY);
        doc.text(student.student_number || 'N/A', colX[3], tableY);
        doc.text(status, colX[4], tableY);
        
        tableY += 6;
    });
    
    if (data.students.length >= 50) {
        tableY += 5;
        doc.setFont(undefined, 'italic');
        doc.text('(Showing first 50 students only. Full list available in the system.)', 20, tableY);
    }
}

// ============================================
// ADD PDF ADMIN TABLE
// ============================================
function addPDFAdminTable(doc, data) {
    // Add new page for admin section
    doc.addPage();
    
    let yPos = 20;
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Admin Distribution', 20, yPos);
    
    yPos += 10;
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    
    // Admin statistics by department
    Object.entries(data.adminsByDept).forEach(([dept, count]) => {
        doc.text(`${dept}:`, 25, yPos);
        doc.setFont(undefined, 'bold');
        doc.text(String(count), 100, yPos);
        doc.setFont(undefined, 'normal');
        yPos += 7;
    });
    
    yPos += 10;
    
    // Admin list
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Admin Accounts', 20, yPos);
    
    yPos += 8;
    doc.setFontSize(9);
    
    // Table headers
    doc.text('Name/Role', 25, yPos);
    doc.text('Department', 80, yPos);
    doc.text('Email', 130, yPos);
    
    yPos += 2;
    doc.setLineWidth(0.3);
    doc.line(20, yPos, 200, yPos);
    
    yPos += 5;
    doc.setFont(undefined, 'normal');
    
    data.admins.forEach(admin => {
        if (yPos > 270) {
            doc.addPage();
            yPos = 20;
        }
        
        const name = admin.role || admin.name || 'N/A';
        const dept = admin.department || 'N/A';
        const email = admin.email.length > 30 ? admin.email.substring(0, 27) + '...' : admin.email;
        
        doc.text(name, 25, yPos);
        doc.text(dept, 80, yPos);
        doc.text(email, 130, yPos);
        
        yPos += 6;
    });
}

// ============================================
// ADD CLEARANCE SUMMARY
// ============================================
function addPDFClearanceSummary(doc, data) {
    // Add new page for clearance summary
    doc.addPage();
    
    let yPos = 20;
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Clearance Summary by Department', 20, yPos);
    
    yPos += 10;
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    
    // Clearance breakdown
    const breakdown = [
        ['Student Services Office (SSO):', data.clearanceBreakdown.sso],
        ['Gymnasium:', data.clearanceBreakdown.gymnasium],
        ['Laboratory:', data.clearanceBreakdown.laboratory],
        ['Library:', data.clearanceBreakdown.library],
        ['Nurse Office:', data.clearanceBreakdown.nurse],
        ['', ''],
        ['TOTAL CLEARANCES ISSUED:', data.clearanceBreakdown.total]
    ];
    
    breakdown.forEach(([label, value], index) => {
        if (label === '') {
            // Add spacing
            yPos += 5;
        } else {
            if (index === breakdown.length - 1) {
                // Highlight total
                doc.setFont(undefined, 'bold');
            }
            doc.text(label, 25, yPos);
            doc.text(String(value), 120, yPos);
            doc.setFont(undefined, 'normal');
            yPos += 7;
        }
    });
    
    // Add recent events section if available
    if (data.events && data.events.length > 0) {
        yPos += 15;
        
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Recent Events', 20, yPos);
        
        yPos += 8;
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        
        data.events.forEach((event, index) => {
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }
            
            const eventDate = new Date(event.event_date).toLocaleDateString();
            doc.text(`${index + 1}. ${event.title} - ${eventDate}`, 25, yPos);
            yPos += 6;
        });
    }
}

// ============================================
// ADD PDF FOOTER
// ============================================
function addPDFFooter(doc) {
    const pageCount = doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont(undefined, 'italic');
        doc.text(
            `Page ${i} of ${pageCount}`,
            105,
            290,
            { align: 'center' }
        );
        doc.text(
            'PUP Santa Maria Branch - System Administration Report',
            105,
            285,
            { align: 'center' }
        );
    }
}

// ============================================
// LOADING MODAL
// ============================================
function showLoadingModal() {
    const modal = document.createElement('div');
    modal.id = 'pdfLoadingModal';
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content alert-modal-content" style="max-width: 400px;">
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 48px; color: #800000; margin-bottom: 20px;"></i>
                <h2 style="margin: 0 0 10px 0;">Generating PDF Report</h2>
                <p style="margin: 0; color: #666;">Please wait while we compile your comprehensive report...</p>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">This may take a few moments</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeLoadingModal() {
    const modal = document.getElementById('pdfLoadingModal');
    if (modal) {
        modal.remove();
    }
}

// ============================================
// EXPORT FUNCTION TO WINDOW
// ============================================
window.exportReportPDF = exportReportPDF;

console.log('✅ Export PDF module loaded');