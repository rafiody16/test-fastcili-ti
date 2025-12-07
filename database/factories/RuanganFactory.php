<?php

namespace Database\Factories;

use App\Models\Ruangan;
use App\Models\Gedung;
use Illuminate\Database\Eloquent\Factories\Factory;

class RuanganFactory extends Factory
{
    protected $model = Ruangan::class;

    public function definition(): array
    {
        return [
            'id_gedung' => Gedung::factory(),
            'kode_ruangan' => 'R-' . strtoupper($this->faker->unique()->bothify('###')),
            'nama_ruangan' => 'Ruangan ' . $this->faker->numberBetween(101, 999),
        ];
    }
}
