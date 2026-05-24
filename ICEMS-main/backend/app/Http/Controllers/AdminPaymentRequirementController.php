<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentRequirement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PaymentRequirementController extends Controller
{
    // GET /api/payment-requirements
    public function index(Request $request)
    {
        try {
            $query = PaymentRequirement::orderBy('created_at', 'desc');

            // Filter by organization if provided
            if ($request->has('organization')) {
                $query->where('organization', $request->organization);
            }

            $requirements = $query->get();

            return response()->json(['success' => true, 'requirements' => $requirements]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // POST /api/payment-requirements
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'due_date' => 'required|date',
            'gcash_name' => 'required|string|max:255',
            'gcash_number' => 'required|string|max:20',
            'qr_code' => 'nullable|image|max:5120',
            'is_mandatory' => 'nullable|boolean',
            'organization' => 'required|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            $qrPath = null;
            if ($request->hasFile('qr_code')) {
                $qrPath = $request->file('qr_code')->store('payment-requirements/qr', 'public');
            }

            $requirement = PaymentRequirement::create([
                'title' => $request->title,
                'amount' => $request->amount,
                'description' => $request->description,
                'due_date' => $request->due_date,
                'gcash_name' => $request->gcash_name,
                'gcash_number' => $request->gcash_number,
                'qr_code' => $qrPath,
                'is_mandatory' => $request->is_mandatory ?? true,
                'organization' => $request->organization,
            ]);

            return response()->json(['success' => true, 'requirement' => $requirement], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // GET /api/payment-requirements/{id}
    public function show($id)
    {
        try {
            $requirement = PaymentRequirement::findOrFail($id);
            return response()->json(['success' => true, 'requirement' => $requirement]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // DELETE /api/payment-requirements/{id}
    public function destroy($id)
    {
        try {
            PaymentRequirement::findOrFail($id)->delete();
            return response()->json(['success' => true, 'message' => 'Requirement deleted']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}