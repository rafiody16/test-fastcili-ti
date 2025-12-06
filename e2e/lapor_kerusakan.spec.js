// tests/lapor_kerusakan.spec.js
import { test, expect, chromium } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:8000';
const LOGIN_URL = `${BASE_URL}/login`;
const LAPOR_URL = `${BASE_URL}/lapor_kerusakan`;
const USER_EMAIL = 'admin@jti.com';
const USER_PASSWORD = 'password';

/**
 * Helper: login sebagai admin & buka halaman /lapor_kerusakan
 */
async function loginAndGoToLaporKerusakan(page) {
  // Login
  await page.goto(LOGIN_URL, { timeout: 60000 });

  await page.fill('input[name="email"]', USER_EMAIL);
  await page.fill('input[name="password"]', USER_PASSWORD);

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }),
    page.click('button[type="submit"]'),
  ]);

  if (await page.url().includes('/login')) {
    throw new Error('Login gagal!');
  }

  // Buka halaman laporan kerusakan
  await page.goto(LAPOR_URL);
  await page.waitForLoadState('networkidle');
}

/* ======================================
   1. READ HALAMAN LAPORAN KERUSAKAN
====================================== */
test('Read Laporan Kerusakan Page', async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await loginAndGoToLaporKerusakan(page);

  // Pastikan judul / elemen utama muncul
  await expect(page.locator('h3', { hasText: 'Laporan Kerusakan' })).toBeVisible();

  // Jika user level 1 (admin), harus muncul tabel #table_laporan
  await expect(page.locator('#table_laporan')).toBeVisible();

  await browser.close();
});

/* =====================================================
   2. INTERAKSI: PILIH GEDUNG -> RUANGAN (MOCK AJAX)
===================================================== */
test('Dropdown Gedung -> Ruangan bekerja (mock get-ruangan)', async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();

  // Mock response /get-ruangan/{idGedung}
  await context.route('**/get-ruangan/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id_ruangan: 1, nama_ruangan: 'Ruang 101' },
        { id_ruangan: 2, nama_ruangan: 'Ruang 102' },
      ]),
    });
  });

  const page = await context.newPage();
  await loginAndGoToLaporKerusakan(page);

  // Pastikan dropdown gedung ada
  const gedungSelect = page.locator('#id_gedung');
  await expect(gedungSelect).toBeVisible();

  // Pilih gedung pertama yang value-nya bukan kosong
  const options = await gedungSelect.locator('option').all();
  let valueToSelect = null;
  for (const opt of options) {
    const val = await opt.getAttribute('value');
    if (val && val !== '') {
      valueToSelect = val;
      break;
    }
  }

  if (!valueToSelect) {
    throw new Error('Tidak ada option gedung yang valid (selain placeholder).');
  }

  await gedungSelect.selectOption(valueToSelect);

  // Setelah pilih gedung, #ruangan-group harus tampil
  await expect(page.locator('#ruangan-group')).toBeVisible();
  await expect(page.locator('#id_ruangan')).toBeVisible();

  // Karena kita sudah mock get-ruangan, dropdown ruangan harus terisi
  // default option + 2 data mock = 3 option total
  await expect(page.locator('#id_ruangan option')).toHaveCount(3);

  await browser.close();
});

/* ==================================================================================
   3. RUANGAN TANPA LAPORAN EXISTING: LANGSUNG TAMPIL FORM LAPORAN BARU (MOCK AJAX)
================================================================================== */
test('Jika tidak ada laporan existing, form laporan baru langsung tampil', async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();

  // Mock get-ruangan
  await context.route('**/get-ruangan/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id_ruangan: 1, nama_ruangan: 'Ruang 101' }]),
    });
  });

  // Mock get-fasilitas-terlapor => KOSONG (tidak ada laporan existing)
  await context.route('**/get-fasilitas-terlapor/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  // Mock get-fasilitas-belum-lapor => ada beberapa fasilitas
  await context.route('**/get-fasilitas-belum-lapor/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id_fasilitas: 10, nama_fasilitas: 'Kursi' },
        { id_fasilitas: 11, nama_fasilitas: 'Meja' },
      ]),
    });
  });

  const page = await context.newPage();
  await loginAndGoToLaporKerusakan(page);

  // Pilih gedung pertama yang valid
  const gedungSelect = page.locator('#id_gedung');
  await expect(gedungSelect).toBeVisible();

  const gedungOptions = await gedungSelect.locator('option').all();
  let gedungValue = null;
  for (const opt of gedungOptions) {
    const val = await opt.getAttribute('value');
    if (val && val !== '') {
      gedungValue = val;
      break;
    }
  }
  await gedungSelect.selectOption(gedungValue);

  // Pilih ruangan (mock id=1)
  const ruanganSelect = page.locator('#id_ruangan');
  await expect(ruanganSelect).toBeVisible();
  await ruanganSelect.selectOption('1');

  // Karena get-fasilitas-terlapor dikembalikan [], container laporan existing harus HIDDEN
  await expect(page.locator('#laporan-terlapor-container')).toBeHidden();

  // Form laporan baru harus tampil
  const formBaru = page.locator('#form-laporan-baru');
  await expect(formBaru).toBeVisible();

  // Dropdown fasilitas harus terisi dari mock
  await expect(page.locator('#id_fasilitas option')).toHaveCount(3); // default + 2 mock

  await browser.close();
});

/* =====================================================================================
   4. RUANGAN DENGAN LAPORAN EXISTING: DUKUNG LAPORAN & FORM BARU TOGGLE (MOCK AJAX)
===================================================================================== */
test('Ruang dengan laporan existing: bisa pilih dukung laporan atau buat laporan baru', async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();

  // Mock get-ruangan
  await context.route('**/get-ruangan/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id_ruangan: 2, nama_ruangan: 'Ruang 202' }]),
    });
  });

  // Mock get-fasilitas-terlapor => ADA 1 laporan existing
  await context.route('**/get-fasilitas-terlapor/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id_laporan: 99,
          nama_fasilitas: 'Proyektor',
          deskripsi: 'Proyektor rusak tidak bisa nyala',
          foto_kerusakan: 'dummy.jpg',
          tanggal_lapor: '2025-01-01',
        },
      ]),
    });
  });

  // Mock get-fasilitas-belum-lapor => 1 fasilitas tersisa
  await context.route('**/get-fasilitas-belum-lapor/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id_fasilitas: 20, nama_fasilitas: 'Speaker' },
      ]),
    });
  });

  // Mock POST /lapor_kerusakan (laporan.store) supaya langsung sukses
  await context.route('**/lapor_kerusakan', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Laporan berhasil (mock).',
        }),
      });
    } else {
      await route.continue();
    }
  });

  const page = await context.newPage();
  await loginAndGoToLaporKerusakan(page);

  // Pilih gedung
  const gedungSelect = page.locator('#id_gedung');
  await expect(gedungSelect).toBeVisible();

  const gedungOptions = await gedungSelect.locator('option').all();
  let gedungValue = null;
  for (const opt of gedungOptions) {
    const val = await opt.getAttribute('value');
    if (val && val !== '') {
      gedungValue = val;
      break;
    }
  }
  await gedungSelect.selectOption(gedungValue);

  // Pilih ruangan (mock id=2)
  const ruanganSelect = page.locator('#id_ruangan');
  await expect(ruanganSelect).toBeVisible();
  await ruanganSelect.selectOption('2');

  // Container laporan existing harus tampil
  const containerExisting = page.locator('#laporan-terlapor-container');
  await expect(containerExisting).toBeVisible();

  // Harus ada 1 card laporan existing
  await expect(containerExisting.locator('.card')).toHaveCount(1);

  // Klik tombol "Laporkan Ini" pada card
  await containerExisting.locator('button.pilih-laporan').click();

  // Setelah pilih, form dukungan harus tampil (#form-dukungan)
  await expect(page.locator('#form-dukungan')).toBeVisible();

  // Form laporan baru harus disembunyikan
  await expect(page.locator('#form-laporan-baru')).toBeHidden();

  // Tombol submit harus aktif (karena mode dukung laporan selalu enable)
  const submitButton = page.locator('#btn-submit');
  await expect(submitButton).toBeEnabled();

  // Klik submit dan pastikan request POST ke /lapor_kerusakan terkirim
  const [request] = await Promise.all([
    page.waitForRequest((req) =>
      req.url().includes('/lapor_kerusakan') && req.method() === 'POST'
    ),
    submitButton.click(),
  ]);
  expect(request.method()).toBe('POST');

  await browser.close();
});