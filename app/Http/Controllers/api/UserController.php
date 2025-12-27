<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Level;
use App\Models\CreditScoreTeknisi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\IOFactory;

class UserController extends Controller
{
    // =======================
    // GET ALL USERS
    // =======================
    public function index(Request $request)
    {
        $users = User::with('level')
            ->when($request->id_level, fn ($q) =>
                $q->where('id_level', $request->id_level)
            )
            ->get();

        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    // =======================
    // CREATE USER
    // =======================
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_level' => 'required|exists:level,id_level',
            'nama'     => 'required|string|max:20',
            'email'    => 'required|email|unique:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors()
            ], 422);
        }

        DB::transaction(function () use ($request) {
            $user = User::create([
                'id_level' => $request->id_level,
                'nama'     => $request->nama,
                'email'    => $request->email,
                'password' => Hash::make('password'),
            ]);

            CreditScoreTeknisi::create([
                'id_user' => $user->id_user
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'User berhasil ditambahkan'
        ], 201);
    }

    // =======================
    // DETAIL USER
    // =======================
    public function show($id)
    {
        $user = User::with('level')->find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $user
        ]);
    }

    // =======================
    // UPDATE USER
    // =======================
    public function update(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak ditemukan'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'id_level' => 'required|exists:level,id_level',
            'nama'     => 'required|string|max:20',
            'email'    => 'required|email|unique:users,email,' . $id . ',id_user',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors()
            ], 422);
        }

        $user->update([
            'id_level' => $request->id_level,
            'nama'     => $request->nama,
            'email'    => $request->email,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'User berhasil diperbarui'
        ]);
    }

    // =======================
    // DELETE USER
    // =======================
    public function destroy($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak ditemukan'
            ], 404);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User berhasil dihapus'
        ]);
    }

    // =======================
    // TOGGLE AKSES
    // =======================
    public function toggleAccess($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak ditemukan'
            ], 404);
        }

        if (!$user->akses && !$user->id_level) {
            return response()->json([
                'success' => false,
                'message' => 'Level user belum diatur'
            ], 400);
        }

        $user->akses = !$user->akses;
        $user->save();

        return response()->json([
            'success' => true,
            'akses' => $user->akses
        ]);
    }

    // =======================
    // IMPORT USER (EXCEL)
    // =======================
    public function import(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file_user' => 'required|mimes:xlsx|max:1024'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors()
            ], 422);
        }

        try {
            $sheet = IOFactory::load(
                $request->file('file_user')->getRealPath()
            )->getActiveSheet()->toArray();

            $insert = [];
            $errors = [];
            $emails = [];

            foreach ($sheet as $i => $row) {
                if ($i === 0) continue;

                [$id_level, $email, $nama, $password] = $row;

                if (!$id_level || !$email || !$nama || !$password) {
                    $errors[] = "Baris " . ($i + 1) . " tidak lengkap";
                    continue;
                }

                if (!Level::find($id_level)) {
                    $errors[] = "Baris " . ($i + 1) . " level tidak valid";
                    continue;
                }

                if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    $errors[] = "Baris " . ($i + 1) . " email tidak valid";
                    continue;
                }

                if (User::where('email', $email)->exists() || in_array($email, $emails)) {
                    $errors[] = "Baris " . ($i + 1) . " email duplikat";
                    continue;
                }

                $emails[] = $email;

                $insert[] = [
                    'id_level' => $id_level,
                    'email'    => $email,
                    'nama'     => $nama,
                    'password' => Hash::make($password),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            if ($errors) {
                return response()->json([
                    'success' => false,
                    'errors' => $errors
                ], 422);
            }

            User::insert($insert);

            return response()->json([
                'success' => true,
                'count' => count($insert)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
