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
        // Create `users` only if it doesn't already exist (prevents failures when importing an existing DB)
        if (!Schema::hasTable('users')) {
            Schema::create('users', function (Blueprint $table) {
                $table->id();
                $table->string('name')->nullable(); // Make nullable just in case, though your code seems to assume it exists. Wait, if it failed it means it wasn't there?
                // Actually the error was "Unknown column 'name' in 'field list'" during insert.
                // This suggests the table `users` ALREADY exists but DOES NOT have a `name` column.
                // It likely has `first_name` and `last_name` instead based on typical old schemas.
                // But wait, the migration above SAYS it creates `name`.
                // This means the table existed BEFORE this migration ran and this migration was skipped or the table structure is different.
                
                // Let's assume we need to check columns.
                // But `create` only runs if table doesn't exist.
                // If table exists, we should use `table` to add columns.
            });
        }
        
        // Let's add a separate check to ensure columns exist even if table exists
        Schema::table('users', function (Blueprint $table) {
             if (!Schema::hasColumn('users', 'first_name')) {
                 $table->string('first_name')->nullable()->after('id');
             }
             if (!Schema::hasColumn('users', 'middle_name')) {
                 $table->string('middle_name')->nullable()->after('first_name');
             }
             if (!Schema::hasColumn('users', 'last_name')) {
                 $table->string('last_name')->nullable()->after('middle_name');
             }
             // Backwards compatibility for 'name' column if it exists and we want to keep it or migrate from it
             if (Schema::hasColumn('users', 'name') && !Schema::hasColumn('users', 'first_name')) {
                 // Maybe split name into first/last? For now just ensure new columns exist.
             }
             
             if (!Schema::hasColumn('users', 'email')) {
                 $table->string('email')->unique()->after('last_name');
             }
             if (!Schema::hasColumn('users', 'password')) {
                 $table->string('password')->after('email');
             }
             if (!Schema::hasColumn('users', 'role')) {
                 $table->string('role')->default('User')->after('password');
             }
             if (!Schema::hasColumn('users', 'profile')) {
                 $table->string('profile')->nullable()->after('role');
             }
             if (!Schema::hasColumn('users', 'department')) {
                 $table->string('department')->nullable()->after('profile');
             }
             if (!Schema::hasColumn('users', 'created_at')) {
                 $table->timestamps();
             }
        });

        // Create `password_reset_tokens` only if it doesn't already exist
        if (!Schema::hasTable('password_reset_tokens')) {
            Schema::create('password_reset_tokens', function (Blueprint $table) {
                $table->string('email')->primary();
                $table->string('token');
                $table->timestamp('created_at')->nullable();
            });
        }

        // Create `sessions` only if it doesn't already exist
        if (!Schema::hasTable('sessions')) {
            Schema::create('sessions', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->foreignId('user_id')->nullable()->index();
                $table->string('ip_address', 45)->nullable();
                $table->text('user_agent')->nullable();
                $table->longText('payload');
                $table->integer('last_activity')->index();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
