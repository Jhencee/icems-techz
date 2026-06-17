<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration
{
    public function up(): void
    {
        // Super Admin credentials table
        Schema::create('super_admins', function (Blueprint $table) {
            $table->id();
            $table->string('name')->default('Super Admin');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('remember_token')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->string('last_login_ip')->nullable();
            $table->timestamps();
        });

        // Audit trail table
        Schema::create('audit_trails', function (Blueprint $table) {
            $table->id();
            $table->string('performed_by')->default('Super Admin');
            $table->string('action');
            $table->string('target')->nullable();
            $table->string('ip_address')->nullable();
            $table->text('details')->nullable();
            $table->timestamps();
        });

        // Activity logs table
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->string('user');
            $table->string('role')->default('Admin');
            $table->string('action');
            $table->text('details')->nullable();
            $table->string('ip_address')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('audit_trails');
        Schema::dropIfExists('super_admins');
    }
};
