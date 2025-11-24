import { test, expect, chromium } from '@playwright/test';

const LOGIN_URL = 'http://127.0.0.1:8000/login';
const RUANGAN_URL = 'http://127.0.0.1:8000/ruangan';
const USER_EMAIL = 'admin@jti.com';
const USER_PASSWORD = 'password';

// Helper Login
async function loginAndGoToRuangan(page) {
    console.log('Login dan navigasi ke /ruangan');

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

    console.log('Berhasil login! Masuk ke halaman /ruangan');

    await page.goto(RUANGAN_URL);
    await page.waitForLoadState('networkidle');
}


// CREATE
test('Create Ruangan', async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    await loginAndGoToRuangan(page);

    await page.click('#createButton');

    await page.selectOption('select[name="id_gedung"]', '1');
    await page.fill('input[name="kode_ruangan"]', 'R999');
    await page.fill('input[name="nama_ruangan"]', 'Ruangan Testing');

    await page.click('#submitButton');

    await expect(page.locator('text=Ruangan Testing')).toBeVisible();

    await browser.close();
});


// READ
test('Read Ruangan Page', async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    await loginAndGoToRuangan(page);

    await expect(page.locator('#table-ruangan')).toBeVisible();

    await browser.close();
});


// UPDATE
test('Update Ruangan', async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    await loginAndGoToRuangan(page);

    await page.click('button.btn-info'); // tombol edit

    await page.fill('input[name="nama_ruangan"]', 'Ruangan Updated');

    await page.click('#submitUpdate');

    await expect(page.locator('text=Ruangan Updated')).toBeVisible();

    await browser.close();
});


// DELETE
test('Delete Ruangan', async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    await loginAndGoToRuangan(page);

    await page.click('button.btn-danger'); // tombol hapus

    await expect(page.locator('text=Ruangan Updated')).not.toBeVisible();

    await browser.close();
});
