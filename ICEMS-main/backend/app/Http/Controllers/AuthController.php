<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\PasswordResetCode;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    // POST /api/auth/login
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $student = Student::where('email', $request->email)->first();

        if (!$student || !Hash::check($request->password, $student->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email or password.',
            ], 401);
        }

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'student' => [
                'id' => $student->id,
                'student_number' => $student->student_number,
                'first_name' => $student->first_name,
                'last_name' => $student->last_name,
                'email' => $student->email,
                'course' => $student->course,
                'year' => $student->year,
                'section' => $student->section,
                'profile_picture' => $student->profile_picture,
            ],
        ]);
    }

    // POST /api/auth/register
    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'student_number' => 'required|unique:students,student_number',
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'email' => 'required|email|unique:students,email',
            'password' => 'required|min:8|confirmed',
            'course' => 'nullable|string',
            'year' => 'nullable|string',
            'section' => 'nullable|string',
        ]);

        $student = Student::create([
            'student_number' => $request->student_number,
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'course' => $request->course,
            'year' => $request->year,
            'section' => $request->section,
        ]);

        // Welcome notification
        Notification::send(
            $student->student_number,
            'success',
            'Welcome to the Student Portal!',
            "Hello {$student->first_name}, your account has been created successfully. Complete your clearance requirements to get started.",
            'general'
        );

        return response()->json([
            'success' => true,
            'message' => 'Registration successful',
            'student' => $student,
        ], 201);
    }

    // GET /api/students/{studentNumber}
    public function show(string $studentNumber): JsonResponse
    {
        $student = Student::where('student_number', $studentNumber)->first();

        if (!$student) {
            return response()->json(['success' => false, 'message' => 'Student not found'], 404);
        }

        return response()->json(['success' => true, 'student' => $student]);
    }

    // ─── Password Reset ───────────────────────────────────────────

    // POST /api/password/send-code
    public function sendResetCode(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email|exists:students,email']);

        // Invalidate old codes
        PasswordResetCode::where('email', $request->email)->update(['is_used' => true]);

        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        PasswordResetCode::create([
            'email' => $request->email,
            'code' => $code,
            'expires_at' => now()->addMinutes(15),
        ]);

        // Send email — configure MAIL_* in .env
        try {
            Mail::raw(
                "Your password reset code is: {$code}\n\nThis code expires in 15 minutes.",
                fn($m) => $m->to($request->email)->subject('Password Reset Code')
            );
        } catch (\Throwable $e) {
            // Log but don't expose mail errors to client
            \Log::error('Mail send failed: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Verification code sent to your email.',
        ]);
    }

    // POST /api/password/verify-code
    public function verifyCode(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6',
        ]);

        $record = PasswordResetCode::where('email', $request->email)
            ->where('code', $request->code)
            ->where('is_used', false)
            ->latest()
            ->first();

        if (!$record || $record->isExpired()) {
            return response()->json(['success' => false, 'message' => 'Invalid or expired code.'], 422);
        }

        $token = Str::random(64);
        $record->update(['token' => $token]);

        return response()->json([
            'success' => true,
            'message' => 'Code verified.',
            'token' => $token,
        ]);
    }

    // POST /api/password/reset
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
            'password' => 'required|min:8|confirmed',
        ]);

        $record = PasswordResetCode::where('token', $request->token)
            ->where('is_used', false)
            ->latest()
            ->first();

        if (!$record || $record->isExpired()) {
            return response()->json(['success' => false, 'message' => 'Invalid or expired token.'], 422);
        }

        Student::where('email', $record->email)
            ->update(['password' => Hash::make($request->password)]);

        $record->update(['is_used' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Password reset successfully.',
        ]);
    }
}