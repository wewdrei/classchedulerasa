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
        // Check if table exists, if not create it first (backwards compatibility for broken migrations)
        if (!Schema::hasTable('subjects')) {
            Schema::create('subjects', function (Blueprint $table) {
                $table->id();
                $table->string('subject_name'); // Assume this was the original column
                $table->timestamps();
            });
        }

        Schema::table('subjects', function (Blueprint $table) {
            if (!Schema::hasColumn('subjects', 'subject_code')) {
                $table->string('subject_code')->nullable()->after('subject_name');
            }
            if (!Schema::hasColumn('subjects', 'program_id')) {
                $table->integer('program_id')->nullable()->after('subject_code');
            }
            if (!Schema::hasColumn('subjects', 'year_level')) {
                $table->integer('year_level')->nullable()->after('program_id');
            }
            // Add semester column early here if missing to prevent type mismatch later, or rely on update migration
            // Ideally migrations should be atomic. But if 2026_01_28 runs later, it will try to add it.
            // But wait, 2026_01_03 runs BEFORE 2026_01_28.
            // If I fix it here, I should remove it from 2026_01_28 or make 2026_01_28 check for it.
            // 2026_01_28 already checks `!Schema::hasColumn`.
            // So if I add it here as string, 2026_01_28 will skip adding it as integer.
             if (!Schema::hasColumn('subjects', 'semester')) {
                $table->string('semester')->nullable()->after('year_level');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropColumn(['subject_code', 'program_id', 'year_level']);
        });
    }
};
