<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HealthQuestion extends Model
{
    protected $table = 'health_questions';
    protected $fillable = ['question','type','options','is_active','order'];
    protected $casts = ['options' => 'array', 'is_active' => 'boolean'];
}