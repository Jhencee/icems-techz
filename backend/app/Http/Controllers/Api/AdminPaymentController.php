<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\PaymentRequirement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AdminPaymentController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $payments = Payment::with('student')->orderBy('created_at', 'desc')->get()->map(fn($p) => [
                'id' => $p->id,
                'student_number' => $p->student_number,
                'student_name' => $p->student?->full_name ?? $p->student_number,
                'requirement_title' => $p->requirement_title,
                'amount' => $p->amount,
                'proof_image' => $p->proof_image ? asset('storage/' . $p->proof_image) : null,
                'status' => $p->status,
                'admin_notes' => $p->admin_notes,
                'created_at' => $p->created_at?->toDateTimeString(),
            ]);
            return response()->json(['success' => true, 'payments' => $payments->values(), 'total' => $payments->count()]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $req = PaymentRequirement::create($request->only(['title', 'amount', 'due_date', 'gcash_name', 'gcash_number', 'description', 'is_mandatory']));
            return response()->json(['success' => true, 'message' => 'Payment requirement created', 'requirement' => $req], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function studentHistory(string $studentNumber): JsonResponse
    {
        try {
            $payments = Payment::where('student_number', $studentNumber)->orderBy('created_at', 'desc')->get();
            return response()->json(['success' => true, 'payments' => $payments->values()]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function verify(Request $request, int $id): JsonResponse
    {
        try {
            $payment = Payment::findOrFail($id);
            $payment->update(['status' => $request->status, 'admin_notes' => $request->admin_notes]);
            return response()->json(['success' => true, 'message' => 'Payment updated', 'payment' => $payment]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}