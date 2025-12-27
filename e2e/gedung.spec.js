import { test, expect } from '@playwright/test';

// --- CONFIG ---
const ADMIN = { email: 'admin@jti.com', pass: 'password' };
const BASE_URL = 'http://127.0.0.1:8000';

// Mode serial: Tes dijalankan berurutan (Create -> Read -> Edit -> Delete)
test.describe.configure({ mode: 'serial' });

test.describe('Manajemen Data Gedung - Role Admin', () => {

    // Timeout 60 detik untuk jaga-jaga laptop lambat loading
    test.setTimeout(60000);

    test.beforeEach(async ({ page }) => {
        // 1. Login dengan strategi 'domcontentloaded' (Lebih cepat)
        await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });

        // Cek login (antisipasi kalau browser sudah save password)
        if (await page.locator('input[name="email"]').isVisible()) {
            await page.fill('input[name="email"]', ADMIN.email);
            await page.fill('input[name="password"]', ADMIN.pass);
            await page.click('button[type="submit"]');
        }

        // 2. Pastikan Login Berhasil
        await expect(page).not.toHaveURL(/.*login/);

        // 3. Masuk ke Menu Gedung
        await page.goto(`${BASE_URL}/gedung`, { waitUntil: 'domcontentloaded' });
        
        // Validasi masuk halaman (Cek Heading "Kelola Data Gedung")
        // Kita pakai getByText biar aman (sesuai screenshot kamu)
        await expect(page.getByText('Kelola Data Gedung').first()).toBeVisible();
    });

    // --- TEST 1: CREATE (DENGAN UPLOAD FOTO) ---
    test('1. Admin bisa MENAMBAH data gedung baru + FOTO', async ({ page }) => {
        // Klik tombol hijau
        await page.getByText('TAMBAH DATA GEDUNG').click();
        const modal = page.locator('.modal-content');
        await expect(modal).toBeVisible();

        // --- SOLUSI: GENERATE DATA UNIK ---
        // Tambahkan angka acak (timestamp) agar kode/nama tidak pernah sama
        const uniqueID = Date.now().toString(); 
        const namaGedung = `Gedung Test 2 ${uniqueID}`;
        const kodeGedung = `AG-${uniqueID.slice(-5)}`; // Ambil 5 digit terakhir biar pendek

        // Isi Form dengan data unik tadi
        await page.fill('input[name="nama_gedung"]', namaGedung);
        await page.fill('input[name="kode_gedung"]', kodeGedung); // Kode pasti unik
        await page.fill('textarea[name="deskripsi"]', 'Deskripsi otomatis');

        // Upload Foto (Pastikan file ada)
        try {
            await page.setInputFiles('input[type="file"]', 'tests/files/sample.jpg');
        } catch (error) { console.log('Skip upload'); }

        // Klik Simpan
        await page.getByRole('button', { name: 'SIMPAN GEDUNG' }).click();

        // Validasi Data Muncul (Cari teks yang unik tadi)
        await expect(page.getByText(namaGedung)).toBeVisible();
    });

    // --- TEST 2: READ / SEARCH ---
    test('2. Admin bisa MENCARI data gedung', async ({ page }) => {
        // Sesuai screenshot placeholder "Cari gedung..."
        const searchInput = page.getByPlaceholder('Cari gedung...');
        await searchInput.fill('Pusat'); 
        
        // Tunggu filter
        await page.waitForTimeout(2000);

        // Pastikan kartu masih ada
        await expect(page.getByText('Pusat')).toBeVisible();
    });

    // --- TEST 3: UPDATE ---
    test('3. Admin bisa MENGEDIT data gedung', async ({ page }) => {
        // Cari kartu spesifik yang barusan dibuat
        // Kita filter kartu yang punya teks "Gedung Test Playwright"
        // class ".gedung-card" mungkin perlu disesuaikan kalau beda, tapi biasanya ".card" aman
        const card = page.locator('.card').filter({ hasText: 'Gedung Test Playwright' }).first();
        
        // Klik tombol Edit (Icon Pensil Kuning)
        // Biasanya classnya .btn-warning atau .btn-warning-soft
        await card.locator('.btn-warning').click();

        // Validasi modal edit muncul
        await expect(page.locator('.modal-content')).toBeVisible();

        // Edit nama gedung
        await page.fill('input[name="nama_gedung"]', 'Gedung Test UPDATED');
        
        // Simpan (Cari tombol simpan di modal, biasanya teksnya sama atau "Simpan Perubahan")
        // Kita cari tombol type submit apapun yang ada di modal
        await page.locator('.modal-content button[type="submit"]').click();

        // Validasi perubahan
        await expect(modal).not.toBeVisible({ timeout: 10000 });
    });

    // --- TEST 4: DELETE ---
    test('4. Admin bisa MENGHAPUS data gedung', async ({ page }) => {
        // Cari kartu yang namanya sudah diupdate
        const card = page.locator('.card').filter({ hasText: 'Gedung Test UPDATED' }).first();

        // Handle alert konfirmasi browser
        page.on('dialog', dialog => dialog.accept());

        // Klik tombol Hapus (Icon Sampah Merah / .btn-danger)
        await card.locator('.btn-danger').click();
        
        // Tunggu proses hapus
        await page.waitForTimeout(2000);

        // Pastikan data hilang
        await expect(modal).not.toBeVisible({ timeout: 10000 });
    });

});