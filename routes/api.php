<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\api\Auth\LoginController;
use App\Http\Controllers\api\Auth\RegisterController;
use App\Http\Controllers\api\ProfileController;
use App\Http\Controllers\api\UserController;
use App\Http\Controllers\api\LevelController;
use App\Http\Controllers\api\GedungController;
use App\Http\Controllers\api\RuanganController;
use App\Http\Controllers\api\FasilitasController;
use App\Http\Controllers\api\LaporanKerusakanController;
use App\Http\Controllers\api\PerbaikanController;
use App\Http\Controllers\api\PenugasanTeknisiController;
use App\Http\Controllers\api\WaspasController;
use App\Http\Controllers\api\NotificationController;
use App\Http\Controllers\api\PeriodeController;

/*
|--------------------------------------------------------------------------
| AUTH api
|--------------------------------------------------------------------------
*/
Route::post('/login', [LoginController::class, 'login']);
Route::post('/register', [RegisterController::class, 'register']);

Route::middleware('auth:sanctum')->post('/logout', [LoginController::class, 'logout']);

/*
|--------------------------------------------------------------------------
| AUTHENTICATED api
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum'])->group(function () {

    /*
    |--------------------------------------------------------------------------
    | PROFILE
    |--------------------------------------------------------------------------
    */
    Route::get('/profile', [ProfileController::class, 'edit']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::put('/profile/password', [ProfileController::class, 'updatePassword']);

    /*
    |--------------------------------------------------------------------------
    | LEVEL (ADMIN)
    |--------------------------------------------------------------------------
    */
    Route::middleware('authorize:1')->prefix('levels')->group(function () {
        Route::get('/level', [LevelController::class, 'index']);
        Route::post('/level', [LevelController::class, 'store']);
        Route::get('/level/{id}', [LevelController::class, 'edit']);
        Route::put('/level/{id}', [LevelController::class, 'update']);
        Route::delete('/level/{id}', [LevelController::class, 'destroy']);
    });

    /*
    |--------------------------------------------------------------------------
    | USERS
    |--------------------------------------------------------------------------
    */
    Route::middleware('authorize:1')->prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::post('/', [UserController::class, 'store']);
        Route::get('/{id}', [UserController::class, 'edit']);
        Route::put('/{id}', [UserController::class, 'update']);
        Route::delete('/{id}', [UserController::class, 'destroy']);
        Route::post('/toggle-access/{id}', [UserController::class, 'toggleAccess']);
        Route::post('/import', [UserController::class, 'import_ajax']);
    });

    /*
    |--------------------------------------------------------------------------
    | GEDUNG
    |--------------------------------------------------------------------------
    */
    Route::apiResource('gedung', GedungController::class);
    Route::get('/gedung/{id}/detail', [GedungController::class, 'detail']);

    /*
    |--------------------------------------------------------------------------
    | RUANGAN
    |--------------------------------------------------------------------------
    */
    Route::prefix('ruangan')->group(function () {
        Route::get('/', [RuanganController::class, 'index']);
        Route::post('/', [RuanganController::class, 'store']);
        Route::put('/{id}', [RuanganController::class, 'update']);
        Route::delete('/{id}', [RuanganController::class, 'destroy']);
        Route::get('/data', [RuanganController::class, 'getData']);
        Route::post('/import', [RuanganController::class, 'import_ajax']);
    });

    /*
    |--------------------------------------------------------------------------
    | FASILITAS
    |--------------------------------------------------------------------------
    */
    Route::prefix('fasilitas')->group(function () {
        Route::get('/', [FasilitasController::class, 'index']);
        Route::post('/', [FasilitasController::class, 'store']);
        Route::get('/{id}', [FasilitasController::class, 'show']);
        Route::put('/{id}', [FasilitasController::class, 'update']);
        Route::delete('/{id}', [FasilitasController::class, 'destroy']);
        Route::get('/ruangan/{id}', [FasilitasController::class, 'getRuangan']);
        Route::get('/list', [FasilitasController::class, 'list']);
        Route::post('/import', [FasilitasController::class, 'import_ajax']);
    });

    /*
    |--------------------------------------------------------------------------
    | LAPORAN KERUSAKAN
    |--------------------------------------------------------------------------
    */
    Route::middleware('authorize:1,2,4,5,6')->prefix('laporan')->group(function () {
        Route::get('/', [LaporanKerusakanController::class, 'index']);
        Route::post('/', [LaporanKerusakanController::class, 'store']);
        Route::delete('/{id}', [LaporanKerusakanController::class, 'destroy']);
        Route::get('/trending', [LaporanKerusakanController::class, 'trending']);
        Route::get('/penilaian/{id}', [LaporanKerusakanController::class, 'showPenilaian']);
        Route::post('/penilaian/{id}', [LaporanKerusakanController::class, 'simpanPenilaian']);
        Route::get('/export', [LaporanKerusakanController::class, 'exportLaporan']);
    });

    /*
    |--------------------------------------------------------------------------
    | PERBAIKAN & TEKNISI
    |--------------------------------------------------------------------------
    */
    Route::middleware('authorize:1,2,3')->prefix('perbaikan')->group(function () {
        Route::get('/', [PerbaikanController::class, 'index']);
        Route::get('/riwayat', [PerbaikanController::class, 'riwayat_perbaikan']);
        Route::put('/{id}', [PerbaikanController::class, 'update']);
        Route::get('/{id}', [PerbaikanController::class, 'detail']);
    });

    Route::middleware('authorize:1,3')->prefix('teknisi')->group(function () {
        Route::put('/feedback/{id}', [PenugasanTeknisiController::class, 'feedbackTeknisi']);
    });
    /*
    |--------------------------------------------------------------------------
    | HELPER (DROPDOWN)
    |--------------------------------------------------------------------------
    */
    Route::get('/get-ruangan/{idGedung}', [LaporanKerusakanController::class, 'getRuangan']);
    Route::get('/get-fasilitas-terlapor/{idRuangan}', [LaporanKerusakanController::class, 'getFasilitasTerlapor']);
    Route::get('/get-fasilitas-belum-lapor/{idRuangan}', [LaporanKerusakanController::class, 'getFasilitasBelumLapor']);
});
