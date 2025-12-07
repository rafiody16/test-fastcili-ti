<?php

namespace Tests\Unit\Models;

use Tests\TestCase;
use App\Models\LaporanKerusakan;
use App\Models\Fasilitas;
use App\Models\StatusLaporan;
use App\Models\PelaporLaporan;
use Illuminate\Foundation\Testing\RefreshDatabase;

class LaporanKerusakanTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test laporan kerusakan dapat dibuat
     */
    public function test_laporan_kerusakan_dapat_dibuat()
    {
        $fasilitas = Fasilitas::factory()->create();
        $status = StatusLaporan::factory()->create(['nama_status' => 'Belum Ditangani']);

        $laporan = LaporanKerusakan::create([
            'id_fasilitas' => $fasilitas->id_fasilitas,
            'deskripsi' => 'Lampu tidak menyala',
            'jumlah_kerusakan' => 2,
            'foto_kerusakan' => 'test.jpg',
            'tanggal_lapor' => now()->format('Y-m-d'),
            'id_status' => $status->id_status
        ]);

        $this->assertInstanceOf(LaporanKerusakan::class, $laporan);
        $this->assertEquals('Lampu tidak menyala', $laporan->deskripsi);
        $this->assertEquals(2, $laporan->jumlah_kerusakan);
    }

    /**
     * Test laporan memiliki relasi dengan fasilitas
     */
    public function test_laporan_memiliki_relasi_dengan_fasilitas()
    {
        $fasilitas = Fasilitas::factory()->create(['nama_fasilitas' => 'Lampu']);
        $laporan = LaporanKerusakan::factory()->create([
            'id_fasilitas' => $fasilitas->id_fasilitas
        ]);

        $this->assertInstanceOf(Fasilitas::class, $laporan->fasilitas);
        $this->assertEquals('Lampu', $laporan->fasilitas->nama_fasilitas);
    }

    /**
     * Test laporan memiliki relasi dengan status
     */
    public function test_laporan_memiliki_relasi_dengan_status()
    {
        $status = StatusLaporan::factory()->create(['nama_status' => 'Belum Ditangani']);
        $laporan = LaporanKerusakan::factory()->create([
            'id_status' => $status->id_status
        ]);

        $this->assertInstanceOf(StatusLaporan::class, $laporan->status);
        $this->assertEquals('Belum Ditangani', $laporan->status->nama_status);
    }

    /**
     * Test laporan memiliki relasi dengan pelapor laporan
     */
    public function test_laporan_memiliki_relasi_dengan_pelapor_laporan()
    {
        $laporan = LaporanKerusakan::factory()->create();
        $pelaporLaporan = PelaporLaporan::factory()->create([
            'id_laporan' => $laporan->id_laporan
        ]);

        $this->assertCount(1, $laporan->pelaporLaporan);
        $this->assertInstanceOf(PelaporLaporan::class, $laporan->pelaporLaporan->first());
    }

    /**
     * Test tanggal lapor di-cast ke datetime
     */
    public function test_tanggal_lapor_dicast_ke_datetime()
    {
        $laporan = LaporanKerusakan::factory()->create([
            'tanggal_lapor' => '2025-01-01'
        ]);

        $this->assertInstanceOf(\Illuminate\Support\Carbon::class, $laporan->tanggal_lapor);
    }

    /**
     * Test fillable attributes
     */
    public function test_laporan_memiliki_fillable_attributes()
    {
        $laporan = new LaporanKerusakan();
        $fillable = $laporan->getFillable();

        $this->assertContains('id_fasilitas', $fillable);
        $this->assertContains('deskripsi', $fillable);
        $this->assertContains('jumlah_kerusakan', $fillable);
        $this->assertContains('id_status', $fillable);
    }

    /**
     * Test primary key adalah id_laporan
     */
    public function test_primary_key_adalah_id_laporan()
    {
        $laporan = new LaporanKerusakan();

        $this->assertEquals('id_laporan', $laporan->getKeyName());
    }
}
