<?php

namespace App\Http\Controllers;

use App\Models\Room;
use App\Services\AuditLogService;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Room::query();

        if ($request->has('campus_building')) {
            $query->where('campus_building', 'like', '%' . $request->campus_building . '%');
        }

        if ($request->has('room_type')) {
            $query->where('room_type', 'like', '%' . $request->room_type . '%');
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Search by room number or name
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('room_number', 'like', "%{$search}%")
                  ->orWhere('room_name', 'like', "%{$search}%")
                  ->orWhere('room_code', 'like', "%{$search}%");
            });
        }

        return response()->json($query->get());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'room_number' => 'nullable|string|max:255',
            'room_name' => 'nullable|string|max:255',
            'room_code' => 'nullable|string|max:255',
            'campus_building' => 'nullable|string|max:255',
            'room_type' => 'nullable|string|max:255',
            'capacity' => 'nullable|integer|min:0',
            'status' => 'nullable|in:Active,Inactive,Under Renovation',
        ]);

        // Fallback: if room_number is missing, use room_code or room_name
        if (empty($validated['room_number'])) {
            $validated['room_number'] = $validated['room_code'] ?? $validated['room_name'] ?? 'N/A';
        }

        $room = Room::create($validated);
        AuditLogService::log('create', 'rooms', $room->id, "Created room {$room->room_code} ({$room->room_name})", null, $request, null, $validated);

        return response()->json($room, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $room = Room::findOrFail($id);
        return response()->json($room);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $room = Room::findOrFail($id);

        $validated = $request->validate([
            'room_number' => 'nullable|string|max:255',
            'room_name' => 'nullable|string|max:255',
            'room_code' => 'nullable|string|max:255',
            'campus_building' => 'nullable|string|max:255',
            'room_type' => 'nullable|string|max:255',
            'capacity' => 'nullable|integer|min:0',
            'status' => 'nullable|in:Active,Inactive,Under Renovation',
        ]);

        $oldValues = $room->toArray();
        $room->update($validated);
        AuditLogService::log('update', 'rooms', $id, "Updated room {$room->room_code} ({$room->room_name})", null, $request, $oldValues, $validated);

        return response()->json($room);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $room = Room::findOrFail($id);
        $roomCode = $room->room_code;
        $roomName = $room->room_name;
        $room->delete();
        AuditLogService::log('delete', 'rooms', $id, "Deleted room {$roomCode} ({$roomName})", null, request());

        return response()->json(['message' => 'Room deleted successfully']);
    }
}
