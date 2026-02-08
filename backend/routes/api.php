<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DatabaseController;
use App\Http\Controllers\FileUploadController;
use App\Http\Controllers\ScheduleController;

// Auth Route
Route::post('/login', [\App\Http\Controllers\AuthController::class, 'login']);

// Audit Trail
Route::get('/audit-trail', [\App\Http\Controllers\AuditTrailController::class, 'index']);
Route::get('/audit-trail/actions', [\App\Http\Controllers\AuditTrailController::class, 'actions']);

Route::post('/upload', [FileUploadController::class, 'upload']);
Route::post('/select', [DatabaseController::class, 'select']);
Route::post('/insert', [DatabaseController::class, 'insert']);
Route::post('/update', [DatabaseController::class, 'update']);
Route::post('/delete', [DatabaseController::class, 'delete']);
Route::post('/custom', [DatabaseController::class, 'custom']);

// New Smart Scheduler Routes
Route::apiResource('schedules', ScheduleController::class);
Route::apiResource('rooms', \App\Http\Controllers\RoomController::class);
Route::apiResource('subjects', \App\Http\Controllers\SubjectController::class);

// Dashboard Aggregates
Route::get('/dashboard/stats', [\App\Http\Controllers\DashboardController::class, 'getStats']);
Route::get('/dashboard/room-utilization', [\App\Http\Controllers\DashboardController::class, 'getRoomUtilization']);
Route::get('/dashboard/teacher-workload', [\App\Http\Controllers\DashboardController::class, 'getTeacherWorkload']);
Route::get('/dashboard/sectioning-progress', [\App\Http\Controllers\DashboardController::class, 'getSectioningProgress']);
Route::get('/dashboard/schedule-status', [\App\Http\Controllers\DashboardController::class, 'getScheduleStatus']);
Route::get('/dashboard/user-roles', [\App\Http\Controllers\DashboardController::class, 'getUserRoles']);

// Masterlist Integration (SIS/Registrar)
Route::get('/masterlist', [\App\Http\Controllers\MasterlistController::class, 'index']);

// Integration Routes (EMS/LMS)
Route::post('/v1/sections', [\App\Http\Controllers\IntegrationController::class, 'pushSections']); // EMS Push
Route::get('/schedules/student/{id}', [\App\Http\Controllers\IntegrationController::class, 'getStudentSchedule']); // LMS Pull
Route::get('/schedules/teacher/{id}', [\App\Http\Controllers\IntegrationController::class, 'getTeacherSchedule']);
Route::get('/schedules/class/{id}', [\App\Http\Controllers\IntegrationController::class, 'getClassSchedule']);
