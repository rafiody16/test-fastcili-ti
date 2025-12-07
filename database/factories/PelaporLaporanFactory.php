<?php

namespace Database\Factories;

use App\Models\PelaporLaporan;
use App\Models\User;
use App\Models\LaporanKerusakan;
use Illuminate\Database\Eloquent\Factories\Factory;

class PelaporLaporanFactory extends Factory
{
    protected $model = PelaporLaporan::class;

    public function definition(): array
    {
        return [
            'id_user' => User::factory(),
            'id_laporan' => LaporanKerusakan::factory(),
            'deskripsi_tambahan' => $this->faker->optional()->sentence(),
            'rating_pengguna' => $this->faker->optional()->numberBetween(1, 5),
            'feedback_pengguna' => $this->faker->optional()->sentence(),
        ];
    }
}
