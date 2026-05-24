<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\HealthQuestion;
use App\Models\Notification;
use App\Models\PaymentRequirement;
use App\Models\Student;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Sample Students ──────────────────────────────────────────
        $students = [
            [
                'student_number' => '2021-00001',
                'first_name' => 'Juan',
                'last_name' => 'Dela Cruz',
                'email' => 'juan.delacruz@pup.edu.ph',
                'password' => Hash::make('Password123'),
                'course' => 'BSIT',
                'year' => '3rd Year',
                'section' => 'A',
            ],
            [
                'student_number' => '2021-00002',
                'first_name' => 'Maria',
                'last_name' => 'Santos',
                'email' => 'maria.santos@pup.edu.ph',
                'password' => Hash::make('Password123'),
                'course' => 'BSCS',
                'year' => '2nd Year',
                'section' => 'B',
            ],
        ];

        foreach ($students as $data) {
            Student::firstOrCreate(['student_number' => $data['student_number']], $data);
        }

        // ── Health Questions ─────────────────────────────────────────
        $questions = [
            ['question' => 'Do you have any known allergies?', 'type' => 'yes/no', 'order' => 1],
            ['question' => 'Are you currently taking any medications?', 'type' => 'yes/no', 'order' => 2],
            ['question' => 'Do you have any chronic medical conditions?', 'type' => 'yes/no', 'order' => 3],
            ['question' => 'Have you been hospitalized in the past year?', 'type' => 'yes/no', 'order' => 4],
            ['question' => 'Do you have a history of asthma or respiratory problems?', 'type' => 'yes/no', 'order' => 5],
            ['question' => 'Are you up-to-date with your vaccinations?', 'type' => 'yes/no', 'order' => 6],
            [
                'question' => 'Please describe any current health concerns:',
                'type' => 'textarea',
                'order' => 7,
                'description' => 'If none, write N/A'
            ],
        ];

        foreach ($questions as $q) {
            HealthQuestion::firstOrCreate(['question' => $q['question']], $q);
        }

        // ── Payment Requirements ─────────────────────────────────────
        $requirements = [
            [
                'title' => 'Student Council Fee',
                'description' => 'Annual student council fee for all enrolled students.',
                'amount' => 150.00,
                'due_date' => now()->addDays(30)->toDateString(),
                'is_mandatory' => true,
                'gcash_name' => 'PUP Student Council',
                'gcash_number' => '09171234567',
            ],
            [
                'title' => 'SSO Activity Fee',
                'description' => 'Covers all SSO-organized events and activities for the semester.',
                'amount' => 200.00,
                'due_date' => now()->addDays(45)->toDateString(),
                'is_mandatory' => true,
                'gcash_name' => 'PUP SSO',
                'gcash_number' => '09179876543',
            ],
        ];

        foreach ($requirements as $req) {
            PaymentRequirement::firstOrCreate(['title' => $req['title']], $req);
        }

        // ── Sample Events ────────────────────────────────────────────
        $events = [
            [
                'title' => 'Campus Orientation Day',
                'description' => 'Annual orientation for all incoming and returning students. Attendance is mandatory for clearance.',
                'event_date' => now()->addDays(7)->toDateString(),
                'time' => '8:00 AM - 12:00 PM',
                'start_time' => '08:00',
                'end_time' => '12:00',
                'location' => 'PUP Main Auditorium',
                'audience' => 'All Students',
                'admin' => 'SSO Office',
                'is_clearance' => true,
                'category' => 'mandatory',
            ],
            [
                'title' => 'Sports Fest 2024',
                'description' => 'Annual inter-department sports festival. Open to all students.',
                'event_date' => now()->addDays(21)->toDateString(),
                'time' => '7:00 AM - 5:00 PM',
                'start_time' => '07:00',
                'end_time' => '17:00',
                'location' => 'PUP Gymnasium',
                'audience' => 'All Students',
                'admin' => 'PE Department',
                'is_clearance' => false,
                'category' => 'optional',
            ],
        ];

        foreach ($events as $ev) {
            Event::firstOrCreate(['title' => $ev['title']], $ev);
        }

        // ── Sample Notifications ─────────────────────────────────────
        $student = Student::first();
        if ($student) {
            $sampleNotifs = [
                [
                    'student_number' => $student->student_number,
                    'type' => 'success',
                    'title' => 'Payment Verified',
                    'message' => 'Your payment for Student Council Fee has been verified and approved.',
                    'category' => 'payments',
                    'is_read' => false,
                    'reference_type' => 'payment',
                    'reference_id' => 1,
                ],
                [
                    'student_number' => $student->student_number,
                    'type' => 'info',
                    'title' => 'New Event Available',
                    'message' => "Campus Orientation Day is scheduled. Attendance is required for your clearance.",
                    'category' => 'events',
                    'is_read' => false,
                    'reference_type' => 'event',
                    'reference_id' => 1,
                ],
                [
                    'student_number' => $student->student_number,
                    'type' => 'warning',
                    'title' => 'Clearance Deadline Reminder',
                    'message' => 'You have 10 days left to complete your clearance requirements. Please submit all pending items.',
                    'category' => 'clearance',
                    'is_read' => true,
                    'read_at' => now()->subHours(2),
                ],
                [
                    'student_number' => $student->student_number,
                    'type' => 'info',
                    'title' => 'Gymnasium Clearance Pending',
                    'message' => 'Your gymnasium clearance submission is currently under review.',
                    'category' => 'clearance',
                    'is_read' => false,
                ],
            ];

            foreach ($sampleNotifs as $notif) {
                Notification::create($notif);
            }
        }

        $this->command->info('✅ Database seeded successfully.');
    }
}