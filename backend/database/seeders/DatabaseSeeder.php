<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Users (Manager, Staff, Teachers)
        $manager = User::firstOrCreate([
            'email' => 'superadmin@gmail.com'
        ], [
            'first_name' => 'Super',
            'last_name' => 'Admin',
            'name' => 'Super Admin',
            'password' => bcrypt('Password_1234'),
            'role' => 'SuperAdmin', // UI maps this to Manager
            'department' => 'CCS'
        ]);

        $staff = User::firstOrCreate([
            'email' => 'admin@gmail.com'
        ], [
            'first_name' => 'Admin',
            'last_name' => 'Staff',
            'name' => 'Admin Staff',
            'password' => bcrypt('Password_1234'),
            'role' => 'Admin', // UI maps this to Staff
            'department' => 'CCS'
        ]);

        $teachers = [
            ['first_name' => 'Alan', 'last_name' => 'Turing', 'name' => 'Prof. Alan Turing', 'email' => 'turing@ccs.edu.ph', 'specialty' => 'Algorithms'],
            ['first_name' => 'Ada', 'last_name' => 'Lovelace', 'name' => 'Prof. Ada Lovelace', 'email' => 'lovelace@ccs.edu.ph', 'specialty' => 'Programming'],
            ['first_name' => 'Grace', 'last_name' => 'Hopper', 'name' => 'Prof. Grace Hopper', 'email' => 'hopper@ccs.edu.ph', 'specialty' => 'Systems'],
            ['first_name' => 'Linus', 'last_name' => 'Torvalds', 'name' => 'Mr. Linus Torvalds', 'email' => 'torvalds@ccs.edu.ph', 'specialty' => 'OS'],
            ['first_name' => 'Tim', 'last_name' => 'Berners-Lee', 'name' => 'Dr. Tim Berners-Lee', 'email' => 'berners@ccs.edu.ph', 'specialty' => 'Web'],
        ];

        $teacherIds = [];
        foreach ($teachers as $t) {
            $u = User::firstOrCreate(['email' => $t['email']], [
                'first_name' => $t['first_name'],
                'last_name' => $t['last_name'],
                'name' => $t['name'],
                'password' => bcrypt('Password_1234'),
                'role' => 'Teacher',
                'department' => 'CCS'
            ]);
            $teacherIds[] = $u->id;
        }

        // 2. Rooms - Bestlink College of the Philippines
        $this->call(RoomSeeder::class);

        // 3. Subjects
        $subjects = [
            // 1st Year, 1st Sem
            ['subject_code' => 'CC101', 'subject_name' => 'Purposive Communication', 'units' => 3, 'year_level' => 1, 'semester' => '1st', 'program_id' => 1],
            ['subject_code' => 'CC102', 'subject_name' => 'Mathematics in the Modern World', 'units' => 3, 'year_level' => 1, 'semester' => '1st', 'program_id' => 1],
            ['subject_code' => 'CC103', 'subject_name' => 'Understanding the Self', 'units' => 3, 'year_level' => 1, 'semester' => '1st', 'program_id' => 1],
            ['subject_code' => 'CC104', 'subject_name' => 'Philippine History', 'units' => 3, 'year_level' => 1, 'semester' => '1st', 'program_id' => 1],
            ['subject_code' => 'CC105', 'subject_name' => 'The Contemporary World', 'units' => 3, 'year_level' => 1, 'semester' => '1st', 'program_id' => 1],
            ['subject_code' => 'CC106', 'subject_name' => 'Physical Education 1', 'units' => 2, 'year_level' => 1, 'semester' => '1st', 'program_id' => 1],
            ['subject_code' => 'CC107', 'subject_name' => 'National Service Training Program 1 (NSTP 1)', 'units' => 3, 'year_level' => 1, 'semester' => '1st', 'program_id' => 1],
            ['subject_code' => 'CC108', 'subject_name' => 'Introduction to Computing', 'units' => 3, 'year_level' => 1, 'semester' => '1st', 'program_id' => 1],
            ['subject_code' => 'CC109', 'subject_name' => 'Living in the IT Era', 'units' => 3, 'year_level' => 1, 'semester' => '1st', 'program_id' => 1],
            
            // 1st Year, 2nd Sem
            ['subject_code' => 'CC201', 'subject_name' => 'Readings in Philippine History', 'units' => 3, 'year_level' => 1, 'semester' => '2nd', 'program_id' => 1],
            ['subject_code' => 'CC202', 'subject_name' => 'Ethics', 'units' => 3, 'year_level' => 1, 'semester' => '2nd', 'program_id' => 1],
            ['subject_code' => 'CC203', 'subject_name' => 'Science, Technology, and Society', 'units' => 3, 'year_level' => 1, 'semester' => '2nd', 'program_id' => 1],
            ['subject_code' => 'CC204', 'subject_name' => 'Art Appreciation', 'units' => 3, 'year_level' => 1, 'semester' => '2nd', 'program_id' => 1],
            ['subject_code' => 'CC205', 'subject_name' => 'Physical Education 2', 'units' => 2, 'year_level' => 1, 'semester' => '2nd', 'program_id' => 1],
            ['subject_code' => 'CC206', 'subject_name' => 'National Service Training Program 2 (NSTP 2)', 'units' => 3, 'year_level' => 1, 'semester' => '2nd', 'program_id' => 1],
            ['subject_code' => 'CC207', 'subject_name' => 'Programming 1 (Java Fundamentals)', 'units' => 3, 'year_level' => 1, 'semester' => '2nd', 'program_id' => 1],
            ['subject_code' => 'CC208', 'subject_name' => 'The Life and Works of Rizal', 'units' => 3, 'year_level' => 1, 'semester' => '2nd', 'program_id' => 1],
            ['subject_code' => 'CC209', 'subject_name' => 'Writing in the Discipline', 'units' => 3, 'year_level' => 1, 'semester' => '2nd', 'program_id' => 1],
            
            // Extra
            ['subject_code' => 'FIL101', 'subject_name' => 'Filipino', 'units' => 3, 'year_level' => 1, 'semester' => '1st', 'program_id' => 1],
        ];

        foreach ($subjects as $s) {
            \App\Models\Subject::firstOrCreate(['subject_code' => $s['subject_code']], $s);
        }

        // 4. Classes (Sections)
        $classes = [
            ['course' => 'BSIT', 'level' => 1, 'section' => 'A', 'student_count' => 42],
            ['course' => 'BSIT', 'level' => 1, 'section' => 'B', 'student_count' => 40],
            ['course' => 'BSIT', 'level' => 2, 'section' => 'A', 'student_count' => 38],
            ['course' => 'BSIT', 'level' => 2, 'section' => 'B', 'student_count' => 36],
            ['course' => 'BSIT', 'level' => 3, 'section' => 'A', 'student_count' => 35],
            ['course' => 'BSIT', 'level' => 3, 'section' => 'B', 'student_count' => 32],
            ['course' => 'BSIT', 'level' => 4, 'section' => 'A', 'student_count' => 40],
            ['course' => 'BSCS', 'level' => 1, 'section' => 'A', 'student_count' => 30],
            ['course' => 'BSCS', 'level' => 2, 'section' => 'A', 'student_count' => 28],
            ['course' => 'BSCS', 'level' => 3, 'section' => 'A', 'student_count' => 25],
        ];

        foreach ($classes as $c) {
            \App\Models\SchoolClass::firstOrCreate(
                ['course' => $c['course'], 'level' => $c['level'], 'section' => $c['section']],
                ['student_count' => $c['student_count']]
            );
        }

        // 5. Schedules (Generate some realistic ones)
        // Clear existing schedules to avoid duplicates/conflicts during seeding re-runs
        \App\Models\Schedule::truncate();
        
        // Ensure logs table exists or handle gracefully
        if (\Illuminate\Support\Facades\Schema::hasTable('logs')) {
             \Illuminate\Support\Facades\DB::table('logs')->truncate();
        }

        $allRooms = \App\Models\Room::all();
        $allSubjects = \App\Models\Subject::all();
        $allTeachers = \App\Models\User::where('role', 'Teacher')->get();
        $allClasses = \App\Models\SchoolClass::all();

        $days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        $times = ['07:30', '09:00', '10:30', '13:00', '14:30', '16:00'];

        $count = 0;
        foreach ($allClasses as $class) {
            // Assign 3-4 subjects per class
            $classSubjects = $allSubjects->where('year_level', $class->level)->take(4);
            
            foreach ($classSubjects as $subj) {
                // Find random available slot? simpler: just pick random day/time
                $day = $days[rand(0, 4)];
                $timeIdx = rand(0, count($times) - 2);
                $startTime = $times[$timeIdx];
                $endTime = $times[$timeIdx + 1]; // 1.5 hr slots
                
                $room = $allRooms->random();
                $teacher = $allTeachers->random();

                // Create Schedule
                try {
                     $schedule = \App\Models\Schedule::create([
                        'class_id' => $class->id,
                        'subject_id' => $subj->id,
                        'teacher_id' => $teacher->id,
                        'room_id' => $room->id,
                        'day_of_week' => $day,
                        'start_time' => $startTime,
                        'end_time' => $endTime,
                        'type' => $room->room_type === 'Lab' ? 'Lab' : 'Lecture',
                        'description' => 'Regular Class',
                    ]);
                    $count++;

                    // 6. Audit Trail (Realistic Logs)
                    // "True data happening": Simulate that staff created these
                    if (\Illuminate\Support\Facades\Schema::hasTable('logs')) {
                        \Illuminate\Support\Facades\DB::table('logs')->insert([
                            'user_id' => $staff->id,
                            'action' => 'Create Schedule',
                            'message' => "Scheduled {$subj->subject_code} for {$class->course} {$class->level}-{$class->section} at {$room->room_code} on {$day} {$startTime}-{$endTime}",
                            'created_at' => now()->subMinutes(rand(10, 10000)),
                            'updated_at' => now(),
                        ]);
                    }

                } catch (\Exception $e) {
                    // Ignore conflicts during seeding, just skip
                }
            }
        }
        
        // Add some log entries for other actions
        if (\Illuminate\Support\Facades\Schema::hasTable('logs')) {
            \Illuminate\Support\Facades\DB::table('logs')->insert([
                'user_id' => $manager->id,
                'action' => 'Login',
                'message' => 'User logged in successfully',
                'created_at' => now()->subMinutes(5),
                'updated_at' => now(),
            ]);
            
            \Illuminate\Support\Facades\DB::table('logs')->insert([
                'user_id' => $staff->id,
                'action' => 'Update Room',
                'message' => 'Updated room LB484 status to Under Renovation',
                'created_at' => now()->subDays(2),
                'updated_at' => now(),
            ]);
        }
    }
}
