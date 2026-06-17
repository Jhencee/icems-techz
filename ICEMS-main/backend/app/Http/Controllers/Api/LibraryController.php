<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
class LibraryController extends Controller
{
    public function getAllClearances()
    {
        try {
            $clearances = DB::table('library_clearances')->orderBy('created_at', 'desc')->get();
            return response()->json(['success' => true, 'clearances' => $clearances]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function updateStatus(Request $request)
    {
        try {
            DB::table('library_clearances')
                ->where('student_id', $request->student_id)
                ->update([
                    'status' => $request->status,
                    'remarks' => $request->remarks,
                    'updated_at' => now(),
                ]);
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}