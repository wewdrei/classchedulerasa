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
        if (!Schema::hasTable('class')) {
            Schema::create('class', function (Blueprint $table) {
                $table->id();
                $table->string('course')->nullable();
                $table->integer('level')->nullable();
                $table->string('section')->nullable();
                $table->integer('adviser')->default(0);
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('class');
    }
};
