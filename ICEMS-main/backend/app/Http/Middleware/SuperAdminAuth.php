<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Symfony\Component\HttpFoundation\Response;

class SuperAdminAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!Session::has('super_admin_id')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Please log in as Super Admin.',
            ], 401);
        }

        return $next($request);
    }
}