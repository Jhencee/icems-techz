<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
class AdminEventController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Event::orderBy('event_date', 'desc');
            if ($request->has('admin')) {
                $query->where('admin', $request->admin);
            }
            $events = $query->get()->map(fn($e) => [
                'id' => $e->id,
                'title' => $e->title,
                'description' => $e->description,
                'event_date' => $e->event_date?->format('Y-m-d'),
                'time' => $e->time,
                'start_time' => $e->start_time,
                'end_time' => $e->end_time,
                'location' => $e->location,
                'category' => $e->category,
                'audience' => $e->audience,
                'admin' => $e->admin,
                'is_clearance' => $e->is_clearance,
            ]);
            return response()->json(['success' => true, 'events' => $events->values(), 'total' => $events->count()]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
    public function store(Request $request): JsonResponse
    {
        try {
            $event = Event::create($request->only([
                'title', 'description', 'event_date', 'time',
                'start_time', 'end_time', 'location', 'category',
                'audience', 'is_clearance', 'admin',
                'council_id', 'organization_id'
            ]));
            return response()->json(['success' => true, 'message' => 'Event created', 'event' => $event], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $event = Event::findOrFail($id);
            $event->update($request->only([
                'title', 'description', 'event_date', 'time',
                'start_time', 'end_time', 'location', 'category',
                'audience', 'is_clearance', 'admin'
            ]));
            return response()->json(['success' => true, 'message' => 'Event updated', 'event' => $event]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
    public function destroy(int $id): JsonResponse
    {
        try {
            Event::findOrFail($id)->delete();
            return response()->json(['success' => true, 'message' => 'Event deleted']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
