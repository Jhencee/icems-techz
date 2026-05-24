<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\SuperAdmin;
use App\Models\AuditTrail;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Session;

class SuperAdminController extends Controller
{
    // =============================================
    // LOGIN
    // =============================================

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $superAdmin = SuperAdmin::where('email', $request->email)->first();

        if (!$superAdmin || !Hash::check($request->password, $superAdmin->password)) {
            // Log failed attempt
            $this->logActivity('Super Admin', 'Super Admin', 'Failed Login', 'Invalid credentials for: ' . $request->email, $request->ip());

            return response()->json([
                'success' => false,
                'message' => 'Invalid email or password.',
            ], 401);
        }

        // Update last login info
        $superAdmin->update([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ]);

        // Store in session
        Session::put('super_admin_id', $superAdmin->id);
        Session::put('super_admin_name', $superAdmin->name);
        Session::put('super_admin_email', $superAdmin->email);

        // Log successful login
        $this->logActivity($superAdmin->name, 'Super Admin', 'Login', 'Successful login.', $request->ip());
        $this->logAudit($superAdmin->name, 'Login', 'System Access', $request->ip(), 'Super Admin logged in.');

        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'super_admin' => [
                'id' => $superAdmin->id,
                'name' => $superAdmin->name,
                'email' => $superAdmin->email,
            ],
        ]);
    }

    // =============================================
    // LOGOUT
    // =============================================

    public function logout(Request $request)
    {
        $name = Session::get('super_admin_name', 'Super Admin');
        $this->logActivity($name, 'Super Admin', 'Logout', 'Super Admin logged out.', $request->ip());

        Session::forget(['super_admin_id', 'super_admin_name', 'super_admin_email']);

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
        ]);
    }

    // =============================================
    // CHECK SESSION (frontend can poll this)
    // =============================================

    public function checkSession()
    {
        if (!Session::has('super_admin_id')) {
            return response()->json(['authenticated' => false], 401);
        }

        return response()->json([
            'authenticated' => true,
            'super_admin' => [
                'id' => Session::get('super_admin_id'),
                'name' => Session::get('super_admin_name'),
                'email' => Session::get('super_admin_email'),
            ],
        ]);
    }

    // =============================================
    // RESET ADMIN PASSWORD
    // =============================================

    public function resetAdminPassword(Request $request)
    {
        if (!Session::has('super_admin_id')) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 401);
        }

        $validator = Validator::make($request->all(), [
            'admin_id' => 'required|integer',
            'new_password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Protect Super Admin (ID 1 is hardcoded super admin — adjust if needed)
        if ($request->admin_id === 1) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot reset Super Admin password from this panel.',
            ], 403);
        }

        $admin = Admin::find($request->admin_id);

        if (!$admin) {
            return response()->json([
                'success' => false,
                'message' => 'Admin not found.',
            ], 404);
        }

        $admin->update([
            'password' => Hash::make($request->new_password),
        ]);

        // Log the action
        $superAdminName = Session::get('super_admin_name', 'Super Admin');
        $this->logAudit(
            $superAdminName,
            'Password Reset',
            "Admin: {$admin->name} (ID: {$admin->id})",
            $request->ip(),
            "Password was reset for {$admin->department} admin."
        );
        $this->logActivity(
            $superAdminName,
            'Super Admin',
            'Password Reset',
            "Reset password for: {$admin->name} ({$admin->department})",
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => "Password reset successfully for {$admin->name}.",
        ]);
    }

    // =============================================
    // CHANGE SUPER ADMIN OWN PASSWORD
    // =============================================

    public function changeOwnPassword(Request $request)
    {
        if (!Session::has('super_admin_id')) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 401);
        }

        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $superAdmin = SuperAdmin::find(Session::get('super_admin_id'));

        if (!Hash::check($request->current_password, $superAdmin->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect.',
            ], 400);
        }

        $superAdmin->update([
            'password' => Hash::make($request->new_password),
        ]);

        $this->logAudit($superAdmin->name, 'Password Change', 'Super Admin Account', $request->ip(), 'Super Admin changed their own password.');
        $this->logActivity($superAdmin->name, 'Super Admin', 'Password Change', 'Changed own password.', $request->ip());

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully.',
        ]);
    }

    // =============================================
    // GET ALL ADMINS
    // =============================================

    public function getAdmins()
    {
        if (!Session::has('super_admin_id')) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 401);
        }

        $admins = Admin::select('id', 'name', 'email', 'department', 'role', 'status')
            ->orderBy('department')
            ->get();

        return response()->json([
            'success' => true,
            'admins' => $admins,
        ]);
    }

    // =============================================
    // LOG ACTION (called from frontend JS)
    // =============================================

    public function logAction(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'action' => 'required|string',
            'details' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false], 422);
        }

        $superAdminName = Session::get('super_admin_name', 'Super Admin');

        $this->logAudit(
            $superAdminName,
            $request->action,
            $request->target ?? 'System',
            $request->ip(),
            $request->details
        );

        return response()->json(['success' => true, 'message' => 'Action logged.']);
    }

    // =============================================
    // GET AUDIT TRAILS
    // =============================================

    public function getAuditTrails(Request $request)
    {
        if (!Session::has('super_admin_id')) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 401);
        }

        $trails = AuditTrail::orderByDesc('created_at')
            ->limit($request->get('limit', 50))
            ->get()
            ->map(fn($t) => [
                'date' => $t->created_at->format('Y-m-d'),
                'admin' => $t->performed_by,
                'action' => $t->action,
                'target' => $t->target,
                'details' => $t->details,
                'ip_address' => $t->ip_address,
                'timestamp' => $t->created_at->toDateTimeString(),
            ]);

        return response()->json([
            'success' => true,
            'trails' => $trails,
        ]);
    }

    // =============================================
    // GET ACTIVITY LOGS
    // =============================================

    public function getActivityLogs(Request $request)
    {
        if (!Session::has('super_admin_id')) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 401);
        }

        $logs = ActivityLog::orderByDesc('created_at')
            ->limit($request->get('limit', 50))
            ->get()
            ->map(fn($l) => [
                'timestamp' => $l->created_at->toDateTimeString(),
                'user' => $l->user,
                'role' => $l->role,
                'action' => $l->action,
                'details' => $l->details,
                'ip_address' => $l->ip_address,
            ]);

        return response()->json([
            'success' => true,
            'logs' => $logs,
        ]);
    }

    // =============================================
    // GET DASHBOARD STATS
    // =============================================

    public function getDashboardStats()
    {
        if (!Session::has('super_admin_id')) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 401);
        }

        return response()->json([
            'success' => true,
            'stats' => [
                'total_admins' => Admin::count(),
                'total_audit_logs' => AuditTrail::count(),
                'total_activity' => ActivityLog::count(),
                'last_login' => AuditTrail::where('action', 'Login')->latest()->first()?->created_at?->toDateTimeString(),
            ],
        ]);
    }

    // =============================================
    // PRIVATE HELPERS
    // =============================================

    private function logAudit(string $performedBy, string $action, string $target, ?string $ip, ?string $details = null): void
    {
        AuditTrail::create([
            'performed_by' => $performedBy,
            'action' => $action,
            'target' => $target,
            'ip_address' => $ip,
            'details' => $details,
        ]);
    }

    private function logActivity(string $user, string $role, string $action, ?string $details, ?string $ip): void
    {
        ActivityLog::create([
            'user' => $user,
            'role' => $role,
            'action' => $action,
            'details' => $details,
            'ip_address' => $ip,
        ]);
    }
}