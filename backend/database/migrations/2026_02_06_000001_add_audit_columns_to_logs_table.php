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
        Schema::table('logs', function (Blueprint $table) {
            if (!Schema::hasColumn('logs', 'ip_address')) {
                $table->string('ip_address', 45)->nullable()->after('message');
            }
            if (!Schema::hasColumn('logs', 'user_agent')) {
                $table->string('user_agent', 500)->nullable()->after('ip_address');
            }
            if (!Schema::hasColumn('logs', 'old_values')) {
                $table->json('old_values')->nullable()->after('user_agent');
            }
            if (!Schema::hasColumn('logs', 'new_values')) {
                $table->json('new_values')->nullable()->after('old_values');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('logs', function (Blueprint $table) {
            $table->dropColumn(['ip_address', 'user_agent', 'old_values', 'new_values']);
        });
    }
};
