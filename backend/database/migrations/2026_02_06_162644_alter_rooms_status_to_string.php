<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Change rooms.status from tinyint (0/1) to string for Active/Inactive/Under Renovation.
     */
    public function up(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->string('status_new', 50)->default('Active')->after('capacity');
        });
        DB::table('rooms')->update([
            'status_new' => DB::raw("CASE WHEN status = 0 THEN 'Active' WHEN status = 1 THEN 'Inactive' WHEN status = 2 THEN 'Under Renovation' ELSE 'Active' END")
        ]);
        Schema::table('rooms', function (Blueprint $table) {
            $table->dropColumn('status');
        });
        Schema::table('rooms', function (Blueprint $table) {
            $table->renameColumn('status_new', 'status');
        });
    }

    public function down(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->tinyInteger('status_old')->nullable()->after('capacity');
        });
        DB::table('rooms')->update([
            'status_old' => DB::raw("CASE WHEN status = 'Active' THEN 0 WHEN status = 'Inactive' THEN 1 WHEN status = 'Under Renovation' THEN 2 ELSE 0 END")
        ]);
        Schema::table('rooms', function (Blueprint $table) {
            $table->dropColumn('status');
        });
        Schema::table('rooms', function (Blueprint $table) {
            $table->renameColumn('status_old', 'status');
        });
    }
};
