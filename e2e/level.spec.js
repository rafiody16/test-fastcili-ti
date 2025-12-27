import { test, expect } from '@playwright/test';

// --- CONFIG ---
const ADMIN = { email: 'admin@jti.com', pass: 'password' };
const BASE_URL = 'http://127.0.0.1:8000';

// Generate Data Unik (Timestamp) agar tidak bentrok saat run berulang
const TIMESTAMP = Date.now().toString().slice(-4);
const DATA = {
    kode: `LVL-${TIMESTAMP}`,
    nama: `Level Test ${TIMESTAMP}`,
    namaUpdate: `Level Test ${TIMESTAMP} UPDATED`
};

test.describe.configure({ mode: 'serial' });

test.describe('Manajemen Data Level - Role Admin', () => {
    test.setTimeout(60000);

    // --- SETUP: LOGIN ---
    test.beforeEach(async ({ page }) => {
        await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });

        // Cek login
        const emailInput = page.locator('input[name="email"]');
        if (await emailInput.isVisible()) {
            await emailInput.fill(ADMIN.email);
            await page.fill('input[name="password"]', ADMIN.pass);
            await page.click('button[type="submit"]');
        }

        await expect(page).not.toHaveURL(/.*login/);
        await page.goto(`${BASE_URL}/level`, { waitUntil: 'domcontentloaded' });
        
        // Validasi judul halaman sesuai screenshot ("Kelola Data Level")
        await expect(page.getByText('Kelola Data Level').first()).toBeVisible();
    });

    // --- TEST 1: CREATE ---
    test('1. Admin bisa MENAMBAH level baru', async ({ page }) => {
        // Klik Tambah
        await page.getByText('TAMBAH DATA LEVEL').click();

        // Isi Form
        await expect(page.locator('.modal-content')).toBeVisible();
        await page.fill('input[name="kode_level"]', DATA.kode);
        await page.fill('input[name="nama_level"]', DATA.nama);
        await page.locator('.modal-content button[type="submit"]').click();

        // --- HANDLING POP-UP SUKSES ---
        // Cari tombol OK/Tutup di SweetAlert
        const btnOk = page.locator('.swal2-confirm, button:has-text("OK"), button:has-text("Tutup")').first();
        await expect(btnOk).toBeVisible(); 
        await btnOk.click();

        // --- SOLUSI PAGINATION: SEARCH DULU ---
        // Karena data baru mungkin ada di page 2, kita search biar muncul
        // Selector input search berdasarkan label "Search:" di screenshot
        const searchInput = page.getByLabel('Search:').or(page.locator('input[type="search"]'));
        await searchInput.first().fill(DATA.nama);
        
        // Tunggu tabel refresh
        await page.waitForTimeout(1000);

        // Validasi Data Muncul
        await expect(page.getByRole('cell', { name: DATA.nama })).toBeVisible();
    });

    // --- TEST 2: READ (SEARCH) ---
    test('2. Admin bisa MENCARI data level', async ({ page }) => {
        // Search data yang dibuat tadi
        const searchInput = page.getByLabel('Search:').or(page.locator('input[type="search"]'));
        await searchInput.first().fill(DATA.nama);
        
        await page.waitForTimeout(1000);
        await expect(page.getByRole('cell', { name: DATA.nama })).toBeVisible();
    });

    // --- TEST 3: UPDATE ---
    test('3. Admin bisa MENGEDIT data level', async ({ page }) => {
        // 1. Search dulu biar barisnya pasti ada di layar
        const searchInput = page.getByLabel('Search:').or(page.locator('input[type="search"]'));
        await searchInput.first().fill(DATA.nama);
        await page.waitForTimeout(1000);

        // 2. Cari baris yang berisi Nama Level kita
        const targetRow = page.locator('tr').filter({ hasText: DATA.nama }).first();

        // 3. Klik tombol "EDIT" (Sesuai teks di screenshot)
        // Kita gunakan getByRole 'link' atau 'button' dengan nama 'EDIT'
        const btnEdit = targetRow.getByRole('link', { name: 'EDIT' }).or(targetRow.getByRole('button', { name: 'EDIT' }));
        await btnEdit.click();

        // Validasi Modal
        await expect(page.locator('.modal-content')).toBeVisible();

        // Update Data
        await page.fill('input[name="nama_level"]', DATA.namaUpdate);
        await page.locator('.modal-content button[type="submit"]').click();

        // Handle Pop-up Sukses
        const btnOk = page.locator('.swal2-confirm, button:has-text("OK"), button:has-text("Tutup")').first();
        await expect(btnOk).toBeVisible();
        await btnOk.click();

        // Validasi Update (Search nama baru)
        await searchInput.first().fill(DATA.namaUpdate);
        await page.waitForTimeout(1000);
        await expect(page.getByRole('cell', { name: DATA.namaUpdate })).toBeVisible();
    });

    // --- TEST 4: DELETE ---
    test('4. Admin bisa MENGHAPUS data level', async ({ page }) => {
        // 1. Search data yang sudah diupdate tadi
        const searchInput = page.getByLabel('Search:').or(page.locator('input[type="search"]'));
        await searchInput.first().fill(DATA.namaUpdate);
        await page.waitForTimeout(1000);

        // 2. Cari baris tabel
        const targetRow = page.locator('tr').filter({ hasText: DATA.namaUpdate }).first();

        // 3. Klik tombol "DELETE" (Sesuai teks di screenshot)
        const btnDelete = targetRow.getByRole('link', { name: 'DELETE' }).or(targetRow.getByRole('button', { name: 'DELETE' }));
        await btnDelete.click();

        // 4. Handle Konfirmasi Hapus (SweetAlert: "Ya, Hapus!")
        // Cari tombol konfirmasi (biasanya warna merah/biru di popup)
        const btnConfirm = page.locator('.swal2-confirm, button:has-text("Ya"), button:has-text("Yes")').first();
        if (await btnConfirm.isVisible()) {
            await btnConfirm.click();
        }

        // 5. Handle Pop-up Sukses Delete
        const btnOk = page.locator('.swal2-confirm, button:has-text("OK"), button:has-text("Tutup")').first();
        if (await btnOk.isVisible()) {
            await btnOk.click();
        }

        // 6. Validasi Data Hilang
        // Tunggu sebentar, pastikan tabel reload
        await page.waitForTimeout(1000);
        await expect(page.getByRole('cell', { name: DATA.namaUpdate })).not.toBeVisible();
    });

});