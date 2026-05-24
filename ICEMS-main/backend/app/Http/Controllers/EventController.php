<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Notification;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventController extends Controller
{
    // GET /api/events
    public function index(): JsonResponse
    {
        $events = Event::orderBy('event_date', 'asc')->get();

        return response()->json(['success' => true, 'events' => $events]);
    }

    // POST /api/events  (admin creates event)
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'event_date' => 'required|date',
            'time' => 'required|string',
            'start_time' => 'nullable|string',
            'end_time' => 'nullable|string',
            'location' => 'required|string|max:255',
            'audience' => 'nullable|string|max:255',
            'admin' => 'required|string|max:255',
            'is_clearance' => 'boolean',
            'category' => 'in:mandatory,optional',
        ]);

        $event = Event::create($validated);

        // Notify all students about the new event
        $this->broadcastEventNotification($event);

        return response()->json([
            'success' => true,
            'message' => 'Event created successfully',
            'event' => $event,
        ], 201);
    }

    // GET /api/events/{id}
    public function show(int $id): JsonResponse
    {
        $event = Event::find($id);
        if (!$event) {
            return response()->json(['success' => false, 'message' => 'Event not found'], 404);
        }

        return response()->json(['success' => true, 'event' => $event]);
    }

    // PUT /api/events/{id}
    public function update(Request $request, int $id): JsonResponse
    {
        $event = Event::find($id);
        if (!$event) {
            return response()->json(['success' => false, 'message' => 'Event not found'], 404);
        }

        $event->update($request->only([
            'title',
            'description',
            'event_date',
            'time',
            'start_time',
            'end_time',
            'location',
            'audience',
            'admin',
            'is_clearance',
            'category',
        ]));

        return response()->json(['success' => true, 'event' => $event]);
    }

    // DELETE /api/events/{id}
    public function destroy(int $id): JsonResponse
    {
        $event = Event::find($id);
        if (!$event) {
            return response()->json(['success' => false, 'message' => 'Event not found'], 404);
        }

        $event->delete();

        return response()->json(['success' => true, 'message' => 'Event deleted']);
    }

    private function broadcastEventNotification(Event $event): void
    {
        $studentNumbers = Student::pluck('student_number');
        $category = $event->is_clearance ? 'clearance' : 'events';
        $type = $event->category === 'mandatory' ? 'warning' : 'info';

        $rows = $studentNumbers->map(fn($sn) => [
            'student_number' => $sn,
            'type' => $type,
            'title' => 'New Event: ' . $event->title,
            'message' => "A new event has been scheduled on {$event->event_date->format('M d, Y')} at {$event->location}." .
                ($event->is_clearance ? ' Attendance is required for your clearance.' : ''),
            'category' => $category,
            'reference_type' => 'event',
            'reference_id' => $event->id,
            'is_read' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ])->toArray();

        foreach (array_chunk($rows, 500) as $chunk) {
            \DB::table('notifications')->insert($chunk);
        }
    }
}