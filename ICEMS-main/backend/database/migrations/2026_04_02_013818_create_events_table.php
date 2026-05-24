<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->date('event_date');
            $table->string('time');
            $table->string('start_time')->nullable();
            $table->string('end_time')->nullable();
            $table->string('location');
            $table->string('audience')->default('All Students');
            $table->string('admin');
            $table->boolean('is_clearance')->default(false);
            $table->enum('category', ['mandatory', 'optional'])->default('optional');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
