// ============================================
// BATCH UPLOAD FUNCTIONALITY
// SystemadminBatchUpload.js - FIXED VERSION
// ============================================

let batchStudentsData = [];

// ============================================
// SWITCH TAB IN ADD USER MODAL
// ============================================
function switchAddUserTab(tab) {
    // Remove active class from all tabs
    document.querySelectorAll('.modal-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.modal-tab-content').forEach(content => content.classList.remove('active'));

    // Add active class to selected tab
    if (tab === 'single') {
        document.querySelector('.modal-tab-btn:nth-child(1)').classList.add('active');
        document.getElementById('singleStudentTab').classList.add('active');
    } else {
        document.querySelector('.modal-tab-btn:nth-child(2)').classList.add('active');
        document.getElementById('batchUploadTab').classList.add('active');
    }
}

// ============================================
// DOWNLOAD EXCEL TEMPLATE
// ============================================
function downloadTemplate() {
    // Create CSV template
    const headers = ['First Name', 'Last Name', 'Student Number', 'Course', 'Year', 'Email', 'Password'];
    const sampleData = [
        ['Juan', 'Dela Cruz', '2021-00001', 'BSIT', '1A', 'juan.delacruz@pupsmb.edu.ph', 'password123'],
        ['Maria', 'Santos', '2021-00002', 'BSCS', '2B', 'maria.santos@pupsmb.edu.ph', 'password456'],
        ['Pedro', 'Reyes', '2021-00003', 'BSBA', '3A', 'pedro.reyes@pupsmb.edu.ph', 'password789']
    ];

    // Combine headers and sample data
    const csvContent = [
        headers.join(','),
        ...sampleData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', 'student_batch_upload_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showAlert('Success', 'Template downloaded successfully! Fill in the student data and upload.', 'success');
}

// ============================================
// HANDLE FILE UPLOAD
// ============================================
document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('batchFileInput');

    if (fileInput) {
        fileInput.addEventListener('change', function (e) {
            const file = e.target.files[0];

            if (!file) return;

            // Show file name
            document.getElementById('fileName').style.display = 'block';
            document.getElementById('fileNameText').textContent = file.name;

            // Read and parse file
            const reader = new FileReader();

            reader.onload = function (event) {
                try {
                    const text = event.target.result;
                    parseCSV(text);
                } catch (error) {
                    console.error('Error reading file:', error);
                    showAlert('Error', 'Failed to read file. Please check the format.', 'error');
                }
            };

            reader.readAsText(file);
        });
    }
});

// ============================================
// PARSE CSV FILE
// ============================================
function parseCSV(text) {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

    batchStudentsData = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Parse CSV line (handles quotes)
        const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);

        if (!values || values.length < 7) continue;

        const student = {
            first_name: values[0].replace(/"/g, '').trim(),
            last_name: values[1].replace(/"/g, '').trim(),
            student_number: values[2].replace(/"/g, '').trim(),
            course: values[3].replace(/"/g, '').trim(),
            year: values[4].replace(/"/g, '').trim(),
            email: values[5].replace(/"/g, '').trim(),
            password: values[6].replace(/"/g, '').trim()
        };

        // Validate required fields
        if (student.first_name && student.last_name && student.student_number &&
            student.email && student.password) {
            batchStudentsData.push(student);
        }
    }

    if (batchStudentsData.length === 0) {
        showAlert('Error', 'No valid student data found in file.', 'error');
        return;
    }

    displayPreview();
}

// ============================================
// DISPLAY PREVIEW TABLE
// ============================================
function displayPreview() {
    const previewSection = document.getElementById('previewSection');
    const previewTable = document.getElementById('previewTable');
    const studentCount = document.getElementById('studentCount');

    studentCount.textContent = batchStudentsData.length;

    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Student Number</th>
                    <th>Course</th>
                    <th>Year</th>
                    <th>Email</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
    `;

    batchStudentsData.forEach((student, index) => {
        // Validate password
        const isValid = student.password.length >= 8;
        const statusBadge = isValid
            ? '<span style="color: green;">✓ Valid</span>'
            : '<span style="color: red;">✗ Weak Password</span>';

        tableHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${student.first_name} ${student.last_name}</td>
                <td>${student.student_number}</td>
                <td>${student.course}</td>
                <td>${student.year}</td>
                <td>${student.email}</td>
                <td>${statusBadge}</td>
            </tr>
        `;
    });

    tableHTML += '</tbody></table>';
    previewTable.innerHTML = tableHTML;
    previewSection.style.display = 'block';
}

// ============================================
// CONFIRM BATCH UPLOAD - FIXED VERSION
// ============================================
async function confirmBatchUpload() {
    if (batchStudentsData.length === 0) {
        showAlert('Error', 'No students to upload', 'error');
        return;
    }

    // Hide preview, show progress
    document.getElementById('previewSection').style.display = 'none';
    document.getElementById('uploadProgress').style.display = 'block';

    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    try {
        // Try batch upload first
        const response = await fetch(`${API_URL}/admin/allowed-students/batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ students: batchStudentsData })
        });

        // If batch endpoint returns 405, use individual upload
        if (response.status === 405) {
            console.log('⚠️ Batch endpoint not available (405). Uploading individually...');
            
            // Hide current progress, use individual upload
            document.getElementById('uploadProgress').style.display = 'none';
            await uploadIndividually(batchStudentsData, progressBar, progressText);
            return;
        }

        // Handle batch upload response
        const data = await response.json();

        if (data.success) {
            document.getElementById('uploadProgress').style.display = 'none';
            showAlert('Success', `Successfully uploaded ${batchStudentsData.length} students!`, 'success');
            await refreshStudentList();
            closeModal('addUserModal');
            resetBatchUpload();
        } else {
            throw new Error(data.message || 'Batch upload failed');
        }

    } catch (error) {
        console.error('Error in batch upload:', error);
        
        // If error, fall back to individual upload
        console.log('⚠️ Falling back to individual upload...');
        await uploadIndividually(batchStudentsData, progressBar, progressText);
    }
}

// ============================================
// UPLOAD INDIVIDUALLY - NEW FUNCTION
// ============================================
async function uploadIndividually(students, progressBar, progressText) {
    let successCount = 0;
    let failedCount = 0;
    const failedStudents = [];

    for (let i = 0; i < students.length; i++) {
        const student = students[i];

        try {
            const formData = {
                first_name: student.first_name,
                last_name: student.last_name,
                student_number: student.student_number,
                course: student.course,
                year: student.year,
                email: student.email,
                password: student.password,
                auto_registered: true
            };

            const response = await fetch(`${API_URL}/admin/allowed-students`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success || response.ok) {
                successCount++;
            } else {
                failedCount++;
                failedStudents.push({
                    name: `${student.first_name} ${student.last_name}`,
                    email: student.email,
                    reason: data.message || 'Unknown error'
                });
            }
        } catch (error) {
            failedCount++;
            failedStudents.push({
                name: `${student.first_name} ${student.last_name}`,
                email: student.email,
                reason: error.message
            });
        }

        // Update progress
        const progress = ((i + 1) / students.length) * 100;
        if (progressBar) {
            progressBar.style.width = progress + '%';
            progressBar.textContent = Math.round(progress) + '%';
        }
        if (progressText) {
            progressText.textContent = `${i + 1} / ${students.length} students processed`;
        }

        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Hide progress
    document.getElementById('uploadProgress').style.display = 'none';

    // Show results
    let resultMessage = `Batch Upload Complete!\n\n`;
    resultMessage += `✓ Successfully added: ${successCount} students\n`;

    if (failedCount > 0) {
        resultMessage += `✗ Failed: ${failedCount} students\n\n`;
        resultMessage += `Failed Students:\n`;
        failedStudents.forEach(student => {
            resultMessage += `- ${student.name} (${student.email}): ${student.reason}\n`;
        });
    }

    showAlert(
        failedCount === 0 ? 'Success' : 'Partial Success',
        resultMessage,
        failedCount === 0 ? 'success' : 'warning'
    );

    // Refresh student list
    await refreshStudentList();

    // Close modal
    closeModal('addUserModal');

    // Reset batch upload
    resetBatchUpload();
}

// ============================================
// CANCEL BATCH UPLOAD
// ============================================
function cancelBatchUpload() {
    showConfirm(
        'Cancel Upload',
        'Are you sure you want to cancel? All prepared data will be lost.',
        function () {
            resetBatchUpload();
        }
    );
}

// ============================================
// FORCE REFRESH STUDENT DATA
// ============================================
async function forceRefreshStudents() {
    console.log('🔄 Force refreshing student data from database...');

    // Clear cache
    sessionStorage.removeItem('cachedStudents');
    sessionStorage.removeItem('adminDataLoaded');

    // Reload from API
    if (typeof loadAllowedStudents === 'function') {
        await loadAllowedStudents();
    }

    showAlert('Success', 'Student data refreshed from database', 'success');
}

// ============================================
// RESET BATCH UPLOAD
// ============================================
function resetBatchUpload() {
    batchStudentsData = [];
    const fileInput = document.getElementById('batchFileInput');
    if (fileInput) {
        fileInput.value = '';
    }
    
    const fileName = document.getElementById('fileName');
    if (fileName) {
        fileName.style.display = 'none';
    }
    
    const previewSection = document.getElementById('previewSection');
    if (previewSection) {
        previewSection.style.display = 'none';
    }
    
    const uploadProgress = document.getElementById('uploadProgress');
    if (uploadProgress) {
        uploadProgress.style.display = 'none';
    }
    
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        progressBar.style.width = '0%';
        progressBar.textContent = '';
    }
}

// ============================================
// GENERATE RANDOM PASSWORD HELPER
// ============================================
function generateRandomPassword() {
    const length = 12;
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*';

    let password = '';

    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Fill the rest randomly
    const allChars = uppercase + lowercase + numbers + special;
    for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Export functions to window
window.switchAddUserTab = switchAddUserTab;
window.downloadTemplate = downloadTemplate;
window.confirmBatchUpload = confirmBatchUpload;
window.cancelBatchUpload = cancelBatchUpload;
window.forceRefreshStudents = forceRefreshStudents;