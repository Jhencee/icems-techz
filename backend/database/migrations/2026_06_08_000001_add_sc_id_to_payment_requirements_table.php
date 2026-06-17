<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::table('payment_requirements', function (Blueprint $table) {
            $table->unsignedBigInteger('sc_id')->nullable()->after('id');
            $table->foreign('sc_id')->references('id')->on('organizations')->onDelete('cascade');
        });
    }
    public function down(): void {
        Schema::table('payment_requirements', function (Blueprint $table) {
            $table->dropForeign(['sc_id']);
            $table->dropColumn('sc_id');
        });
    }
};
