<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash; // Import Facade Hash
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    public function definition(): array
    {
        return [
            'nama' => $this->faker->name(),
            
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            
            // Menggunakan Hash::make
            'password' => Hash::make('password'), 
            
            'remember_token' => Str::random(10),
            'id_level' => 3, // Default level user biasa
        ];
    }
}