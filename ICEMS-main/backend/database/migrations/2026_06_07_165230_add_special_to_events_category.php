<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        DB::statement("ALTER TABLE events MODIFY COLUMN category ENUM('mandatory', 'optional', 'special') DEFAULT 'optional'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE events MODIFY COLUMN category ENUM('mandatory', 'optional') DEFAULT 'optional'");
    }
};