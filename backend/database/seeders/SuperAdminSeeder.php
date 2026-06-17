<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\SuperAdmin;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        // Creates the one Super Admin account.
        // Change email/password before deploying to production!
        SuperAdmin::updateOrCreate(
            ['email' => 'superadmin@pupsmb.edu.ph'],
            [
                'name' => 'Super Admin',
                'email' => 'superadmin@pupsmb.edu.ph',
                'password' => Hash::make('SuperAdmin@2026!'),
            ]
        );

        $this->command->info('✅ Super Admin seeded: superadmin@pupsmb.edu.ph / SuperAdmin@2026!');
    }
}