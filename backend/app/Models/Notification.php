<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class Notification extends Model
{
    protected $fillable = [
        'student_number',
        'type',
        'title',
        'message',
        'category',
        'is_read',
        'read_at',
        'action_url',
        'reference_type',
        'reference_id',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'read_at' => 'datetime',
    ];

    // ─── Relationships ────────────────────────────────────────────
    public function student()
    {
        return $this->belongsTo(Student::class, 'student_number', 'student_number');
    }

    // ─── Scopes ───────────────────────────────────────────────────
    public function scopeForStudent(Builder $query, string $studentNumber): Builder
    {
        return $query->where('student_number', $studentNumber);
    }

    public function scopeUnread(Builder $query): Builder
    {
        return $query->where('is_read', false);
    }

    public function scopeRead(Builder $query): Builder
    {
        return $query->where('is_read', true);
    }

    public function scopeByCategory(Builder $query, string $category): Builder
    {
        return $query->where('category', $category);
    }

    public function scopeRecent(Builder $query, int $days = 30): Builder
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    // ─── Helpers ──────────────────────────────────────────────────
    public function markAsRead(): void
    {
        $this->update([
            'is_read' => true,
            'read_at' => now(),
        ]);
    }

    public function getTimeAgoAttribute(): string
    {
        $diff = now()->diffInSeconds($this->created_at);

        if ($diff < 60)
            return 'Just now';
        if ($diff < 3600)
            return floor($diff / 60) . ' minutes ago';
        if ($diff < 86400)
            return floor($diff / 3600) . ' hours ago';
        if ($diff < 604800)
            return floor($diff / 86400) . ' days ago';
        if ($diff < 2592000)
            return floor($diff / 604800) . ' weeks ago';

        return $this->created_at->format('M d, Y');
    }

    /**
     * Convenience factory — creates and persists a notification.
     */
    public static function send(
        string $studentNumber,
        string $type,
        string $title,
        string $message,
        string $category = 'general',
        ?string $actionUrl = null,
        ?string $referenceType = null,
        ?int $referenceId = null
    ): self {
        return self::create([
            'student_number' => $studentNumber,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'category' => $category,
            'action_url' => $actionUrl,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
        ]);
    }
}