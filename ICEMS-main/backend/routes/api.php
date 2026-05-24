<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClearanceController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PaymentController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AdminEventController;
use App\Http\Controllers\Api\AdminClearanceController;
use App\Http\Controllers\Api\AdminPaymentController;
use App\Http\Controllers\Api\StudentCouncilController;
use App\Http\Controllers\Api\OrganizationController;
use App\Http\Controllers\Api\NurseController;
use App\Http\Controllers\Api\LibraryController;
use App\Http\Controllers\Api\LaboratoryController;
use App\Http\Controllers\Api\GymnasiumController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\PaymentRequirementController;
use App\Http\Controllers\SuperAdminController;

// ── FIX: import the new controller ──────────────────────────────────────
use App\Http\Controllers\Api\AllowedStudentController;
use App\Http\Controllers\Api\AdminController;

/*
|--------------------------------------------------------------------------
| API Routes — Student Portal Backend
|--------------------------------------------------------------------------
*/

// ── Handle OPTIONS pre-flight requests ──────────────────────────────────
Route::options('{any}', fn() => response('', 200))->where('any', '.*');

// ════════════════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════════════════
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register']);
});

Route::get('students/{studentNumber}', [AuthController::class, 'show']);

// Password Reset
Route::prefix('password')->group(function () {
    Route::post('send-code', [AuthController::class, 'sendResetCode']);
    Route::post('verify-code', [AuthController::class, 'verifyCode']);
    Route::post('reset', [AuthController::class, 'resetPassword']);
});

// ════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ════════════════════════════════════════════════════════════════════════
Route::prefix('notifications')->group(function () {
    Route::post('send', [NotificationController::class, 'send']);
    Route::post('broadcast', [NotificationController::class, 'broadcast']);

    Route::prefix('{studentNumber}')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('unread-count', [NotificationController::class, 'unreadCount']);
        Route::get('summary', [NotificationController::class, 'summary']);
        Route::post('mark-all-read', [NotificationController::class, 'markAllRead']);
        Route::delete('clear-all', [NotificationController::class, 'clearAll']);
        Route::post('{id}/read', [NotificationController::class, 'markRead']);
        Route::delete('{id}', [NotificationController::class, 'destroy']);
    });
});

// ════════════════════════════════════════════════════════════════════════
// EVENTS
// ════════════════════════════════════════════════════════════════════════
Route::apiResource('events', EventController::class);

// ════════════════════════════════════════════════════════════════════════
// CLEARANCE — EVENT ATTENDANCE
// ════════════════════════════════════════════════════════════════════════
Route::prefix('clearance')->group(function () {
    Route::get('student/{email}', [ClearanceController::class, 'getStudentSubmissions']);
    Route::post('submit-proof', [ClearanceController::class, 'submitProof']);
    Route::post('{id}/review', [ClearanceController::class, 'reviewSubmission']);
});

// ════════════════════════════════════════════════════════════════════════
// CLEARANCE — GYMNASIUM
// ════════════════════════════════════════════════════════════════════════
Route::prefix('gymnasium')->group(function () {
    Route::get('clearance/{studentNumber}', [ClearanceController::class, 'getGymnasiumClearance']);
    Route::post('submit-clearance', [ClearanceController::class, 'submitGymnasiumClearance']);
    Route::post('clearance/{id}/review', [ClearanceController::class, 'reviewGymnasiumClearance']);
});

// ════════════════════════════════════════════════════════════════════════
// CLEARANCE — LABORATORY
// ════════════════════════════════════════════════════════════════════════
Route::prefix('laboratory')->group(function () {
    Route::get('clearance/{studentNumber}', [ClearanceController::class, 'getLaboratoryClearance']);
    Route::post('submit-clearance', [ClearanceController::class, 'submitLaboratoryClearance']);
    Route::post('clearance/{id}/review', [ClearanceController::class, 'reviewLaboratoryClearance']);
});

// ════════════════════════════════════════════════════════════════════════
// CLEARANCE — LIBRARY
// ════════════════════════════════════════════════════════════════════════
Route::prefix('library')->group(function () {
    Route::get('clearance/{studentNumber}', [ClearanceController::class, 'getLibraryClearance']);
    Route::post('submit-clearance', [ClearanceController::class, 'submitLibraryClearance']);
    Route::post('clearance/{id}/review', [ClearanceController::class, 'reviewLibraryClearance']);
});

// ════════════════════════════════════════════════════════════════════════
// CLEARANCE — NURSE
// ════════════════════════════════════════════════════════════════════════
Route::prefix('nurse')->group(function () {
    Route::get('questions', [ClearanceController::class, 'getHealthQuestions']);
    Route::get('clearance/{studentNumber}', [ClearanceController::class, 'getNurseClearance']);
    Route::post('submit-clearance', [ClearanceController::class, 'submitNurseClearance']);
    Route::post('clearance/{id}/review', [ClearanceController::class, 'reviewNurseClearance']);
});

// ════════════════════════════════════════════════════════════════════════
// PAYMENTS
// ════════════════════════════════════════════════════════════════════════
Route::prefix('payment-requirements')->group(function () {
    Route::get('/', [PaymentController::class, 'requirements']);
    Route::post('/', [PaymentController::class, 'storeRequirement']);
});

Route::prefix('payments')->group(function () {
    Route::post('/', [PaymentController::class, 'store']);
    Route::get('student/{studentNumber}', [PaymentController::class, 'studentPayments']);
    Route::post('{id}/verify', [PaymentController::class, 'verify']);
});

// ════════════════════════════════════════════════════════════════════════
// SSO — EVENTS
// ════════════════════════════════════════════════════════════════════════
Route::get('/events', [AdminEventController::class, 'index']);
Route::post('/events', [AdminEventController::class, 'store']);
Route::put('/events/{id}', [AdminEventController::class, 'update']);
Route::delete('/events/{id}', [AdminEventController::class, 'destroy']);

// ════════════════════════════════════════════════════════════════════════
// SSO — CLEARANCE SUBMISSIONS
// ════════════════════════════════════════════════════════════════════════
Route::get('/clearance/submissions', [AdminClearanceController::class, 'getSSOSubmissions']);
Route::put('/clearance/submissions/{id}/status', [AdminClearanceController::class, 'updateSSOStatus']);

// ════════════════════════════════════════════════════════════════════════
// STUDENTS (existing)
// ════════════════════════════════════════════════════════════════════════
Route::get('/students', [StudentController::class, 'index']);

// ════════════════════════════════════════════════════════════════════════
// FIX 1: ALLOWED STUDENTS — was completely missing, caused 405 errors
// ════════════════════════════════════════════════════════════════════════
Route::prefix('admin/allowed-students')->group(function () {
    Route::get('/', [AllowedStudentController::class, 'index']);    // GET  /api/admin/allowed-students
    Route::post('/', [AllowedStudentController::class, 'store']);    // POST /api/admin/allowed-students
    Route::put('/{id}', [AllowedStudentController::class, 'update']);   // PUT  /api/admin/allowed-students/{id}
    Route::delete('/{id}', [AllowedStudentController::class, 'destroy']);  // DELETE /api/admin/allowed-students/{id}

    // Batch upload
    Route::post('/batch', [AllowedStudentController::class, 'batch']);    // POST /api/admin/allowed-students/batch
});

// ════════════════════════════════════════════════════════════════════════
// FIX 2: ADMIN LIST — was completely missing, caused 405 errors
// ════════════════════════════════════════════════════════════════════════
Route::get('/admin/admins', [AdminController::class, 'index']);             // GET  /api/admin/admins

// Send passwords to students
Route::post('/admin/send-password', [AllowedStudentController::class, 'sendPassword']);
Route::post('/admin/send-passwords-batch', [AllowedStudentController::class, 'sendPasswordsBatch']);

// ════════════════════════════════════════════════════════════════════════
// PAYMENT REQUIREMENTS
// ════════════════════════════════════════════════════════════════════════
Route::get('/payment-requirements', [PaymentRequirementController::class, 'index']);
Route::post('/payment-requirements', [PaymentRequirementController::class, 'store']);
Route::get('/payment-requirements/{id}', [PaymentRequirementController::class, 'show']);
Route::delete('/payment-requirements/{id}', [PaymentRequirementController::class, 'destroy']);

// ════════════════════════════════════════════════════════════════════════
// PAYMENTS (admin)
// ════════════════════════════════════════════════════════════════════════
Route::get('/payments', [AdminPaymentController::class, 'index']);
Route::post('/payments', [AdminPaymentController::class, 'store']);
Route::put('/payments/{id}/verify', [AdminPaymentController::class, 'verify']);
Route::get('/payments/student/{studentNumber}', [AdminPaymentController::class, 'studentHistory']);

// ════════════════════════════════════════════════════════════════════════
// STUDENT COUNCILS
// ════════════════════════════════════════════════════════════════════════
Route::get('/student-councils', [StudentCouncilController::class, 'index']);
Route::post('/student-councils', [StudentCouncilController::class, 'store']);
Route::get('/student-councils/{id}', [StudentCouncilController::class, 'show']);
Route::put('/student-councils/{id}', [StudentCouncilController::class, 'update']);
Route::delete('/student-councils/{id}', [StudentCouncilController::class, 'destroy']);
Route::get('/student-councils/{id}/events', [StudentCouncilController::class, 'getEvents']);
Route::post('/student-councils/{id}/events', [StudentCouncilController::class, 'createEvent']);
Route::put('/student-councils/{id}/events/{eventId}', [StudentCouncilController::class, 'updateEvent']);
Route::delete('/student-councils/{id}/events/{eventId}', [StudentCouncilController::class, 'deleteEvent']);
Route::get('/student-councils/{id}/clearances', [StudentCouncilController::class, 'getClearances']);
Route::put('/student-councils/{id}/clearances/{clearanceId}/status', [StudentCouncilController::class, 'updateClearanceStatus']);
Route::get('/student-councils/{id}/payments', [StudentCouncilController::class, 'getPayments']);
Route::post('/student-councils/{id}/payments/{paymentId}/verify', [StudentCouncilController::class, 'verifyPayment']);

// ════════════════════════════════════════════════════════════════════════
// ORGANIZATIONS
// ════════════════════════════════════════════════════════════════════════
Route::get('/organizations', [OrganizationController::class, 'index']);
Route::post('/organizations', [OrganizationController::class, 'store']);
Route::get('/organizations/{id}', [OrganizationController::class, 'show']);
Route::put('/organizations/{id}', [OrganizationController::class, 'update']);
Route::delete('/organizations/{id}', [OrganizationController::class, 'destroy']);
Route::get('/organizations/{id}/events', [OrganizationController::class, 'getEvents']);
Route::post('/organizations/{id}/events', [OrganizationController::class, 'createEvent']);
Route::put('/organizations/{id}/events/{eventId}', [OrganizationController::class, 'updateEvent']);
Route::delete('/organizations/{id}/events/{eventId}', [OrganizationController::class, 'deleteEvent']);
Route::get('/organizations/{id}/clearances', [OrganizationController::class, 'getClearances']);

// ════════════════════════════════════════════════════════════════════════
// NURSE
// ════════════════════════════════════════════════════════════════════════
Route::get('/nurse/all-clearances', [NurseController::class, 'getAllClearances']);
Route::post('/nurse/update-status', [NurseController::class, 'updateStatus']);
Route::get('/nurse/questions', [NurseController::class, 'getQuestions']);
Route::post('/nurse/questions', [NurseController::class, 'createQuestion']);
Route::put('/nurse/questions/{id}', [NurseController::class, 'updateQuestion']);
Route::delete('/nurse/questions/{id}', [NurseController::class, 'deleteQuestion']);

// ════════════════════════════════════════════════════════════════════════
// LIBRARY
// ════════════════════════════════════════════════════════════════════════
Route::get('/library/all-clearances', [LibraryController::class, 'getAllClearances']);
Route::post('/library/update-status', [LibraryController::class, 'updateStatus']);

// ════════════════════════════════════════════════════════════════════════
// FIX 3: LABORATORY — was /laboratory/clearances, frontend calls /laboratory/all-clearances
// ════════════════════════════════════════════════════════════════════════
Route::get('/laboratory/all-clearances', [LaboratoryController::class, 'getAllClearances']); // FIX: added alias
Route::get('/laboratory/clearances', [LaboratoryController::class, 'getAllClearances']); // keep original too
Route::post('/laboratory/update-status', [LaboratoryController::class, 'updateStatus']);

// ════════════════════════════════════════════════════════════════════════
// GYMNASIUM
// ════════════════════════════════════════════════════════════════════════
Route::get('/gymnasium/clearances', [GymnasiumController::class, 'getAllClearances']);
Route::post('/gymnasium/update-clearance', [GymnasiumController::class, 'updateClearance']);

// ════════════════════════════════════════════════════════════════════════
// SUPER ADMIN
// ════════════════════════════════════════════════════════════════════════
Route::post('/super-admin/login', [SuperAdminController::class, 'login']);
Route::post('/super-admin/logout', [SuperAdminController::class, 'logout']);
Route::get('/super-admin/check-session', [SuperAdminController::class, 'checkSession']);

Route::middleware('super.admin.auth')->group(function () {
    Route::get('/super-admin/stats', [SuperAdminController::class, 'getDashboardStats']);
    Route::get('/super-admin/admins', [SuperAdminController::class, 'getAdmins']);
    Route::post('/admin/reset-password', [SuperAdminController::class, 'resetAdminPassword']);
    Route::post('/super-admin/change-password', [SuperAdminController::class, 'changeOwnPassword']);
    Route::post('/admin/log-action', [SuperAdminController::class, 'logAction']);
    Route::get('/super-admin/audit-trails', [SuperAdminController::class, 'getAuditTrails']);
    Route::get('/super-admin/activity-logs', [SuperAdminController::class, 'getActivityLogs']);
});