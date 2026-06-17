<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class NurseClearance extends Model
{
    protected $table = 'nurse_clearances';
    protected $fillable = ['student_id','student_name','section','health_answers','medical_certificate','vaccination_record','notes','status','remarks'];
    protected $casts = ['health_answers' => 'array'];
}