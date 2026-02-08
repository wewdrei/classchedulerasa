<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $password = 'Password_1234';
    $hashedPassword = Hash::make($password);

    echo "Updating passwords to: $password (bcrypt)\n";

    // Update admin@gmail.com
    $updatedAdmin = DB::table('users')->where('email', 'admin@gmail.com')->update(['password' => $hashedPassword]);
    echo "Updated admin@gmail.com: " . ($updatedAdmin ? "Yes" : "No (maybe already set)") . "\n";

    // Update superadmin@gmail.com if exists
    $superAdminExists = DB::table('users')->where('email', 'superadmin@gmail.com')->exists();
    if ($superAdminExists) {
        DB::table('users')->where('email', 'superadmin@gmail.com')->update(['password' => $hashedPassword]);
        echo "Updated superadmin@gmail.com\n";
    } else {
        // Check if there is a SuperAdmin role user to update email or create new
        $superAdminRole = DB::table('users')->where('role', 'SuperAdmin')->first();
        if ($superAdminRole) {
            echo "Found SuperAdmin user (ID: {$superAdminRole->id}). Updating email to superadmin@gmail.com and password...\n";
            DB::table('users')->where('id', $superAdminRole->id)->update([
                'email' => 'superadmin@gmail.com',
                'password' => $hashedPassword
            ]);
        } else {
            echo "Creating superadmin@gmail.com...\n";
            DB::table('users')->insert([
                'first_name' => 'Super',
                'last_name' => 'Admin',
                'email' => 'superadmin@gmail.com',
                'password' => $hashedPassword,
                'role' => 'SuperAdmin',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
