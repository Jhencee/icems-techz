<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class PaymentRequirement extends Model
{
    protected $fillable = [
        'sc_id',
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