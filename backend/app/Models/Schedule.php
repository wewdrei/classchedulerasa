<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Schedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'class_id',
        'subject_id',
        'teacher_id',
        'room_id',
        'day_of_week', // Mon, Tue, Wed, Thu, Fri, Sat, Sun
        'start_time',
        'end_time',
        'type',        // Lecture, Lab, Exam
        'description',
        // 'datetime_start', // Deprecated
        // 'datetime_end',   // Deprecated
    ];

    protected $casts = [
        'start_time' => 'datetime:H:i',
        'end_time' => 'datetime:H:i',
    ];

    // Relationships
    public function schoolClass() {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function subject() {
        return $this->belongsTo(Subject::class);
    }

    public function teacher() {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function room() {
        return $this->belongsTo(Room::class);
    }
}
