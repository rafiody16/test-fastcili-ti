<?php

namespace Database\Factories;

use App\Models\Gedung;
use Illuminate\Database\Eloquent\Factories\Factory;

class GedungFactory extends Factory
{
    protected $model = Gedung::class;

    public function definition(): array
    {
        return [
            'kode_gedung' => 'GD-' . strtoupper($this->faker->unique()->bothify('###')),
            'nama_gedung' => 'Gedung ' . $this->faker->randomElement(['A', 'B', 'C', 'D']),
            'deskripsi' => $this->faker->optional()->sentence(),
        ];
    }
}
