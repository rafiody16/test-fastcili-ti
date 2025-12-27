<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\PenugasanTeknisi;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

class PenugasanTeknisiController extends Controller
{
    /* =========================
     * GET DETAIL PENUGASAN
     * ========================= */
    public function show($id)
    {
        if (auth()->user()->id_level != 3) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $penugasan = PenugasanTeknisi::find($id);

        if (!$penugasan) {
            return response()->json([
                'success' => false,
                'message' => 'Data tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $penugasan
        ], 200);
    }

    /* =========================
     * FEEDBACK TEKNISI
     * ========================= */
    public function feedback(Request $request, $id)
    {
        if (auth()->user()->id_level != 3) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'catatan_teknisi' => 'required|string',
            'dokumentasi' => 'required|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $penugasan = PenugasanTeknisi::find($id);
        if (!$penugasan) {
            return response()->json([
                'success' => false,
                'message' => 'Data tidak ditemukan'
            ], 404);
        }

        /* Upload dokumentasi */
        $path = $request->file('dokumentasi')
            ->store('uploads/dokumentasi', 'public');
        $filename = basename($path);

        /* Update data */
        $penugasan->update([
            'catatan_teknisi' => $request->catatan_teknisi,
            'dokumentasi' => $filename,
            'tanggal_selesai' => Carbon::now(),
            'status_perbaikan' => 'Selesai'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Feedback teknisi berhasil disimpan',
            'data' => $penugasan
        ], 200);
    }

    /* =========================
     * RIWAYAT PENUGASAN TEKNISI
     * ========================= */
    public function riwayat()
    {
        if (auth()->user()->id_level != 3) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $data = PenugasanTeknisi::where('id_teknisi', auth()->user()->id)
            ->orderBy('tanggal_selesai', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $data
        ], 200);
    }
}
