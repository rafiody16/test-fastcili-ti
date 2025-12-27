<?php

namespace App\Http\Controllers\api\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class RegisterController extends Controller
{
    /**
     * REGISTER USER (API)
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama'     => 'required|string|max:255',
            'email'    => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'agree_terms_and_conditions' => 'required|accepted',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors()
            ], 422);
        }

        try {
            $user = User::create([
                'nama'     => $request->nama,
                'email'    => $request->email,
                'password' => Hash::make($request->password),
                'akses'    => 0, // menunggu persetujuan admin
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Registrasi berhasil. Akun menunggu persetujuan admin.',
                'data' => [
                    'id_user' => $user->id_user,
                    'nama'    => $user->nama,
                    'email'   => $user->email,
                    'akses'   => $user->akses
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Registrasi gagal',
                'error'   => $e->getMessage()
            ], 500);
        }
    }
}
