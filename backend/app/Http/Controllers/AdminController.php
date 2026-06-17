<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    // ─────────────────────────────────────────
    // GET /api/admin/admins
    // Returns all admins for the Super Admin panel
    // ─────────────────────────────────────────
    public function index()
    {
        try {
            $admins = Admin::select('id', 'name', 'email', 'department', 'role', 'status')
                ->orderBy('department')
                ->get();

            return response()->json([
                'success' => true,
                'admins' => $admins,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
