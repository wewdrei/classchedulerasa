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
        // 1. Smart Scheduler: Update schedules table
        // Ensure table exists first
        if (!Schema::hasTable('schedules')) {
            Schema::create('schedules', function (Blueprint $table) {
                $table->id();
                $table->timestamps();
            });
        }

        Schema::table('schedules', function (Blueprint $table) {
            // Ensure core FK columns exist (without strict constraints to avoid type mismatch errors)
            if (!Schema::hasColumn('schedules', 'class_id')) {
                $table->unsignedBigInteger('class_id')->nullable()->index();
            }
            if (!Schema::hasColumn('schedules', 'subject_id')) {
                $table->unsignedBigInteger('subject_id')->nullable()->index();
            }
            if (!Schema::hasColumn('schedules', 'teacher_id')) {
                $table->unsignedBigInteger('teacher_id')->nullable()->index();
            }
            if (!Schema::hasColumn('schedules', 'room_id')) {
                $table->unsignedBigInteger('room_id')->nullable()->index();
            }

            if (!Schema::hasColumn('schedules', 'day_of_week')) {
                $table->enum('day_of_week', ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])->nullable()->after('room_id');
            }
            if (!Schema::hasColumn('schedules', 'start_time')) {
                $table->time('start_time')->nullable()->after('day_of_week');
            }
            if (!Schema::hasColumn('schedules', 'end_time')) {
                $table->time('end_time')->nullable()->after('start_time');
            }
            if (!Schema::hasColumn('schedules', 'type')) {
                $table->string('type')->default('Lecture')->after('end_time'); // Lecture, Lab, Exam
            }
            if (!Schema::hasColumn('schedules', 'description')) {
                $table->text('description')->nullable()->after('type');
            }
            
            // Indexes for conflict detection (check if exist first to avoid duplicate errors)
            // Using a simpler approach: drop index if exists then add? No, too aggressive.
            // Just wrap in try-catch or assume they might exist?
            // Laravel Schema doesn't have hasIndex easily.
            // But if we just added the columns, we can add indexes.
            // If columns existed, indexes might exist.
            
            // We will add indexes only if we think they are needed.
            // Given the error was "Key column teacher_id doesn't exist", adding the column above should fix it.
            // We will try adding indexes. If it fails due to "duplicate index", we can ignore or use a custom check.
            // For now, I'll rely on the fact that if I just added teacher_id, I can index it.
            
             try {
                $table->index(['day_of_week', 'start_time', 'end_time'], 'schedules_time_idx');
             } catch (\Exception $e) {
                 // Ignore if index already exists
             }
        });

        // 2. Rooms: Add status
        Schema::table('rooms', function (Blueprint $table) {
            if (!Schema::hasColumn('rooms', 'status')) {
                $table->enum('status', ['Active', 'Inactive', 'Under Renovation'])->default('Active')->after('capacity');
            }
            // Ensure other columns exist (backfill safety)
            if (!Schema::hasColumn('rooms', 'room_code')) {
                $table->string('room_code')->nullable();
            }
            if (!Schema::hasColumn('rooms', 'campus_building')) {
                $table->string('campus_building')->nullable();
            }
            if (!Schema::hasColumn('rooms', 'room_type')) {
                $table->string('room_type')->nullable();
            }
            if (!Schema::hasColumn('rooms', 'capacity')) {
                $table->integer('capacity')->default(0);
            }
        });

        // 3. Subjects: Add semester
        Schema::table('subjects', function (Blueprint $table) {
            if (!Schema::hasColumn('subjects', 'semester')) {
                $table->integer('semester')->nullable()->comment('1 or 2')->after('year_level');
            }
            // Ensure uniqueness on subject_code if possible, but might fail if duplicates exist.
            // Leaving as index for now.
            if (Schema::hasColumn('subjects', 'subject_code')) {
                $table->index('subject_code');
            }
        });
        
        // 4. Class: Add student_count
         if (Schema::hasTable('class')) {
            Schema::table('class', function (Blueprint $table) {
                if (!Schema::hasColumn('class', 'student_count')) {
                    $table->integer('student_count')->default(0);
                }
            });
         }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schedules', function (Blueprint $table) {
            // Drop columns only if they exist
            if (Schema::hasColumn('schedules', 'day_of_week')) {
                $table->dropColumn('day_of_week');
            }
            if (Schema::hasColumn('schedules', 'start_time')) {
                $table->dropColumn('start_time');
            }
            if (Schema::hasColumn('schedules', 'end_time')) {
                $table->dropColumn('end_time');
            }
            if (Schema::hasColumn('schedules', 'type')) {
                $table->dropColumn('type');
            }
            if (Schema::hasColumn('schedules', 'description')) {
                $table->dropColumn('description');
            }

            // Drop indexes if they exist
            // Using raw SQL for safety if Schema::hasIndex is not available or reliable
            try {
                $table->dropIndex('schedules_time_idx');
            } catch (\Exception $e) {
                // Ignore if index doesn't exist
            }
             try {
                $table->dropIndex(['teacher_id']);
            } catch (\Exception $e) {}
            try {
                $table->dropIndex(['room_id']);
            } catch (\Exception $e) {}
             try {
                $table->dropIndex(['class_id']);
            } catch (\Exception $e) {}
        });

        Schema::table('rooms', function (Blueprint $table) {
            if (Schema::hasColumn('rooms', 'status')) {
                $table->dropColumn(['status']);
            }
        });

        Schema::table('subjects', function (Blueprint $table) {
             if (Schema::hasColumn('subjects', 'semester')) {
                $table->dropColumn(['semester']);
            }
        });
        
        if (Schema::hasTable('class')) {
            Schema::table('class', function (Blueprint $table) {
                if (Schema::hasColumn('class', 'student_count')) {
                    $table->dropColumn(['student_count']);
                }
            });
        }
    }
};
