<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\PaymentRequirement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PaymentRequirementController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $requirements = PaymentRequirement::orderBy('created_at', 'desc')->get();
            return response()->json(['success' => true, 'requirements' => $requirements]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function indexByCouncil(int $id): JsonResponse
    {
        try {
            $requirements = PaymentRequirement::where('sc_id', $id)
                ->orderBy('created_at', 'desc')->get();
            return response()->json(['success' => true, 'requirements' => $requirements]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'title'         => 'required|string|max:255',
                'amount'        => 'required|numeric|min:0',
                'description'   => 'nullable|string',
                'gcash_name'    => 'required|string|max:255',
                'gcash_number'  => 'required|string|max:20',
                'due_date'      => 'required|date',
                'is_mandatory'  => 'nullable|boolean',
            ]);
            $requirement = PaymentRequirement::create([
                'title'        => $validated['title'],
                'amount'       => $validated['amount'],
                'description'  => $validated['description'] ?? null,
                'gcash_name'   => $validated['gcash_name'],
                'gcash_number' => $validated['gcash_number'],
                'due_date'     => $validated['due_date'],
                'is_mandatory' => $request->boolean('is_mandatory', true),
            ]);
            return response()->json(['success' => true, 'message' => 'Payment requirement created', 'requirement' => $requirement], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function storeByCouncil(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'title'        => 'required|string|max:255',
                'amount'       => 'required|numeric|min:0',
                'description'  => 'nullable|string',
                'gcash_name'   => 'required|string|max:255',
                'gcash_number' => 'required|string|max:20',
                'due_date'     => 'required|date',
                'is_mandatory' => 'nullable|boolean',
            ]);
            $requirement = PaymentRequirement::updateOrCreate(
                ['sc_id' => $id],
                [
                    'sc_id'        => $id,
                    'title'        => $validated['title'],
                    'amount'       => $validated['amount'],
                    'description'  => $validated['description'] ?? null,
                    'gcash_name'   => $validated['gcash_name'],
                    'gcash_number' => $validated['gcash_number'],
                    'due_date'     => $validated['due_date'],
                    'is_mandatory' => $request->boolean('is_mandatory', true),
                ]
            );
            return response()->json(['success' => true, 'message' => 'Payment requirement saved', 'requirement' => $requirement], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $requirement = PaymentRequirement::findOrFail($id);
            return response()->json(['success' => true, 'requirement' => $requirement]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            PaymentRequirement::findOrFail($id)->delete();
            return response()->json(['success' => true, 'message' => 'Payment requirement deleted']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}