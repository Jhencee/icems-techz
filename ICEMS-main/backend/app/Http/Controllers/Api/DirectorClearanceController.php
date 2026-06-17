<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DirectorClearanceController extends Controller
{
    private array $tables = [
        'gymnasium'  => 'gymnasium_clearances',
        'laboratory' => 'laboratory_clearances',
        'library'    => 'library_clearances',
        'nurse'      => 'nurse_clearances',
    ];

    private array $labels = [
        'gymnasium'  => 'Gymnasium',
        'laboratory' => 'Laboratory',
        'library'    => 'Library',
        'nurse'      => 'Nurse/Medical',
    ];

    // GET /api/director/clearances
    public function index(Request $request): JsonResponse
    {
        try {
            $all = collect();

            foreach ($this->tables as $type => $table) {
                $rows = DB::table($table)->orderBy('created_at', 'desc')->get();
                foreach ($rows as $row) {
                    $all->push($this->mapRow($row, $type));
                }
            }

            if ($request->filled('sections') && $request->sections !== 'all') {
                $all = $all->where('sections', $request->sections);
            }
            if ($request->filled('status') && $request->status !== 'all') {
                $all = $all->where('status', $request->status);
            }

            return response()->json([
                'success' => true,
                'clearances' => $all->values(),
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // PUT /api/director/clearances/{type}/{id}
    public function updateStatus(Request $request, string $type, int $id): JsonResponse
    {
        $request->validate([
            'status'  => 'required|in:Pending,Approved,Rejected',
            'remarks' => 'nullable|string',
        ]);

        if (!isset($this->tables[$type])) {
            return response()->json(['success' => false, 'message' => 'Invalid clearance type'], 422);
        }

        $table = $this->tables[$type];

        $updated = DB::table($table)->where('id', $id)->update([
            'status'     => strtolower($request->status),
            'remarks'    => $request->remarks,
            'updated_at' => now(),
        ]);

        if (!$updated) {
            return response()->json(['success' => false, 'message' => 'Clearance not found'], 404);
        }

        $clearance = DB::table($table)->where('id', $id)->first();

        return response()->json(['success' => true, 'clearance' => $clearance]);
    }

    private function mapRow($row, string $type): array
    {
        $proof = match ($type) {
            'nurse' => $row->medical_certificate ?: $row->vaccination_record,
            default => $row->proof_image ?? null,
        };

        return [
            'id'            => $type . '-' . $row->id,
            'recordId'      => $row->id,
            'type'          => $type,
            'studentId'     => $row->student_id,
            'name'          => $row->student_name,
            'sections'      => $row->section,
            'clearanceType' => $this->labels[$type],
            'description'   => $row->notes,
            'proof'         => $proof,
            'status'        => ucfirst($row->status ?? 'pending'),
            'remarks'       => $row->remarks,
        ];
    }
}