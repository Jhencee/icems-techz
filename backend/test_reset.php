<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    $admin = App\Models\Admin::first();
    if ($admin) {
        echo 'Found: ' . $admin->name . PHP_EOL;
        $admin->update(['password' => bcrypt('test1234')]);
        echo 'Password updated OK' . PHP_EOL;
        App\Models\AuditTrail::create([
            'performed_by' => 'superadmin@gmail.com',
            'action' => 'Password Reset',
            'target' => 'Admin: ' . $admin->name,
            'ip_address' => '127.0.0.1',
            'details' => 'Test reset',
        ]);
        echo 'Audit log OK' . PHP_EOL;
        App\Models\ActivityLog::create([
            'user' => 'superadmin@gmail.com',
            'role' => 'Super Admin',
            'action' => 'Password Reset',
            'details' => 'Test',
            'ip_address' => '127.0.0.1',
        ]);
        echo 'Activity log OK' . PHP_EOL;
    } else {
        echo 'No admins found!' . PHP_EOL;
    }
} catch(Exception $e) {
    echo 'ERROR: ' . $e->getMessage() . PHP_EOL;
}
