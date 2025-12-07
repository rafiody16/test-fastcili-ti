<?php

namespace Tests\Unit\Helpers;

use Tests\TestCase;

class ValidationHelperTest extends TestCase
{
    /**
     * Test validasi email
     */
    public function test_validasi_email_valid()
    {
        $email = 'test@jti.com';

        $this->assertTrue(filter_var($email, FILTER_VALIDATE_EMAIL) !== false);
    }

    /**
     * Test validasi email invalid
     */
    public function test_validasi_email_invalid()
    {
        $email = 'invalid-email';

        $this->assertFalse(filter_var($email, FILTER_VALIDATE_EMAIL) !== false);
    }

    /**
     * Test validasi angka positif
     */
    public function test_validasi_angka_positif()
    {
        $number = 5;

        $this->assertTrue($number > 0);
        $this->assertIsNumeric($number);
    }

    /**
     * Test validasi string tidak kosong
     */
    public function test_validasi_string_tidak_kosong()
    {
        $string = 'Test String';

        $this->assertNotEmpty($string);
        $this->assertIsString($string);
    }

    /**
     * Test validasi panjang string minimum
     */
    public function test_validasi_panjang_string_minimum()
    {
        $string = 'Test description';
        $minLength = 5;

        $this->assertTrue(strlen($string) >= $minLength);
    }

    /**
     * Test validasi rating range
     */
    public function test_validasi_rating_range()
    {
        $rating = 5;

        $this->assertTrue($rating >= 1 && $rating <= 5);
    }
}
