<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\ClearanceSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrganizationController extends Controller
{
    // GET /api/organizations
    public function index()
    {
        try {
            $organizations = DB::table('organizations')->get();
            return response()->json([
                'success' => true,
                'organizations' => $organizations
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/organizations/{id}
    public function show($id)
    {
        try {
            $org = DB::table('organizations')->where('id', $id)->first();
            if (!$org) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }
            return response()->json([
                'success' => true,
                'organization' => $org
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // POST /api/organizations
    public function store(Request $request)
    {
        try {
            $id = DB::table('organizations')->insertGetId([
                'name' => $request->name,
                'acronym' => $request->acronym,
                'description' => $request->description,
                'logo' => $request->logo,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $org = DB::table('organizations')->where('id', $id)->first();
            return response()->json([
                'success' => true,
                'organization' => $org
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // PUT /api/organizations/{id}
    public function update(Request $request, $id)
    {
        try {
            DB::table('organizations')->where('id', $id)->update([
                'name' => $request->name,
                'acronym' => $request->acronym,
                'description' => $request->description,
                'logo' => $request->logo,
                'updated_at' => now(),
            ]);

            $org = DB::table('organizations')->where('id', $id)->first();
            return response()->json([
                'success' => true,
                'organization' => $org
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // DELETE /api/organizations/{id}
    public function destroy($id)
    {
        try {
            DB::table('organizations')->where('id', $id)->delete();
            return response()->json([
                'success' => true,
                'message' => 'Organization deleted'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/organizations/{id}/events
    public function getEvents($id)
    {
        try {
            $events = Event::where('organization_id', $id)
                ->orderBy('event_date', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'events' => $events
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // POST /api/organizations/{id}/events
    public function createEvent(Request $request, $id)
    {
        try {
            $event = Event::create([
                'organization_id' => $id,
                'title' => $request->title,
                'description' => $request->description,
                'location' => $request->location,
                'event_date' => $request->event_date,
                'time' => $request->time,
                'start_time' => $request->start_time,
                'end_time' => $request->end_time,
                'category' => $request->category,
                'audience' => $request->audience ?? 'All Students',
                'admin' => $request->admin ?? 'Organization',
                'is_clearance' => $request->is_clearance ?? false,
            ]);

            return response()->json([
                'success' => true,
                'event' => $event
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // PUT /api/organizations/{id}/events/{eventId}
    public function updateEvent(Request $request, $id, $eventId)
    {
        try {
            $event = Event::where('id', $eventId)
                ->where('organization_id', $id)
                ->first();

            if (!$event) {
                return response()->json([
                    'success' => false,
                    'message' => 'Event not found'
                ], 404);
            }

            $event->update([
                'title' => $request->title ?? $event->title,
                'description' => $request->description ?? $event->description,
                'location' => $request->location ?? $event->location,
                'event_date' => $request->event_date ?? $event->event_date,
                'time' => $request->time ?? $event->time,
                'start_time' => $request->start_time ?? $event->start_time,
                'end_time' => $request->end_time ?? $event->end_time,
                'category' => $request->category ?? $event->category,
                'audience' => $request->audience ?? $event->audience,
                'is_clearance' => $request->is_clearance ?? $event->is_clearance,
            ]);

            return response()->json([
                'success' => true,
                'event' => $event->fresh()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // DELETE /api/organizations/{id}/events/{eventId}
    public function deleteEvent($id, $eventId)
    {
        try {
            $event = Event::where('id', $eventId)
                ->where('organization_id', $id)
                ->first();

            if (!$event) {
                return response()->json([
                    'success' => false,
                    'message' => 'Event not found'
                ], 404);
            }

            $event->delete();

            return response()->json([
                'success' => true,
                'message' => 'Event deleted'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/organizations/{id}/clearances
    // Joins event_id -> events.organization_id to filter by org
    public function getClearances($id)
    {
        try {
            $submissions = ClearanceSubmission::join('events', 'clearance_submissions.event_id', '=', 'events.id')
                ->where('events.organization_id', $id)
                ->select('clearance_submissions.*')
                ->orderBy('clearance_submissions.created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'submissions' => $submissions
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}