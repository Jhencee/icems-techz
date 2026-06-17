const API_BASE = 'http://127.0.0.1:8000/api';

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

// ===== FETCH FROM DB =====
async function loadClearances() {
    try {
        const res = await fetch(`${API_BASE}/director/clearances`);
        const data = await res.json();
        if (data.success) {
            clearances = data.clearances;
        }
    } catch (err) {
        console.error('Failed to load clearances:', err);
    }
    updateDisplay();
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
                <td>${c.sections || '-'}</td>
                <td>${c.clearanceType}</td>
                <td>${c.description || '-'}</td>
                <td>${c.proof ? `<a href="${c.proof}" target="_blank">View File</a>` : '-'}</td>
                <td><span class="status-badge status-${c.status.toLowerCase()}">${c.status}</span></td>
                <td>${c.remarks || '-'}</td>
                <td><button class="btn btn-view" onclick="viewClearance('${c.id}')">View</button></td>
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

    updateSectionReport();
}

// update per-section clearance report table
function updateSectionReport() {
    const tbody = document.getElementById('sectionReportBody');

    if (clearances.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="table-empty">
                        <div class="table-empty-icon"><i class="fas fa-chart-bar"></i></div>
                        <h3>No Data Available</h3>
                        <p>Section reports will be generated once clearances are processed.</p>
                    </div>
                </td>
            </tr>`;
        return;
    }

    const bySection = {};
    clearances.forEach(c => {
        const sec = c.sections || 'Unspecified';
        if (!bySection[sec]) {
            bySection[sec] = { total: 0, cleared: 0, pending: 0 };
        }
        bySection[sec].total++;
        if (c.status === 'Approved') bySection[sec].cleared++;
        if (c.status === 'Pending') bySection[sec].pending++;
    });

    tbody.innerHTML = Object.keys(bySection).sort().map(sec => {
        const data = bySection[sec];
        const rate = data.total > 0 ? Math.round((data.cleared / data.total) * 100) : 0;
        return `
            <tr>
                <td>${sec}</td>
                <td>${data.total}</td>
                <td>${data.cleared}</td>
                <td>${data.pending}</td>
                <td>${rate}%</td>
            </tr>`;
    }).join('');
}

// view clearance details (with approve/reject)
function viewClearance(id) {
    const clearance = clearances.find(c => c.id === id);
    if (!clearance) return;

    const popup = document.createElement('div');
    popup.className = 'filter-popup-overlay';
    popup.innerHTML = `
        <div class="filter-popup">
            <h2>Clearance Details</h2>
            <p><strong>Student:</strong> ${clearance.name}</p>
            <p><strong>ID:</strong> ${clearance.studentId}</p>
            <p><strong>Section:</strong> ${clearance.sections || '-'}</p>
            <p><strong>Type:</strong> ${clearance.clearanceType}</p>
            <p><strong>Description:</strong> ${clearance.description || '-'}</p>
            <p><strong>Proof:</strong> ${clearance.proof ? `<a href="${clearance.proof}" target="_blank">View File</a>` : 'None'}</p>
            <p><strong>Status:</strong> ${clearance.status}</p>
            <label for="remarksInput">Remarks:</label>
            <textarea id="remarksInput" rows="3" style="width:100%;">${clearance.remarks || ''}</textarea>

            <div class="filter-popup-buttons">
                <button class="filter-btn cancel" id="closeView">Close</button>
                <button class="filter-btn print" id="rejectBtn" style="background:#b91c1c;">Reject</button>
                <button class="filter-btn print" id="approveBtn">Approve</button>
            </div>
        </div>
    `;
    document.body.appendChild(popup);

    document.getElementById('closeView').onclick = () => popup.remove();
    document.getElementById('approveBtn').onclick = () => {
        updateClearanceStatus(clearance, 'Approved', document.getElementById('remarksInput').value);
        popup.remove();
    };
    document.getElementById('rejectBtn').onclick = () => {
        updateClearanceStatus(clearance, 'Rejected', document.getElementById('remarksInput').value);
        popup.remove();
    };
}

// send approve/reject to backend
async function updateClearanceStatus(clearance, status, remarks) {
    try {
        const res = await fetch(`${API_BASE}/director/clearances/${clearance.type}/${clearance.recordId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, remarks }),
        });
        const data = await res.json();
        if (data.success) {
            await loadClearances();
        } else {
            alert(data.message || 'Update failed.');
        }
    } catch (err) {
        console.error('Failed to update clearance:', err);
        alert('Failed to update clearance. Please try again.');
    }
}

// PRINTABLE REPORT WITH FILTER (Overall Clearance Summary)
function downloadReport(type) {
    if (type === 'section') {
        printSectionReport();
        return;
    }

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
        const sections = document.getElementById("filterSections").value;
        const status = document.getElementById("filterStatus").value;
        filterPopup.remove();
        printFilteredReport(sections, status);
    };
}

// Print the section clearance status report
function printSectionReport() {
    const tbody = document.getElementById('sectionReportBody');

    const printWindow = window.open("", "", "width=900,height=700");
    printWindow.document.write(`
        <html>
            <head>
                <title>ICEMS - Section Clearance Report</title>
                <link rel="stylesheet" href="report.css">
            </head>
            <body>
                <h2>ICEMS - Section Clearance Status Report</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Section</th>
                            <th>Total Students</th>
                            <th>Cleared</th>
                            <th>Pending</th>
                            <th>Completion Rate</th>
                        </tr>
                    </thead>
                    <tbody>${tbody.innerHTML}</tbody>
                </table>
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Print filtered table (Overall Clearance Summary)
function printFilteredReport(sections, status) {
    const filtered = clearances.filter(c =>
        (sections === "all" || c.sections === sections) &&
        (status === "all" || c.status === status)
    );

    let rows = "";
    if (filtered.length > 0) {
        rows = filtered.map(c => `
            <tr>
                <td>${c.studentId}</td>
                <td>${c.name}</td>
                <td>${c.sections || '-'}</td>
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
                <p>Section: ${sections.toUpperCase()} | Status: ${status.toUpperCase()}</p>
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
    document.body.style.overflow = "hidden";
}

function closeLogoutModal() {
    document.getElementById("logoutModal").style.display = "none";
    document.body.style.overflow = "auto";
}

function confirmLogout() {
    document.body.style.overflow = "auto";
    window.location.href = "../user/studentlogin.html";
}

// initialize
document.addEventListener('DOMContentLoaded', function () {
    loadClearances();
});