<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('payment_requirements', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->decimal('amount', 10, 2);
            $table->date('due_date')->nullable();
            $table->string('gcash_name')->nullable();
            $table->string('gcash_number')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_mandatory')->default(true);
            $table->string('qr_code')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('payment_requirements');
    }
};
