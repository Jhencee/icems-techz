<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LibraryClearance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LibraryController extends Controller
{
    // GET /api/library/all-clearances
    public function getAllClearances()
    {
        try {
            $clearances = LibraryClearance::orderBy('submitted_at', 'desc')
                ->get()
                ->map(fn($c) => [
                    'id' => $c->id,
                    'student_id' => $c->student_id,
                    'student_name' => $c->student_name,
                    'student_email' => $c->student_email,
                    'section' => $c->section,
                    'borrowed_books' => $c->borrowed_books,
                    'book_items' => $c->book_items ?? [],
                    'proof_image' => $c->proof_image
                        ? asset('storage/' . $c->proof_image)
                        : null,
                    'notes' => $c->notes,
                    'status' => $c->status,
                    'remarks' => $c->remarks,
                    'submitted_at' => $c->submitted_at,
                    'processed_at' => $c->processed_at,
                ]);

            return response()->json(['success' => true, 'clearances' => $clearances]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // POST /api/library/update-status
    public function updateStatus(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'student_id' => 'required|string',
            'status' => 'required|in:pending,approved,rejected',
            'remarks' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            $clearance = LibraryClearance::where('student_id', $request->student_id)->latest()->firstOrFail();
            $clearance->update([
                'status' => $request->status,
                'remarks' => $request->remarks,
                'processed_at' => now(),
            ]);

            return response()->json(['success' => true, 'message' => 'Status updated', 'clearance' => $clearance]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}