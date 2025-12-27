<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

use App\Models\User;
use App\Models\Gedung;
use App\Models\Ruangan;
use App\Models\Fasilitas;
use App\Models\PelaporLaporan;
use App\Models\LaporanKerusakan;
use App\Models\PenugasanTeknisi;
use App\Models\KriteriaPenilaian;
use App\Models\CreditScoreTeknisi;

class LaporanKerusakanController extends Controller
{
    /* =====================================================
     * GET ALL LAPORAN
     * ===================================================== */
    public function index()
    {
        $data = PelaporLaporan::with([
            'laporan.fasilitas.ruangan.gedung',
            'laporan.status',
            'user'
        ])->get();

        return response()->json([
            'success' => true,
            'data' => $data
        ], 200);
    }

    /* =====================================================
     * GET RUANGAN BY GEDUNG
     * ===================================================== */
    public function getRuangan($idGedung)
    {
        return response()->json([
            'success' => true,
            'data' => Ruangan::where('id_gedung', $idGedung)->get()
        ]);
    }

    /* =====================================================
     * GET FASILITAS TERLAPOR
     * ===================================================== */
    public function getFasilitasTerlapor($idRuangan)
    {
        $data = LaporanKerusakan::with('fasilitas')
            ->whereHas('fasilitas', fn ($q) => $q->where('id_ruangan', $idRuangan))
            ->whereIn('id_status', [1,2,3])
            ->get();

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    /* =====================================================
     * STORE LAPORAN BARU
     * ===================================================== */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_fasilitas'     => 'required|exists:fasilitas,id_fasilitas',
            'deskripsi'        => 'required|string|max:255',
            'jumlah_kerusakan' => 'required|numeric|min:0',
            'foto_kerusakan'   => 'required|image|max:2048'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $path = $request->file('foto_kerusakan')
            ->store('uploads/laporan_kerusakan', 'public');

        $laporan = LaporanKerusakan::create([
            'id_fasilitas'     => $request->id_fasilitas,
            'deskripsi'        => $request->deskripsi,
            'jumlah_kerusakan' => $request->jumlah_kerusakan,
            'foto_kerusakan'   => basename($path),
            'tanggal_lapor'    => now(),
            'id_status'        => 1,
        ]);

        PelaporLaporan::create([
            'id_laporan' => $laporan->id_laporan,
            'id_user'    => Auth::id(),
            'deskripsi_tambahan' => $request->deskripsi,
        ]);

        return response()->json([
            'success' => true,
            'data' => $laporan
        ], 201);
    }

    /* =====================================================
     * DELETE LAPORAN
     * ===================================================== */
   public function destroy($id)
    {
        if (auth()->user()->id_level == 3) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden'
            ], 403);
        }

        DB::transaction(function () use ($id) {
            PelaporLaporan::where('id_laporan', $id)->delete();
            LaporanKerusakan::where('id_laporan', $id)->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Laporan berhasil dihapus'
        ]);
    }

    /* =====================================================
     * TRENDING LAPORAN
     * ===================================================== */
    public function trending()
    {
        $bobot = [
            'MHS' => 1,
            'TDK' => 2,
            'DSN' => 3,
            'ADM' => 3
        ];

        $pelapor = PelaporLaporan::with(['user.level','laporan'])
            ->whereHas('laporan', fn ($q) => $q->where('id_status','!=',4))
            ->get();

        $hasil = [];

        foreach ($pelapor as $p) {
            $id = $p->id_laporan;
            $kode = $p->user->level->kode_level ?? 'OTHER';
            $skor = $bobot[$kode] ?? 0;

            if (!isset($hasil[$id])) {
                $hasil[$id] = [
                    'laporan' => $p->laporan,
                    'skor' => 0,
                    'total_pelapor' => 0
                ];
            }

            $hasil[$id]['skor'] += $skor;
            $hasil[$id]['total_pelapor']++;
        }

        return response()->json([
            'success' => true,
            'data' => array_values($hasil)
        ]);
    }

    /* =====================================================
     * SIMPAN PENILAIAN
     * ===================================================== */
    public function simpanPenilaian(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'tingkat_kerusakan'   => 'required|numeric',
            'frekuensi_digunakan' => 'required|numeric',
            'dampak'              => 'required|numeric',
            'estimasi_biaya'      => 'required|numeric',
            'potensi_bahaya'      => 'required|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        LaporanKerusakan::where('id_laporan',$id)
            ->update(['id_status' => 2]);

        KriteriaPenilaian::create(array_merge(
            ['id_laporan' => $id],
            $validator->validated()
        ));

        return response()->json([
            'success' => true,
            'message' => 'Penilaian berhasil disimpan'
        ]);
    }
}
