<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentRequirement extends Model
{
    protected $fillable = [
        'title',
        'description',
        'amount',
        'due_date',
        'is_mandatory',
        'gcash_name',
        'gcash_number',
        'qr_code',
        'is_active',
    ];

    protected $casts = [
        'is_mandatory' => 'boolean',
        'is_active' => 'boolean',
        'due_date' => 'date',
        'amount' => 'decimal:2',
    ];

    public function payments()
    {
        return $this->hasMany(Payment::class, 'requirement_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}


class Payment extends Model
{
    protected $fillable = [
        'student_number',
        'requirement_id',
        'requirement_title',
        'amount',
        'proof_image',
        'status',
        'admin_notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function requirement()
    {
        return $this->belongsTo(PaymentRequirement::class, 'requirement_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_number', 'student_number');
    }
}


class PasswordResetCode extends Model
{
    protected $fillable = ['email', 'code', 'token', 'is_used', 'expires_at'];

    protected $casts = [
        'is_used' => 'boolean',
        'expires_at' => 'datetime',
    ];

    public function isExpired(): bool
    {
        return now()->isAfter($this->expires_at);
    }

    public function isValid(): bool
    {
        return !$this->is_used && !$this->isExpired();
    }
}