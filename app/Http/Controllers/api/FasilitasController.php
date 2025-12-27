<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Models\Fasilitas;
use App\Models\Ruangan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class FasilitasController extends Controller
{
    /**
     * GET ALL FASILITAS
     */
    public function index(Request $request)
    {
        $query = Fasilitas::with(['ruangan.gedung', 'laporan']);

        if ($request->filled('id_ruangan')) {
            $query->where('id_ruangan', $request->id_ruangan);
        }

        if ($request->filled('search')) {
            $query->where('nama_fasilitas', 'like', '%' . $request->search . '%');
        }

        $perPage = $request->get('per_page', 10);

        $data = $query->paginate($perPage);

        // Tambah status_fasilitas
        // $data->getCollection()->transform(function ($item) {
        //     $item->status_fasilitas = $item->laporan->count() > 0 ? 'Rusak' : 'Baik';
        //     return $item;
        // });
 
        return response()->json([
            'success' => true,
            'message' => 'Data fasilitas berhasil diambil',
            'data' => $data
        ]);
    }

    /**
     * GET BY ID
     */
    public function show($id)
    {
        $fasilitas = Fasilitas::with(['ruangan.gedung', 'laporan'])->find($id);

        if (!$fasilitas) {
            return response()->json([
                'success' => false,
                'message' => 'Data tidak ditemukan'
            ], 404);
        }

        $fasilitas->status_fasilitas = $fasilitas->laporan->count() > 0 ? 'Rusak' : 'Baik';

        return response()->json([
            'success' => true,
            'data' => $fasilitas
        ]);
    }

    /**
     * STORE
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_ruangan' => 'required|exists:ruangan,id_ruangan',
            'nama_fasilitas' => 'required|string|max:50',
            'kode_fasilitas' => 'required|unique:fasilitas,kode_fasilitas',
            'jumlah' => 'required|integer|min:1'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $fasilitas = Fasilitas::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Fasilitas berhasil ditambahkan',
            'data' => $fasilitas
        ], 201);
    }

    /**
     * UPDATE
     */
    public function update(Request $request, $id)
    {
        $fasilitas = Fasilitas::find($id);

        if (!$fasilitas) {
            return response()->json([
                'success' => false,
                'message' => 'Data tidak ditemukan'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'nama_fasilitas' => 'string|max:50',
            'kode_fasilitas' => 'unique:fasilitas,kode_fasilitas,' . $id . ',id_fasilitas',
            'jumlah' => 'integer|min:1'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $fasilitas->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Data berhasil diperbarui'
        ]);
    }

    /**
     * DELETE
     */
    public function destroy($id)
    {
        $fasilitas = Fasilitas::find($id);

        if (!$fasilitas) {
            return response()->json([
                'success' => false,
                'message' => 'Data tidak ditemukan'
            ], 404);
        }

        $fasilitas->delete();

        return response()->json([
            'success' => true,
            'message' => 'Data berhasil dihapus'
        ]);
    }

    /**
     * GET RUANGAN BY GEDUNG
     */
    public function getRuangan($idGedung)
    {
        return response()->json([
            'success' => true,
            'data' => Ruangan::where('id_gedung', $idGedung)->get()
        ]);
    }
}
