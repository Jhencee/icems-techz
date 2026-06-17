<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class LibraryClearance extends Model
{
    protected $fillable = ['student_id','student_name','student_email','section','clearance_type','borrowed_books','book_items','proof_image','notes','status','remarks','submitted_at'];
    protected $casts = ['book_items' => 'array', 'borrowed_books' => 'boolean', 'submitted_at' => 'datetime'];
}