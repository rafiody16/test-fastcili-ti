import { test, expect, chromium } from '@playwright/test';

const LOGIN_URL = 'http://127.0.0.1:8000/login';
const GEDUNG_URL = 'http://127.0.0.1:8000/gedung';
const USER_EMAIL = 'admin@jti.com';
const USER_PASSWORD = 'password';

async function loginAndGoToGedung(page) {
    console.log('Login dan navigasi ke /gedung');

    await page.goto(LOGIN_URL, { timeout: 60000 });

    await page.fill('input[name="email"]', USER_EMAIL);
    await page.fill('input[name="password"]', USER_PASSWORD);

    await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle' }),
        page.click('button[type="submit"]'),
    ]);

    if (await page.url().includes('/login')) {
        throw new Error("Login gagal!");
    }

    console.log('Berhasil login, masuk ke halaman gedung');

    await page.goto(GEDUNG_URL);
    await page.waitForLoadState('networkidle');
}


/* ============================================================
                        CREATE GEDUNG
   ============================================================ */
test('Create Gedung', async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    await loginAndGoToGedung(page);

    await page.click('#createButton'); // tombol add

    await page.fill('input[name="kode_gedung"]', 'G99');
    await page.fill('input[name="nama_gedung"]', 'Gedung Testing');
    await page.fill('textarea[name="deskripsi"]', 'Deskripsi gedung testing');

    // Upload image
    await page.setInputFiles('input[name="foto_gedung"]', 'tests/files/sample.jpg');

    await page.click('#submitButton'); // tombol submit create

    await expect(page.locator('text=Gedung Testing')).toBeVisible();

    await browser.close();
});


/* ============================================================
                         READ / LIST
   ============================================================ */
test('Read Gedung Page', async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    await loginAndGoToGedung(page);

    await expect(page.locator('#table-gedung')).toBeVisible();

    await browser.close();
});


/* ============================================================
                        UPDATE GEDUNG
   ============================================================ */
test('Update Gedung', async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    await loginAndGoToGedung(page);

    // Klik tombol edit (btn-info)
    await page.click('button.btn-info');

    await page.fill('input[name="nama_gedung"]', 'Gedung Updated');
    await page.fill('textarea[name="deskripsi"]', 'Deskripsi Updated');

    // Upload foto baru (opsional)
    await page.setInputFiles('input[name="foto_gedung"]', 'tests/files/sample2.jpg');

    await page.click('#submitUpdate');

    await expect(page.locator('text=Gedung Updated')).toBeVisible();

    await browser.close();
});


/* ============================================================
                        DELETE GEDUNG
   ============================================================ */
test('Delete Gedung', async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    await loginAndGoToGedung(page);

    await page.click('button.btn-danger'); // tombol hapus

    await expect(page.locator('text=Gedung Updated')).not.toBeVisible();

    await browser.close();
});
