<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use App\Services\AuditLogService;

class DatabaseController extends Controller
{
    /**
     * Resolve "logical" table names used by the frontend to the actual DB tables.
     *
     * This app historically used a `class` table with columns (section, level, course).
     * Your database uses a `program` table with columns (section, level, program).
     *
     * To avoid rewriting multiple frontend pages, we alias:
     * - `class`  -> `program`
     * And map columns:
     * - `course` <-> `program`
     */
    private function resolveTable(string $table): string
    {
        // Default to identity mapping.
        // If 'class' table exists in DB, use it directly.
        return $table;
    }

    private function mapPayloadToResolvedTable(string $originalTable, array $data): array
    {
        return $data;
    }
    // ✅ SELECT (Login + General Select)
    public function select(Request $request)
    {
        $table = $request->input('table');
        $conditions = $request->input('conditions', []);

        // Convert conditions to array if it's an object
        if (is_object($conditions)) {
            $conditions = (array) $conditions;
        }

        try {
            // ✅ Special case: login (email + password)
            if ($table === 'users' && !empty($conditions['email']) && !empty($conditions['password'])) {
                $email = trim($conditions['email']);
                $plainPassword = trim($conditions['password']);

                // Fetch user by email first, then verify password (supports bcrypt + legacy md5)
                $user = DB::selectOne("SELECT * FROM users WHERE email = ? LIMIT 1", [$email]);

                if (!$user) {
                    // Try to find user by email only for debugging
                    return response()->json([
                        'success' => false,
                        'message' => 'User not found',
                        'data'    => [],
                    ]);
                }

                // Convert stdClass to array for easier manipulation
                $user = (array) $user;

                $storedPassword = (string) ($user['password'] ?? '');
                $bcryptOk = false;
                try {
                    $bcryptOk = Hash::check($plainPassword, $storedPassword);
                } catch (\Throwable $e) {
                    // If the stored password is a legacy hash (e.g. md5), Hash::check can throw.
                    $bcryptOk = false;
                }
                $md5Ok = (md5($plainPassword) === $storedPassword);

                if (!$bcryptOk && !$md5Ok) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid password',
                        'data'    => [],
                    ]);
                }

                // If legacy MD5 matched, upgrade to bcrypt immediately.
                if ($md5Ok && !$bcryptOk && !empty($user['id'])) {
                    DB::table('users')->where('id', $user['id'])->update([
                        'password' => Hash::make($plainPassword),
                    ]);
                }

                // Password matches - login successful
                unset($user['password']);

                // ✅ Log the login action
                AuditLogService::log('login', 'users', $user['id'], "User {$user['email']} logged in successfully", (int) $user['id'], $request);

                return response()->json([
                    'success' => true,
                    'message' => 'Login successful',
                    'data'    => [$user],
                ]);
            }

            // ✅ Default: regular SELECT
            $resolvedTable = $this->resolveTable($table);

            // Use simple select * for now to avoid column name mismatch errors.
            $query = DB::table($resolvedTable);

            foreach ($conditions as $col => $val) {
                $query->where($col, $val);
            }

            $results = $query->get();

            if ($results->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No records found',
                    'data'    => [],
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Records fetched successfully',
                'data'    => $results,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage(),
                'data'    => [],
            ], 500);
        }
    }

    // ✅ INSERT
    public function insert(Request $request)
    {
        $table = $request->input('table');
        $data  = $request->input('data', []);
        $userId = $request->input('user_id_session');

        try {
            $resolvedTable = $this->resolveTable($table);
            $data = $this->mapPayloadToResolvedTable($table, $data);
            // Server-side validation for users table
            if ($table === 'users') {
                $validator = Validator::make($data, [
                    'first_name' => 'required|string|max:100',
                    'last_name' => 'required|string|max:100',
                    'email' => 'required|email|max:191|unique:users,email',
                    'password' => ['required', 'string', 'min:8', 'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-]).+$/'],
                    'role' => 'required|string|max:50',
                ], [
                    'password.regex' => 'Password must include uppercase, lowercase, number and special character.',
                ]);

                if ($validator->fails()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Validation failed',
                        'errors' => $validator->errors(),
                    ], 422);
                }
            }

            // 🔒 Hash password if present
            if (isset($data['password'])) {
                $data['password'] = Hash::make($data['password']);
            }

            // Prevent accidental insertion of primary key value
            // If frontend sends an `id` field (empty or otherwise), remove it so DB can auto-increment.
            if (isset($data['id'])) {
                unset($data['id']);
            }

            // Handle file uploads (validate image type and size)
            if ($request->hasFile('file')) {
                $file = $request->file('file');
                $mime = $file->getMimeType() ?? '';
                $size = $file->getSize() ?? 0;
                // only allow images up to 2MB
                if (!Str::startsWith($mime, 'image/')) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Uploaded file must be an image',
                    ], 422);
                }
                if ($size > 2 * 1024 * 1024) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Uploaded image must be smaller than 2MB',
                    ], 422);
                }
                $path = $file->store('uploads', 'public');
                $data['file_path'] = $path;
            }

            // Handle base64-encoded profile images sent inline (avoid storing huge
            // base64 blobs directly in the DB). If frontend sends `profile` as a
            // data URL (data:image/...), decode and store as a file and save the
            // storage path instead.
            if (isset($data['profile']) && is_string($data['profile']) && Str::startsWith($data['profile'], 'data:')) {
                try {
                    [$meta, $b64] = explode(',', $data['profile'], 2);
                    preg_match('/data:(image\/[^;]+);base64/', $meta, $m);
                    $ext = $m[1] ?? 'png';
                    $ext = str_replace('image/', '', $ext);
                    $binary = base64_decode($b64);
                    $filename = 'profiles/' . uniqid('prof_') . '.' . $ext;
                    Storage::disk('public')->put($filename, $binary);
                    // Store the public URL (e.g. '/storage/profiles/...') so frontend
                    // can use it directly without further normalization.
                    $data['profile'] = Storage::url($filename);
                } catch (\Throwable $e) {
                    // If decoding fails, remove profile to avoid DB errors
                    unset($data['profile']);
                }
            }

            // Normalize "role" to match DB column constraints (enum or max length)
            if (isset($data['role'])) {
                $roleVal = $data['role'];
                try {
                    $col = DB::select("SHOW COLUMNS FROM `users` WHERE Field = 'role'");
                    if (!empty($col) && isset($col[0]->Type)) {
                        $type = $col[0]->Type; // e.g. "enum('Admin','User')" or "varchar(20)"
                        // If enum, try to match case-insensitively to one of the allowed values
                        if (Str::startsWith($type, 'enum(')) {
                            preg_match_all("/'([^']+)'/", $type, $m);
                            $enums = $m[1] ?? [];
                            $matched = null;
                            foreach ($enums as $ev) {
                                if (strcasecmp($ev, $roleVal) === 0) {
                                    $matched = $ev;
                                    break;
                                }
                            }
                            if ($matched) {
                                $data['role'] = $matched;
                            } else {
                                // fallback to first enum value if nothing matches
                                $data['role'] = $enums[0] ?? $roleVal;
                            }
                        } else {
                            // If varchar(n) or similar, truncate to max length
                            if (preg_match('/\((\d+)\)/', $type, $m2)) {
                                $max = (int) $m2[1];
                                if (is_string($roleVal) && strlen($roleVal) > $max) {
                                    $data['role'] = substr($roleVal, 0, $max);
                                }
                            }
                        }
                    }
                } catch (\Throwable $e) {
                    // ignore and leave role as-is if inspection fails
                }
            }

            $id = DB::table($resolvedTable)->insertGetId($data);

            $userId = $userId ?? AuditLogService::resolveUserId($request);
            $msg = self::buildInsertMessage($table, $id, $data);
            AuditLogService::log('insert', $table, $id, $msg, $userId, $request, null, $data);

            return response()->json([
                'success' => true,
                'message' => 'Record inserted successfully',
                'data'    => [
                    'id'        => $id,
                    'file_path' => $data['file_path'] ?? null,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Insert failed: ' . $e->getMessage(),
                'data'    => [],
            ], 500);
        }
    }

    // ✅ UPDATE
    public function update(Request $request)
    {
        $table      = $request->input('table');
        $conditions = $request->input('conditions', $request->input('where', []));
        $data       = $request->input('data', []);
        $userId     = $request->input('user_id_session');

        try {
            $resolvedTable = $this->resolveTable($table);
            $data = $this->mapPayloadToResolvedTable($table, $data);
            if (empty($conditions)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Update failed: No conditions provided',
                    'data'    => [],
                ], 400);
            }

            if (isset($data['password'])) {
                $data['password'] = Hash::make($data['password']);
            }

            if ($request->hasFile('file')) {
                $file = $request->file('file');
                $path = $file->store('uploads', 'public');
                $data['file_path'] = $path;
            }

            // If frontend sent a base64 data URL for the `profile` field,
            // decode & store it on disk and save the file path instead of the
            // raw base64 string (which can be too large for varchar columns).
            if (isset($data['profile']) && is_string($data['profile']) && Str::startsWith($data['profile'], 'data:')) {
                try {
                    [$meta, $b64] = explode(',', $data['profile'], 2);
                    preg_match('/data:(image\/[^;]+);base64/', $meta, $m);
                    $ext = $m[1] ?? 'png';
                    $ext = str_replace('image/', '', $ext);
                    $binary = base64_decode($b64);
                    $filename = 'profiles/' . uniqid('prof_') . '.' . $ext;
                    Storage::disk('public')->put($filename, $binary);
                    // Store the public URL so frontend receives a consistent
                    // '/storage/...' value when updating a profile image.
                    $data['profile'] = Storage::url($filename);
                } catch (\Throwable $e) {
                    // If decoding fails, remove profile so the update won't try to
                    // write a too-long string into the DB column.
                    unset($data['profile']);
                }
            }

            // Normalize "role" value before update to match DB enum / length
            if (isset($data['role'])) {
                $roleVal = $data['role'];
                try {
                    $col = DB::select("SHOW COLUMNS FROM `users` WHERE Field = 'role'");
                    if (!empty($col) && isset($col[0]->Type)) {
                        $type = $col[0]->Type;
                        if (Str::startsWith($type, 'enum(')) {
                            preg_match_all("/'([^']+)'/", $type, $m);
                            $enums = $m[1] ?? [];
                            $matched = null;
                            foreach ($enums as $ev) {
                                if (strcasecmp($ev, $roleVal) === 0) { $matched = $ev; break; }
                            }
                            if ($matched) $data['role'] = $matched;
                            else $data['role'] = $enums[0] ?? $roleVal;
                        } else {
                            if (preg_match('/\((\d+)\)/', $type, $m2)) {
                                $max = (int) $m2[1];
                                if (is_string($roleVal) && strlen($roleVal) > $max) {
                                    $data['role'] = substr($roleVal, 0, $max);
                                }
                            }
                        }
                    }
                } catch (\Throwable $e) {
                    // ignore
                }
            }

            if (isset($data['email']) && isset($conditions['id'])) {
                $exists = DB::table($resolvedTable)
                    ->where('email', $data['email'])
                    ->where('id', '!=', $conditions['id'])
                    ->exists();

                if ($exists) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Email already used by another account',
                        'data'    => [],
                    ], 422);
                }
            }

            $query = DB::table($resolvedTable);
            foreach ($conditions as $col => $val) {
                $query->where($col, $val);
            }

            $recordId = $conditions['id'] ?? null;
            $oldRecord = $recordId ? DB::table($resolvedTable)->where('id', $recordId)->first() : null;
            $affected = $query->update($data);

            if ($affected > 0) {
                $userId = $userId ?? AuditLogService::resolveUserId($request);
                $oldValues = $oldRecord ? (array) $oldRecord : null;
                $msg = self::buildUpdateMessage($table, $affected, $recordId);
                AuditLogService::log('update', $table, $recordId, $msg, $userId, $request, $oldValues, $data);

                return response()->json([
                    'success' => true,
                    'message' => 'Record(s) updated successfully',
                    'data'    => [
                        'affected'  => $affected,
                        'file_path' => $data['file_path'] ?? null,
                    ],
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'No records updated (check conditions)',
                'data'    => [],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Update failed: ' . $e->getMessage(),
                'data'    => [],
            ], 500);
        }
    }

    // ✅ DELETE
    public function delete(Request $request)
    {
        $table      = $request->input('table');
        $conditions = $request->input('conditions', []);
        $userId     = $request->input('user_id_session');

        try {
            $resolvedTable = $this->resolveTable($table);
            $query = DB::table($resolvedTable);
            foreach ($conditions as $col => $val) {
                $query->where($col, $val);
            }

            $recordId = $conditions['id'] ?? null;
            $deleted = $query->delete();

            if ($deleted > 0) {
                $userId = $userId ?? AuditLogService::resolveUserId($request);
                $msg = "Deleted {$deleted} record(s) from {$table}" . ($recordId ? " (ID: {$recordId})" : '');
                AuditLogService::log('delete', $table, $recordId, $msg, $userId, $request);

                return response()->json([
                    'success' => true,
                    'message' => 'Record(s) deleted successfully',
                    'data'    => ['deleted' => $deleted],
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'No records deleted (check conditions)',
                'data'    => [],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Delete failed: ' . $e->getMessage(),
                'data'    => [],
            ], 500);
        }
    }

    // ✅ CUSTOM SQL
    public function custom(Request $request)
    {
        $sql      = $request->input('sql');
        $bindings = $request->input('bindings', []);
        $userId   = $request->input('user_id_session');

        try {
            $result = DB::select($sql, $bindings);

            $userId = $userId ?? AuditLogService::resolveUserId($request);
            AuditLogService::log('custom', 'raw_sql', null, "Executed custom SQL: " . substr($sql, 0, 200), $userId, $request);

            return response()->json([
                'success' => true,
                'message' => 'Custom query executed successfully',
                'data'    => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Custom query failed: ' . $e->getMessage(),
                'data'    => [],
            ], 500);
        }
    }

    private static function buildInsertMessage(string $table, $id, array $data): string
    {
        $label = self::getRecordLabel($table, $data);
        return "Created new record in {$table}" . ($id ? " (ID: {$id})" : '') . $label;
    }

    private static function buildUpdateMessage(string $table, int $affected, $recordId): string
    {
        return "Updated {$affected} record(s) in {$table}" . ($recordId ? " (ID: {$recordId})" : '');
    }

    private static function getRecordLabel(string $table, array $data): string
    {
        if ($table === 'users' && !empty($data['email'])) {
            return " – {$data['email']}";
        }
        if ($table === 'class' && (!empty($data['course']) || !empty($data['section']))) {
            $parts = array_filter([$data['course'] ?? '', $data['level'] ?? '', $data['section'] ?? '']);
            return ' – ' . implode('-', $parts);
        }
        if ($table === 'rooms' && !empty($data['room_code'])) {
            return " – {$data['room_code']}";
        }
        if ($table === 'subjects' && !empty($data['subject_code'])) {
            return " – {$data['subject_code']}";
        }
        return '';
    }
}
