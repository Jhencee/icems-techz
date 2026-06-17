<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class NotificationController extends Controller
{
    // ================================================================
    // GET /api/notifications/{studentNumber}
    // Returns all notifications for a student, newest first.
    // Optional query params: ?category=payments&unread=1&limit=50
    // ================================================================
    public function index(string $studentNumber, Request $request): JsonResponse
    {
        $student = Student::where('student_number', $studentNumber)->first();
        if (!$student) {
            return response()->json(['success' => false, 'message' => 'Student not found'], 404);
        }

        $query = Notification::forStudent($studentNumber)->recent(60);

        // Filter by category
        if ($request->filled('category') && $request->category !== 'all') {
            $query->byCategory($request->category);
        }

        // Filter unread only
        if ($request->boolean('unread')) {
            $query->unread();
        }

        $limit = min((int) $request->get('limit', 50), 100);

        $notifications = $query->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(fn($n) => $this->formatNotification($n));

        $unreadCount = Notification::forStudent($studentNumber)->unread()->count();

        return response()->json([
            'success' => true,
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
            'total' => $notifications->count(),
        ]);
    }

    // ================================================================
    // GET /api/notifications/{studentNumber}/unread-count
    // Lightweight endpoint for badge polling.
    // ================================================================
    public function unreadCount(string $studentNumber): JsonResponse
    {
        $count = Notification::forStudent($studentNumber)->unread()->count();

        return response()->json([
            'success' => true,
            'unread_count' => $count,
        ]);
    }

    // ================================================================
    // POST /api/notifications/{studentNumber}/{id}/read
    // Marks a single notification as read.
    // ================================================================
    public function markRead(string $studentNumber, int $id): JsonResponse
    {
        $notification = Notification::forStudent($studentNumber)->find($id);

        if (!$notification) {
            return response()->json(['success' => false, 'message' => 'Notification not found'], 404);
        }

        $notification->markAsRead();

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read',
        ]);
    }

    // ================================================================
    // POST /api/notifications/{studentNumber}/mark-all-read
    // Marks all (or filtered) notifications as read.
    // ================================================================
    public function markAllRead(string $studentNumber, Request $request): JsonResponse
    {
        $query = Notification::forStudent($studentNumber)->unread();

        if ($request->filled('category') && $request->category !== 'all') {
            $query->byCategory($request->category);
        }

        $updated = $query->update([
            'is_read' => true,
            'read_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "{$updated} notification(s) marked as read",
            'updated' => $updated,
        ]);
    }

    // ================================================================
    // DELETE /api/notifications/{studentNumber}/{id}
    // Deletes a single notification.
    // ================================================================
    public function destroy(string $studentNumber, int $id): JsonResponse
    {
        $notification = Notification::forStudent($studentNumber)->find($id);

        if (!$notification) {
            return response()->json(['success' => false, 'message' => 'Notification not found'], 404);
        }

        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notification deleted',
        ]);
    }

    // ================================================================
    // DELETE /api/notifications/{studentNumber}/clear-all
    // Clears all (or filtered) notifications for a student.
    // ================================================================
    public function clearAll(string $studentNumber, Request $request): JsonResponse
    {
        $query = Notification::forStudent($studentNumber);

        if ($request->filled('category') && $request->category !== 'all') {
            $query->byCategory($request->category);
        }

        $deleted = $query->delete();

        return response()->json([
            'success' => true,
            'message' => "{$deleted} notification(s) cleared",
            'deleted' => $deleted,
        ]);
    }

    // ================================================================
    // POST /api/notifications/send
    // Internal / admin endpoint to push a notification to a student.
    // Body: { student_number, type, title, message, category,
    //         action_url?, reference_type?, reference_id? }
    // ================================================================
    public function send(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_number' => 'required|string|exists:students,student_number',
            'type' => ['required', Rule::in(['success', 'info', 'warning', 'error'])],
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'category' => ['required', Rule::in(['payments', 'events', 'clearance', 'general', 'attendance'])],
            'action_url' => 'nullable|string|max:500',
            'reference_type' => 'nullable|string|max:100',
            'reference_id' => 'nullable|integer',
        ]);

        $notification = Notification::send(
            $validated['student_number'],
            $validated['type'],
            $validated['title'],
            $validated['message'],
            $validated['category'],
            $validated['action_url'] ?? null,
            $validated['reference_type'] ?? null,
            $validated['reference_id'] ?? null,
        );

        return response()->json([
            'success' => true,
            'message' => 'Notification sent',
            'notification' => $this->formatNotification($notification),
        ], 201);
    }

    // ================================================================
    // POST /api/notifications/broadcast
    // Sends the same notification to multiple students (or all students).
    // Body: { student_numbers?: [...], type, title, message, category }
    // If student_numbers is omitted → broadcast to ALL students.
    // ================================================================
    public function broadcast(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_numbers' => 'nullable|array',
            'student_numbers.*' => 'string|exists:students,student_number',
            'type' => ['required', Rule::in(['success', 'info', 'warning', 'error'])],
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'category' => ['required', Rule::in(['payments', 'events', 'clearance', 'general', 'attendance'])],
            'action_url' => 'nullable|string|max:500',
            'reference_type' => 'nullable|string|max:100',
            'reference_id' => 'nullable|integer',
        ]);

        $targets = isset($validated['student_numbers'])
            ? $validated['student_numbers']
            : Student::pluck('student_number')->toArray();

        $rows = array_map(fn($sn) => [
            'student_number' => $sn,
            'type' => $validated['type'],
            'title' => $validated['title'],
            'message' => $validated['message'],
            'category' => $validated['category'],
            'action_url' => $validated['action_url'] ?? null,
            'reference_type' => $validated['reference_type'] ?? null,
            'reference_id' => $validated['reference_id'] ?? null,
            'is_read' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ], $targets);

        // Insert in chunks to avoid query size limits
        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('notifications')->insert($chunk);
        }

        return response()->json([
            'success' => true,
            'message' => 'Notification broadcast to ' . count($targets) . ' student(s)',
            'sent_to' => count($targets),
        ], 201);
    }

    // ================================================================
    // GET /api/notifications/{studentNumber}/summary
    // Returns category counts for the notification badge/overview.
    // ================================================================
    public function summary(string $studentNumber): JsonResponse
    {
        $counts = Notification::forStudent($studentNumber)
            ->unread()
            ->selectRaw('category, COUNT(*) as count')
            ->groupBy('category')
            ->pluck('count', 'category');

        return response()->json([
            'success' => true,
            'summary' => [
                'total' => $counts->sum(),
                'payments' => $counts->get('payments', 0),
                'events' => $counts->get('events', 0),
                'clearance' => $counts->get('clearance', 0),
                'attendance' => $counts->get('attendance', 0),
                'general' => $counts->get('general', 0),
            ],
        ]);
    }

    // ================================================================
    // PRIVATE HELPERS
    // ================================================================
    private function formatNotification(Notification $n): array
    {
        return [
            'id' => $n->id,
            'type' => $n->type,
            'title' => $n->title,
            'message' => $n->message,
            'category' => $n->category,
            'is_read' => $n->is_read,
            'read_at' => $n->read_at?->toIso8601String(),
            'action_url' => $n->action_url,
            'reference_type' => $n->reference_type,
            'reference_id' => $n->reference_id,
            'time' => $n->time_ago,       // human readable
            'created_at' => $n->created_at->toIso8601String(),
        ];
    }
}