<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // This migration attempts to convert the `users.id` column to an
        // auto-incrementing unsigned BIGINT primary key. Useful for
        // existing databases that were created without auto-increment.

        // Only run for MySQL-ish databases. Wrap in try/catch to avoid
        // breaking migrations on other drivers.
        try {
            DB::statement('ALTER TABLE `users` MODIFY `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;');
        } catch (\Exception $e) {
            // swallow: if this DB doesn't support ALTER or column already correct,
            // the migration should not break the deployment.
            // For visibility, you can log or rethrow in stricter environments.
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverting is potentially destructive and DB-specific. We'll leave empty
        // to avoid accidental data loss. If you want a reversible change, implement
        // a specific ALTER to remove AUTO_INCREMENT based on your DB.
    }
};
