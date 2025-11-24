import { test, expect } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:8000';

test.describe('CRUD Fasilitas', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', 'admin@jti.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`);
  });

  test('Create - Menambahkan fasilitas baru', async ({ page }) => {
    await page.goto(`${BASE_URL}/fasilitas`);

    // buka modal create
    await page.click('button#btn-create');
    await page.waitForSelector('#modal-master.show');

    // pilih gedung
    await page.selectOption('#gedung', { index: 1 });

    // tunggu AJAX ruangan
    await page.waitForFunction(() => {
      const r = document.querySelector('#ruangan');
      return r && r.options.length > 1;
    });

    // pilih ruangan
    await page.selectOption('#ruangan', { index: 1 });

    // isi field
    await page.fill('#kode_fasilitas', 'TEST-001');
    await page.fill('#nama_fasilitas', 'Fasilitas Testing');
    await page.fill('#jumlah', '5');

    // submit
    await page.click('#form_create button[type="submit"]');

    // SweetAlert success
    await page.waitForSelector('.swal2-popup');

    await page.click('.swal2-confirm');

    // pastikan reload
    await page.waitForURL(/fasilitas/);

    // cek apakah tampil
    await expect(page.locator('table')).toContainText('Fasilitas Testing');
  });

  test('Update - Edit Data Fasilitas', async ({ page }) => {
    await page.goto(`${BASE_URL}/fasilitas`);

    // klik tombol edit (asumsi ada tombol class .btn-edit)
    await page.click('.btn-edit');

    await page.waitForSelector('#modal-edit.show');

    await page.fill('#nama_fasilitas_edit', 'Fasilitas Edit Test');

    await page.click('#form_edit button[type="submit"]');

    await page.waitForSelector('.swal2-popup');
    await page.click('.swal2-confirm');

    await expect(page.locator('table')).toContainText('Fasilitas Edit Test');
  });

  test('Delete - Hapus Data Fasilitas', async ({ page }) => {
    await page.goto(`${BASE_URL}/fasilitas`);

    // klik tombol hapus
    await page.click('.btn-delete');

    // konfirmasi sweetalert
    await page.waitForSelector('.swal2-popup');
    await page.click('.swal2-confirm');

    await page.waitForSelector('.swal2-popup');
    await page.click('.swal2-confirm');

    // cek apakah sudah hilang
    await expect(page.locator('table')).not.toContainText('Fasilitas Edit Test');
  });

});
