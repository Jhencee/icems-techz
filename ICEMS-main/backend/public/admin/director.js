// data storage
let clearances = [];

// tab switching
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.getElementById(tabName + '-tab').classList.remove('hidden');
    event.target.closest('.nav-link').classList.add('active');
    updateDisplay();
}

// toggle sidebar for mobile
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

// update all displays
function updateDisplay() {
    updateClearanceStats();
    updateClearancesTable();
    updateReports();
}

// update clearance statistics
function updateClearanceStats() {
    const total = clearances.length;
    const pending = clearances.filter(c => c.status === 'Pending').length;
    const approved = clearances.filter(c => c.status === 'Approved').length;
    const rejected = clearances.filter(c => c.status === 'Rejected').length;

    document.getElementById('totalClearances').textContent = total;
    document.getElementById('pendingClearances').textContent = pending;
    document.getElementById('approvedClearances').textContent = approved;
    document.getElementById('rejectedClearances').textContent = rejected;
}

// update clearances table
function updateClearancesTable() {
    const tbody = document.getElementById('clearancesTableBody');
    if (clearances.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9">
                    <div class="table-empty">
                        <div class="table-empty-icon">📋</div>
                        <h3>No Clearances Yet</h3>
                        <p>Clearance requests will appear here once students submit them.</p>
                    </div>
                </td>
            </tr>`;
    } else {
        tbody.innerHTML = clearances.map(c => `
            <tr>
                <td>${c.studentId}</td>
                <td style="font-weight: 500; color: #374151;">${c.name}</td>
                <td>${c.sections}</td>
                <td>${c.clearanceType}</td>
                <td>${c.description}</td>
                <td>${c.proof || '-'}</td>
                <td><span class="status-badge status-${c.status.toLowerCase()}">${c.status}</span></td>
                <td>${c.remarks || '-'}</td>
                <td><button class="btn btn-view" onclick="viewClearance(${c.id})">View</button></td>
            </tr>`).join('');
    }
    document.getElementById('clearanceCount').textContent = clearances.length;
}

// update reports
function updateReports() {
    const total = clearances.length;
    const completed = clearances.filter(c => c.status === 'Approved').length;
    const pending = clearances.filter(c => c.status === 'Pending').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    document.getElementById('reportTotal').textContent = total;
    document.getElementById('reportCompleted').textContent = completed;
    document.getElementById('reportPending').textContent = pending;
    document.getElementById('reportPercentage').textContent = percentage + '%';

    const today = new Date();
    document.getElementById('reportDate').textContent = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// view clearance details
function viewClearance(id) {
    const clearance = clearances.find(c => c.id === id);
    if (clearance) {
        alert(`Clearance Details:\n\nStudent: ${clearance.name}\nID: ${clearance.studentId}\nType: ${clearance.clearanceType}\nStatus: ${clearance.status}\nRemarks: ${clearance.remarks || 'None'}`);
    }
}

// PRINTABLE REPORT WITH FILTER 
function downloadReport(type) {
    const filterPopup = document.createElement("div");
    filterPopup.className = "filter-popup-overlay";
    filterPopup.innerHTML = `
        <div class="filter-popup">
            <h2>Filter Before Printing</h2>

            <label for="filterSections">Sections:</label>
            <select id="filterSections">
                <option value="all">All</option>
                <option value="1-1">1-1</option>
                <option value="1-2">1-2</option>
                <option value="2-1">2-1</option>
                <option value="2-2">2-2</option>
                <option value="3-1">3-1</option>
                <option value="3-2">3-2</option>
                <option value="4-1">4-1</option>
                <option value="4-2">4-2</option>
            </select>

            <label for="filterStatus">Status:</label>
            <select id="filterStatus">
                <option value="all">All</option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
                <option value="Rejected">Rejected</option>
            </select>

            <div class="filter-popup-buttons">
                <button class="filter-btn cancel" id="cancelFilter">Cancel</button>
                <button class="filter-btn print" id="applyFilterPrint">Print</button>
            </div>
        </div>
    `;
    document.body.appendChild(filterPopup);

    document.getElementById("cancelFilter").onclick = () => filterPopup.remove();

    document.getElementById("applyFilterPrint").onclick = () => {
        const dept = document.getElementById("filterSections").value;
        const status = document.getElementById("filterStatus").value;
        filterPopup.remove();
        printFilteredReport(dept, status);
    };
}

// Print filtered table
function printFilteredReport(sections, status) {
    const filtered = clearances.filter(c => 
        (sections === "all" || c.course === sections) &&
        (status === "all" || c.status === status)
    );

    let rows = "";
    if (filtered.length > 0) {
        rows = filtered.map(c => `
            <tr>
                <td>${c.studentId}</td>
                <td>${c.name}</td>
                <td>${c.sections}</td>
                <td>${c.clearanceType}</td>
                <td>${c.status}</td>
            </tr>
        `).join("");
    } else {
        rows = `<tr><td colspan="5" class="no-records">No matching records found.</td></tr>`;
    }

    const printWindow = window.open("", "", "width=900,height=700");
    printWindow.document.write(`
        <html>
            <head>
                <title>ICEMS - Filtered Report</title>
                <link rel="stylesheet" href="report.css">
            </head>
            <body>
                <h2>ICEMS - Filtered Clearance Report</h2>
                <p>Department: ${sections.toUpperCase()} | Status: ${status.toUpperCase()}</p>
                <table>
                    <thead>
                        <tr>
                            <th>Student ID</th>
                            <th>Name</th>
                            <th>Sections</th>
                            <th>Type</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

function logout() {
    document.getElementById("logoutModal").style.display = "flex";
    document.body.style.overflow = "hidden";  // disable scroll
}

function closeLogoutModal() {
    document.getElementById("logoutModal").style.display = "none";
    document.body.style.overflow = "auto"; // enable scroll again
}

function confirmLogout() {
    document.body.style.overflow = "auto";
    window.location.href = "../user/studentlogin.html";
}


// initialize
document.addEventListener('DOMContentLoaded', function () {
    updateDisplay();
});