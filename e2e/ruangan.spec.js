import { test, expect } from '@playwright/test';

// =======================
// CONFIG
// =======================
const ADMIN = {
  email: 'admin@jti.com',
  pass: 'password',
};

const BASE_URL = 'http://127.0.0.1:8000';

// Data unik
const TIMESTAMP = Date.now().toString().slice(-4);
const DATA = {
  kode: `R-${TIMESTAMP}`,
  nama: `Ruangan Test ${TIMESTAMP}`,
  namaUpdate: `Ruangan Test ${TIMESTAMP} UPDATED`,
};

test.describe.configure({ mode: 'serial' });

// =======================
// TEST SUITE
// =======================
test.describe('Manajemen Data Ruangan - Role Admin', () => {
  test.setTimeout(60000);

  // =======================
  // AUTH (SAMA DENGAN LEVEL)
  // =======================
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });

    if (await page.locator('input[name="email"]').isVisible()) {
      await page.fill('input[name="email"]', ADMIN.email);
      await page.fill('input[name="password"]', ADMIN.pass);

      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle' }),
        page.click('button[type="submit"]'),
      ]);
    }

    await expect(page).not.toHaveURL(/login/);

    await page.goto(`${BASE_URL}/ruangan`, { waitUntil: 'domcontentloaded' });

    await expect(
      page.getByText('Kelola Data Ruangan').first()
    ).toBeVisible();
  });

  // =======================
  // CREATE
  // =======================
  test('1. Admin bisa MENAMBAH ruangan', async ({ page }) => {
    // Klik tombol tambah
    const btnTambah = page.getByText('TAMBAH DATA RUANGAN');
    await btnTambah.waitFor({ state: 'visible', timeout: 60000 });
    await btnTambah.click();

    // Tunggu modal siap (BUKAN cuma muncul)
    const modal = page.locator('.modal.show');
    await modal.waitFor({ state: 'visible', timeout: 60000 });

    // ===== FIX UTAMA: PILIH GEDUNG =====
    const selectGedung = modal.locator('select[name="id_gedung"]');

    // Tunggu dropdown aktif
    await selectGedung.waitFor({ state: 'visible', timeout: 60000 });
    await expect(selectGedung).toBeEnabled({ timeout: 60000 });

    // Tunggu option ke-load (AJAX / DB)
    await expect(
      selectGedung.locator('option')
    ).toHaveCountGreaterThan(1, { timeout: 60000 });

    // Pilih gedung TERATAS (selain placeholder)
    await selectGedung.selectOption({ index: 1 });

    // Isi field lain
    await modal.locator('input[name="kode_ruangan"]').fill(DATA.kode);
    await modal.locator('input[name="nama_ruangan"]').fill(DATA.nama);

    // ===== SUBMIT (nunggu siap) =====
    const btnSubmit = modal.locator('button[type="submit"]');
    await btnSubmit.waitFor({ state: 'visible', timeout: 60000 });
    await expect(btnSubmit).toBeEnabled({ timeout: 60000 });
    await btnSubmit.click();

    // SweetAlert sukses
    const btnOk = page.locator(
      '.swal2-confirm, button:has-text("OK"), button:has-text("Tutup")'
    ).first();

    await btnOk.waitFor({ state: 'visible', timeout: 60000 });
    await btnOk.click();

    // Search (DataTables pagination-safe)
    const searchInput = page
      .getByLabel('Search:')
      .or(page.locator('input[type="search"]'));

    await searchInput.first().fill(DATA.nama);
    await page.waitForTimeout(1000);

    await expect(
      page.getByRole('cell', { name: DATA.nama })
    ).toBeVisible();
  });

  // =======================
  // READ
  // =======================
  test('2. Admin bisa MENCARI ruangan', async ({ page }) => {
    const searchInput = page
      .getByLabel('Search:')
      .or(page.locator('input[type="search"]'));

    await searchInput.first().fill(DATA.nama);
    await page.waitForTimeout(1000);

    await expect(
      page.getByRole('cell', { name: DATA.nama })
    ).toBeVisible();
  });

  // =======================
  // UPDATE
  // =======================
  test('3. Admin bisa MENGEDIT ruangan', async ({ page }) => {
    const searchInput = page
      .getByLabel('Search:')
      .or(page.locator('input[type="search"]'));

    await searchInput.first().fill(DATA.nama);
    await page.waitForTimeout(1000);

    const targetRow = page
      .locator('tr')
      .filter({ hasText: DATA.nama })
      .first();

    const btnEdit = targetRow
      .getByRole('link', { name: 'EDIT' })
      .or(targetRow.getByRole('button', { name: 'EDIT' }));

    await btnEdit.click();

    const modal = page.locator('.modal.show');
    await modal.waitFor({ state: 'visible', timeout: 60000 });

    await modal
      .locator('input[name="nama_ruangan"]')
      .fill(DATA.namaUpdate);

    const btnSubmit = modal.locator('button[type="submit"]');
    await btnSubmit.waitFor({ state: 'visible', timeout: 60000 });
    await expect(btnSubmit).toBeEnabled({ timeout: 60000 });
    await btnSubmit.click();

    const btnOk = page.locator(
      '.swal2-confirm, button:has-text("OK"), button:has-text("Tutup")'
    ).first();

    await btnOk.waitFor({ state: 'visible', timeout: 60000 });
    await btnOk.click();

    await searchInput.first().fill(DATA.namaUpdate);
    await page.waitForTimeout(1000);

    await expect(
      page.getByRole('cell', { name: DATA.namaUpdate })
    ).toBeVisible();
  });

  // =======================
  // DELETE
  // =======================
  test('4. Admin bisa MENGHAPUS ruangan', async ({ page }) => {
    const searchInput = page
      .getByLabel('Search:')
      .or(page.locator('input[type="search"]'));

    await searchInput.first().fill(DATA.namaUpdate);
    await page.waitForTimeout(1000);

    const targetRow = page
      .locator('tr')
      .filter({ hasText: DATA.namaUpdate })
      .first();

    const btnDelete = targetRow
      .getByRole('link', { name: 'DELETE' })
      .or(targetRow.getByRole('button', { name: 'DELETE' }));

    await btnDelete.click();

    // Konfirmasi hapus
    const btnConfirm = page.locator(
      '.swal2-confirm, button:has-text("Ya"), button:has-text("Yes")'
    ).first();

    if (await btnConfirm.isVisible()) {
      await btnConfirm.click();
    }

    // Popup sukses
    const btnOk = page.locator(
      '.swal2-confirm, button:has-text("OK"), button:has-text("Tutup")'
    ).first();

    if (await btnOk.isVisible()) {
      await btnOk.click();
    }

    await page.waitForTimeout(1000);
    await expect(
      page.getByRole('cell', { name: DATA.namaUpdate })
    ).not.toBeVisible();
  });
});
