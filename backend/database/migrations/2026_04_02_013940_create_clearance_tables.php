<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Attendance / event clearance proof
        Schema::create('clearance_submissions', function (Blueprint $table) {
            $table->id();
            $table->string('student_email');
            $table->unsignedBigInteger('event_id');
            $table->string('event_title');
            $table->date('event_date');
            $table->text('proof_image');      // base64 or path
            $table->text('notes')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('admin_notes')->nullable();
            $table->timestamps();

            $table->foreign('event_id')->references('id')->on('events')->onDelete('cascade');
            $table->index(['student_email', 'status']);
        });

        // Gymnasium clearance
        Schema::create('gymnasium_clearances', function (Blueprint $table) {
            $table->id();
            $table->string('student_id');      // student_number
            $table->string('student_name');
            $table->string('student_email');
            $table->string('section')->nullable();
            $table->enum('clearance_type', ['online', 'direct_visit'])->default('online');
            $table->boolean('borrowed_equipment')->default(false);
            $table->json('equipment_items')->nullable();
            $table->text('proof_image')->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('remarks')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();

            $table->index(['student_id', 'status']);
        });

        // Laboratory clearance
        Schema::create('laboratory_clearances', function (Blueprint $table) {
            $table->id();
            $table->string('student_id');
            $table->string('student_name');
            $table->string('student_email');
            $table->string('section')->nullable();
            $table->enum('clearance_type', ['online', 'direct_visit'])->default('online');
            $table->boolean('borrowed_equipment')->default(false);
            $table->json('equipment_items')->nullable();
            $table->text('proof_image')->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('remarks')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();

            $table->index(['student_id', 'status']);
        });

        // Library clearance
        Schema::create('library_clearances', function (Blueprint $table) {
            $table->id();
            $table->string('student_id');
            $table->string('student_name');
            $table->string('student_email');
            $table->string('section')->nullable();
            $table->enum('clearance_type', ['online', 'direct_visit'])->default('online');
            $table->boolean('borrowed_books')->default(false);
            $table->json('book_items')->nullable();
            $table->text('proof_image')->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('remarks')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();

            $table->index(['student_id', 'status']);
        });

        // Nurse clearance
        Schema::create('nurse_clearances', function (Blueprint $table) {
            $table->id();
            $table->string('student_id');
            $table->string('student_name');
            $table->string('section')->nullable();
            $table->json('health_answers')->nullable();
            $table->text('medical_certificate')->nullable();
            $table->text('vaccination_record')->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->index(['student_id', 'status']);
        });

        // Health questions (managed by admin/nurse)
        Schema::create('health_questions', function (Blueprint $table) {
            $table->id();
            $table->text('question');
            $table->text('description')->nullable();
            $table->enum('type', ['yes/no', 'text', 'textarea'])->default('yes/no');
            $table->integer('order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nurse_clearances');
        Schema::dropIfExists('health_questions');
        Schema::dropIfExists('library_clearances');
        Schema::dropIfExists('laboratory_clearances');
        Schema::dropIfExists('gymnasium_clearances');
        Schema::dropIfExists('clearance_submissions');
    }
};
