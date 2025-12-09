<?php

namespace Tests\Feature;

use App\Models\Gedung;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash; // Import Facade Hash
use Tests\TestCase;

class GedungTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Helper khusus untuk login sebagai Admin JTI
     */
    private function authenticateAdmin()
    {
        // Membuat user admin dengan Hash::make
        $user = User::factory()->create([
            'email' => 'admin@jti.com',
            'password' => Hash::make('password'), // Update disini
            'id_level' => 1, 
        ]);

        $this->actingAs($user);
        
        return $user;
    }

    public function test_can_fetch_gedung_data_via_ajax()
    {
        $this->authenticateAdmin(); 

        Gedung::factory()->count(5)->create();

        $response = $this->getJson(route('gedung.index'));

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data' => [
                         '*' => ['kode_gedung', 'nama_gedung', 'deskripsi']
                     ],
                 ]);
    }

    public function test_can_search_gedung()
    {
        $this->authenticateAdmin();

        Gedung::factory()->create(['nama_gedung' => 'Gedung Serbaguna']);
        Gedung::factory()->create(['nama_gedung' => 'Gedung Olahraga']);

        $response = $this->getJson(route('gedung.index', ['search' => 'Serbaguna']));

        $response->assertStatus(200)
                 ->assertJsonFragment(['nama_gedung' => 'Gedung Serbaguna'])
                 ->assertJsonMissing(['nama_gedung' => 'Gedung Olahraga']);
    }

    public function test_store_gedung_validation_error()
    {
        $this->authenticateAdmin();

        $response = $this->postJson(route('gedung.store'), []);

        $response->assertStatus(422)
                 ->assertJson(['success' => false]);
    }

    public function test_can_store_gedung_successfully()
    {
        $this->authenticateAdmin();

        Storage::fake('public');
        $file = UploadedFile::fake()->image('gedung_baru.jpg');

        $data = [
            'kode_gedung' => 'GD-JTI-HASH', // Contoh kode unik
            'nama_gedung' => 'Gedung Sipil',
            'deskripsi'   => 'Gedung jurusan teknik sipil',
            'foto_gedung' => $file
        ];

        $response = $this->postJson(route('gedung.store'), $data);

        $response->assertStatus(200)
                 ->assertJson(['success' => true]);

        $this->assertDatabaseHas('gedung', [
            'kode_gedung' => 'GD-JTI-HASH',
            'nama_gedung' => 'Gedung Sipil'
        ]);
    }

    public function test_can_update_gedung_with_image()
    {
        $this->authenticateAdmin();

        Storage::fake('public');
        $gedung = Gedung::factory()->create();
        $newFile = UploadedFile::fake()->image('update.jpg');

        $data = [
            'nama_gedung' => 'Gedung Update',
            'deskripsi'   => 'Deskripsi Update',
            'foto_gedung' => $newFile
        ];

        // Menggunakan parameter array untuk route agar lebih aman
        $response = $this->putJson(route('gedung.update', ['id' => $gedung->id]), $data);

        $response->assertStatus(200)
                 ->assertJson(['success' => true]);

        $this->assertDatabaseHas('gedung', [
            'id' => $gedung->id,
            'nama_gedung' => 'Gedung Update'
        ]);
    }

    public function test_destroy_gedung_unauthorized_level()
    {
        // User level 3
        $userBiasa = User::factory()->create(['id_level' => 3]);
        $this->actingAs($userBiasa);
        
        $gedung = Gedung::factory()->create();

        $response = $this->deleteJson(route('gedung.destroy', ['id' => $gedung->id]));

        $this->assertDatabaseHas('gedung', ['id' => $gedung->id]);
    }

    public function test_can_destroy_gedung_by_admin()
    {
        $this->authenticateAdmin();

        $gedung = Gedung::factory()->create();

        $response = $this->deleteJson(route('gedung.destroy', ['id' => $gedung->id]));

        $response->assertStatus(200)
                 ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('gedung', ['id' => $gedung->id]);
    }
}