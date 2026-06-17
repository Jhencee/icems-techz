<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\GymnasiumClearance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class GymnasiumController extends Controller
{
    // GET /api/gymnasium/clearances
    public function getAllClearances()
    {
        try {
            $clearances = GymnasiumClearance::orderBy('submitted_at', 'desc')
                ->get()
                ->map(fn($c) => [
                    'id' => $c->id,
                    'student_id' => $c->student_id,
                    'student_name' => $c->student_name,
                    'section' => $c->section,
                    'borrowed_equipment' => $c->borrowed_equipment,
                    'equipment_items' => $c->equipment_items ?? [],
                    'proof_image' => $c->proof_image
                        ? asset('storage/' . $c->proof_image)
                        : null,
                    'notes' => $c->notes,
                    'status' => $c->status,
                    'remarks' => $c->remarks,
                    'submitted_at' => $c->submitted_at,
                ]);

            return response()->json(['success' => true, 'clearances' => $clearances]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // POST /api/gymnasium/update-clearance
    public function updateClearance(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'clearance_id' => 'required|integer|exists:gymnasium_clearances,id',
            'status' => 'required|in:pending,approved,rejected',
            'remarks' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            $clearance = GymnasiumClearance::findOrFail($request->clearance_id);
            $clearance->update([
                'status' => $request->status,
                'remarks' => $request->remarks,
            ]);

            return response()->json(['success' => true, 'message' => 'Clearance updated', 'clearance' => $clearance]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
