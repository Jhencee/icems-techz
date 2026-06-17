<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;

class SuperAdminAuth
{
    public function handle(Request $request, Closure $next)
    {
        // Allow if super_admin_email is in the request body (hardcoded frontend login)
        $emailFromRequest = $request->input('super_admin_email');
        if ($emailFromRequest && strtolower($emailFromRequest) === 'superadmin@gmail.com') {
            return $next($request);
        }

        // Fallback: allow if session is set (API-based login)
        if (Session::has('super_admin_id')) {
            return $next($request);
        }

        return response()->json([
            'success' => false,
            'message' => 'Unauthorized. Please log in as Super Admin.'
        ], 401);
    }
}