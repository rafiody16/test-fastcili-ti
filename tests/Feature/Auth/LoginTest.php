<?php

namespace Tests\Feature\Auth;

use Tests\TestCase;
use App\Models\User;
use App\Models\Level;
use Illuminate\Foundation\Testing\RefreshDatabase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test halaman login dapat diakses
     */
    public function test_halaman_login_dapat_diakses()
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
        $response->assertViewIs('auth.login');
    }

    /**
     * Test user dapat login dengan kredensial valid
     */
    public function test_user_dapat_login_dengan_kredensial_valid()
    {
        $level = Level::factory()->create(['id_level' => 4, 'nama_level' => 'Pelapor']);

        $user = User::factory()->create([
            'email' => 'test@jti.com',
            'password' => bcrypt('password'),
            'id_level' => $level->id_level
        ]);

        $response = $this->post('/login', [
            'email' => 'test@jti.com',
            'password' => 'password'
        ]);

        $this->assertAuthenticatedAs($user);
        $response->assertRedirect('/pelapor');
    }

    /**
     * Test user tidak dapat login dengan password salah
     */
    public function test_user_tidak_dapat_login_dengan_password_salah()
    {
        $level = Level::factory()->create(['id_level' => 4]);

        $user = User::factory()->create([
            'email' => 'test@jti.com',
            'password' => bcrypt('password'),
            'id_level' => $level->id_level
        ]);

        $response = $this->post('/login', [
            'email' => 'test@jti.com',
            'password' => 'wrong-password'
        ]);

        $this->assertGuest();
        $response->assertSessionHasErrors();
    }

    /**
     * Test user pelapor redirect ke /pelapor setelah login
     */
    public function test_pelapor_redirect_ke_pelapor_page()
    {
        $level = Level::factory()->create(['id_level' => 4, 'nama_level' => 'Pelapor']);

        $user = User::factory()->create([
            'id_level' => $level->id_level
        ]);

        $response = $this->actingAs($user)->get('/');

        $response->assertRedirect('/pelapor');
    }

    /**
     * Test user teknisi redirect ke /teknisi setelah login
     */
    public function test_teknisi_redirect_ke_teknisi_page()
    {
        $level = Level::factory()->create(['id_level' => 3, 'nama_level' => 'Teknisi']);

        $user = User::factory()->create([
            'id_level' => $level->id_level
        ]);

        $response = $this->actingAs($user)->get('/');

        $response->assertRedirect('/teknisi');
    }

    /**
     * Test user admin redirect ke /home setelah login
     */
    public function test_admin_redirect_ke_home_page()
    {
        $level = Level::factory()->create(['id_level' => 1, 'nama_level' => 'Admin']);

        $user = User::factory()->create([
            'id_level' => $level->id_level
        ]);

        $response = $this->actingAs($user)->get('/');

        $response->assertRedirect('/home');
    }
}
