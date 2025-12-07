<?php

namespace Database\Factories;

use App\Models\StatusLaporan;
use Illuminate\Database\Eloquent\Factories\Factory;

class StatusLaporanFactory extends Factory
{
    protected $model = StatusLaporan::class;

    public function definition(): array
    {
        return [
            'nama_status' => $this->faker->randomElement([
                'Belum Ditangani',
                'Dalam Proses',
                'Selesai',
                'Dibatalkan'
            ]),
        ];
    }
}
