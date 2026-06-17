<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClearanceSubmission extends Model
{
    protected $fillable = [
        'student_email',
        'student_number',
        'student_name',
        'course',
        'year',
        'event_id',
        'event_title',
        'event_date',
        'proof_image',
        'notes',
        'status',
        'admin_notes',
        'accounting_status',
        'accounting_notes',
        'submitted_at',
    ];

    protected $casts = [
        'event_date'   => 'date',
        'submitted_at' => 'datetime',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class, 'event_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_email', 'email');
    }
}