<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    protected $fillable = [
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
    ];

    protected $casts = [
        'event_date' => 'date',
        'is_clearance' => 'boolean',
    ];

    public function clearanceSubmissions()
    {
        return $this->hasMany(ClearanceSubmission::class, 'event_id');
    }

    public function scopeIsClearance($query)
    {
        return $query->where('is_clearance', true);
    }

    public function scopeUpcoming($query)
    {
        return $query->where('event_date', '>=', now()->toDateString());
    }

    public function scopePast($query)
    {
        return $query->where('event_date', '<', now()->toDateString());
    }
}


class ClearanceSubmission extends Model
{
    protected $fillable = [
        'student_email',
        'event_id',
        'event_title',
        'event_date',
        'proof_image',
        'notes',
        'status',
        'admin_notes',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_email', 'email');
    }
}


class GymnasiumClearance extends Model
{
    protected $fillable = [
        'student_id',
        'student_name',
        'student_email',
        'section',
        'clearance_type',
        'borrowed_equipment',
        'equipment_items',
        'proof_image',
        'notes',
        'status',
        'remarks',
        'submitted_at',
    ];

    protected $casts = [
        'borrowed_equipment' => 'boolean',
        'equipment_items' => 'array',
        'submitted_at' => 'datetime',
    ];
}


class LaboratoryClearance extends Model
{
    protected $fillable = [
        'student_id',
        'student_name',
        'student_email',
        'section',
        'clearance_type',
        'borrowed_equipment',
        'equipment_items',
        'proof_image',
        'notes',
        'status',
        'remarks',
        'submitted_at',
    ];

    protected $casts = [
        'borrowed_equipment' => 'boolean',
        'equipment_items' => 'array',
        'submitted_at' => 'datetime',
    ];
}


class LibraryClearance extends Model
{
    protected $fillable = [
        'student_id',
        'student_name',
        'student_email',
        'section',
        'clearance_type',
        'borrowed_books',
        'book_items',
        'proof_image',
        'notes',
        'status',
        'remarks',
        'submitted_at',
    ];

    protected $casts = [
        'borrowed_books' => 'boolean',
        'book_items' => 'array',
        'submitted_at' => 'datetime',
    ];
}


class NurseClearance extends Model
{
    protected $fillable = [
        'student_id',
        'student_name',
        'section',
        'health_answers',
        'medical_certificate',
        'vaccination_record',
        'notes',
        'status',
        'remarks',
    ];

    protected $casts = [
        'health_answers' => 'array',
    ];
}


class HealthQuestion extends Model
{
    protected $fillable = ['question', 'description', 'type', 'order', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function scopeActive($query)
    {
        return $query->where('is_active', true)->orderBy('order');
    }
}