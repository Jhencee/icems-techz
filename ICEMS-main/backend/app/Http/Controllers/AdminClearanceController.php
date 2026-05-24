<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClearanceSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ClearanceController extends Controller
{
    // GET /api/clearance/submissions
    public function getSSOSubmissions()
    {
        try {
            $submissions = ClearanceSubmission::with(['student', 'event'])
                ->whereHas('event', function ($q) {
                    $q->whereNull('council_id')->whereNull('organization_id');
                })
                ->orderBy('submitted_at', 'desc')
                ->get()
                ->map(function ($s) {
                    return [
                        'id' => $s->id,
                        'student_number' => $s->student_number,
                        'student_name' => $s->student_name,
                        'student_email' => $s->student_email,
                        'course' => $s->course,
                        'year' => $s->year,
                        'event_title' => $s->event ? $s->event->title : $s->event_title,
                        'event_date' => $s->event ? $s->event->event_date : null,
                        'status' => $s->status,
                        'admin_notes' => $s->admin_notes,
                        'notes' => $s->notes,
                        'proof_image' => $s->proof_image
                            ? asset('storage/' . $s->proof_image)
                            : null,
                        'submitted_at' => $s->submitted_at,
                    ];
                });

            $pending = $submissions->where('status', 'pending')->count();
            $approved = $submissions->where('status', 'approved')->count();
            $rejected = $submissions->where('status', 'rejected')->count();

            return response()->json([
                'success' => true,
                'submissions' => $submissions->values(),
                'total' => $submissions->count(),
                'pending' => $pending,
                'approved' => $approved,
                'rejected' => $rejected,
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // PUT /api/clearance/submissions/{id}/status
    public function updateSSOStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:pending,approved,rejected',
            'admin_notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            $submission = ClearanceSubmission::findOrFail($id);
            $submission->update([
                'status' => $request->status,
                'admin_notes' => $request->admin_notes,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Submission status updated successfully',
                'submission' => $submission,
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}