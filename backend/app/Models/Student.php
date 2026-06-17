<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;

class Student extends Authenticatable
{
    protected $fillable = [
        'student_number',
        'first_name',
        'last_name',
        'email',
        'password',
        'course',
        'year',
        'section',
        'profile_picture',
    ];

    protected $hidden = ['password'];

    protected $casts = ['password' => 'hashed'];

    public function notifications()
    {
        return $this->hasMany(Notification::class, 'student_number', 'student_number');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class, 'student_number', 'student_number');
    }

    public function clearanceSubmissions()
    {
        return $this->hasMany(ClearanceSubmission::class, 'student_email', 'email');
    }

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }
}