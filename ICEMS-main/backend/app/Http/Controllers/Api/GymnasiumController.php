<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GymnasiumController extends Controller
{
    public function getAllClearances()
    {
        try {
            $clearances = DB::table("gymnasium_clearances")
                ->orderBy("created_at", "desc")
                ->get();
            return response()->json(["success" => true, "clearances" => $clearances]);
        } catch (\Exception $e) {
            return response()->json(["success" => false, "message" => $e->getMessage()], 500);
        }
    }

    public function submitGymnasiumClearance(Request $request)
    {
        try {
            $id = DB::table("gymnasium_clearances")->insertGetId([
                "student_id" => $request->student_id,
                "student_name" => $request->student_name,
                "student_email" => $request->student_email,
                "section" => $request->section,
                "clearance_type" => "online",
                "borrowed_equipment" => $request->borrowed_equipment ? 1 : 0,
                "equipment_items" => json_encode($request->equipment_items),
                "proof_image" => $request->proof_image,
                "notes" => $request->notes,
                "status" => "pending",
                "submitted_at" => now(),
                "created_at" => now(),
                "updated_at" => now()
            ]);
            return response()->json(["success" => true, "message" => "Clearance submitted successfully", "id" => $id]);
        } catch (\Exception $e) {
            return response()->json(["success" => false, "message" => $e->getMessage()], 500);
        }
    }

    public function updateClearance(Request $request)
    {
        try {
            DB::table("gymnasium_clearances")->where("id", $request->id)->update(["status" => $request->status, "remarks" => $request->remarks, "updated_at" => now()]);
            return response()->json(["success" => true, "message" => "Updated successfully"]);
        } catch (\Exception $e) {
            return response()->json(["success" => false, "message" => $e->getMessage()], 500);
        }
    }
}