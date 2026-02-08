<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Room;
use App\Models\Subject;
use App\Models\Schedule;
use App\Models\SchoolClass;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function getStats()
    {
        return response()->json([
            'users' => User::count(),
            'rooms' => Room::count(),
            'subjects' => Subject::count(),
            'schedules' => Schedule::count(),
            'classes' => DB::table('class')->count(), // Using DB because SchoolClass model might not match table name 'class'
        ]);
    }

    public function getRoomUtilization()
    {
        // Top 5 most used rooms based on schedule count
        $data = Schedule::select('room_id', DB::raw('count(*) as total'))
            ->groupBy('room_id')
            ->orderByDesc('total')
            ->limit(5)
            ->with('room')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->room->room_name ?? $item->room->room_code ?? 'Unknown Room',
                    'count' => $item->total
                ];
            });

        return response()->json($data);
    }

    public function getTeacherWorkload()
    {
        // Top 5 teachers by schedule count
        $data = Schedule::select('teacher_id', DB::raw('count(*) as total'))
            ->whereNotNull('teacher_id')
            ->groupBy('teacher_id')
            ->orderByDesc('total')
            ->limit(5)
            ->with('teacher')
            ->get()
            ->map(function ($item) {
                return [
                    'teacher_id' => $item->teacher_id,
                    'name' => $item->teacher->name ?? 'Unknown Teacher',
                    'count' => $item->total
                ];
            });

        return response()->json($data);
    }

    public function getSectioningProgress()
    {
        // Count of classes that have at least one schedule vs total classes
        $totalClasses = DB::table('class')->count();
        $scheduledClasses = Schedule::distinct('class_id')->count('class_id');
        
        return response()->json([
            'total' => $totalClasses,
            'scheduled' => $scheduledClasses,
            'percentage' => $totalClasses > 0 ? round(($scheduledClasses / $totalClasses) * 100, 2) : 0
        ]);
    }

    public function getScheduleStatus()
    {
        // Distribution of schedule types
        $data = Schedule::select('type', DB::raw('count(*) as total'))
            ->groupBy('type')
            ->get();
            
        return response()->json($data);
    }

    public function getUserRoles()
    {
        $data = User::select('role', DB::raw('count(*) as total'))
            ->groupBy('role')
            ->get();
            
        return response()->json($data);
    }
}
