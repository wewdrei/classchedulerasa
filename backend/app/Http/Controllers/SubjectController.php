<?php

namespace App\Http\Controllers;

use App\Models\Subject;
use App\Services\AuditLogService;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Subject::query();

        if ($request->has('class_id')) {
            $query->where('class_id', $request->class_id);
        }

        if ($request->has('year_level')) {
            $query->where('year_level', $request->year_level);
        }

        if ($request->has('semester')) {
            $query->where('semester', $request->semester);
        }

        // Search by subject name or code
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('subject_name', 'like', "%{$search}%")
                  ->orWhere('subject_code', 'like', "%{$search}%");
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
            'subject_name' => 'required|string|max:255',
            'subject_code' => 'required|string|max:255|unique:subjects,subject_code',
            'class_id' => 'nullable|integer',
            'year_level' => 'nullable|integer',
            'semester' => 'nullable|string|max:255',
            'units' => 'nullable|integer|min:0',
            'description' => 'nullable|string',
        ]);

        $subject = Subject::create($validated);
        AuditLogService::log('create', 'subjects', $subject->id, "Created subject {$subject->subject_code} ({$subject->subject_name})", null, $request, null, $validated);

        return response()->json($subject, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $subject = Subject::findOrFail($id);
        return response()->json($subject);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $subject = Subject::findOrFail($id);

        $validated = $request->validate([
            'subject_name' => 'sometimes|required|string|max:255',
            'subject_code' => 'nullable|string|max:255|unique:subjects,subject_code,' . $id,
            'class_id' => 'nullable|integer',
            'year_level' => 'nullable|integer',
            'semester' => 'nullable|string|max:255',
            'units' => 'nullable|integer|min:0',
            'description' => 'nullable|string',
        ]);

        $oldValues = $subject->toArray();
        $subject->update($validated);
        AuditLogService::log('update', 'subjects', $id, "Updated subject {$subject->subject_code} ({$subject->subject_name})", null, $request, $oldValues, $validated);

        return response()->json($subject);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $subject = Subject::findOrFail($id);
        $subjectCode = $subject->subject_code;
        $subjectName = $subject->subject_name;
        $subject->delete();
        AuditLogService::log('delete', 'subjects', $id, "Deleted subject {$subjectCode} ({$subjectName})", null, request());

        return response()->json(['message' => 'Subject deleted successfully']);
    }
}
