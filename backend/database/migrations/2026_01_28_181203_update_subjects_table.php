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
            // Check if column exists before adding
            if (!Schema::hasColumn('subjects', 'subject_code')) {
                $table->string('subject_code')->unique()->after('subject_name');
            }
            if (!Schema::hasColumn('subjects', 'program_id')) {
                $table->unsignedBigInteger('program_id')->nullable()->after('subject_code');
            }
            if (!Schema::hasColumn('subjects', 'year_level')) {
                $table->integer('year_level')->nullable()->after('program_id');
            }
            if (!Schema::hasColumn('subjects', 'semester')) {
                 $table->string('semester')->nullable()->after('year_level'); // Changed from integer to string to support "1st", "2nd"
             }
            if (!Schema::hasColumn('subjects', 'units')) {
                $table->integer('units')->nullable()->after('semester');
            }
            if (!Schema::hasColumn('subjects', 'description')) {
                $table->text('description')->nullable()->after('units');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            if (Schema::hasColumn('subjects', 'semester')) {
                $table->dropColumn('semester');
            }
             if (Schema::hasColumn('subjects', 'units')) {
                $table->dropColumn('units');
            }
            // We generally don't drop the others as they might be from previous migrations
        });
    }
};
