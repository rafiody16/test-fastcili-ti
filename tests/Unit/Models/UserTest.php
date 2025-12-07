<?php

namespace Tests\Unit\Models;

use Tests\TestCase;
use App\Models\User;
use App\Models\Level;
use Illuminate\Foundation\Testing\RefreshDatabase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test user dapat dibuat dengan data valid
     */
    public function test_user_dapat_dibuat_dengan_data_valid()
    {
        $level = Level::factory()->create(['id_level' => 4, 'nama_level' => 'Pelapor']);

        $user = User::create([
            'nama' => 'Test User',
            'email' => 'test@jti.com',
            'password' => bcrypt('password'),
            'id_level' => $level->id_level
        ]);

        $this->assertInstanceOf(User::class, $user);
        $this->assertEquals('Test User', $user->nama);
        $this->assertEquals('test@jti.com', $user->email);
        $this->assertEquals($level->id_level, $user->id_level);
    }

    /**
     * Test user memiliki relasi dengan level
     */
    public function test_user_memiliki_relasi_dengan_level()
    {
        $level = Level::factory()->create(['id_level' => 4, 'nama_level' => 'Pelapor']);

        $user = User::factory()->create([
            'id_level' => $level->id_level
        ]);

        $this->assertInstanceOf(Level::class, $user->level);
        $this->assertEquals($level->nama_level, $user->level->nama_level);
    }

    /**
     * Test email harus unique
     */
    public function test_email_harus_unique()
    {
        $this->expectException(\Illuminate\Database\QueryException::class);

        User::factory()->create(['email' => 'test@jti.com']);
        User::factory()->create(['email' => 'test@jti.com']); // Should throw exception
    }

    /**
     * Test password di-hash ketika disimpan
     */
    public function test_password_dihash_ketika_disimpan()
    {
        $user = User::factory()->create([
            'password' => bcrypt('password123')
        ]);

        $this->assertNotEquals('password123', $user->password);
        $this->assertTrue(\Hash::check('password123', $user->password));
    }

    /**
     * Test user memiliki atribut yang dapat diisi (fillable)
     */
    public function test_user_memiliki_fillable_attributes()
    {
        $user = new User();
        $fillable = $user->getFillable();

        $this->assertContains('nama', $fillable);
        $this->assertContains('email', $fillable);
        $this->assertContains('password', $fillable);
    }

    /**
     * Test user dapat dihapus
     */
    public function test_user_dapat_dihapus()
    {
        $user = User::factory()->create();
        $userId = $user->id_user;

        $user->delete();

        $this->assertDatabaseMissing('users', [
            'id_user' => $userId
        ]);
    }
}
