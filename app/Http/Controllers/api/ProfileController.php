<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ProfileController extends Controller
{
    /* =========================
     * GET PROFILE
     * ========================= */
    public function show()
    {
        return response()->json([
            'success' => true,
            'data' => Auth::user()
        ], 200);
    }

    /* =========================
     * UPDATE PROFILE
     * ========================= */
    public function update(Request $request)
    {
        $user = Auth::user();

        $validator = Validator::make($request->all(), [
            'nama' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id_user . ',id_user',
            'foto_profil' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $isChanged = false;

        if ($request->nama !== $user->nama || $request->email !== $user->email) {
            $user->nama = $request->nama;
            $user->email = $request->email;
            $isChanged = true;
        }

        if ($request->hasFile('foto_profil')) {
            $isChanged = true;

            if ($user->foto_profil &&
                Storage::exists('public/uploads/foto_profil/' . $user->foto_profil)) {
                Storage::delete('public/uploads/foto_profil/' . $user->foto_profil);
            }

            $path = $request->file('foto_profil')
                ->store('uploads/foto_profil', 'public');

            $user->foto_profil = basename($path);
        }

        if (!$isChanged) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada perubahan data'
            ], 200);
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui',
            'data' => $user
        ], 200);
    }

    /* =========================
     * UPDATE PASSWORD
     * ========================= */
    public function updatePassword(Request $request)
    {
        $user = Auth::user();

        $validator = Validator::make($request->all(), [
            'old_password' => 'required',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        if (!Hash::check($request->old_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Password lama tidak cocok'
            ], 422);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Password berhasil diperbarui'
        ], 200);
    }
}
