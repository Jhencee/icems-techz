<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    // GET /api/students
    public function index(Request $request)
    {
        try {
            $query = Student::orderBy('last_name');

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('student_number', 'like', "%{$search}%")
                        ->orWhere('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%");
                });
            }

            $students = $query->get()->map(fn($s) => [
                'student_number' => $s->student_number,
                'first_name' => $s->first_name,
                'last_name' => $s->last_name,
                'email' => $s->email,
                'course' => $s->course,
                'year' => $s->year,
                'section' => $s->section,
            ]);

            return response()->json(['success' => true, 'students' => $students]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}