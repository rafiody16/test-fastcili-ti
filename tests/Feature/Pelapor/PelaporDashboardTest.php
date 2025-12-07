<?php

namespace Tests\Feature\Pelapor;

use Tests\TestCase;
use App\Models\User;
use App\Models\Level;
use App\Models\LaporanKerusakan;
use App\Models\PelaporLaporan;
use App\Models\Fasilitas;
use App\Models\StatusLaporan;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PelaporDashboardTest extends TestCase
{
    use RefreshDatabase;

    protected $pelapor;

    protected function setUp(): void
    {
        parent::setUp();

        $level = Level::factory()->create(['id_level' => 4, 'nama_level' => 'Pelapor']);
        $this->pelapor = User::factory()->create([
            'id_level' => $level->id_level,
            'nama' => 'Pelapor Test'
        ]);
    }

    /**
     * Test guest tidak dapat akses dashboard pelapor
     */
    public function test_guest_tidak_dapat_akses_dashboard_pelapor()
    {
        $response = $this->get('/pelapor');

        $response->assertRedirect('/login');
    }

    /**
     * Test pelapor dapat akses dashboard
     */
    public function test_pelapor_dapat_akses_dashboard()
    {
        $response = $this->actingAs($this->pelapor)->get('/pelapor');

        $response->assertStatus(200);
        $response->assertViewIs('pages.pelapor.index');
        $response->assertSee('Selamat Datang');
        $response->assertSee('Pelapor Test');
    }

    /**
     * Test dashboard menampilkan laporan milik pelapor
     */
    public function test_dashboard_menampilkan_laporan_milik_pelapor()
    {
        $fasilitas = Fasilitas::factory()->create();
        $status = StatusLaporan::factory()->create();

        $laporan = LaporanKerusakan::factory()->create([
            'id_fasilitas' => $fasilitas->id_fasilitas,
            'id_status' => $status->id_status,
            'deskripsi' => 'Lampu rusak'
        ]);

        PelaporLaporan::factory()->create([
            'id_user' => $this->pelapor->id,
            'id_laporan' => $laporan->id_laporan
        ]);

        $response = $this->actingAs($this->pelapor)->get('/pelapor');

        $response->assertStatus(200);
        $response->assertSee('Lampu rusak');
    }

    /**
     * Test pelapor dapat akses halaman create laporan
     */
    public function test_pelapor_dapat_akses_halaman_create_laporan()
    {
        $response = $this->actingAs($this->pelapor)->get('/pelapor/create');

        $response->assertStatus(200);
        $response->assertViewIs('pages.pelapor.create');
    }

    /**
     * Test pelapor dapat melihat detail laporan mereka
     */
    public function test_pelapor_dapat_melihat_detail_laporan_mereka()
    {
        $fasilitas = Fasilitas::factory()->create();
        $status = StatusLaporan::factory()->create();

        $laporan = LaporanKerusakan::factory()->create([
            'id_fasilitas' => $fasilitas->id_fasilitas,
            'id_status' => $status->id_status
        ]);

        PelaporLaporan::factory()->create([
            'id_user' => $this->pelapor->id,
            'id_laporan' => $laporan->id_laporan
        ]);

        $response = $this->actingAs($this->pelapor)
            ->get('/pelapor/detail/' . $laporan->id_laporan);

        $response->assertStatus(200);
        $response->assertViewIs('pages.pelapor.detail');
    }
}
