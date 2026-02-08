<?php

namespace Database\Seeders;

use App\Models\Room;
use Illuminate\Database\Seeder;

/**
 * Bestlink College of the Philippines - Room Management Seeder
 *
 * Campuses:
 * - Main Campus: #1071 Quirino Highway, Brgy. Kaligayahan, Novaliches, QC
 * - Millionaire's Village (MV) Campus: Topaz St. corner Sapphire St., Brgy. San Agustin, Novaliches, QC
 *   (Includes Dr. Carino Hall - 5-story building)
 * - San Agustin Campus: 109 Susano Street, Brgy. San Agustin, Novaliches, QC
 */
class RoomSeeder extends Seeder
{
    public function run(): void
    {
        $rooms = [
            // Main Campus - Quirino Highway
            ['room_number' => 'MC-101', 'room_name' => 'Lecture Room 101', 'room_code' => 'MC101', 'campus_building' => 'Main Building', 'room_type' => 'Lecture Hall', 'capacity' => 50, 'status' => 'Active'],
            ['room_number' => 'MC-102', 'room_name' => 'Lecture Room 102', 'room_code' => 'MC102', 'campus_building' => 'Main Building', 'room_type' => 'Lecture Hall', 'capacity' => 50, 'status' => 'Active'],
            ['room_number' => 'MC-103', 'room_name' => 'Lecture Room 103', 'room_code' => 'MC103', 'campus_building' => 'Main Building', 'room_type' => 'Lecture Hall', 'capacity' => 45, 'status' => 'Active'],
            ['room_number' => 'MC-201', 'room_name' => 'Computer Lab 201', 'room_code' => 'MCL201', 'campus_building' => 'Main Building', 'room_type' => 'Computer Lab', 'capacity' => 40, 'status' => 'Active'],
            ['room_number' => 'MC-202', 'room_name' => 'Computer Lab 202', 'room_code' => 'MCL202', 'campus_building' => 'Main Building', 'room_type' => 'Computer Lab', 'capacity' => 40, 'status' => 'Active'],
            ['room_number' => 'MC-301', 'room_name' => 'Faculty Room', 'room_code' => 'MCFR', 'campus_building' => 'Main Building', 'room_type' => 'Faculty Room', 'capacity' => 20, 'status' => 'Active'],
            ['room_number' => 'MC-LIB', 'room_name' => 'Main Campus Library', 'room_code' => 'MCLIB', 'campus_building' => 'Main Building', 'room_type' => 'Library', 'capacity' => 100, 'status' => 'Active'],

            // Millionaire's Village Campus - Dr. Carino Hall (5-story)
            ['room_number' => 'DC-101', 'room_name' => 'Lecture Room 101', 'room_code' => 'DC101', 'campus_building' => 'Dr. Carino Hall', 'room_type' => 'Lecture Hall', 'capacity' => 55, 'status' => 'Active'],
            ['room_number' => 'DC-102', 'room_name' => 'Lecture Room 102', 'room_code' => 'DC102', 'campus_building' => 'Dr. Carino Hall', 'room_type' => 'Lecture Hall', 'capacity' => 55, 'status' => 'Active'],
            ['room_number' => 'DC-103', 'room_name' => 'Lecture Room 103', 'room_code' => 'DC103', 'campus_building' => 'Dr. Carino Hall', 'room_type' => 'Lecture Hall', 'capacity' => 50, 'status' => 'Active'],
            ['room_number' => 'DC-201', 'room_name' => 'IT Laboratory', 'room_code' => 'DCIT201', 'campus_building' => 'Dr. Carino Hall', 'room_type' => 'Computer Lab', 'capacity' => 45, 'status' => 'Active'],
            ['room_number' => 'DC-202', 'room_name' => 'ICT Laboratory', 'room_code' => 'DCIT202', 'campus_building' => 'Dr. Carino Hall', 'room_type' => 'Computer Lab', 'capacity' => 45, 'status' => 'Active'],
            ['room_number' => 'DC-301', 'room_name' => 'Science Laboratory', 'room_code' => 'DCSCI301', 'campus_building' => 'Dr. Carino Hall', 'room_type' => 'Science Laboratory', 'capacity' => 35, 'status' => 'Active'],
            ['room_number' => 'DC-401', 'room_name' => 'MV Campus Library', 'room_code' => 'DCLIB', 'campus_building' => 'Dr. Carino Hall', 'room_type' => 'Library', 'capacity' => 120, 'status' => 'Active'],
            ['room_number' => 'DC-402', 'room_name' => 'AVR / Seminar Room', 'room_code' => 'DCAVR', 'campus_building' => 'Dr. Carino Hall', 'room_type' => 'AVR', 'capacity' => 80, 'status' => 'Active'],
            ['room_number' => 'DC-501', 'room_name' => 'Multi-Purpose Hall', 'room_code' => 'DCMPH', 'campus_building' => 'Dr. Carino Hall', 'room_type' => 'Multi-Purpose Hall', 'capacity' => 200, 'status' => 'Active'],

            // Vicente Building (MV Campus)
            ['room_number' => 'VB-101', 'room_name' => 'Lecture Room 101', 'room_code' => 'VB101', 'campus_building' => 'Vicente Building', 'room_type' => 'Lecture Hall', 'capacity' => 50, 'status' => 'Active'],
            ['room_number' => 'VB-102', 'room_name' => 'Lecture Room 102', 'room_code' => 'VB102', 'campus_building' => 'Vicente Building', 'room_type' => 'Lecture Hall', 'capacity' => 50, 'status' => 'Active'],
            ['room_number' => 'VB-201', 'room_name' => 'Criminology Lab', 'room_code' => 'VBCRIM', 'campus_building' => 'Vicente Building', 'room_type' => 'Laboratory', 'capacity' => 40, 'status' => 'Active'],
            ['room_number' => 'VB-OFF', 'room_name' => 'Registrar Office', 'room_code' => 'VBREG', 'campus_building' => 'Vicente Building', 'room_type' => 'Office', 'capacity' => 15, 'status' => 'Active'],

            // San Agustin Campus
            ['room_number' => 'SA-101', 'room_name' => 'Lecture Room 101', 'room_code' => 'SA101', 'campus_building' => 'San Agustin Building', 'room_type' => 'Lecture Hall', 'capacity' => 45, 'status' => 'Active'],
            ['room_number' => 'SA-102', 'room_name' => 'Lecture Room 102', 'room_code' => 'SA102', 'campus_building' => 'San Agustin Building', 'room_type' => 'Lecture Hall', 'capacity' => 45, 'status' => 'Active'],
            ['room_number' => 'SA-201', 'room_name' => 'Computer Lab', 'room_code' => 'SACOMP', 'campus_building' => 'San Agustin Building', 'room_type' => 'Computer Lab', 'capacity' => 35, 'status' => 'Active'],
        ];

        foreach ($rooms as $r) {
            Room::updateOrCreate(
                ['room_code' => $r['room_code']],
                $r
            );
        }
    }
}
