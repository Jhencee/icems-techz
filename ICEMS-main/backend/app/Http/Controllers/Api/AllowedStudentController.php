<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AllowedStudent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class AllowedStudentController extends Controller
{
    public function index()
    {
        try {
            $students = AllowedStudent::orderBy('id')->get();
            return response()->json(['success' => true, 'students' => $students]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:allowed_students,email',
            'student_number' => 'required|string|unique:allowed_students,student_number',
            'password' => 'required|string|min:6',
            'course' => 'nullable|string|max:100',
            'year' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation failed.', 'errors' => $validator->errors()], 422);
        }

        try {
            $data = [
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'email' => $request->email,
                'student_number' => $request->student_number,
                'course' => $request->course ?? null,
                'year' => $request->year ?? null,
                'password' => Hash::make($request->password),
                'is_registered' => $request->boolean('auto_registered', false),
            ];

            $student = AllowedStudent::create($data);

            try {
                AllowedStudent::on('mysql_local')->create($data);
            } catch (\Exception $localEx) {
                \Log::warning('Local DB sync failed: ' . $localEx->getMessage());
            }

            return response()->json(['success' => true, 'message' => 'Student added successfully.', 'student' => $student], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $student = AllowedStudent::find($id);
        if (!$student) {
            return response()->json(['success' => false, 'message' => 'Student not found.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:allowed_students,email,' . $id,
            'is_registered' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation failed.', 'errors' => $validator->errors()], 422);
        }

        $updateData = [
            'first_name' => $request->input('first_name', $student->first_name),
            'last_name' => $request->input('last_name', $student->last_name),
            'email' => $request->input('email', $student->email),
            'is_registered' => $request->has('is_registered') ? (bool) $request->input('is_registered') : $student->is_registered,
        ];

        $student->update($updateData);

        try {
            $localStudent = AllowedStudent::on('mysql_local')->find($id);
            if ($localStudent) $localStudent->update($updateData);
        } catch (\Exception $localEx) {
            \Log::warning('Local DB update sync failed: ' . $localEx->getMessage());
        }

        return response()->json(['success' => true, 'message' => 'Student updated successfully.', 'student' => $student->fresh()]);
    }

    public function destroy($id)
    {
        $student = AllowedStudent::find($id);
        if (!$student) {
            return response()->json(['success' => false, 'message' => 'Student not found.'], 404);
        }
        if ($student->is_registered) {
            return response()->json(['success' => false, 'message' => 'Cannot delete a registered student.'], 403);
        }

        $student->delete();

        try {
            $localStudent = AllowedStudent::on('mysql_local')->find($id);
            if ($localStudent) $localStudent->delete();
        } catch (\Exception $localEx) {
            \Log::warning('Local DB delete sync failed: ' . $localEx->getMessage());
        }

        return response()->json(['success' => true, 'message' => 'Student deleted successfully.']);
    }

    public function batch(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'students' => 'required|array|min:1',
            'students.*.first_name' => 'required|string',
            'students.*.last_name' => 'required|string',
            'students.*.email' => 'required|email',
            'students.*.student_number' => 'required|string',
            'students.*.password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation failed.', 'errors' => $validator->errors()], 422);
        }

        $successCount = 0;
        $failedCount = 0;
        $failedList = [];

        foreach ($request->students as $item) {
            try {
                $exists = AllowedStudent::where('email', $item['email'])
                    ->orWhere('student_number', $item['student_number'])
                    ->exists();

                if ($exists) {
                    $failedCount++;
                    $failedList[] = $item['email'] . ' (duplicate)';
                    continue;
                }

                $data = [
                    'first_name' => $item['first_name'],
                    'last_name' => $item['last_name'],
                    'email' => $item['email'],
                    'student_number' => $item['student_number'],
                    'course' => $item['course'] ?? null,
                    'year' => $item['year'] ?? null,
                    'password' => Hash::make($item['password']),
                    'is_registered' => false,
                ];

                AllowedStudent::create($data);

                try {
                    AllowedStudent::on('mysql_local')->create($data);
                } catch (\Exception $localEx) {
                    \Log::warning('Local DB batch sync failed: ' . $localEx->getMessage());
                }

                $successCount++;
            } catch (\Exception $e) {
                $failedCount++;
                $failedList[] = ($item['email'] ?? 'unknown') . ': ' . $e->getMessage();
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Batch complete: {$successCount} added, {$failedCount} failed.",
            'added_count' => $successCount,
            'failed_count' => $failedCount,
            'failed_emails' => $failedList,
        ]);
    }

    public function sendPassword(Request $request)
    {
        $student = AllowedStudent::find($request->student_id);
        if (!$student) {
            return response()->json(['success' => false, 'message' => 'Student not found.'], 404);
        }

        $plainPassword = $this->generatePassword();
        $student->update(['password' => Hash::make($plainPassword)]);

        try {
            Mail::raw(
                "Hello {$request->student_name},\n\nYour ICEMS account credentials:\nStudent Number: {$request->student_number}\nPassword: {$plainPassword}\n\nPlease log in and change your password.\n\nPUP Santa Maria Branch",
                function ($message) use ($request) {
                    $message->to($request->email)->subject('Your ICEMS Account Password');
                }
            );
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to send email: ' . $e->getMessage()], 500);
        }

        return response()->json(['success' => true, 'message' => "Password sent to {$request->email}."]);
    }

    public function sendPasswordsBatch(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'students' => 'required|array|min:1',
            'students.*.student_id' => 'required|integer',
            'students.*.email' => 'required|email',
            'students.*.student_name' => 'required|string',
            'students.*.student_number' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation failed.', 'errors' => $validator->errors()], 422);
        }

        $sentCount = 0;
        $failedCount = 0;
        $failedEmails = [];

        foreach ($request->students as $item) {
            try {
                $student = AllowedStudent::find($item['student_id']);
                if (!$student) { $failedCount++; $failedEmails[] = $item['email']; continue; }

                $plainPassword = $this->generatePassword();
                $student->update(['password' => Hash::make($plainPassword)]);

                Mail::raw(
                    "Hello {$item['student_name']},\n\nYour ICEMS account credentials:\nStudent Number: {$item['student_number']}\nPassword: {$plainPassword}\n\nPlease log in and change your password.\n\nPUP Santa Maria Branch",
                    function ($message) use ($item) {
                        $message->to($item['email'])->subject('Your ICEMS Account Password');
                    }
                );

                $sentCount++;
            } catch (\Exception $e) {
                $failedCount++;
                $failedEmails[] = $item['email'] ?? 'unknown';
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Sent: {$sentCount}, Failed: {$failedCount}",
            'sent_count' => $sentCount,
            'failed_count' => $failedCount,
            'failed_emails' => $failedEmails,
        ]);
    }

    private function generatePassword(int $length = 10): string
    {
        $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$';
        $password = '';
        for ($i = 0; $i < $length; $i++) {
            $password .= $chars[random_int(0, strlen($chars) - 1)];
        }
        return $password;
    }
}
