<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NurseClearance;
use App\Models\HealthQuestion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class NurseController extends Controller
{
    // GET /api/nurse/all-clearances
    public function getAllClearances()
    {
        try {
            $clearances = NurseClearance::orderBy('created_at', 'desc')
                ->get()
                ->map(function ($c) {
                    $healthAnswers = $c->health_answers;
                    if (is_string($healthAnswers)) {
                        $healthAnswers = json_decode($healthAnswers, true) ?? [];
                    }

                    return [
                        'id' => $c->id,
                        'student_id' => $c->student_id,
                        'student_name' => $c->student_name,
                        'section' => $c->section,
                        'status' => $c->status,
                        'remarks' => $c->remarks,
                        'health_answers' => $healthAnswers,
                        'medical_certificate' => $c->medical_certificate
                            ? asset('storage/' . $c->medical_certificate)
                            : null,
                        'vaccination_record' => $c->vaccination_record
                            ? asset('storage/' . $c->vaccination_record)
                            : null,
                        'notes' => $c->notes,
                        'submitted_at' => $c->created_at,
                    ];
                });

            return response()->json(['success' => true, 'clearances' => $clearances]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // POST /api/nurse/update-status
    public function updateStatus(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'student_id' => 'required|string',
            'status' => 'required|in:pending,approved,rejected',
            'remarks' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            $clearance = NurseClearance::where('student_id', $request->student_id)->latest()->firstOrFail();
            $clearance->update([
                'status' => $request->status,
                'remarks' => $request->remarks,
            ]);

            return response()->json(['success' => true, 'message' => 'Status updated', 'clearance' => $clearance]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // GET /api/nurse/questions
    public function getQuestions()
    {
        try {
            $questions = HealthQuestion::orderBy('order')->get();
            return response()->json(['success' => true, 'questions' => $questions]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // POST /api/nurse/questions
    public function createQuestion(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'question' => 'required|string',
            'description' => 'nullable|string',
            'type' => 'required|in:text,textarea,yes/no',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            $maxOrder = HealthQuestion::max('order') ?? 0;
            $question = HealthQuestion::create([
                'question' => $request->question,
                'description' => $request->description,
                'type' => $request->type,
                'order' => $maxOrder + 1,
            ]);

            return response()->json(['success' => true, 'question' => $question], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // PUT /api/nurse/questions/{id}
    public function updateQuestion(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'question' => 'required|string',
            'description' => 'nullable|string',
            'type' => 'required|in:text,textarea,yes/no',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            $question = HealthQuestion::findOrFail($id);
            $question->update($request->only(['question', 'description', 'type']));
            return response()->json(['success' => true, 'question' => $question]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // DELETE /api/nurse/questions/{id}
    public function deleteQuestion($id)
    {
        try {
            HealthQuestion::findOrFail($id)->delete();
            return response()->json(['success' => true, 'message' => 'Question deleted']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}