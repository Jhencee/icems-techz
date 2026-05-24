// ============================================
// LIBRARY CLEARANCE MODULE
// Handles all library book clearance functionality
// ============================================

let libraryBookCounter = 0;
let libraryStatusCache = new Map();
let libPendingRequests = new Map();

// ============================================
// CLEAR LIBRARY CACHE
// ============================================
function clearLibraryCache(studentNumber = null) {
    if (studentNumber) {
        libraryStatusCache.delete(studentNumber);
    } else {
        libraryStatusCache.clear();
    }
}

// ============================================
// FETCH LIBRARY CLEARANCE STATUS
// ============================================
async function fetchLibraryClearanceStatus(studentNumber, forceRefresh = false) {
    if (!forceRefresh && libraryStatusCache.has(studentNumber)) {
        console.log('📦 Using cached library status for:', studentNumber);
        return libraryStatusCache.get(studentNumber);
    }

    if (libPendingRequests.has(studentNumber)) {
        console.log('⏳ Waiting for existing request for:', studentNumber);
        return await libPendingRequests.get(studentNumber);
    }

    const requestPromise = (async () => {
        let result;
        
        try {
            const response = await fetch(`${window.API_URL}/api/library/clearance/${studentNumber}`);
            const data = await response.json();

            if (response.ok && data.success) {
                if (data.exists && data.clearance) {
                    console.log('✅ Library clearance found:', data.clearance.status);
                    result = {
                        status: data.clearance.status,
                        remarks: data.clearance.remarks || '',
                        exists: true
                    };
                } else {
                    console.log('ℹ️ No library clearance submitted yet');
                    result = {
                        status: 'not_submitted',
                        remarks: '',
                        exists: false
                    };
                }
            } else {
                console.log('ℹ️ Unexpected response, treating as not submitted');
                result = {
                    status: 'not_submitted',
                    remarks: '',
                    exists: false
                };
            }

        } catch (error) {
            console.log('ℹ️ Could not fetch clearance status (network error)');
            result = {
                status: 'not_submitted',
                remarks: '',
                exists: false
            };
        } finally {
            libraryStatusCache.set(studentNumber, result);
            libPendingRequests.delete(studentNumber);
        }
        
        return result;
    })();

    libPendingRequests.set(studentNumber, requestPromise);
    return await requestPromise;
}

// ============================================
// ADD LIBRARY CLEARANCE CARD TO PAGE
// ============================================
async function addLibraryClearanceCard() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    const libStatus = await fetchLibraryClearanceStatus(currentUser.student_number);
    
    let statusClass = 'required';
    let statusText = 'Required';
    let statusIcon = 'fa-circle-exclamation';
    
    if (libStatus.status === 'approved') {
        statusClass = 'completed';
        statusText = 'Completed';
        statusIcon = 'fa-circle-check';
    } else if (libStatus.status === 'pending') {
        statusClass = 'pending';
        statusText = 'Pending';
        statusIcon = 'fa-hourglass-half';
    } else if (libStatus.status === 'rejected') {
        statusClass = 'required';
        statusText = 'Rejected';
        statusIcon = 'fa-circle-xmark';
    }

    const libCardHTML = `
        <div class="clearance-card ${statusClass}" data-status="${statusClass}">
            <div class="clearance-header">
                <div class="clearance-title">
                    <i class="fas fa-book"></i> Library Clearance
                </div>
                <span class="clearance-status ${statusClass}">
                    <i class="fas ${statusIcon}"></i> ${statusText}
                </span>
            </div>
            <div class="clearance-details">
                Complete all library book clearance requirements
            </div>
            ${libStatus.remarks ? `
                <div class="clearance-remarks" style="margin: 10px 0; padding: 10px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                    <strong style="color: #92400e;">Remarks:</strong> <span style="color: #78350f;">${libStatus.remarks}</span>
                </div>
            ` : ''}
            <div class="clearance-requirements">
                <h4>Requirements:</h4>
                <ul class="requirement-list">
                    <li class="requirement-item">Return all borrowed library books</li>
                    <li class="requirement-item">Submit proof of book return</li>
                    <li class="requirement-item">Clear any overdue book charges</li>
                </ul>
            </div>
            <div class="clearance-actions">
                ${libStatus.status === 'not_submitted' || libStatus.status === 'rejected' ? `
                    <button class="btn btn-primary" onclick="submitLibraryClearance()">
                        <i class="fas fa-paper-plane"></i> Submit Clearance
                    </button>
                ` : libStatus.status === 'pending' ? `
                    <button class="btn btn-secondary" disabled>
                        <i class="fas fa-hourglass-half"></i> Pending Approval
                    </button>
                ` : `
                    <button class="btn btn-success" disabled style="background: #10b981; cursor: not-allowed;">
                        <i class="fas fa-check-circle"></i> Approved
                    </button>
                `}
            </div>
        </div>
    `;

    const container = document.getElementById('clearanceContainer');
    if (container) {
        container.insertAdjacentHTML('beforeend', libCardHTML);
    }

    updateClearanceStats();
}

// ============================================
// SUBMIT LIBRARY CLEARANCE MODAL
// ============================================
function submitLibraryClearance() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    const modalHTML = `
        <div class="modal active" id="libClearanceModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; justify-content: center; align-items: center;">
            <div class="modal-content" style="background: white; border-radius: 12px; padding: 30px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto; position: relative;">
                <span onclick="closeLibraryModal()" style="position: absolute; top: 15px; right: 20px; font-size: 2rem; cursor: pointer; color: #666; line-height: 1;">&times;</span>
                
                <h2 style="color: #800020; margin-bottom: 20px;">
                    <i class="fas fa-book"></i> Library Book Clearance
                </h2>
                
                <p style="color: #666; margin-bottom: 20px;">
                    Please select how you want to process your library clearance.
                </p>
                
                <form id="libClearanceForm" onsubmit="handleLibrarySubmit(event)">
                    <!-- Clearance Type Selection -->
                    <div style="margin-bottom: 25px; padding: 15px; background: #f0f9ff; border-radius: 8px; border: 2px solid #0ea5e9;">
                        <label style="display: block; font-weight: 600; margin-bottom: 12px; color: #0c4a6e;">
                            <i class="fas fa-route"></i> Choose Clearance Method *
                        </label>
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <label style="display: flex; align-items: start; cursor: pointer; padding: 12px; background: white; border-radius: 6px; border: 2px solid #e0e0e0; transition: all 0.2s;">
                                <input type="radio" name="clearanceType" value="online" onchange="toggleLibraryClearanceMethod('online')" checked style="margin-right: 10px; margin-top: 4px;">
                                <div>
                                    <strong style="display: block; color: #800020;">📤 Submit Online</strong>
                                    <span style="font-size: 0.85rem; color: #666;">Upload documents and submit clearance online</span>
                                </div>
                            </label>
                            <label style="display: flex; align-items: start; cursor: pointer; padding: 12px; background: white; border-radius: 6px; border: 2px solid #e0e0e0; transition: all 0.2s;">
                                <input type="radio" name="clearanceType" value="direct_visit" onchange="toggleLibraryClearanceMethod('direct_visit')" style="margin-right: 10px; margin-top: 4px;">
                                <div>
                                    <strong style="display: block; color: #800020;">🏢 Direct Library Visit</strong>
                                    <span style="font-size: 0.85rem; color: #666;">Visit the library in person for consultation/clearance</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <!-- Direct Visit Message -->
                    <div id="directVisitMessageLib" style="display: none; margin-bottom: 20px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px;">
                        <p style="margin: 0; color: #78350f; font-weight: 600;">
                            <i class="fas fa-info-circle"></i> Please visit the library during operating hours:
                        </p>
                        <ul style="margin: 10px 0 0 20px; color: #78350f;">
                            <li>Monday to Friday: 8:00 AM - 5:00 PM</li>
                            <li>Bring Student ID and any required documents</li>
                            <li>Location: University Library, 2nd Floor</li>
                        </ul>
                    </div>

                    <!-- Online Submission Form -->
                    <div id="onlineSubmissionFormLib">
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; font-weight: 600; margin-bottom: 8px;">
                                <i class="fas fa-book-open"></i> Did you borrow any library books?
                            </label>
                            <div style="display: flex; gap: 15px;">
                                <label style="display: flex; align-items: center; cursor: pointer;">
                                    <input type="radio" name="borrowedBooks" value="yes" onchange="toggleLibraryBookDetails(true)" style="margin-right: 8px;">
                                    <span>Yes</span>
                                </label>
                                <label style="display: flex; align-items: center; cursor: pointer;">
                                    <input type="radio" name="borrowedBooks" value="no" onchange="toggleLibraryBookDetails(false)" checked style="margin-right: 8px;">
                                    <span>No</span>
                                </label>
                            </div>
                        </div>

                        <div id="libraryBookDetailsSection" style="display: none; background: #f9fafb; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                            <h3 style="color: #800020; margin-bottom: 15px; font-size: 1rem;">
                                <i class="fas fa-clipboard-list"></i> Book Details
                            </h3>
                            
                            <div id="libraryBookList"></div>
                            
                            <button type="button" onclick="addLibraryBookItem()" class="btn btn-secondary" style="margin-top: 10px; padding: 8px 15px; font-size: 0.9rem;">
                                <i class="fas fa-plus"></i> Add Book
                            </button>
                        </div>
                        
                        <div id="libProofSection" style="margin-bottom: 20px;">
                            <label style="display: block; font-weight: 600; margin-bottom: 8px;">
                                Upload Proof (Optional)
                                <span id="libProofRequired" style="display: none; color: #dc2626;">*</span>
                            </label>
                            <input type="file" id="libProofFile" accept="image/*,.pdf" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;">
                            <p style="font-size: 0.85rem; color: #666; margin-top: 5px;">Accepted: Images (JPG, PNG) or PDF</p>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; font-weight: 600; margin-bottom: 8px;">Additional Notes (Optional)</label>
                            <textarea id="libNotes" rows="3" placeholder="Any additional information..." style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; resize: vertical;"></textarea>
                        </div>
                        
                        <button type="submit" class="btn btn-primary" style="width: 100%; padding: 15px;">
                            <i class="fas fa-paper-plane"></i> <span id="submitBtnTextLib">Submit Clearance</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// ============================================
// TOGGLE LIBRARY CLEARANCE METHOD
// ============================================
function toggleLibraryClearanceMethod(method) {
    const onlineForm = document.getElementById('onlineSubmissionFormLib');
    const directMessage = document.getElementById('directVisitMessageLib');
    const submitBtnText = document.getElementById('submitBtnTextLib');

    if (method === 'direct_visit') {
        onlineForm.style.display = 'none';
        directMessage.style.display = 'block';
        submitBtnText.textContent = 'Request Direct Visit';
    } else {
        onlineForm.style.display = 'block';
        directMessage.style.display = 'none';
        submitBtnText.textContent = 'Submit Clearance';
    }
}

// ============================================
// CLOSE LIBRARY MODAL
// ============================================
function closeLibraryModal() {
    const modal = document.getElementById('libClearanceModal');
    if (modal) modal.remove();
}

// ============================================
// TOGGLE BOOK DETAILS SECTION
// ============================================
function toggleLibraryBookDetails(show) {
    const bookSection = document.getElementById('libraryBookDetailsSection');
    const proofRequired = document.getElementById('libProofRequired');
    const proofFile = document.getElementById('libProofFile');

    if (show) {
        bookSection.style.display = 'block';
        proofRequired.style.display = 'inline';
        proofFile.required = true;
    } else {
        bookSection.style.display = 'none';
        proofRequired.style.display = 'none';
        proofFile.required = false;
        document.getElementById('libraryBookList').innerHTML = '';
    }
}

// ============================================
// ADD BOOK ITEM
// ============================================
function addLibraryBookItem() {
    const bookList = document.getElementById('libraryBookList');
    const itemId = libraryBookCounter++;

    const itemHTML = `
        <div class="library-book-item" id="library_book_${itemId}" style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 2px solid #e0e0e0; position: relative;">
            <button type="button" onclick="removeLibraryBookItem(${itemId})" style="position: absolute; top: 10px; right: 10px; background: #dc2626; color: white; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer; font-size: 0.9rem;">×</button>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; font-weight: 600; margin-bottom: 5px; font-size: 0.9rem;">Book Title *</label>
                <input type="text" class="library-book-title" required placeholder="Enter book title" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; font-weight: 600; margin-bottom: 5px; font-size: 0.9rem;">Author</label>
                <input type="text" class="library-book-author" placeholder="Enter author name" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; font-weight: 600; margin-bottom: 5px; font-size: 0.9rem;">ISBN/Book Number</label>
                <input type="text" class="library-book-isbn" placeholder="Enter ISBN or book number" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; font-weight: 600; margin-bottom: 5px; font-size: 0.9rem;">Date Borrowed *</label>
                <input type="date" class="library-book-borrow-date" required style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; font-weight: 600; margin-bottom: 5px; font-size: 0.9rem;">Date Returned *</label>
                <input type="date" class="library-book-return-date" required style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
            </div>
            
            <div>
                <label style="display: block; font-weight: 600; margin-bottom: 5px; font-size: 0.9rem;">Return Status *</label>
                <select class="library-book-status" required style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                    <option value="">Select status</option>
                    <option value="returned_on_time">Returned on Time</option>
                    <option value="returned_late">Returned Late</option>
                    <option value="returned_damaged">Returned with Damage</option>
                    <option value="not_returned">Not Yet Returned</option>
                </select>
            </div>
        </div>
    `;

    bookList.insertAdjacentHTML('beforeend', itemHTML);
}

// ============================================
// REMOVE BOOK ITEM
// ============================================
function removeLibraryBookItem(itemId) {
    const item = document.getElementById(`library_book_${itemId}`);
    if (item) item.remove();
}

// ============================================
// HANDLE LIBRARY CLEARANCE SUBMISSION
// ============================================
async function handleLibrarySubmit(e) {
    e.preventDefault();

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const clearanceType = document.querySelector('input[name="clearanceType"]:checked').value;

    if (!currentUser) {
        alert('Please log in to submit clearance');
        return;
    }

    // Handle Direct Visit Request
    if (clearanceType === 'direct_visit') {
        const confirmed = confirm('Are you sure you want to request a direct library visit?\n\nYou will need to visit the library in person.');
        if (!confirmed) return;

        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

        try {
            const response = await fetch(`${window.API_URL}/api/library/submit-clearance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    student_id: currentUser.student_number,
                    student_name: `${currentUser.first_name} ${currentUser.last_name}`,
                    student_email: currentUser.email,
                    section: `${currentUser.year}-${currentUser.section}`,
                    borrowed_books: false,
                    book_items: [],
                    proof_image: null,
                    notes: 'Student requested direct library visit for consultation',
                    submitted_at: new Date().toISOString()
                })
            });

            const data = await response.json();

            if (data.success) {
                alert('✅ Direct visit request submitted successfully!\n\nPlease visit the library during operating hours:\nMonday to Friday: 8:00 AM - 5:00 PM\nLocation: University Library, 2nd Floor');
                closeLibraryModal();
                clearLibraryCache(currentUser.student_number);
                location.reload();
            } else {
                alert('❌ ' + (data.message || 'Failed to submit request'));
            }
        } catch (error) {
            console.error('Error submitting direct visit request:', error);
            alert('❌ Failed to submit request. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
        return;
    }

    // Handle Online Submission
    const fileInput = document.getElementById('libProofFile');
    const notesInput = document.getElementById('libNotes');
    const borrowedBooks = document.querySelector('input[name="borrowedBooks"]:checked').value;

    let bookData = [];
    if (borrowedBooks === 'yes') {
        const bookItems = document.querySelectorAll('.library-book-item');

        if (bookItems.length === 0) {
            alert('Please add at least one book item or select "No" if you did not borrow any books.');
            return;
        }

        for (let item of bookItems) {
            const title = item.querySelector('.library-book-title').value;
            const author = item.querySelector('.library-book-author').value;
            const isbn = item.querySelector('.library-book-isbn').value;
            const borrowDate = item.querySelector('.library-book-borrow-date').value;
            const returnDate = item.querySelector('.library-book-return-date').value;
            const status = item.querySelector('.library-book-status').value;

            if (!title || !borrowDate || !returnDate || !status) {
                alert('Please fill in all required fields for each book item.');
                return;
            }

            bookData.push({
                title: title,
                author: author,
                isbn: isbn,
                date_borrowed: borrowDate,
                date_returned: returnDate,
                status: status
            });
        }

        if (fileInput.files.length === 0) {
            alert('Please upload proof of book return.');
            return;
        }
    }

    const confirmed = confirm('Are you sure you want to submit your Library Clearance?\n\nThis action cannot be undone.');
    if (!confirmed) return;

    const notes = notesInput.value.trim();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

    try {
        let base64Image = null;
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            base64Image = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }

        const response = await fetch(`${window.API_URL}/api/library/submit-clearance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                student_id: currentUser.student_number,
                student_name: `${currentUser.first_name} ${currentUser.last_name}`,
                student_email: currentUser.email,
                section: `${currentUser.year}-${currentUser.section}`,
                borrowed_books: borrowedBooks === 'yes',
                book_items: bookData,
                proof_image: base64Image,
                notes: notes,
                submitted_at: new Date().toISOString()
            })
        });

        const data = await response.json();

        if (data.success) {
            alert('✅ Library clearance submitted successfully!\n\nYour submission is pending admin approval.');
            closeLibraryModal();
            clearLibraryCache(currentUser.student_number);
            location.reload();
        } else {
            alert('❌ ' + (data.message || 'Failed to submit clearance'));
        }

    } catch (error) {
        console.error('Error submitting library clearance:', error);
        alert('❌ Failed to submit clearance. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📚 Library module: DOMContentLoaded fired');
    console.log('📚 Current path:', window.location.pathname);
    
    if (window.location.pathname.includes('studentclearance.html')) {
        console.log('📚 Loading library clearance card...');
        await addLibraryClearanceCard();
        console.log('📚 Library clearance card loaded');
    } else {
        console.log('📚 Not on clearance page, skipping');
    }
});