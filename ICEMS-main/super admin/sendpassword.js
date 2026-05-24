// ============================================
// SEND PASSWORD MODAL FUNCTIONS
// ============================================

function sendAllPasswords() {
    openModal('sendPasswordOptionsModal');
}

function selectSendMethod(method) {
    closeModal('sendPasswordOptionsModal');

    if (method === 'single') {
        openSendSinglePasswordModal();
    } else if (method === 'batch') {
        openSendBatchPasswordModal();
    }
}

// ============================================
// SEND SINGLE PASSWORD
// ============================================
function openSendSinglePasswordModal() {
    // Clear the email input
    const emailInput = document.getElementById('singlePasswordEmail');
    if (emailInput) {
        emailInput.value = '';
    }

    openModal('sendSinglePasswordModal');
}

async function sendSinglePassword() {
    const emailInput = document.getElementById('singlePasswordEmail');
    const email = emailInput.value.trim();

    if (!email) {
        showAlert('Error', 'Please enter an email address', 'error');
        return;
    }

    // DEBUG: Log the allowedStudents array
    console.log('🔍 All students:', allowedStudents);

    // Find student by email from the global allowedStudents array
    const student = allowedStudents.find(s =>
        s.email.toLowerCase() === email.toLowerCase()
    );

    // DEBUG: Log the found student
    console.log('🔍 Found student:', student);

    if (!student) {
        showAlert('Error', 'No student found with this email address', 'error');
        return;
    }

    // Prepare payload
    const payload = {
        student_id: student.id,
        email: email,
        student_name: `${student.first_name} ${student.last_name}`,
        student_number: student.student_number
    };

    // DEBUG: Log what we're about to send
    console.log('📤 Sending payload:', payload);

    // Show loading state
    const sendBtn = event.target;
    const originalText = sendBtn.innerHTML;
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    sendBtn.disabled = true;

    try {
        const response = await fetch(`${API_URL}/admin/send-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        // DEBUG: Log the response
        console.log('📥 Response status:', response.status);
        
        const data = await response.json();
        console.log('📥 Response data:', data);

        if (response.ok && data.success) {
            closeModal('sendSinglePasswordModal');
            showAlert('Success', `Password sent successfully to ${email}`, 'success');
            emailInput.value = '';
        } else {
            // Show detailed error message
            const errorMsg = data.message || 'Failed to send password';
            let errorDetails = '';
            
            if (data.errors) {
                errorDetails = Object.values(data.errors).flat().join('\n');
            }
            
            console.error('❌ Error:', errorMsg, errorDetails);
            showAlert('Error', errorMsg + (errorDetails ? '\n' + errorDetails : ''), 'error');
        }
    } catch (error) {
        console.error('❌ Network error:', error);
        showAlert('Error', 'Network error: ' + error.message, 'error');
    } finally {
        sendBtn.innerHTML = originalText;
        sendBtn.disabled = false;
    }
}

// ============================================
// SEND BATCH PASSWORDS
// ============================================
function openSendBatchPasswordModal() {
    const tbody = document.getElementById('batchPasswordTableBody');

    if (tbody) {
        tbody.innerHTML = '';

        // Show all students from the global allowedStudents array
        if (!allowedStudents || allowedStudents.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px;">
                        <i class="fas fa-inbox" style="font-size: 48px; color: #ccc; display: block; margin-bottom: 10px;"></i>
                        No students found
                    </td>
                </tr>
            `;
        } else {
            allowedStudents.forEach(student => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">
                        <input type="checkbox" 
                               class="student-checkbox" 
                               data-student-id="${student.id}" 
                               checked>
                    </td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${student.first_name} ${student.last_name}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${student.student_number}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${student.email}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">
                        <input type="email" 
                               class="email-input" 
                               data-student-id="${student.id}"
                               value="${student.email}"
                               placeholder="Enter email"
                               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    }

    openModal('sendBatchPasswordModal');
}

function toggleAllStudents() {
    const selectAllCheckbox = document.getElementById('selectAllStudents');
    const checkboxes = document.querySelectorAll('.student-checkbox');

    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });
}

async function sendBatchPasswords() {
    const checkboxes = document.querySelectorAll('.student-checkbox:checked');

    if (checkboxes.length === 0) {
        showAlert('Error', 'Please select at least one student', 'error');
        return;
    }

    // Collect selected students and their emails
    const selectedStudents = [];

    for (const checkbox of checkboxes) {
        const studentId = checkbox.getAttribute('data-student-id');
        const emailInput = document.querySelector(`.email-input[data-student-id="${studentId}"]`);
        const email = emailInput.value.trim();

        if (!email) {
            showAlert('Error', `Please enter email for all selected students`, 'error');
            return;
        }

        const student = allowedStudents.find(s => s.id == studentId);
        if (student) {
            selectedStudents.push({
                student_id: student.id,
                email: email,
                student_name: `${student.first_name} ${student.last_name}`,
                student_number: student.student_number
            });
        }
    }

    // DEBUG: Log what we're sending
    console.log('📤 Sending batch payload:', { students: selectedStudents });

    // Show loading state
    const sendBtn = event.target;
    const originalText = sendBtn.innerHTML;
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    sendBtn.disabled = true;

    try {
        const response = await fetch(`${API_URL}/admin/send-passwords-batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                students: selectedStudents
            })
        });

        // DEBUG: Log response
        console.log('📥 Batch response status:', response.status);

        const data = await response.json();
        console.log('📥 Batch response data:', data);

        if (response.ok && data.success) {
            closeModal('sendBatchPasswordModal');
            
            let message = `Passwords sent successfully to ${data.sent_count || selectedStudents.length} students`;
            
            if (data.failed_count > 0) {
                message += `\nFailed: ${data.failed_count} students`;
                if (data.failed_emails && data.failed_emails.length > 0) {
                    message += `\n${data.failed_emails.join(', ')}`;
                }
            }
            
            showAlert('Success', message, 'success');
        } else {
            const errorMsg = data.message || 'Failed to send passwords';
            let errorDetails = '';
            
            if (data.errors) {
                errorDetails = Object.values(data.errors).flat().join('\n');
            }
            
            console.error('❌ Batch error:', errorMsg, errorDetails);
            showAlert('Error', errorMsg + (errorDetails ? '\n' + errorDetails : ''), 'error');
        }
    } catch (error) {
        console.error('❌ Batch network error:', error);
        showAlert('Error', 'Network error: ' + error.message, 'error');
    } finally {
        sendBtn.innerHTML = originalText;
        sendBtn.disabled = false;
    }
}

// ============================================
// INITIALIZE
// ============================================
console.log('✅ sendpassword.js loaded successfully');