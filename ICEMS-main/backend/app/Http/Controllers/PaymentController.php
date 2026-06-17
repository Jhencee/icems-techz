<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\Payment;
use App\Models\PaymentRequirement;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PaymentController extends Controller
{
    // GET /api/payment-requirements
    public function requirements(): JsonResponse
    {
        $requirements = PaymentRequirement::active()
            ->orderBy('due_date', 'asc')
            ->get();

        return response()->json(['success' => true, 'requirements' => $requirements]);
    }

    // GET /api/payments/student/{studentNumber}
    public function studentPayments(string $studentNumber): JsonResponse
    {
        $payments = Payment::where('student_number', $studentNumber)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['success' => true, 'payments' => $payments]);
    }

    // POST /api/payments  (student submits payment proof)
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'student_number' => 'required|string|exists:students,student_number',
            'requirement_id' => 'required|integer|exists:payment_requirements,id',
            'amount' => 'required|numeric|min:0',
            'proof_image' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        $requirement = PaymentRequirement::find($request->requirement_id);

        // Prevent duplicate pending payments
        $existing = Payment::where('student_number', $request->student_number)
            ->where('requirement_id', $request->requirement_id)
            ->whereIn('status', ['pending', 'verified'])
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'You already have a payment submission for this requirement.',
            ], 422);
        }

        // Store the proof image
        $path = $request->file('proof_image')->store('payment_proofs', 'public');

        $payment = Payment::create([
            'student_number' => $request->student_number,
            'requirement_id' => $request->requirement_id,
            'requirement_title' => $requirement->title,
            'amount' => $request->amount,
            'proof_image' => $path,
            'status' => 'pending',
        ]);

        // Notify student
        Notification::send(
            $request->student_number,
            'info',
            'Payment Submitted',
            "Your payment of ₱{$request->amount} for \"{$requirement->title}\" has been submitted and is pending verification.",
            'payments',
            null,
            'payment',
            $payment->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Payment submitted successfully',
            'payment' => $payment,
        ], 201);
    }

    // POST /api/payments/{id}/verify  (admin verifies or rejects)
    public function verify(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:verified,rejected',
            'admin_notes' => 'nullable|string',
        ]);

        $payment = Payment::find($id);
        if (!$payment) {
            return response()->json(['success' => false, 'message' => 'Payment not found'], 404);
        }

        $payment->update([
            'status' => $request->status,
            'admin_notes' => $request->admin_notes,
        ]);

        $isVerified = $request->status === 'verified';

        Notification::send(
            $payment->student_number,
            $isVerified ? 'success' : 'error',
            'Payment ' . ($isVerified ? 'Verified' : 'Rejected'),
            $isVerified
            ? "Your payment of ₱{$payment->amount} for \"{$payment->requirement_title}\" has been verified! ✅"
            : "Your payment for \"{$payment->requirement_title}\" was rejected. " . ($request->admin_notes ?? 'Please resubmit.'),
            'payments',
            null,
            'payment',
            $payment->id
        );

        return response()->json(['success' => true, 'payment' => $payment]);
    }

    // POST /api/payment-requirements  (admin creates requirement)
    public function storeRequirement(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'amount' => 'required|numeric|min:0',
            'due_date' => 'required|date',
            'is_mandatory' => 'boolean',
            'gcash_name' => 'nullable|string',
            'gcash_number' => 'nullable|string',
            'qr_code' => 'nullable|file|mimes:jpg,jpeg,png|max:2048',
        ]);

        $qrPath = null;
        if ($request->hasFile('qr_code')) {
            $qrPath = $request->file('qr_code')->store('qr_codes', 'public');
        }

        $requirement = PaymentRequirement::create([
            'title' => $request->title,
            'description' => $request->description,
            'amount' => $request->amount,
            'due_date' => $request->due_date,
            'is_mandatory' => $request->boolean('is_mandatory', true),
            'gcash_name' => $request->gcash_name,
            'gcash_number' => $request->gcash_number,
            'qr_code' => $qrPath,
        ]);

        // Notify all students of new payment requirement
        $studentNumbers = Student::pluck('student_number');
        $rows = $studentNumbers->map(fn($sn) => [
            'student_number' => $sn,
            'type' => 'warning',
            'title' => 'New Payment Required: ' . $requirement->title,
            'message' => "A new payment of ₱{$requirement->amount} for \"{$requirement->title}\" is due on {$requirement->due_date->format('M d, Y')}.",
            'category' => 'payments',
            'reference_type' => 'payment_requirement',
            'reference_id' => $requirement->id,
            'is_read' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ])->toArray();

        foreach (array_chunk($rows, 500) as $chunk) {
            \DB::table('notifications')->insert($chunk);
        }

        return response()->json([
            'success' => true,
            'message' => 'Payment requirement created',
            'requirement' => $requirement,
        ], 201);
    }
}