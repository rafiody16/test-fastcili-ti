<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Level;
use Illuminate\Support\Facades\Validator;

class LevelController extends Controller
{
    /* =========================
     * GET ALL LEVEL
     * ========================= */
    public function index()
    {
        $data = Level::all();

        return response()->json([
            'success' => true,
            'data' => $data
        ], 200);
    }

    /* =========================
     * STORE LEVEL
     * ========================= */
    public function store(Request $request)
    {
        if (auth()->user()->id_level != 1) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'kode_level' => 'required|string|max:10|unique:level,kode_level',
            'nama_level' => 'required|string|max:25'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $level = Level::create($request->only([
            'kode_level',
            'nama_level'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Level berhasil ditambahkan',
            'data' => $level
        ], 201);
    }

    /* =========================
     * SHOW LEVEL BY ID
     * ========================= */
    public function show($id)
    {
        $level = Level::find($id);

        if (!$level) {
            return response()->json([
                'success' => false,
                'message' => 'Data tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $level
        ], 200);
    }

    /* =========================
     * UPDATE LEVEL
     * ========================= */
    public function update(Request $request, $id)
    {
        if (auth()->user()->id_level != 1) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'kode_level' => 'required|string|max:10|unique:level,kode_level,' . $id . ',id_level',
            'nama_level' => 'required|string|max:25'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $level = Level::find($id);
        if (!$level) {
            return response()->json([
                'success' => false,
                'message' => 'Data tidak ditemukan'
            ], 404);
        }

        $level->update($request->only([
            'kode_level',
            'nama_level'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Level berhasil diupdate',
            'data' => $level
        ], 200);
    }

    /* =========================
     * DELETE LEVEL
     * ========================= */
    public function destroy($id)
    {
        if (auth()->user()->id_level != 1) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        try {
            $level = Level::find($id);
            if (!$level) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data tidak ditemukan'
                ], 404);
            }

            $level->delete();

            return response()->json([
                'success' => true,
                'message' => 'Level berhasil dihapus'
            ], 200);

        } catch (\Illuminate\Database\QueryException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Level gagal dihapus karena masih digunakan user'
            ], 422);
        }
    }
}
