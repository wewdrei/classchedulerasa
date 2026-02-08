<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuditTrailController extends Controller
{
    /**
     * Get audit trail with optional filters.
     * Returns logs joined with user names, supports search and date range.
     */
    public function index(Request $request)
    {
        $query = DB::table('logs')
            ->leftJoin('users', 'logs.user_id', '=', 'users.id')
            ->select(
                'logs.id',
                'logs.user_id',
                'logs.action',
                'logs.table_name',
                'logs.record_id',
                'logs.message',
                'logs.created_at',
                'users.first_name',
                'users.last_name',
                'users.email'
            )
            ->orderBy('logs.created_at', 'desc');

        // Filter by action
        if ($request->filled('action')) {
            $query->where('logs.action', $request->input('action'));
        }

        // Filter by table/resource
        if ($request->filled('table')) {
            $query->where('logs.table_name', 'like', '%' . $request->input('table') . '%');
        }

        // Filter by user_id
        if ($request->filled('user_id')) {
            $query->where('logs.user_id', $request->input('user_id'));
        }

        // Filter by date range
        if ($request->filled('from')) {
            $query->whereDate('logs.created_at', '>=', $request->input('from'));
        }
        if ($request->filled('to')) {
            $query->whereDate('logs.created_at', '<=', $request->input('to'));
        }

        // Search across message, action, table_name
        if ($request->filled('search')) {
            $term = $request->input('search');
            $query->where(function ($q) use ($term) {
                $q->where('logs.message', 'like', "%{$term}%")
                    ->orWhere('logs.action', 'like', "%{$term}%")
                    ->orWhere('logs.table_name', 'like', "%{$term}%")
                    ->orWhere('logs.record_id', 'like', "%{$term}%")
                    ->orWhere('users.first_name', 'like', "%{$term}%")
                    ->orWhere('users.last_name', 'like', "%{$term}%")
                    ->orWhere('users.email', 'like', "%{$term}%");
            });
        }

        $perPage = min((int) ($request->input('per_page', 50)), 100);
        $logs = $query->paginate($perPage);

        // Add computed user_name field
        $logs->getCollection()->transform(function ($row) {
            $row->user_name = trim(($row->first_name ?? '') . ' ' . ($row->last_name ?? '')) ?: null;
            if (empty($row->user_name) && !empty($row->email)) {
                $row->user_name = explode('@', $row->email)[0];
            }
            if (empty($row->user_name) && $row->user_id) {
                $row->user_name = "User #{$row->user_id}";
            }
            return $row;
        });

        return response()->json($logs);
    }

    /**
     * Get distinct action types for filter dropdown.
     */
    public function actions()
    {
        $actions = DB::table('logs')->distinct()->pluck('action')->filter()->values();
        return response()->json($actions);
    }
}
