<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Models\PenugasanTeknisi;
use App\Models\CreditScoreTeknisi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class PerbaikanController extends Controller
{
    /* =========================
     * LIST PERBAIKAN AKTIF
     * ========================= */
    public function index()
    {
        $status = ['Sedang Dikerjakan', 'Selesai'];

        $query = PenugasanTeknisi::with(['user', 'laporan.fasilitas']);

        if (auth()->user()->id_level == 3) {
            $query->where('id_user', auth()->user()->id_user);
        }

        $data = $query->whereIn('status_perbaikan', $status)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $data
        ], 200);
    }

    /* =========================
     * RIWAYAT PERBAIKAN
     * ========================= */
    public function riwayat(Request $request)
    {
        $query = PenugasanTeknisi::with(['laporan.fasilitas.ruangan.gedung']);

        if (auth()->user()->id_level == 3) {
            $query->where('id_user', auth()->user()->id_user);
        }

        $query->where(function ($q) {
            $q->where('status_perbaikan', 'Tidak Selesai')
              ->orWhereHas('laporan', function ($sub) {
                  $sub->where('id_status', 4);
              });
        });

        if ($request->filled('bulan')) {
            $query->whereMonth('tanggal_selesai', $request->bulan);
        }

        if ($request->filled('status')) {
            $query->where('status_perbaikan', $request->status);
        }

        return response()->json([
            'success' => true,
            'data' => $query->latest()->get()
        ], 200);
    }

    /* =========================
     * DETAIL PERBAIKAN + RATING
     * ========================= */
    public function show($id)
    {
        $perbaikan = PenugasanTeknisi::with([
            'laporan.fasilitas',
            'laporan.pelaporLaporan',
            'user'
        ])->find($id);

        if (!$perbaikan) {
            return response()->json([
                'success' => false,
                'message' => 'Data tidak ditemukan'
            ], 404);
        }

        $pelapor = $perbaikan->laporan->pelaporLaporan;

        $jumlahPendukung = $pelapor->count();
        $ratings = $pelapor->whereNotNull('rating_pengguna')->pluck('rating_pengguna');

        $jumlahRating = $ratings->count();
        $totalRating = $ratings->sum();
        $ratingAkhir = $jumlahPendukung > 0
            ? ($totalRating / (5 * $jumlahPendukung)) * 5
            : 0;

        return response()->json([
            'success' => true,
            'data' => [
                'perbaikan' => $perbaikan,
                'jumlah_pendukung' => $jumlahPendukung,
                'jumlah_rating_diberikan' => $jumlahRating,
                'rating_akhir' => round($ratingAkhir, 2),
                'ulasan' => $pelapor
                    ->whereNotNull('feedback_pengguna')
                    ->pluck('feedback_pengguna')
                    ->take(10)
            ]
        ], 200);
    }

    /* =========================
     * UPDATE PERBAIKAN (TEKNISI)
     * ========================= */
    public function update(Request $request, $id)
    {
        if (auth()->user()->id_level != 3) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $penugasan = PenugasanTeknisi::where('id_penugasan', $id)->first();
        if (!$penugasan) {
            return response()->json([
                'success' => false,
                'message' => 'Penugasan tidak ditemukan'
            ], 404);
        }

        if (now()->greaterThan($penugasan->tenggat)) {
            return response()->json([
                'success' => false,
                'message' => 'Tenggat waktu telah lewat'
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'catatan_teknisi' => 'nullable|string|max:500',
            'dokumentasi' => 'nullable|image|mimes:jpg,jpeg,png|max:2048'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        if ($request->hasFile('dokumentasi')) {
            if ($penugasan->dokumentasi &&
                Storage::exists('public/uploads/dokumentasi/' . $penugasan->dokumentasi)) {
                Storage::delete('public/uploads/dokumentasi/' . $penugasan->dokumentasi);
            }

            $path = $request->file('dokumentasi')
                ->store('uploads/dokumentasi', 'public');

            $penugasan->dokumentasi = basename($path);
        }

        $penugasan->update([
            'status_perbaikan' => 'Selesai',
            'catatan_teknisi' => $request->catatan_teknisi,
            'tanggal_selesai' => Carbon::now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Perbaikan berhasil diperbarui',
            'data' => $penugasan
        ], 200);
    }

    /* =========================
     * SKOR TEKNISI
     * ========================= */
    public function skorTeknisi()
    {
        $data = CreditScoreTeknisi::with('user')
            ->orderBy('credit_score', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $data
        ], 200);
    }
}
