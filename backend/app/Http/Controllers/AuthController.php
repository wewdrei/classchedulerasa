<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Services\AuditLogService;

class AuthController extends Controller
{
    /**
     * Handle an authentication attempt.
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        // Get user directly from database (legacy system stored MD5 hashes historically)
        $user = DB::table('users')->where('email', $credentials['email'])->first();

        if ($user) {
            $plainPassword = trim($credentials['password']);
            $storedPassword = (string) ($user->password ?? '');

            // Support BOTH:
            // - bcrypt (Laravel Hash)
            // - legacy md5 (old records)
            $bcryptOk = false;
            try {
                $bcryptOk = Hash::check($plainPassword, $storedPassword);
            } catch (\Throwable $e) {
                // If the stored password is a legacy hash (e.g. md5), Hash::check can throw.
                $bcryptOk = false;
            }
            $md5Ok = (md5($plainPassword) === $storedPassword);

            if ($bcryptOk || $md5Ok) {
                // If legacy MD5 matched, upgrade to bcrypt immediately.
                if ($md5Ok && !$bcryptOk) {
                    DB::table('users')->where('id', $user->id)->update([
                        'password' => Hash::make($plainPassword),
                    ]);
                }

                // Convert to array and remove password before returning
                $userData = (array) $user;
                unset($userData['password']);

                AuditLogService::log('login', 'users', $user->id, "User {$user->email} logged in successfully", (int) $user->id, $request);

                return response()->json([
                    'success' => true,
                    'message' => 'Login successful',
                    'data' => [$userData] // Wrap in array to match frontend expectation
                ]);
            }
        }

        return response()->json([
            'success' => false,
            'message' => 'The provided credentials do not match our records.',
        ], 401);
    }
}
