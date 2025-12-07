<?php

namespace Database\Factories;

use App\Models\Level;
use Illuminate\Database\Eloquent\Factories\Factory;

class LevelFactory extends Factory
{
    protected $model = Level::class;

    public function definition(): array
    {
        return [
            'kode_level' => 'LVL-' . strtoupper($this->faker->unique()->bothify('##')),
            'nama_level' => $this->faker->randomElement(['Admin', 'Sarpras', 'Teknisi', 'Pelapor']),
        ];
    }
}
