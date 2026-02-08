<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SchoolClass;
use App\Models\Schedule;
use App\Models\User;
use App\Models\Room;
use App\Services\ScheduleConflictService;
use Illuminate\Support\Facades\Log;

class IntegrationController extends Controller
{
    protected $conflictService;

    public function __construct(ScheduleConflictService $conflictService)
    {
        $this->conflictService = $conflictService;
    }

    /**
     * EMS Push: Create/Update Section (Class)
     * POST /api/v1/sections
     */
    public function pushSections(Request $request)
    {
        $validated = $request->validate([
            'course' => 'required|string',
            'level' => 'required|integer',
            'section' => 'required|string',
            'student_count' => 'nullable|integer',
            // potentially other fields like program_id
        ]);

        $class = SchoolClass::updateOrCreate(
            [
                'course' => $validated['course'],
                'level' => $validated['level'],
                'section' => $validated['section']
            ],
            [
                'student_count' => $validated['student_count'] ?? 0,
                // 'target_capacity' => 50 // KPI default
            ]
        );

        // Trigger Auto-Assign
        $this->autoAssignResources($class);

        return response()->json([
            'message' => 'Section synced successfully',
            'data' => $class
        ], 200);
    }

    /**
     * LMS Pull: Student Schedule
     * GET /api/schedules/student/{id}
     */
    public function getStudentSchedule($id)
    {
        // TODO: Map student ID to Class ID? 
        // For now, assuming request might pass context or just return empty if no mapping table.
        // User instruction: "TODO if no student-class mapping"
        return response()->json(['message' => 'Student-Class mapping not implemented yet (TODO).'], 501);
    }

    /**
     * LMS Pull: Teacher Schedule
     * GET /api/schedules/teacher/{id}
     */
    public function getTeacherSchedule($id)
    {
        $schedules = Schedule::where('teacher_id', $id)
            ->with(['subject', 'room', 'schoolClass'])
            ->get()
            ->map(function ($s) {
                return $this->formatSchedule($s);
            });

        return response()->json($schedules);
    }

    /**
     * LMS Pull: Class Schedule
     * GET /api/schedules/class/{id}
     */
    public function getClassSchedule($id)
    {
        $schedules = Schedule::where('class_id', $id)
            ->with(['subject', 'room', 'teacher'])
            ->get()
            ->map(function ($s) {
                return $this->formatSchedule($s);
            });

        return response()->json($schedules);
    }

    private function formatSchedule($s)
    {
        return [
            'day_of_week' => $s->day_of_week,
            'start_time' => $s->start_time->format('H:i'),
            'end_time' => $s->end_time->format('H:i'),
            'type' => $s->type,
            'subject' => $s->subject ? $s->subject->subject_code . ' - ' . $s->subject->subject_name : 'N/A',
            'room' => $s->room ? ($s->room->room_code ?? $s->room->room_name) : 'TBA',
            'teacher' => $s->teacher ? $s->teacher->name : 'TBA',
            'section' => $s->schoolClass ? $s->schoolClass->course . ' ' . $s->schoolClass->level . '-' . $s->schoolClass->section : 'N/A',
        ];
    }

    private function autoAssignResources(SchoolClass $class)
    {
        // KPI: Attempt auto-assign room + qualified teacher
        // Logic: Find empty room matching capacity? Find teacher with subject expertise?
        // Result: Log failure if cannot assign.
        
        Log::info("Attempting auto-assign for class {$class->id}");
        
        // This is a placeholder for complex logic involving finding required subjects for the class level/program
        // and finding available slots. Without a "Curriculum" table, we don't know WHAT to schedule for this class.
        // So we log a warning.
        
        Log::warning("Auto-assign failed: Curriculum/Subjects requirements not found for class {$class->id}");
    }
}
