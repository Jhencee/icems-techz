<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\ClearanceSubmission;
use App\Models\Payment;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class StudentCouncilController extends Controller
{
    public function getEvents(int $id): JsonResponse
    {
        try {
            $events = Event::orderBy('event_date', 'desc')->get();
            return response()->json(['success' => true, 'events' => $events]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function createEvent(Request $request, int $id): JsonResponse
    {
        try {
            $event = Event::create($request->only([
                'title','description','location','event_date',
                'time','start_time','end_time','duration',
                'category','audience','admin','is_clearance'
            ]));
            return response()->json(['success' => true, 'event' => $event], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function updateEvent(Request $request, int $id, int $eventId): JsonResponse
    {
        try {
            $event = Event::findOrFail($eventId);
            $event->update($request->only([
                'title','description','location','event_date',
                'time','start_time','end_time','duration',
                'category','audience','admin','is_clearance'
            ]));
            return response()->json(['success' => true, 'event' => $event]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function deleteEvent(int $id, int $eventId): JsonResponse
    {
        try {
            Event::findOrFail($eventId)->delete();
            return response()->json(['success' => true, 'message' => 'Event deleted']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function getClearances(int $id): JsonResponse
    {
        try {
            $submissions = ClearanceSubmission::with('event')
                ->orderBy('created_at', 'desc')
                ->get();
            return response()->json(['success' => true, 'submissions' => $submissions]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function updateClearanceStatus(Request $request, int $id, int $clearanceId): JsonResponse
    {
        try {
            $submission = ClearanceSubmission::findOrFail($clearanceId);
            $submission->update([
                'status' => $request->status,
                'admin_notes' => $request->admin_notes ?? null,
            ]);
            return response()->json(['success' => true, 'submission' => $submission]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function getPayments(int $id): JsonResponse
    {
        try {
            $payments = Payment::with('student')->orderBy('created_at', 'desc')->get()->map(fn($p) => [
                'id' => $p->id,
                'student_number' => $p->student_number,
                'student_name' => $p->student?->full_name ?? $p->student_number,
                'requirement_title' => $p->requirement_title,
                'amount' => $p->amount,
                'proof_image' => $p->proof_image ? asset('storage/' . $p->proof_image) : null,
                'status' => $p->status,
                'admin_notes' => $p->admin_notes,
                'created_at' => $p->created_at?->toDateTimeString(),
            ]);
            return response()->json(['success' => true, 'payments' => $payments]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function verifyPayment(Request $request, int $id, int $paymentId): JsonResponse
    {
        try {
            $payment = Payment::findOrFail($paymentId);
            $payment->update([
                'status' => $request->status,
                'admin_notes' => $request->admin_notes ?? null,
            ]);
            return response()->json(['success' => true, 'payment' => $payment]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function index(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => []]);
    }

    public function store(Request $request): JsonResponse
    {
        return response()->json(['success' => true]);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(['success' => true]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        return response()->json(['success' => true]);
    }

    public function destroy(int $id): JsonResponse
    {
        return response()->json(['success' => true]);
    }
}
