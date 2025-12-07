<?php

namespace Tests\Unit\Models;

use Tests\TestCase;
use App\Models\Fasilitas;
use App\Models\Ruangan;
use App\Models\LaporanKerusakan;
use Illuminate\Foundation\Testing\RefreshDatabase;

class FasilitasTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test fasilitas dapat dibuat
     */
    public function test_fasilitas_dapat_dibuat()
    {
        $ruangan = Ruangan::factory()->create();

        $fasilitas = Fasilitas::create([
            'id_ruangan' => $ruangan->id_ruangan,
            'kode_fasilitas' => 'F-001',
            'nama_fasilitas' => 'Proyektor',
            'jumlah' => 5
        ]);

        $this->assertInstanceOf(Fasilitas::class, $fasilitas);
        $this->assertEquals('Proyektor', $fasilitas->nama_fasilitas);
        $this->assertEquals(5, $fasilitas->jumlah);
    }

    /**
     * Test fasilitas memiliki relasi dengan ruangan
     */
    public function test_fasilitas_memiliki_relasi_dengan_ruangan()
    {
        $ruangan = Ruangan::factory()->create(['nama_ruangan' => 'Lab 101']);
        $fasilitas = Fasilitas::factory()->create([
            'id_ruangan' => $ruangan->id_ruangan
        ]);

        $this->assertInstanceOf(Ruangan::class, $fasilitas->ruangan);
        $this->assertEquals('Lab 101', $fasilitas->ruangan->nama_ruangan);
    }

    /**
     * Test fasilitas dapat memiliki banyak laporan kerusakan
     */
    public function test_fasilitas_dapat_memiliki_banyak_laporan()
    {
        $fasilitas = Fasilitas::factory()->create();

        LaporanKerusakan::factory()->count(3)->create([
            'id_fasilitas' => $fasilitas->id_fasilitas
        ]);

        $this->assertCount(3, $fasilitas->laporan);
    }

    /**
     * Test nama fasilitas required
     */
    public function test_nama_fasilitas_required()
    {
        $this->expectException(\Illuminate\Database\QueryException::class);

        Fasilitas::create([
            'id_ruangan' => 1,
            'kode_fasilitas' => 'F-TEST',
            'nama_fasilitas' => null, // Should fail
            'jumlah' => 5
        ]);
    }

    /**
     * Test jumlah fasilitas harus numeric
     */
    public function test_jumlah_fasilitas_harus_numeric()
    {
        $fasilitas = Fasilitas::factory()->create([
            'jumlah' => 10
        ]);

        $this->assertIsNumeric($fasilitas->jumlah);
    }
}
