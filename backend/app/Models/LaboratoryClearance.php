<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
        'equipment_items' => 'array',
        'borrowed_equipment' => 'boolean',
        'submitted_at' => 'datetime',
    ];
}
