<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentCouncil;
use App\Models\Event;
use App\Models\ClearanceSubmission;
use App\Models\CouncilPayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class StudentCouncilController extends Controller
{
    // GET /api/student-councils
    public function index()
    {
        try {
            $councils = StudentCouncil::orderBy('name')->get();
            return response()->json(['success' => true, 'councils' => $councils]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // POST /api/student-councils
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'acronym' => 'required|string|max:20',
            'description' => 'nullable|string',
            'logo' => 'nullable|image|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            $logoPath = null;
            if ($request->hasFile('logo')) {
                $logoPath = $request->file('logo')->store('councils/logos', 'public');
            }

            $council = StudentCouncil::create([
                'name' => $request->name,
                'acronym' => $request->acronym,
                'description' => $request->description,
                'logo' => $logoPath ? asset('storage/' . $logoPath) : null,
            ]);

            return response()->json(['success' => true, 'council' => $council], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // GET /api/student-councils/{id}
    public function show($id)
    {
        try {
            $council = StudentCouncil::findOrFail($id);
            return response()->json(['success' => true, 'council' => $council]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // PUT /api/student-councils/{id}
    public function update(Request $request, $id)
    {
        try {
            $council = StudentCouncil::findOrFail($id);
            $council->update($request->only(['name', 'acronym', 'description']));
            return response()->json(['success' => true, 'council' => $council]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // DELETE /api/student-councils/{id}
    public function destroy($id)
    {
        try {
            StudentCouncil::findOrFail($id)->delete();
            return response()->json(['success' => true, 'message' => 'Council deleted']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // GET /api/student-councils/{id}/events
    public function getEvents($id)
    {
        try {
            StudentCouncil::findOrFail($id);
            $events = Event::where('council_id', $id)->orderBy('event_date')->get();
            return response()->json(['success' => true, 'events' => $events]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // POST /api/student-councils/{id}/events
    public function createEvent(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'event_date' => 'required|date',
            'title' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            StudentCouncil::findOrFail($id);

            $event = Event::create([
                'council_id' => $id,
                'organization_id' => null,
                'event_date' => $request->event_date,
                'title' => $request->title,
                'description' => $request->description,
                'location' => $request->location,
                'time' => $request->time,
                'start_time' => $request->start_time,
                'end_time' => $request->end_time,
                'duration' => $request->duration ?? 'N/A',
                'category' => $request->category ?? 'optional',
                'audience' => $request->audience ?? 'All Students',
                'admin' => $request->admin ?? 'Student Council',
                'is_clearance' => $request->is_clearance ?? false,
            ]);

            return response()->json(['success' => true, 'event' => $event], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // PUT /api/student-councils/{id}/events/{eventId}
    public function updateEvent(Request $request, $id, $eventId)
    {
        try {
            $event = Event::where('council_id', $id)->findOrFail($eventId);
            $event->update($request->only([
                'title',
                'description',
                'location',
                'time',
                'start_time',
                'end_time',
                'category',
                'audience',
                'admin',
                'is_clearance',
                'event_date',
                'duration',
            ]));
            return response()->json(['success' => true, 'event' => $event]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // DELETE /api/student-councils/{id}/events/{eventId}
    public function deleteEvent($id, $eventId)
    {
        try {
            Event::where('council_id', $id)->findOrFail($eventId)->delete();
            return response()->json(['success' => true, 'message' => 'Event deleted']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // GET /api/student-councils/{id}/clearances
    public function getClearances($id)
    {
        try {
            StudentCouncil::findOrFail($id);

            $submissions = ClearanceSubmission::whereHas('event', function ($q) use ($id) {
                $q->where('council_id', $id);
            })
                ->with('event')
                ->orderBy('submitted_at', 'desc')
                ->get()
                ->map(fn($s) => [
                    'id' => $s->id,
                    'student_number' => $s->student_number,
                    'student_name' => $s->student_name,
                    'event_title' => $s->event?->title ?? $s->event_title,
                    'status' => $s->status,
                    'submitted_at' => $s->submitted_at,
                    'proof_image' => $s->proof_image ? asset('storage/' . $s->proof_image) : null,
                ]);

            return response()->json(['success' => true, 'submissions' => $submissions]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // PUT /api/student-councils/{id}/clearances/{clearanceId}/status
    public function updateClearanceStatus(Request $request, $id, $clearanceId)
    {
        try {
            $submission = ClearanceSubmission::findOrFail($clearanceId);
            $submission->update([
                'status' => $request->status,
                'admin_notes' => $request->admin_notes,
            ]);
            return response()->json(['success' => true, 'submission' => $submission]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // GET /api/student-councils/{id}/payments
    public function getPayments($id)
    {
        try {
            StudentCouncil::findOrFail($id);

            $payments = CouncilPayment::where('council_id', $id)
                ->orderBy('submitted_at', 'desc')
                ->get()
                ->map(fn($p) => [
                    'id' => $p->id,
                    'student_number' => $p->student_number,
                    'student_name' => $p->student_name,
                    'amount' => $p->amount,
                    'reference_number' => $p->reference_number,
                    'status' => $p->status,
                    'submitted_at' => $p->submitted_at,
                    'proof_image' => $p->proof_image ? asset('storage/' . $p->proof_image) : null,
                ]);

            return response()->json(['success' => true, 'payments' => $payments]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // POST /api/student-councils/{id}/payments/{paymentId}/verify
    public function verifyPayment($id, $paymentId)
    {
        try {
            $payment = CouncilPayment::where('council_id', $id)->findOrFail($paymentId);
            $payment->update(['status' => 'verified', 'verified_at' => now()]);
            return response()->json(['success' => true, 'message' => 'Payment verified', 'payment' => $payment]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}