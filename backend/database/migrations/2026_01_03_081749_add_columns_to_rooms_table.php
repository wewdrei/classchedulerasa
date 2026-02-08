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
        if (!Schema::hasTable('rooms')) {
            Schema::create('rooms', function (Blueprint $table) {
                $table->id();
                $table->string('room_number'); // Assume this was the original column
                $table->timestamps();
            });
        }

        Schema::table('rooms', function (Blueprint $table) {
            if (!Schema::hasColumn('rooms', 'room_name')) {
                $table->string('room_name')->nullable()->after('room_number');
            }
            if (!Schema::hasColumn('rooms', 'room_code')) {
                $table->string('room_code')->nullable()->after('room_name');
            }
            if (!Schema::hasColumn('rooms', 'campus_building')) {
                $table->string('campus_building')->nullable()->after('room_code');
            }
            if (!Schema::hasColumn('rooms', 'room_type')) {
                $table->string('room_type')->nullable()->after('campus_building');
            }
            if (!Schema::hasColumn('rooms', 'capacity')) {
                $table->integer('capacity')->nullable()->default(0)->after('room_type');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->dropColumn(['room_name', 'room_code', 'campus_building', 'room_type', 'capacity']);
        });
    }
};
