<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class GedungFactory extends Factory
{
    public function definition(): array
    {
        return [
            'kode_gedung' => $this->faker->unique()->bothify('GD###'),
            'nama_gedung' => $this->faker->company,
            'deskripsi' => $this->faker->sentence,
            'foto_gedung' => 'default.jpg', 
            'created_at' => now(),
        ];
    }
}