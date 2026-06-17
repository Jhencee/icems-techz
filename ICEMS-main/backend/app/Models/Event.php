<?php
// app/Models/Event.php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Event extends Model
{
    use HasFactory;
    protected $fillable = [
        'council_id',
        'organization_id',
        'event_date',
        'title',
        'description',
        'location',
        'time',
        'start_time',
        'end_time',
        'duration',
        'category',
        'audience',
        'admin',
        'is_clearance',
    ];
    protected $casts = ['is_clearance' => 'boolean', 'event_date' => 'date'];

    public function council()
    {
        return $this->belongsTo(StudentCouncil::class, 'council_id');
    }
    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }
    public function clearanceSubmissions()
    {
        return $this->hasMany(ClearanceSubmission::class);
    }
}