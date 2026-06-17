<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class AllowedStudent extends Authenticatable
{
    use HasFactory, HasApiTokens;

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
        'auto_registered',
        'password_changed',
    ];

    protected $hidden = ['password'];

    protected $casts = [
        'is_registered'    => 'boolean',
        'auto_registered'  => 'boolean',
        'password_changed' => 'boolean',
    ];
}