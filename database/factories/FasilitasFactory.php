<?php

namespace Database\Factories;

use App\Models\Fasilitas;
use App\Models\Ruangan;
use Illuminate\Database\Eloquent\Factories\Factory;

class FasilitasFactory extends Factory
{
    protected $model = Fasilitas::class;

    public function definition(): array
    {
        return [
            'id_ruangan' => Ruangan::factory(),
            'kode_fasilitas' => 'F-' . strtoupper($this->faker->unique()->bothify('###')),
            'nama_fasilitas' => $this->faker->randomElement([
                'Lampu',
                'AC',
                'Proyektor',
                'Whiteboard',
                'Kursi',
                'Meja',
                'Komputer',
                'Kipas Angin'
            ]),
            'jumlah' => $this->faker->numberBetween(1, 20),
        ];
    }
}
