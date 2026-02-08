<?php

namespace App\Http\Controllers;

use App\Models\Schedule;
use App\Models\Room;
use App\Models\Subject;
use App\Models\SchoolClass;
use App\Models\User;
use App\Services\ScheduleConflictService;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ScheduleController extends Controller
{
    protected $conflictService;

    public function __construct(ScheduleConflictService $conflictService)
    {
        $this->conflictService = $conflictService;
    }

    public function index(Request $request)
    {
        $query = Schedule::with(['room', 'subject', 'teacher', 'schoolClass']);

        if ($request->has('teacher_id')) {
            $query->where('teacher_id', $request->teacher_id);
        }
        if ($request->has('room_id')) {
            $query->where('room_id', $request->room_id);
        }
        if ($request->has('class_id')) {
            $query->where('class_id', $request->class_id);
        }
        if ($request->has('day_of_week')) {
            $query->where('day_of_week', $request->day_of_week);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'class_id' => 'required|exists:class,id',
            'subject_id' => 'required|exists:subjects,id',
            'teacher_id' => 'required|exists:users,id',
            'room_id' => 'required|exists:rooms,id',
            'days' => 'required|array', // ['Mon', 'Wed']
            'days.*' => 'in:Mon,Tue,Wed,Thu,Fri,Sat,Sun',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'type' => 'nullable|string',
            'description' => 'nullable|string',
        ]);

        $createdSchedules = [];
        $errors = [];

        DB::beginTransaction();
        try {
            foreach ($validated['days'] as $day) {
                // Check conflicts
                $conflicts = $this->conflictService->checkConflict(
                    $day,
                    $validated['start_time'],
                    $validated['end_time'],
                    $validated['room_id'],
                    $validated['teacher_id'],
                    $validated['class_id']
                );

                if (!empty($conflicts)) {
                    $errors[$day] = $conflicts;
                    continue; // Skip creating this day if conflict exists
                    // Or throw exception to rollback all?
                    // Usually user wants to know all conflicts.
                    // Let's collect errors and fail if any.
                }

                $schedule = Schedule::create([
                    'class_id' => $validated['class_id'],
                    'subject_id' => $validated['subject_id'],
                    'teacher_id' => $validated['teacher_id'],
                    'room_id' => $validated['room_id'],
                    'day_of_week' => $day,
                    'start_time' => $validated['start_time'],
                    'end_time' => $validated['end_time'],
                    'type' => $validated['type'] ?? 'Lecture',
                    'description' => $validated['description'] ?? null,
                ]);
                $createdSchedules[] = $schedule;
            }

            if (!empty($errors)) {
                DB::rollBack();
                return response()->json([
                    'message' => 'Schedule conflicts detected.',
                    'conflicts' => $errors
                ], 422);
            }

            DB::commit();
            foreach ($createdSchedules as $s) {
                $msg = "Created schedule: {$s->day_of_week} {$s->start_time}-{$s->end_time}";
                AuditLogService::log('create', 'schedules', $s->id, $msg, null, $request, null, $s->toArray());
            }
            return response()->json(['message' => 'Schedules created successfully', 'data' => $createdSchedules], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error creating schedule', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $schedule = Schedule::findOrFail($id);

        $validated = $request->validate([
            'class_id' => 'exists:class,id',
            'subject_id' => 'exists:subjects,id',
            'teacher_id' => 'exists:users,id',
            'room_id' => 'exists:rooms,id',
            'day_of_week' => 'in:Mon,Tue,Wed,Thu,Fri,Sat,Sun',
            'start_time' => 'date_format:H:i',
            'end_time' => 'date_format:H:i|after:start_time',
            'type' => 'nullable|string',
            'description' => 'nullable|string',
        ]);

        // Merge with existing data for conflict check
        $day = $validated['day_of_week'] ?? $schedule->day_of_week;
        $start = $validated['start_time'] ?? $schedule->start_time;
        $end = $validated['end_time'] ?? $schedule->end_time;
        $room = $validated['room_id'] ?? $schedule->room_id;
        $teacher = $validated['teacher_id'] ?? $schedule->teacher_id;
        $class = $validated['class_id'] ?? $schedule->class_id;

        $conflicts = $this->conflictService->checkConflict($day, $start, $end, $room, $teacher, $class, $id);

        if (!empty($conflicts)) {
            return response()->json([
                'message' => 'Schedule conflicts detected.',
                'conflicts' => $conflicts
            ], 422);
        }

        $oldValues = $schedule->toArray();
        $schedule->update($validated);
        $msg = "Updated schedule ID {$id}: {$schedule->day_of_week} {$schedule->start_time}-{$schedule->end_time}";
        AuditLogService::log('update', 'schedules', $id, $msg, null, $request, $oldValues, $validated);

        return response()->json(['message' => 'Schedule updated successfully', 'data' => $schedule]);
    }

    public function destroy($id)
    {
        $schedule = Schedule::find($id);
        if ($schedule) {
            $msg = "Deleted schedule ID {$id}: {$schedule->day_of_week} {$schedule->start_time}-{$schedule->end_time}";
            AuditLogService::log('delete', 'schedules', $id, $msg, null, request());
        }
        Schedule::destroy($id);
        return response()->json(['message' => 'Schedule deleted successfully']);
    }
}
