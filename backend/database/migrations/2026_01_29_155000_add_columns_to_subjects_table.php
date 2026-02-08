<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->string('subject_code')->nullable()->after('subject_name');
            $table->integer('units')->default(3)->after('subject_code');
            $table->integer('year_level')->nullable()->after('units');
            $table->text('description')->nullable()->after('year_level');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropColumn(['subject_code', 'units', 'year_level', 'description']);
        });
    }
};
