<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SchoolClass extends Model
{
    use HasFactory;

    protected $table = 'class'; // Explicitly map to 'class' table

    protected $fillable = [
        'course',  // e.g. BSIT
        'level',   // e.g. 3
        'section', // e.g. A
        'student_count',
        'description',
        // 'program_id', // Legacy/Relation?
        // 'year_level', // Legacy?
    ];
}
