<?php

use Illuminate\Support\Facades\DB;
use App\Models\Subject;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$subjects = Subject::all();

foreach ($subjects as $subject) {
    try {
        // Skip if already seeded
        if (!empty($subject->subject_code) && $subject->subject_code !== 'N/A') {
            echo "Skipping {$subject->id} - already has code {$subject->subject_code}\n";
            continue;
        }

        // Parse "Code - Name" format
        if (preg_match('/^([A-Z0-9]+)\s-\s(.*)$/', $subject->subject_name, $matches)) {
            $subject->subject_code = $matches[1];
            $subject->subject_name = $matches[2]; // Clean name
        } else {
            // If no match, and we don't have a code, try to synthesize one or leave as N/A?
            // Let's generate a unique placeholder if unique constraint exists
            $subject->subject_code = 'SUBJ-' . $subject->id;
        }

        // Default Units to 3 if date is 0 or null
        if (!$subject->units) {
             $subject->units = 3;
        }

        // Infer Year Level
        if (!$subject->year_level) {
            $classLevel = DB::table('class')->where('id', $subject->class_id)->value('level');
            if ($classLevel) {
                // Handle "11", "12", "1"
                $subject->year_level = is_numeric($classLevel) ? (int)$classLevel : 1; 
            } else {
                $subject->year_level = 1;
            }
        }

        $subject->save();
        echo "Updated {$subject->id}: {$subject->subject_code}\n";

    } catch (\Exception $e) {
        echo "Error updating subject {$subject->id}: " . $e->getMessage() . "\n";
    }
}

echo "Subjects update completed.\n";
