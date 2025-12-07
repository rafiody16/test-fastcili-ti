<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Models\LaporanKerusakan;
use App\Models\StatusLaporan;
use App\Models\Fasilitas;
use Illuminate\Foundation\Testing\RefreshDatabase;

class LaporanServiceTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test menghitung total laporan
     */
    public function test_dapat_menghitung_total_laporan()
    {
        LaporanKerusakan::factory()->count(5)->create();

        $total = LaporanKerusakan::count();

        $this->assertEquals(5, $total);
    }

    /**
     * Test filter laporan berdasarkan status
     */
    public function test_dapat_filter_laporan_berdasarkan_status()
    {
        $statusBelum = StatusLaporan::factory()->create([
            'id_status' => 1,
            'nama_status' => 'Belum Ditangani'
        ]);
        $statusSelesai = StatusLaporan::factory()->create([
            'id_status' => 3,
            'nama_status' => 'Selesai'
        ]);

        LaporanKerusakan::factory()->count(3)->create([
            'id_status' => $statusBelum->id_status
        ]);
        LaporanKerusakan::factory()->count(2)->create([
            'id_status' => $statusSelesai->id_status
        ]);

        $belumDitangani = LaporanKerusakan::where('id_status', 1)->count();
        $selesai = LaporanKerusakan::where('id_status', 3)->count();

        $this->assertEquals(3, $belumDitangani);
        $this->assertEquals(2, $selesai);
    }

    /**
     * Test update status laporan
     */
    public function test_dapat_update_status_laporan()
    {
        $statusBelum = StatusLaporan::factory()->create(['id_status' => 1]);
        $statusProses = StatusLaporan::factory()->create(['id_status' => 2]);

        $laporan = LaporanKerusakan::factory()->create([
            'id_status' => $statusBelum->id_status
        ]);

        $laporan->update(['id_status' => $statusProses->id_status]);

        $this->assertEquals(2, $laporan->fresh()->id_status);
    }

    /**
     * Test menghitung laporan per fasilitas
     */
    public function test_dapat_menghitung_laporan_per_fasilitas()
    {
        $fasilitas = Fasilitas::factory()->create();

        LaporanKerusakan::factory()->count(4)->create([
            'id_fasilitas' => $fasilitas->id_fasilitas
        ]);

        $jumlah = LaporanKerusakan::where('id_fasilitas', $fasilitas->id_fasilitas)->count();

        $this->assertEquals(4, $jumlah);
    }
}
