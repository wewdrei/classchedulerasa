<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuditLogService
{
    /**
     * Resolve the acting user ID from the request.
     * Checks: user_id_session (body), X-User-Id (header), or null for system actions.
     */
    public static function resolveUserId(Request $request = null): ?int
    {
        if (!$request) {
            return null;
        }

        // From request body (legacy)
        $userId = $request->input('user_id_session');
        if ($userId !== null && $userId !== '') {
            return (int) $userId;
        }

        // From header (preferred for API consistency)
        $header = $request->header('X-User-Id');
        if ($header !== null && $header !== '') {
            return (int) $header;
        }

        return null;
    }

    /**
     * Log an audit trail entry.
     *
     * @param string $action e.g. 'login', 'insert', 'update', 'delete', 'create', 'store', etc.
     * @param string|null $tableName Database table or resource name
     * @param string|int|null $recordId Affected record ID
     * @param string $message Human-readable description
     * @param int|null $userId Acting user ID (resolved from request if not passed)
     * @param Request|null $request For resolving user_id and IP when userId is null
     * @param array|null $oldValues Previous values (for update/delete)
     * @param array|null $newValues New values (for insert/update)
     */
    public static function log(
        string $action,
        ?string $tableName = null,
        $recordId = null,
        string $message = '',
        ?int $userId = null,
        ?Request $request = null,
        ?array $oldValues = null,
        ?array $newValues = null
    ): void {
        $userId = $userId ?? self::resolveUserId($request);
        $ipAddress = $request ? $request->ip() : null;
        $userAgent = $request ? $request->userAgent() : null;

        $payload = [
            'user_id'     => $userId,
            'action'      => $action,
            'table_name'  => $tableName,
            'record_id'   => $recordId !== null ? (string) $recordId : null,
            'message'     => $message,
            'created_at'  => now(),
        ];
        if ($ipAddress && strlen($ipAddress) <= 45) {
            $payload['ip_address'] = $ipAddress;
        }
        if ($userAgent) {
            $payload['user_agent'] = substr($userAgent, 0, 500);
        }
        if ($oldValues !== null) {
            $payload['old_values'] = json_encode(self::redactSensitive($oldValues));
        }
        if ($newValues !== null) {
            $payload['new_values'] = json_encode(self::redactSensitive($newValues));
        }

        try {
            DB::table('logs')->insert($payload);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Audit log insert failed: ' . $e->getMessage());
        }
    }

    private static function redactSensitive(array $data): array
    {
        $sensitive = ['password', 'remember_token', 'api_token'];
        foreach ($sensitive as $key) {
            if (isset($data[$key])) {
                $data[$key] = '[REDACTED]';
            }
        }
        return $data;
    }
}
