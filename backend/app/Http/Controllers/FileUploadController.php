<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FileUploadController extends Controller
{
    /**
     * Handle file uploads and return their paths.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function upload(Request $request)
    {
        $uploadedFiles = [];
        $files = $request->allFiles();

        foreach ($files as $key => $file) {
            if (is_array($file)) {
                foreach ($file as $f) {
                    $path = $f->store('uploads', 'public');
                    $uploadedFiles[$key][] = Storage::url($path);
                }
            } else {
                $path = $file->store('uploads', 'public');
                $uploadedFiles[$key] = Storage::url($path);
            }
        }

        return response()->json([
            'success' => true,
            'paths' => $uploadedFiles,
        ]);
    }
}