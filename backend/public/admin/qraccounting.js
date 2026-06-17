// ==============================================
// QRACCOUNTING.JS - QR Code Validation Module
// ==============================================
// This file handles all QR code validation functionality
// Compatible with Accounting Payment Settings Modal

console.log('🔧 [Accounting] QR Validation Module Loading...');

// ==============================================
// QR CODE VALIDATION WITH JSQR LIBRARY
// ==============================================

// Load jsQR library dynamically
function loadJsQRLibrary() {
    return new Promise((resolve, reject) => {
        if (window.jsQR) {
            console.log('✅ [Accounting] jsQR library already loaded');
            resolve();
            return;
        }

        console.log('📦 [Accounting] Loading jsQR library from CDN...');
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
        script.onload = () => {
            console.log('✅ [Accounting] jsQR library loaded successfully');
            resolve();
        };
        script.onerror = () => {
            console.error('❌ [Accounting] Failed to load jsQR library');
            reject(new Error('Failed to load QR scanner library'));
        };
        document.head.appendChild(script);
    });
}

// Main QR validation function
function validateQRCode(file) {
    return new Promise(async (resolve, reject) => {
        console.log('🔍 [Accounting] Starting QR validation for file:', file?.name);

        // Check if file exists
        if (!file) {
            reject('No file selected');
            return;
        }

        // Check file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            console.warn('❌ [Accounting] Invalid file type:', file.type);
            reject('Invalid file type. Please upload a valid image (JPEG, PNG, WEBP)');
            return;
        }

        // Check file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            console.warn('❌ [Accounting] File too large:', file.size, 'bytes');
            reject('File size too large. Maximum size is 5MB');
            return;
        }

        // Load jsQR library if not already loaded
        try {
            await loadJsQRLibrary();
        } catch (error) {
            reject('Failed to load QR validation library');
            return;
        }

        // Create image to validate
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                console.log('📐 [Accounting] Image dimensions:', img.width, 'x', img.height);

                // Check minimum dimensions (QR codes should be at least 100x100)
                if (img.width < 100 || img.height < 100) {
                    console.warn('❌ [Accounting] Image too small');
                    reject('Image too small. QR code must be at least 100x100 pixels');
                    return;
                }

                // Create canvas to process image
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                // Get image data
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                console.log('🔎 [Accounting] Scanning for QR code...');
                // Use jsQR to detect QR code
                const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });

                if (!qrCode) {
                    console.warn('❌ [Accounting] No QR code detected');
                    reject('No valid QR code detected in image. Please upload an image containing a QR code.');
                    return;
                }

                // QR code detected successfully
                console.log('✅ [Accounting] QR Code detected! Data:', qrCode.data);
                
                resolve({
                    valid: true,
                    dataUrl: e.target.result,
                    width: img.width,
                    height: img.height,
                    size: file.size,
                    qrData: qrCode.data,
                    qrLocation: qrCode.location
                });
            };

            img.onerror = function() {
                console.error('❌ [Accounting] Failed to load image');
                reject('Invalid image file. Unable to load image');
            };

            img.src = e.target.result;
        };

        reader.onerror = function() {
            console.error('❌ [Accounting] FileReader error');
            reject('Error reading file. Please try again');
        };

        reader.readAsDataURL(file);
    });
}

// ==============================================
// PAYMENT QR VALIDATION IN SETTINGS MODAL
// ==============================================

function setupPaymentQRValidation() {
    console.log('🎯 [Accounting] Setting up Payment QR validation...');
    
    // Look for the QR input in the payment settings form
    const qrInput = document.getElementById('paymentQR');
    if (!qrInput) {
        console.warn('⚠️ [Accounting] Payment QR input not found (id="paymentQR")');
        return;
    }

    console.log('✅ [Accounting] Found payment QR input');

    // Create validation message container if it doesn't exist
    let validationContainer = document.getElementById('qrValidationContainer');
    if (!validationContainer) {
        validationContainer = document.createElement('div');
        validationContainer.id = 'qrValidationContainer';
        validationContainer.style.marginTop = '10px';
        qrInput.parentElement.appendChild(validationContainer);
        console.log('✅ [Accounting] Created validation container');
    }

    // Create preview container if it doesn't exist
    let previewContainer = document.getElementById('qrPreviewInSettings');
    if (!previewContainer) {
        previewContainer = document.createElement('div');
        previewContainer.id = 'qrPreviewInSettings';
        previewContainer.style.display = 'none';
        previewContainer.style.marginTop = '15px';
        previewContainer.style.textAlign = 'center';
        qrInput.parentElement.appendChild(previewContainer);
        console.log('✅ [Accounting] Created preview container');
    }

    // Remove existing listeners to prevent duplicates
    const newQrInput = qrInput.cloneNode(true);
    qrInput.parentNode.replaceChild(newQrInput, qrInput);

    // Add change event listener
    newQrInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        
        console.log('📁 [Accounting] File selected:', file?.name);

        // Reset states
        validationContainer.innerHTML = '';
        previewContainer.style.display = 'none';
        previewContainer.innerHTML = '';

        if (!file) return;

        try {
            // Show loading
            validationContainer.innerHTML = `
                <div style="padding: 10px; background: #e0f2fe; color: #0369a1; border-radius: 8px; font-size: 0.9rem;">
                    <i class="fas fa-spinner fa-spin"></i> Validating QR code...
                </div>
            `;

            // Validate the QR code
            const result = await validateQRCode(file);

            // Show success message
            validationContainer.innerHTML = `
                <div style="padding: 10px; background: #dcfce7; color: #059669; border: 1px solid #86efac; border-radius: 8px; font-size: 0.9rem;">
                    <i class="fas fa-check-circle"></i> <strong>Valid QR code detected!</strong> 
                    <div style="margin-top: 5px; font-size: 0.85rem;">
                        QR Code Data: <code style="background: #fff; padding: 2px 6px; border-radius: 4px;">${result.qrData}</code>
                    </div>
                </div>
            `;

            // Show preview
            previewContainer.style.display = 'block';
            previewContainer.innerHTML = `
                <div style="padding: 15px; background: #f9fafb; border: 2px solid #059669; border-radius: 8px;">
                    <img src="${result.dataUrl}" alt="QR Preview" style="max-width: 100%; max-height: 200px; border-radius: 8px;" />
                    <div style="margin-top: 10px; font-size: 0.85rem; color: #666;">
                        <i class="fas fa-info-circle"></i>
                        <strong>Dimensions:</strong> ${result.width}x${result.height}px | 
                        <strong>Size:</strong> ${(result.size / 1024).toFixed(2)} KB
                    </div>
                </div>
            `;

            console.log('✅ [Accounting] QR validation successful');

        } catch (error) {
            console.error('❌ [Accounting] QR validation failed:', error);

            // Show error message
            validationContainer.innerHTML = `
                <div style="padding: 10px; background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; border-radius: 8px; font-size: 0.9rem;">
                    <i class="fas fa-exclamation-circle"></i> 
                    <strong>Invalid QR Code!</strong><br>
                    <span style="font-size: 0.85rem;">${error}</span>
                </div>
            `;

            // Clear the file input
            newQrInput.value = '';
        }
    });

    console.log('✅ [Accounting] QR validation setup complete');
}

// ==============================================
// UPLOAD QR MODAL (STANDALONE)
// ==============================================

function openUploadQRModal() {
    console.log('📤 [Accounting] Opening Upload QR Modal...');

    let modalHTML = `
        <div class="modal active" id="uploadQRModal" style="display: flex !important; z-index: 10000;">
            <div class="modal-content" style="max-width: 500px;">
                <span class="close-modal" onclick="closeUploadQRModal()">&times;</span>
                <h2 class="modal-title"><i class="fas fa-qrcode"></i> Upload Payment QR Code</h2>
                
                <form id="uploadQRForm" style="padding: 20px 0;">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">
                            QR Code Image <span style="color: #dc2626;">*</span>
                        </label>
                        <div style="position: relative;">
                            <input 
                                type="file" 
                                id="qrCodeInput" 
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                style="width: 100%; padding: 12px; border: 2px dashed #800020; border-radius: 8px; cursor: pointer; background: #fff;"
                                required
                            />
                        </div>
                        <small style="display: block; margin-top: 5px; color: #666;">
                            <i class="fas fa-info-circle"></i> Accepted formats: JPG, PNG, WEBP (Max 5MB)
                        </small>
                    </div>

                    <!-- Validation Message -->
                    <div id="qrValidationMessage" style="display: none; padding: 12px; border-radius: 8px; margin-bottom: 15px; font-size: 0.9rem;"></div>

                    <!-- Preview Container -->
                    <div id="qrPreviewContainer" style="display: none; margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">
                            <i class="fas fa-eye"></i> Preview:
                        </label>
                        <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px; border: 2px solid #059669;">
                            <img id="qrPreview" src="" alt="QR Preview" style="max-width: 100%; max-height: 300px; border-radius: 8px;" />
                        </div>
                        <div id="qrInfo" style="margin-top: 10px; font-size: 0.85rem; color: #666; text-align: center;"></div>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">
                            Payment Title
                        </label>
                        <input 
                            type="text" 
                            id="qrPaymentTitle" 
                            placeholder="e.g., Tuition Fee, Registration Fee"
                            style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;"
                        />
                    </div>

                    <div style="display: flex; gap: 15px; justify-content: center; padding-top: 15px; border-top: 1px solid #e5e5e5;">
                        <button type="submit" class="btn btn-primary" id="uploadQRBtn" disabled style="background: #800020; opacity: 0.5;">
                            <i class="fas fa-upload"></i> Upload QR Code
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="closeUploadQRModal()">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('uploadQRModal');
    if (existingModal) existingModal.remove();

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Add event listener for file input
    const qrInput = document.getElementById('qrCodeInput');
    const uploadBtn = document.getElementById('uploadQRBtn');
    const validationMsg = document.getElementById('qrValidationMessage');
    const previewContainer = document.getElementById('qrPreviewContainer');
    const qrPreview = document.getElementById('qrPreview');
    const qrInfo = document.getElementById('qrInfo');

    let validatedFile = null;

    qrInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        
        console.log('📁 [Accounting] File selected in upload modal:', file?.name);

        // Reset validation state
        validationMsg.style.display = 'none';
        previewContainer.style.display = 'none';
        uploadBtn.disabled = true;
        uploadBtn.style.opacity = '0.5';
        validatedFile = null;

        if (!file) return;

        try {
            // Show loading state
            validationMsg.style.display = 'block';
            validationMsg.style.background = '#e0f2fe';
            validationMsg.style.color = '#0369a1';
            validationMsg.style.border = '1px solid #bae6fd';
            validationMsg.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Validating QR code...';

            // Validate the QR code
            const result = await validateQRCode(file);

            // Show success message
            validationMsg.style.background = '#dcfce7';
            validationMsg.style.color = '#059669';
            validationMsg.style.border = '1px solid #86efac';
            validationMsg.innerHTML = '<i class="fas fa-check-circle"></i> <strong>Valid QR code detected!</strong> The image passed all validation checks.';

            // Show preview
            previewContainer.style.display = 'block';
            qrPreview.src = result.dataUrl;
            qrInfo.innerHTML = `
                <i class="fas fa-info-circle"></i>
                <strong>Dimensions:</strong> ${result.width}x${result.height}px | 
                <strong>Size:</strong> ${(result.size / 1024).toFixed(2)} KB
            `;

            // Enable upload button
            uploadBtn.disabled = false;
            uploadBtn.style.opacity = '1';
            validatedFile = file;

            console.log('✅ [Accounting] Upload modal QR validation successful');

        } catch (error) {
            console.error('❌ [Accounting] Upload modal QR validation failed:', error);

            // Show error message
            validationMsg.style.display = 'block';
            validationMsg.style.background = '#fee2e2';
            validationMsg.style.color = '#dc2626';
            validationMsg.style.border = '1px solid #fca5a5';
            validationMsg.innerHTML = `
                <i class="fas fa-exclamation-circle"></i> 
                <strong>Invalid QR Code!</strong><br>
                <span style="font-size: 0.85rem;">${error}</span>
            `;

            uploadBtn.disabled = true;
            uploadBtn.style.opacity = '0.5';
            validatedFile = null;
        }
    });

    // Handle form submission
    const form = document.getElementById('uploadQRForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        if (!validatedFile) {
            alert('⚠️ Please select a valid QR code image first!');
            return;
        }

        const paymentTitle = document.getElementById('qrPaymentTitle').value;

        // Here you would typically upload to your server
        console.log('💾 [Accounting] Uploading QR code:', {
            file: validatedFile.name,
            title: paymentTitle
        });

        alert(`✅ QR Code uploaded successfully!${paymentTitle ? '\n📝 Title: ' + paymentTitle : ''}`);
        
        closeUploadQRModal();
    });

    console.log('✅ [Accounting] Upload QR Modal opened');
}

function closeUploadQRModal() {
    console.log('❌ [Accounting] Closing Upload QR Modal...');
    const modal = document.getElementById('uploadQRModal');
    if (modal) modal.remove();
}

// ==============================================
// INITIALIZE QR VALIDATION
// ==============================================

// Auto-setup when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 [Accounting] Initializing QR Validation Module...');
    
    // Setup validation when opening payment settings modal
    const openPaymentSettingsBtn = document.getElementById('openPaymentSettings');
    if (openPaymentSettingsBtn) {
        console.log('✅ [Accounting] Found "Create Payment Requirement" button');
        
        // Listen for clicks on the button
        openPaymentSettingsBtn.addEventListener('click', function(e) {
            console.log('🎯 [Accounting] Payment Settings button clicked');
            
            // Give modal time to render, then setup validation
            setTimeout(() => {
                console.log('⏰ [Accounting] Setting up QR validation after modal render...');
                setupPaymentQRValidation();
            }, 200);
        });
        
        console.log('✅ [Accounting] Payment settings button listener added');
    } else {
        console.warn('⚠️ [Accounting] Payment Settings button not found (id="openPaymentSettings")');
    }

    console.log('✅ [Accounting] QR Validation Module initialized');
});

// ==============================================
// EXPORT FUNCTIONS FOR GLOBAL USE
// ==============================================

window.validateQRCodeAccounting = validateQRCode;
window.setupPaymentQRValidationAccounting = setupPaymentQRValidation;
window.openUploadQRModalAccounting = openUploadQRModal;
window.closeUploadQRModalAccounting = closeUploadQRModal;

console.log('✅ [Accounting] QR Validation Module loaded successfully');