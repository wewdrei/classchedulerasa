<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MasterlistController extends Controller
{
    /**
     * Fetch masterlist from SIS/Registrar API and return grouped by section.
     */
    public function index(Request $request)
    {
        $url = config('services.masterlist.url', 'https://sisreg.jampzdev.com/api/getMasterlist.php');
        $key = config('services.masterlist.key', 'RegistrarAPIKeyPass');

        $fullUrl = rtrim($url, '?') . (str_contains($url, '?') ? '&' : '?') . 'key=' . urlencode($key);

        try {
            $response = Http::timeout(15)->get($fullUrl);

            if (!$response->successful()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to fetch masterlist from registrar',
                    'data' => [],
                ], 502);
            }

            $data = $response->json();

            if (!is_array($data)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid response from registrar API',
                    'data' => [],
                ], 502);
            }

            // Fetch personal info and build StudentID -> info map
            $personalInfoMap = $this->fetchPersonalInfoMap($key);

            // Enrich each student with personal info
            $data = array_map(function ($row) use ($personalInfoMap) {
                $studentId = $row['StudentID'] ?? $row['student_id'] ?? null;
                $info = $studentId && isset($personalInfoMap[$studentId]) ? $personalInfoMap[$studentId] : [];
                $firstName = $info['FirstName'] ?? $info['first_name'] ?? '';
                $lastName = $info['LastName'] ?? $info['last_name'] ?? '';
                $middleName = $info['MiddleName'] ?? $info['middle_name'] ?? '';
                $fullName = trim("{$firstName} " . ($middleName ? "{$middleName} " : '') . "{$lastName}");
                return array_merge($row, [
                    'full_name' => $fullName ?: null,
                    'email' => $info['email'] ?? null,
                    'gender' => $info['Gender'] ?? $info['gender'] ?? null,
                    'date_of_birth' => $info['DateOfBirth'] ?? $info['date_of_birth'] ?? null,
                    'username' => $info['username'] ?? null,
                ]);
            }, $data);

            // Group by section (Section + Course + YearLevel for uniqueness)
            $grouped = collect($data)->groupBy(function ($row) {
                $section = $row['Section'] ?? $row['section'] ?? 'Unknown';
                $course = $row['Course'] ?? $row['course'] ?? '';
                $yearLevel = $row['YearLevel'] ?? $row['year_level'] ?? '';
                return trim("{$course}|{$yearLevel}|{$section}", '|');
            })->map(function ($items, $key) {
                $first = $items->first();
                return [
                    'section_key' => $key,
                    'section' => $first['Section'] ?? $first['section'] ?? 'Unknown',
                    'course' => $first['Course'] ?? $first['course'] ?? '',
                    'year_level' => $first['YearLevel'] ?? $first['year_level'] ?? '',
                    'academic_year' => $first['AcademicYear'] ?? $first['academic_year'] ?? '',
                    'semester' => $first['Semester'] ?? $first['semester'] ?? '',
                    'class_number' => $first['ClassNumber'] ?? $first['class_number'] ?? '',
                    'branch' => $first['branch'] ?? '',
                    'count' => $items->count(),
                    'students' => $items->values()->all(),
                ];
            })->values()->all();

            return response()->json([
                'success' => true,
                'message' => 'Masterlist fetched successfully',
                'data' => $grouped,
                'total' => count($data),
            ]);
        } catch (\Throwable $e) {
            Log::error('Masterlist API error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error fetching masterlist: ' . $e->getMessage(),
                'data' => [],
            ], 500);
        }
    }

    /**
     * Fetch personal info from SIS API and return StudentID -> data map.
     */
    private function fetchPersonalInfoMap(string $key): array
    {
        $url = config('services.personalinfo.url', 'https://sisreg.jampzdev.com/api/getpersonalinfo.php');
        $fullUrl = rtrim($url, '?') . (str_contains($url, '?') ? '&' : '?') . 'key=' . urlencode($key);

        try {
            $response = Http::timeout(10)->get($fullUrl);
            if (!$response->successful()) {
                return [];
            }
            $json = $response->json();
            $data = $json['data'] ?? $json;
            if (!is_array($data)) {
                return [];
            }
            $map = [];
            foreach ($data as $row) {
                $studentId = $row['StudentID'] ?? $row['student_id'] ?? null;
                if ($studentId !== null) {
                    $map[(string) $studentId] = $row;
                }
            }
            return $map;
        } catch (\Throwable $e) {
            Log::warning('Personal info API error: ' . $e->getMessage());
            return [];
        }
    }
}
