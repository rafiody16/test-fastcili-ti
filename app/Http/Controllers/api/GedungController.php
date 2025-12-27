<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Models\Gedung;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class GedungController extends Controller
{
    /**
     * GET ALL GEDUNG (Pagination + Search)
     */
    public function index(Request $request)
    {
        $query = Gedung::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nama_gedung', 'like', "%$search%")
                  ->orWhere('kode_gedung', 'like', "%$search%")
                  ->orWhere('deskripsi', 'like', "%$search%");
            });
        }

        $data = $query->orderBy('created_at', 'desc')
                      ->paginate($request->get('per_page', 10));

        return response()->json([
            'success' => true,
            'message' => 'Data gedung berhasil diambil',
            'data' => $data
        ]);
    }

    /**
     * GET GEDUNG BY ID
     */
    public function show($id)
    {
        $gedung = Gedung::find($id);

        if (!$gedung) {
            return response()->json([
                'success' => false,
                'message' => 'Data tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $gedung
        ]);
    }

    /**
     * STORE GEDUNG
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'kode_gedung' => 'required|string|max:10|unique:gedung,kode_gedung',
            'nama_gedung' => 'required|string|max:50',
            'deskripsi' => 'required|string|max:255',
            'foto_gedung' => 'required|image|max:2048'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        // Upload foto
        $path = $request->file('foto_gedung')
                        ->store('uploads/foto_gedung', 'public');

        $gedung = Gedung::create([
            'kode_gedung' => $request->kode_gedung,
            'nama_gedung' => $request->nama_gedung,
            'deskripsi' => $request->deskripsi,
            'foto_gedung' => basename($path)
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Gedung berhasil ditambahkan',
            'data' => $gedung
        ], 201);
    }

    /**
     * UPDATE GEDUNG
     */
    public function update(Request $request, $id)
    {
        $gedung = Gedung::find($id);

        if (!$gedung) {
            return response()->json([
                'success' => false,
                'message' => 'Data tidak ditemukan'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'nama_gedung' => 'required|string|max:50',
            'deskripsi' => 'required|string|max:255',
            'foto_gedung' => 'nullable|image|max:2048'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        if ($request->hasFile('foto_gedung')) {
            if ($gedung->foto_gedung) {
                Storage::disk('public')->delete('uploads/foto_gedung/' . $gedung->foto_gedung);
            }

            $path = $request->file('foto_gedung')
                            ->store('uploads/foto_gedung', 'public');

            $gedung->foto_gedung = basename($path);
        }

        $gedung->update([
            'nama_gedung' => $request->nama_gedung,
            'deskripsi' => $request->deskripsi
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Gedung berhasil diperbarui'
        ]);
    }

    /**
     * DELETE GEDUNG
     */
    public function destroy($id)
    {
        $gedung = Gedung::find($id);

        if (!$gedung) {
            return response()->json([
                'success' => false,
                'message' => 'Data tidak ditemukan'
            ], 404);
        }

        if ($gedung->foto_gedung) {
            Storage::disk('public')->delete('uploads/foto_gedung/' . $gedung->foto_gedung);
        }

        $gedung->delete();

        return response()->json([
            'success' => true,
            'message' => 'Data berhasil dihapus'
        ]);
    }
}
