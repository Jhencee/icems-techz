<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('clearance_submissions', function (Blueprint $table) {
            if (!Schema::hasColumn('clearance_submissions', 'student_number')) {
                $table->string('student_number')->nullable()->after('student_email');
            }
            if (!Schema::hasColumn('clearance_submissions', 'student_name')) {
                $table->string('student_name')->nullable()->after('student_number');
            }
            if (!Schema::hasColumn('clearance_submissions', 'course')) {
                $table->string('course')->nullable()->after('student_name');
            }
            if (!Schema::hasColumn('clearance_submissions', 'year')) {
                $table->string('year')->nullable()->after('course');
            }
            if (!Schema::hasColumn('clearance_submissions', 'accounting_status')) {
                $table->enum('accounting_status', ['new', 'pending', 'approved', 'rejected'])
                    ->default('new')->after('admin_notes');
            }
            if (!Schema::hasColumn('clearance_submissions', 'accounting_notes')) {
                $table->text('accounting_notes')->nullable()->after('accounting_status');
            }
            if (!Schema::hasColumn('clearance_submissions', 'submitted_at')) {
                $table->timestamp('submitted_at')->nullable()->after('accounting_notes');
            }
        });
    }

    public function down(): void
    {
        Schema::table('clearance_submissions', function (Blueprint $table) {
            $table->dropColumn(array_filter([
                Schema::hasColumn('clearance_submissions', 'accounting_status') ? 'accounting_status' : null,
                Schema::hasColumn('clearance_submissions', 'accounting_notes') ? 'accounting_notes' : null,
                Schema::hasColumn('clearance_submissions', 'submitted_at') ? 'submitted_at' : null,
            ]));
        });
    }
};
