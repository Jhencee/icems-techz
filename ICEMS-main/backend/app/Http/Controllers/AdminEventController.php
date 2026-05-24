<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class EventController extends Controller
{
    // GET /api/events
    public function index()
    {
        try {
            $events = Event::whereNull('council_id')
                ->whereNull('organization_id')
                ->orderBy('event_date', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'events' => $events,
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // POST /api/events
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'event_date' => 'required|date',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'location' => 'nullable|string|max:255',
            'time' => 'nullable|string|max:50',
            'start_time' => 'nullable|string|max:10',
            'end_time' => 'nullable|string|max:10',
            'category' => 'nullable|string|max:50',
            'audience' => 'nullable|string|max:255',
            'admin' => 'nullable|string|max:255',
            'is_clearance' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            $event = Event::create([
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
                'admin' => $request->admin ?? 'Student Services Office',
                'is_clearance' => $request->is_clearance ?? false,
                'council_id' => null,
                'organization_id' => null,
            ]);

            return response()->json(['success' => true, 'event' => $event], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // PUT /api/events/{id}
    public function update(Request $request, $id)
    {
        try {
            $event = Event::findOrFail($id);
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

    // DELETE /api/events/{id}
    public function destroy($id)
    {
        try {
            $event = Event::findOrFail($id);
            $event->delete();

            return response()->json(['success' => true, 'message' => 'Event deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}