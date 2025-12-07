<?php

namespace Tests\Feature\Pelapor;

use Tests\TestCase;
use App\Models\User;
use App\Models\Level;
use App\Models\LaporanKerusakan;
use App\Models\PelaporLaporan;
use App\Models\Fasilitas;
use App\Models\Ruangan;
use App\Models\Gedung;
use App\Models\StatusLaporan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class LaporanKerusakanTest extends TestCase
{
    use RefreshDatabase;

    protected $pelapor;
    protected $gedung;
    protected $ruangan;
    protected $fasilitas;
    protected $status;

    protected function setUp(): void
    {
        parent::setUp();

        $level = Level::factory()->create(['id_level' => 4, 'nama_level' => 'Pelapor']);
        $this->pelapor = User::factory()->create(['id_level' => $level->id_level]);

        $this->gedung = Gedung::factory()->create();
        $this->ruangan = Ruangan::factory()->create(['id_gedung' => $this->gedung->id_gedung]);
        $this->fasilitas = Fasilitas::factory()->create(['id_ruangan' => $this->ruangan->id_ruangan]);
        $this->status = StatusLaporan::factory()->create(['id_status' => 1, 'nama_status' => 'Belum Ditangani']);
    }

    /**
     * Test pelapor dapat membuat laporan kerusakan
     */
    public function test_pelapor_dapat_membuat_laporan_kerusakan()
    {
        Storage::fake('public');

        $data = [
            'id_gedung' => $this->gedung->id_gedung,
            'id_ruangan' => $this->ruangan->id_ruangan,
            'id_fasilitas' => $this->fasilitas->id_fasilitas,
            'deskripsi' => 'Lampu tidak menyala',
            'jumlah_kerusakan' => 2,
            'deskripsi_tambahan' => 'Sudah rusak sejak 2 hari lalu',
            'foto_kerusakan' => UploadedFile::fake()->image('kerusakan.jpg')
        ];

        $response = $this->actingAs($this->pelapor)
            ->post('/pelapor', $data);

        $response->assertRedirect('/pelapor');

        $this->assertDatabaseHas('laporan_kerusakan', [
            'id_fasilitas' => $this->fasilitas->id_fasilitas,
            'deskripsi' => 'Lampu tidak menyala',
            'jumlah_kerusakan' => 2
        ]);

        $this->assertDatabaseHas('pelapor_laporan', [
            'id_user' => $this->pelapor->id,
            'deskripsi_tambahan' => 'Sudah rusak sejak 2 hari lalu'
        ]);
    }

    /**
     * Test validasi form laporan - deskripsi required
     */
    public function test_validasi_deskripsi_required()
    {
        $data = [
            'id_fasilitas' => $this->fasilitas->id_fasilitas,
            'deskripsi' => '', // Empty
            'jumlah_kerusakan' => 2
        ];

        $response = $this->actingAs($this->pelapor)
            ->post('/pelapor', $data);

        $response->assertSessionHasErrors('deskripsi');
    }

    /**
     * Test validasi form laporan - jumlah kerusakan required
     */
    public function test_validasi_jumlah_kerusakan_required()
    {
        $data = [
            'id_fasilitas' => $this->fasilitas->id_fasilitas,
            'deskripsi' => 'Test deskripsi',
            'jumlah_kerusakan' => '' // Empty
        ];

        $response = $this->actingAs($this->pelapor)
            ->post('/pelapor', $data);

        $response->assertSessionHasErrors('jumlah_kerusakan');
    }

    /**
     * Test pelapor dapat mengedit laporan mereka
     */
    public function test_pelapor_dapat_mengedit_laporan_mereka()
    {
        $laporan = LaporanKerusakan::factory()->create([
            'id_fasilitas' => $this->fasilitas->id_fasilitas,
            'deskripsi' => 'Deskripsi lama',
            'jumlah_kerusakan' => 1,
            'id_status' => $this->status->id_status
        ]);

        PelaporLaporan::factory()->create([
            'id_user' => $this->pelapor->id,
            'id_laporan' => $laporan->id_laporan
        ]);

        $updateData = [
            'id_fasilitas' => $this->fasilitas->id_fasilitas,
            'deskripsi' => 'Deskripsi baru',
            'jumlah_kerusakan' => 3
        ];

        $response = $this->actingAs($this->pelapor)
            ->put('/pelapor/update/' . $laporan->id_laporan, $updateData);

        $response->assertRedirect('/pelapor');

        $this->assertDatabaseHas('laporan_kerusakan', [
            'id_laporan' => $laporan->id_laporan,
            'deskripsi' => 'Deskripsi baru',
            'jumlah_kerusakan' => 3
        ]);
    }

    /**
     * Test pelapor dapat menghapus laporan mereka
     */
    public function test_pelapor_dapat_menghapus_laporan_mereka()
    {
        $laporan = LaporanKerusakan::factory()->create([
            'id_fasilitas' => $this->fasilitas->id_fasilitas,
            'id_status' => $this->status->id_status
        ]);

        $pelaporLaporan = PelaporLaporan::factory()->create([
            'id_user' => $this->pelapor->id,
            'id_laporan' => $laporan->id_laporan
        ]);

        $response = $this->actingAs($this->pelapor)
            ->delete('/pelapor/delete/' . $laporan->id_laporan);

        $response->assertRedirect('/pelapor');

        $this->assertDatabaseMissing('laporan_kerusakan', [
            'id_laporan' => $laporan->id_laporan
        ]);
    }

    /**
     * Test pelapor dapat memberikan rating
     */
    public function test_pelapor_dapat_memberikan_rating()
    {
        $laporan = LaporanKerusakan::factory()->create([
            'id_fasilitas' => $this->fasilitas->id_fasilitas,
            'id_status' => 3 // Status selesai
        ]);

        $pelaporLaporan = PelaporLaporan::factory()->create([
            'id_user' => $this->pelapor->id,
            'id_laporan' => $laporan->id_laporan,
            'rating_pengguna' => null,
            'feedback_pengguna' => null
        ]);

        $ratingData = [
            'rating_pengguna' => 5,
            'feedback_pengguna' => 'Perbaikan sangat memuaskan!'
        ];

        $response = $this->actingAs($this->pelapor)
            ->put('/pelapor/rating/' . $laporan->id_laporan, $ratingData);

        $response->assertRedirect();

        $this->assertDatabaseHas('pelapor_laporan', [
            'id_laporan' => $laporan->id_laporan,
            'rating_pengguna' => 5,
            'feedback_pengguna' => 'Perbaikan sangat memuaskan!'
        ]);
    }
}
