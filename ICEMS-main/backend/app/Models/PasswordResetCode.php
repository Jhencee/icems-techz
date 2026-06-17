<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
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
