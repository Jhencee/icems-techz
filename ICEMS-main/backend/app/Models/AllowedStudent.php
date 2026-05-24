<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class AllowedStudent extends Model
{
    use HasFactory;

    protected $table = 'allowed_students';

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'student_number',
        'course',
        'year',
        'password',
        'is_registered',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'is_registered' => 'boolean',
    ];
}