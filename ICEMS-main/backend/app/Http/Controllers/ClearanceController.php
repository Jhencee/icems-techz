<?php

namespace App\Http\Controllers;

use App\Models\ClearanceSubmission;
use App\Models\Event;
use App\Models\GymnasiumClearance;
use App\Models\HealthQuestion;
use App\Models\LaboratoryClearance;
use App\Models\LibraryClearance;
use App\Models\Notification;
use App\Models\NurseClearance;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClearanceController extends Controller
{
    // ==============================================================
    // EVENT CLEARANCE (attendance proof)
    // ==============================================================

    // GET /api/clearance/student/{email}
    public function getStudentSubmissions(string $email): JsonResponse
    {
        $submissions = ClearanceSubmission::where('student_email', $email)
            ->orderBy('submitted_at', 'desc')
            ->get()
            ->map(fn($s) => [
                'id' => $s->id,
                'event_id' => $s->event_id,
                'event_title' => $s->event_title,
                'event_date' => $s->event_date,
                'proof_image' => $s->proof_image,
                'notes' => $s->notes,
                'status' => $s->status,
                'admin_notes' => $s->admin_notes,
                'submitted_at' => $s->created_at->toIso8601String(),
            ]);

        return response()->json(['success' => true, 'submissions' => $submissions]);
    }

    // POST /api/clearance/submit-proof
    public function submitProof(Request $request): JsonResponse
    {
        $request->validate([
            'student_email' => 'required|email|exists:students,email',
            'event_id' => 'required|integer|exists:events,id',
            'proof_image' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        $event = Event::find($request->event_id);

        // Prevent duplicate submissions
        $existing = ClearanceSubmission::where('student_email', $request->student_email)
            ->where('event_id', $request->event_id)
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'You have already submitted proof for this event.',
            ], 422);
        }

        $submission = ClearanceSubmission::create([
            'student_email' => $request->student_email,
            'event_id' => $request->event_id,
            'event_title' => $event->title,
            'event_date' => $event->event_date,
            'proof_image' => $request->proof_image,
            'notes' => $request->notes,
            'status' => 'pending',
        ]);

        // Notify student
        $student = Student::where('email', $request->student_email)->first();
        if ($student) {
            Notification::send(
                $student->student_number,
                'info',
                'Attendance Proof Submitted',
                "Your attendance proof for \"{$event->title}\" has been submitted and is pending review.",
                'attendance',
                null,
                'clearance_submission',
                $submission->id
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Proof submitted successfully',
            'submission' => $submission,
        ], 201);
    }

    // POST /api/clearance/{id}/review  (admin approves/rejects)
    public function reviewSubmission(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:approved,rejected',
            'admin_notes' => 'nullable|string',
        ]);

        $submission = ClearanceSubmission::find($id);
        if (!$submission) {
            return response()->json(['success' => false, 'message' => 'Submission not found'], 404);
        }

        $submission->update([
            'status' => $request->status,
            'admin_notes' => $request->admin_notes,
        ]);

        // Notify student of result
        $student = Student::where('email', $submission->student_email)->first();
        if ($student) {
            $isApproved = $request->status === 'approved';
            Notification::send(
                $student->student_number,
                $isApproved ? 'success' : 'error',
                'Attendance Proof ' . ($isApproved ? 'Approved' : 'Rejected'),
                $isApproved
                ? "Your attendance proof for \"{$submission->event_title}\" has been approved!"
                : "Your attendance proof for \"{$submission->event_title}\" was rejected. " . ($request->admin_notes ?? ''),
                'attendance',
                null,
                'clearance_submission',
                $submission->id
            );
        }

        return response()->json(['success' => true, 'submission' => $submission]);
    }

    // ==============================================================
    // GYMNASIUM CLEARANCE
    // ==============================================================

    // GET /api/gymnasium/clearance/{studentNumber}
    public function getGymnasiumClearance(string $studentNumber): JsonResponse
    {
        $clearance = GymnasiumClearance::where('student_id', $studentNumber)
            ->latest()
            ->first();

        if (!$clearance) {
            return response()->json(['success' => true, 'exists' => false]);
        }

        return response()->json([
            'success' => true,
            'exists' => true,
            'clearance' => [
                'id' => $clearance->id,
                'status' => $clearance->status,
                'remarks' => $clearance->remarks,
            ],
        ]);
    }

    // POST /api/gymnasium/submit-clearance
    public function submitGymnasiumClearance(Request $request): JsonResponse
    {
        $request->validate([
            'student_id' => 'required|string',
            'student_name' => 'required|string',
            'student_email' => 'required|email',
            'section' => 'nullable|string',
            'clearance_type' => 'required|in:online,direct_visit',
            'borrowed_equipment' => 'boolean',
            'equipment_items' => 'nullable|array',
            'proof_image' => 'nullable|string',
            'notes' => 'nullable|string',
            'submitted_at' => 'nullable|string',
        ]);

        // One-active-submission rule
        $existing = GymnasiumClearance::where('student_id', $request->student_id)
            ->whereIn('status', ['pending', 'approved'])
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'You already have an active gymnasium clearance submission.',
            ], 422);
        }

        $clearance = GymnasiumClearance::create([
            'student_id' => $request->student_id,
            'student_name' => $request->student_name,
            'student_email' => $request->student_email,
            'section' => $request->section,
            'clearance_type' => $request->clearance_type,
            'borrowed_equipment' => $request->boolean('borrowed_equipment'),
            'equipment_items' => $request->equipment_items,
            'proof_image' => $request->proof_image,
            'notes' => $request->notes,
            'submitted_at' => $request->submitted_at ?? now(),
            'status' => 'pending',
        ]);

        $student = Student::where('student_number', $request->student_id)->first();
        if ($student) {
            Notification::send(
                $student->student_number,
                'info',
                'Gymnasium Clearance Submitted',
                'Your gymnasium clearance has been submitted and is pending review.',
                'clearance',
                null,
                'gymnasium_clearance',
                $clearance->id
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Gymnasium clearance submitted successfully',
            'clearance' => $clearance,
        ], 201);
    }

    // POST /api/gymnasium/clearance/{id}/review  (admin)
    public function reviewGymnasiumClearance(Request $request, int $id): JsonResponse
    {
        return $this->reviewGenericClearance(
            GymnasiumClearance::find($id),
            $request,
            'gymnasium_clearance',
            'clearance',
            'Gymnasium Clearance'
        );
    }

    // ==============================================================
    // LABORATORY CLEARANCE
    // ==============================================================

    // GET /api/laboratory/clearance/{studentNumber}
    public function getLaboratoryClearance(string $studentNumber): JsonResponse
    {
        $clearance = LaboratoryClearance::where('student_id', $studentNumber)->latest()->first();
        if (!$clearance) {
            return response()->json(['success' => true, 'exists' => false]);
        }
        return response()->json([
            'success' => true,
            'exists' => true,
            'clearance' => ['id' => $clearance->id, 'status' => $clearance->status, 'remarks' => $clearance->remarks]
        ]);
    }

    // POST /api/laboratory/submit-clearance
    public function submitLaboratoryClearance(Request $request): JsonResponse
    {
        $request->validate([
            'student_id' => 'required|string',
            'student_name' => 'required|string',
            'student_email' => 'required|email',
            'section' => 'nullable|string',
            'clearance_type' => 'required|in:online,direct_visit',
            'borrowed_equipment' => 'boolean',
            'equipment_items' => 'nullable|array',
            'proof_image' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $existing = LaboratoryClearance::where('student_id', $request->student_id)
            ->whereIn('status', ['pending', 'approved'])->first();
        if ($existing) {
            return response()->json(['success' => false, 'message' => 'Active laboratory clearance already exists.'], 422);
        }

        $clearance = LaboratoryClearance::create([
            'student_id' => $request->student_id,
            'student_name' => $request->student_name,
            'student_email' => $request->student_email,
            'section' => $request->section,
            'clearance_type' => $request->clearance_type,
            'borrowed_equipment' => $request->boolean('borrowed_equipment'),
            'equipment_items' => $request->equipment_items,
            'proof_image' => $request->proof_image,
            'notes' => $request->notes,
            'submitted_at' => now(),
        ]);

        $student = Student::where('student_number', $request->student_id)->first();
        if ($student) {
            Notification::send(
                $student->student_number,
                'info',
                'Laboratory Clearance Submitted',
                'Your laboratory clearance has been submitted and is pending review.',
                'clearance',
                null,
                'laboratory_clearance',
                $clearance->id
            );
        }

        return response()->json(['success' => true, 'message' => 'Laboratory clearance submitted', 'clearance' => $clearance], 201);
    }

    // POST /api/laboratory/clearance/{id}/review
    public function reviewLaboratoryClearance(Request $request, int $id): JsonResponse
    {
        return $this->reviewGenericClearance(
            LaboratoryClearance::find($id),
            $request,
            'laboratory_clearance',
            'clearance',
            'Laboratory Clearance'
        );
    }

    // ==============================================================
    // LIBRARY CLEARANCE
    // ==============================================================

    // GET /api/library/clearance/{studentNumber}
    public function getLibraryClearance(string $studentNumber): JsonResponse
    {
        $clearance = LibraryClearance::where('student_id', $studentNumber)->latest()->first();
        if (!$clearance) {
            return response()->json(['success' => true, 'exists' => false]);
        }
        return response()->json([
            'success' => true,
            'exists' => true,
            'clearance' => ['id' => $clearance->id, 'status' => $clearance->status, 'remarks' => $clearance->remarks]
        ]);
    }

    // POST /api/library/submit-clearance
    public function submitLibraryClearance(Request $request): JsonResponse
    {
        $request->validate([
            'student_id' => 'required|string',
            'student_name' => 'required|string',
            'student_email' => 'required|email',
            'section' => 'nullable|string',
            'clearance_type' => 'required|in:online,direct_visit',
            'borrowed_books' => 'boolean',
            'book_items' => 'nullable|array',
            'proof_image' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $existing = LibraryClearance::where('student_id', $request->student_id)
            ->whereIn('status', ['pending', 'approved'])->first();
        if ($existing) {
            return response()->json(['success' => false, 'message' => 'Active library clearance already exists.'], 422);
        }

        $clearance = LibraryClearance::create([
            'student_id' => $request->student_id,
            'student_name' => $request->student_name,
            'student_email' => $request->student_email,
            'section' => $request->section,
            'clearance_type' => $request->clearance_type,
            'borrowed_books' => $request->boolean('borrowed_books'),
            'book_items' => $request->book_items,
            'proof_image' => $request->proof_image,
            'notes' => $request->notes,
            'submitted_at' => now(),
        ]);

        $student = Student::where('student_number', $request->student_id)->first();
        if ($student) {
            Notification::send(
                $student->student_number,
                'info',
                'Library Clearance Submitted',
                'Your library clearance has been submitted and is pending review.',
                'clearance',
                null,
                'library_clearance',
                $clearance->id
            );
        }

        return response()->json(['success' => true, 'message' => 'Library clearance submitted', 'clearance' => $clearance], 201);
    }

    // POST /api/library/clearance/{id}/review
    public function reviewLibraryClearance(Request $request, int $id): JsonResponse
    {
        return $this->reviewGenericClearance(
            LibraryClearance::find($id),
            $request,
            'library_clearance',
            'clearance',
            'Library Clearance'
        );
    }

    // ==============================================================
    // NURSE CLEARANCE
    // ==============================================================

    // GET /api/nurse/questions
    public function getHealthQuestions(): JsonResponse
    {
        $questions = HealthQuestion::active()->get();
        return response()->json(['success' => true, 'questions' => $questions]);
    }

    // GET /api/nurse/clearance/{studentNumber}
    public function getNurseClearance(string $studentNumber): JsonResponse
    {
        $clearance = NurseClearance::where('student_id', $studentNumber)->latest()->first();
        if (!$clearance) {
            return response()->json(['success' => false, 'message' => 'No nurse clearance found'], 404);
        }
        return response()->json(['success' => true, 'clearance' => $clearance]);
    }

    // POST /api/nurse/submit-clearance
    public function submitNurseClearance(Request $request): JsonResponse
    {
        $request->validate([
            'student_id' => 'required|string',
            'student_name' => 'required|string',
            'section' => 'nullable|string',
            'health_answers' => 'required|array',
            'medical_certificate' => 'nullable|string',
            'vaccination_record' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        // Upsert: replace rejected or create new
        NurseClearance::where('student_id', $request->student_id)
            ->whereIn('status', ['rejected'])->delete();

        $existing = NurseClearance::where('student_id', $request->student_id)
            ->whereIn('status', ['pending', 'approved'])->first();
        if ($existing) {
            return response()->json(['success' => false, 'message' => 'Active nurse clearance already exists.'], 422);
        }

        $clearance = NurseClearance::create([
            'student_id' => $request->student_id,
            'student_name' => $request->student_name,
            'section' => $request->section,
            'health_answers' => $request->health_answers,
            'medical_certificate' => $request->medical_certificate,
            'vaccination_record' => $request->vaccination_record,
            'notes' => $request->notes,
        ]);

        $student = Student::where('student_number', $request->student_id)->first();
        if ($student) {
            Notification::send(
                $student->student_number,
                'info',
                'Nurse Clearance Submitted',
                'Your health clearance has been submitted and is pending nurse review.',
                'clearance',
                null,
                'nurse_clearance',
                $clearance->id
            );
        }

        return response()->json(['success' => true, 'message' => 'Nurse clearance submitted', 'clearance' => $clearance], 201);
    }

    // POST /api/nurse/clearance/{id}/review
    public function reviewNurseClearance(Request $request, int $id): JsonResponse
    {
        return $this->reviewGenericClearance(
            NurseClearance::find($id),
            $request,
            'nurse_clearance',
            'clearance',
            'Nurse Clearance'
        );
    }

    // ==============================================================
    // SHARED REVIEW HELPER
    // ==============================================================
    private function reviewGenericClearance(
        $model,
        Request $request,
        string $referenceType,
        string $notifCategory,
        string $label
    ): JsonResponse {
        if (!$model) {
            return response()->json(['success' => false, 'message' => "{$label} not found"], 404);
        }

        $request->validate([
            'status' => 'required|in:approved,rejected',
            'remarks' => 'nullable|string',
        ]);

        $model->update(['status' => $request->status, 'remarks' => $request->remarks]);

        $studentNumber = $model->student_id ?? null;
        if ($studentNumber) {
            $isApproved = $request->status === 'approved';
            Notification::send(
                $studentNumber,
                $isApproved ? 'success' : 'error',
                "{$label} " . ($isApproved ? 'Approved' : 'Rejected'),
                $isApproved
                ? "Your {$label} has been approved! ✅"
                : "Your {$label} was rejected. " . ($request->remarks ?? 'Please resubmit.'),
                $notifCategory,
                null,
                $referenceType,
                $model->id
            );
        }

        return response()->json(['success' => true, 'message' => "{$label} {$request->status}", 'clearance' => $model]);
    }
}