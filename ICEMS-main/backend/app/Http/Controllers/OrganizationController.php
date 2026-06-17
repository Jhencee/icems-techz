<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\Event;
use App\Models\ClearanceSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class OrganizationController extends Controller
{
    // GET /api/organizations
    public function index()
    {
        try {
            $organizations = Organization::orderBy('name')->get();
            return response()->json(['success' => true, 'organizations' => $organizations]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // POST /api/organizations
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
                $logoPath = $request->file('logo')->store('organizations/logos', 'public');
            }

            $org = Organization::create([
                'name' => $request->name,
                'acronym' => $request->acronym,
                'description' => $request->description,
                'logo' => $logoPath ? asset('storage/' . $logoPath) : null,
            ]);

            return response()->json(['success' => true, 'organization' => $org], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // GET /api/organizations/{id}
    public function show($id)
    {
        try {
            $org = Organization::findOrFail($id);
            return response()->json(['success' => true, 'organization' => $org]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // PUT /api/organizations/{id}
    public function update(Request $request, $id)
    {
        try {
            $org = Organization::findOrFail($id);
            $org->update($request->only(['name', 'acronym', 'description']));
            return response()->json(['success' => true, 'organization' => $org]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // DELETE /api/organizations/{id}
    public function destroy($id)
    {
        try {
            Organization::findOrFail($id)->delete();
            return response()->json(['success' => true, 'message' => 'Organization deleted']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // GET /api/organizations/{id}/events
    public function getEvents($id)
    {
        try {
            Organization::findOrFail($id);
            $events = Event::where('organization_id', $id)->orderBy('event_date')->get();
            return response()->json(['success' => true, 'events' => $events]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // POST /api/organizations/{id}/events
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
            Organization::findOrFail($id);

            $event = Event::create([
                'organization_id' => $id,
                'council_id' => null,
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
                'admin' => $request->admin ?? 'Organization',
                'is_clearance' => $request->is_clearance ?? false,
            ]);

            return response()->json(['success' => true, 'event' => $event], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // PUT /api/organizations/{id}/events/{eventId}
    public function updateEvent(Request $request, $id, $eventId)
    {
        try {
            $event = Event::where('organization_id', $id)->findOrFail($eventId);
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

    // DELETE /api/organizations/{id}/events/{eventId}
    public function deleteEvent($id, $eventId)
    {
        try {
            Event::where('organization_id', $id)->findOrFail($eventId)->delete();
            return response()->json(['success' => true, 'message' => 'Event deleted']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // GET /api/organizations/{id}/clearances
    public function getClearances($id)
    {
        try {
            Organization::findOrFail($id);

            $submissions = ClearanceSubmission::whereHas('event', function ($q) use ($id) {
                $q->where('organization_id', $id);
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
}
