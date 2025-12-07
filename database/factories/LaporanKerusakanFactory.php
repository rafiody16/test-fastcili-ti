<?php

namespace Database\Factories;

use App\Models\LaporanKerusakan;
use App\Models\Fasilitas;
use App\Models\StatusLaporan;
use Illuminate\Database\Eloquent\Factories\Factory;

class LaporanKerusakanFactory extends Factory
{
    protected $model = LaporanKerusakan::class;

    public function definition(): array
    {
        return [
            'id_fasilitas' => Fasilitas::factory(),
            'deskripsi' => $this->faker->sentence(10),
            'foto_kerusakan' => 'default.jpg',
            'jumlah_kerusakan' => $this->faker->numberBetween(1, 5),
            'tanggal_lapor' => $this->faker->date(),
            'tanggal_selesai' => null,
            'id_status' => StatusLaporan::factory(),
        ];
    }
}
