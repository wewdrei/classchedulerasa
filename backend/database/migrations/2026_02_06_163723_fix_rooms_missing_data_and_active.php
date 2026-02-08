<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Fix rooms with missing data and set all to Active.
     */
    public function up(): void
    {
        $rooms = DB::table('rooms')->get();

        foreach ($rooms as $room) {
            $updates = ['status' => 'Active'];

            if (empty($room->room_name)) {
                $updates['room_name'] = $room->room_number ?? "Room {$room->id}";
            }
            if (empty($room->room_code)) {
                $updates['room_code'] = $room->room_number ?? "R{$room->id}";
            }
            if (empty($room->campus_building)) {
                $updates['campus_building'] = 'Main Building';
            }
            if (empty($room->room_type)) {
                $updates['room_type'] = 'Lecture Hall';
            }
            if ($room->capacity === null || $room->capacity === '') {
                $updates['capacity'] = 50;
            }
            if (empty($room->room_number) && !empty($room->room_code)) {
                $updates['room_number'] = $room->room_code;
            }

            if (count($updates) > 1) {
                DB::table('rooms')->where('id', $room->id)->update($updates);
            } else {
                DB::table('rooms')->where('id', $room->id)->update(['status' => 'Active']);
            }
        }
    }

    public function down(): void
    {
        // No reversible changes
    }
};
