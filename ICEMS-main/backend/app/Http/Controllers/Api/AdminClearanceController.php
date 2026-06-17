<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClearanceSubmission;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AdminClearanceController extends Controller
{
    // GET /api/clearance/submissions
    public function getSSOSubmissions(): JsonResponse
    {
        try {
            $submissions = ClearanceSubmission::with('event')
                ->whereHas('event', fn($q) => $q->where('admin', 'Admin'))
                ->orderBy('submitted_at', 'desc')
                ->get()
                ->map(fn($s) => [
                    'id' => $s->id,
                    'student_number' => $s->student_number,
                    'student_name' => $s->student_name,
                    'student_email' => $s->student_email,
                    'course' => $s->course,
                    'year' => $s->year,
                    'event_title' => $s->event?->title ?? $s->event_title,
                    'event_date' => $s->event?->event_date ?? $s->event_date,
                    'status' => $s->status,
                    'accounting_status' => $s->accounting_status ?? 'new',
                    'accounting_notes' => $s->accounting_notes,
                    'admin_notes' => $s->admin_notes,
                    'notes' => $s->notes,
                    'proof_image' => $s->proof_image
                        ? asset('storage/' . $s->proof_image)
                        : null,
                    'submitted_at' => $s->submitted_at,
                ]);

            return response()->json([
                'success' => true,
                'submissions' => $submissions->values(),
                'total' => $submissions->count(),
                'pending' => $submissions->where('status', 'pending')->count(),
                'approved' => $submissions->where('status', 'approved')->count(),
                'rejected' => $submissions->where('status', 'rejected')->count(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    // PUT /api/clearance/submissions/{id}/status
    public function updateSSOStatus(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:pending,approved,rejected',
            'admin_notes' => 'nullable|string',
        ]);

        try {
            $submission = ClearanceSubmission::findOrFail($id);
            $submission->update([
                'status' => $request->status,
                'admin_notes' => $request->admin_notes,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Status updated successfully',
                'submission' => $submission,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    // PUT /api/clearance/submissions/{id}/accounting-status
    public function updateAccountingStatus(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'accounting_status' => 'required|in:new,pending,approved,rejected',
            'accounting_notes' => 'nullable|string',
        ]);

        try {
            $submission = ClearanceSubmission::findOrFail($id);
            $submission->update([
                'accounting_status' => $request->accounting_status,
                'accounting_notes' => $request->accounting_notes,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Accounting status updated successfully',
                'submission' => $submission,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}