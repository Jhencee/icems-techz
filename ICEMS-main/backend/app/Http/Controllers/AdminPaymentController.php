<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PaymentController extends Controller
{
    // GET /api/payments
    public function index()
    {
        try {
            $payments = Payment::with('requirement')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(fn($p) => $this->formatPayment($p));

            return response()->json(['success' => true, 'payments' => $payments]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // POST /api/payments
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'requirement_id' => 'required|exists:payment_requirements,id',
            'student_number' => 'required|string',
            'student_name' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'proof_image' => 'nullable|image|max:5120',
            'reference_number' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            $proofPath = null;
            if ($request->hasFile('proof_image')) {
                $proofPath = $request->file('proof_image')->store('payments/proofs', 'public');
            }

            $payment = Payment::create([
                'requirement_id' => $request->requirement_id,
                'student_number' => $request->student_number,
                'student_name' => $request->student_name,
                'student_email' => $request->student_email,
                'course' => $request->course,
                'year' => $request->year,
                'amount' => $request->amount,
                'reference_number' => $request->reference_number,
                'proof_image' => $proofPath,
                'status' => 'pending',
            ]);

            return response()->json([
                'success' => true,
                'payment' => $this->formatPayment($payment->load('requirement')),
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // PUT /api/payments/{id}/verify
    public function verify(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:verified,rejected',
            'rejection_reason' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            $payment = Payment::findOrFail($id);
            $payment->update([
                'status' => $request->status,
                'rejection_reason' => $request->rejection_reason,
                'verified_at' => $request->status === 'verified' ? now() : null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payment status updated',
                'payment' => $this->formatPayment($payment->load('requirement')),
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // GET /api/payments/student/{studentNumber}
    public function studentHistory($studentNumber)
    {
        try {
            $payments = Payment::with('requirement')
                ->where('student_number', $studentNumber)
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(fn($p) => $this->formatPayment($p));

            return response()->json(['success' => true, 'payments' => $payments]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    private function formatPayment(Payment $p): array
    {
        return [
            'id' => $p->id,
            'requirement_id' => $p->requirement_id,
            'requirement_title' => $p->requirement?->title,
            'student_number' => $p->student_number,
            'student_name' => $p->student_name,
            'student_email' => $p->student_email,
            'course' => $p->course,
            'year' => $p->year,
            'amount' => $p->amount,
            'reference_number' => $p->reference_number,
            'status' => $p->status,
            'rejection_reason' => $p->rejection_reason,
            'proof_image' => $p->proof_image ? asset('storage/' . $p->proof_image) : null,
            'created_at' => $p->created_at,
            'verified_at' => $p->verified_at,
        ];
    }
}