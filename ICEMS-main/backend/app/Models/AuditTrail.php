<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class AuditTrail extends Model
{
    use HasFactory;

    protected $table = 'audit_trails';

    protected $fillable = [
        'performed_by',
        'action',
        'target',
        'ip_address',
        'details',
    ];
}