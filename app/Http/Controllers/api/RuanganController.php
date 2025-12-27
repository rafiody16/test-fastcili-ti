<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Models\Gedung;
use App\Models\Ruangan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\IOFactory;

class RuanganController extends Controller
{
    /* =========================
     * LIST RUANGAN
     * ========================= */
    public function index(Request $request)
    {
        $query = Ruangan::with('gedung')->orderBy('created_at', 'desc');

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('nama_ruangan', 'like', '%' . $request->search . '%')
                  ->orWhere('kode_ruangan', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->filled('id_gedung')) {
            $query->where('id_gedung', $request->id_gedung);
        }

        return response()->json([
            'success' => true,
            'data' => $query->paginate(12)
        ], 200);
    }

    /* =========================
     * DETAIL RUANGAN
     * ========================= */
    public function show($id)
    {
        $ruangan = Ruangan::with('gedung')->find($id);

        if (!$ruangan) {
            return response()->json([
                'success' => false,
                'message' => 'Data tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $ruangan
        ], 200);
    }

    /* =========================
     * CREATE RUANGAN
     * ========================= */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_gedung' => 'required|exists:gedung,id_gedung',
            'kode_ruangan' => 'required|string|max:20|unique:ruangan,kode_ruangan',
            'nama_ruangan' => 'required|string|max:50',
        ], [
            'kode_ruangan.unique' => 'Kode ruangan sudah digunakan'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $ruangan = Ruangan::create([
            'id_gedung' => $request->id_gedung,
            'kode_ruangan' => $request->kode_ruangan,
            'nama_ruangan' => $request->nama_ruangan,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Ruangan berhasil ditambahkan',
            'data' => $ruangan
        ], 201);
    }

    /* =========================
     * UPDATE RUANGAN
     * ========================= */
    public function update(Request $request, $id)
    {
        $ruangan = Ruangan::find($id);
        if (!$ruangan) {
            return response()->json([
                'success' => false,
                'message' => 'Data tidak ditemukan'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'id_gedung' => 'required|exists:gedung,id_gedung',
            'kode_ruangan' => 'required|string|max:20|unique:ruangan,kode_ruangan,' . $ruangan->id_ruangan . ',id_ruangan',
            'nama_ruangan' => 'required|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $ruangan->update($request->only([
            'id_gedung',
            'kode_ruangan',
            'nama_ruangan'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Ruangan berhasil diperbarui',
            'data' => $ruangan
        ], 200);
    }

    /* =========================
     * DELETE RUANGAN
     * ========================= */
    public function destroy($id)
    {
        $ruangan = Ruangan::find($id);

        if (!$ruangan) {
            return response()->json([
                'success' => false,
                'message' => 'Data tidak ditemukan'
            ], 404);
        }

        $ruangan->delete();

        return response()->json([
            'success' => true,
            'message' => 'Ruangan berhasil dihapus'
        ], 200);
    }

    /* =========================
     * IMPORT EXCEL RUANGAN
     * ========================= */
    public function import(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file_ruangan' => 'required|mimes:xlsx|max:1024'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $sheet = IOFactory::load($request->file('file_ruangan')->getRealPath())
                ->getActiveSheet()
                ->toArray();

            $errors = [];
            $rows = [];

            foreach ($sheet as $i => $row) {
                if ($i === 0) continue;

                [$id_gedung, $kode_ruangan, $nama_ruangan] = $row;

                if (!$id_gedung || !$kode_ruangan || !$nama_ruangan) {
                    $errors[] = "Baris " . ($i + 1) . " tidak boleh kosong";
                    continue;
                }

                if (!Gedung::find($id_gedung)) {
                    $errors[] = "Baris " . ($i + 1) . " ID Gedung tidak valid";
                    continue;
                }

                if (Ruangan::where('kode_ruangan', $kode_ruangan)->exists()) {
                    $errors[] = "Baris " . ($i + 1) . " kode ruangan duplikat";
                    continue;
                }

                $rows[] = [
                    'id_gedung' => $id_gedung,
                    'kode_ruangan' => $kode_ruangan,
                    'nama_ruangan' => $nama_ruangan,
                    'created_at' => now(),
                    'updated_at' => now()
                ];
            }

            if ($errors) {
                return response()->json([
                    'success' => false,
                    'errors' => $errors
                ], 422);
            }

            DB::transaction(fn () => Ruangan::insert($rows));

            return response()->json([
                'success' => true,
                'message' => 'Import berhasil',
                'count' => count($rows)
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal import',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
