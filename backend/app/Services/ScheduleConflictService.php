<?php

namespace App\Services;

use App\Models\Schedule;
use Illuminate\Support\Carbon;

class ScheduleConflictService
{
    /**
     * Wrapper for check() to match Controller usage.
     */
    public function checkConflict($day, $start, $end, $roomId, $teacherId, $classId, $excludeId = null)
    {
        return $this->check([
            'day_of_week' => $day,
            'start_time' => $start,
            'end_time' => $end,
            'room_id' => $roomId,
            'teacher_id' => $teacherId,
            'class_id' => $classId
        ], $excludeId);
    }

    /**
     * Check for scheduling conflicts.
     *
     * @param array $data Need: day_of_week, start_time, end_time, room_id, teacher_id, class_id
     * @param int|null $excludeScheduleId ID to exclude (adjustment)
     * @return array Array of conflicts or empty if none.
     */
    public function check(array $data, $excludeScheduleId = null)
    {
        $conflicts = [];
        
        $day = $data['day_of_week'] ?? null;
        $start = $data['start_time'] ?? null;
        $end = $data['end_time'] ?? null;
        
        if (!$day || !$start || !$end) {
            return $conflicts; // logic error, skip check
        }

        // Room Conflict
        if (!empty($data['room_id'])) {
            $roomConflict = $this->queryOverlap($day, $start, $end, $excludeScheduleId)
                ->where('room_id', $data['room_id'])
                ->with(['subject', 'teacher', 'schoolClass'])
                ->first();

            if ($roomConflict) {
                $conflicts['room'] = "Room is occupied by " . 
                    ($roomConflict->subject->subject_code ?? 'another class') . 
                    " (" . $roomConflict->start_time->format('H:i') . " - " . $roomConflict->end_time->format('H:i') . ")";
            }
        }

        // Teacher Conflict
        if (!empty($data['teacher_id'])) {
            $teacherConflict = $this->queryOverlap($day, $start, $end, $excludeScheduleId)
                ->where('teacher_id', $data['teacher_id'])
                ->with(['subject', 'room'])
                ->first();

            if ($teacherConflict) {
                $conflicts['teacher'] = "Teacher is busy in " . 
                    ($teacherConflict->room->room_code ?? 'another room') . 
                    " with " . ($teacherConflict->subject->subject_code ?? 'another class');
            }
        }

        // Class Conflict (Students cannot be in two places)
        if (!empty($data['class_id'])) {
            $classConflict = $this->queryOverlap($day, $start, $end, $excludeScheduleId)
                ->where('class_id', $data['class_id'])
                ->with(['subject'])
                ->first();

            if ($classConflict) {
                $conflicts['class'] = "Class/Section has " . 
                    ($classConflict->subject->subject_code ?? 'another subject') . 
                    " at this time";
            }
        }

        return $conflicts;
    }

    private function queryOverlap($day, $start, $end, $excludeId = null)
    {
        $query = Schedule::where('day_of_week', $day)
            ->where(function ($q) use ($start, $end) {
                // (StartA < EndB) and (EndA > StartB)
                $q->where('start_time', '<', $end)
                  ->where('end_time', '>', $start);
            });

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return $query;
    }
}
