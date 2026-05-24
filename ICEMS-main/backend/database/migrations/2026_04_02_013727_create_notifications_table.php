<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->string('student_number');        // recipient
            $table->enum('type', ['success', 'info', 'warning', 'error'])->default('info');
            $table->string('title');
            $table->text('message');
            $table->enum('category', ['payments', 'events', 'clearance', 'general', 'attendance'])->default('general');
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->string('action_url')->nullable();   // optional deep link
            $table->string('reference_type')->nullable(); // e.g. 'payment', 'event'
            $table->unsignedBigInteger('reference_id')->nullable(); // FK to that record
            $table->timestamps();

            $table->foreign('student_number')
                  ->references('student_number')
                  ->on('students')
                  ->onDelete('cascade');

            $table->index(['student_number', 'is_read']);
            $table->index(['student_number', 'category']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
