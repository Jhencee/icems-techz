<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
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
