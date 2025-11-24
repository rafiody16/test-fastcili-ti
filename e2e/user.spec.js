import { test, expect, chromium } from '@playwright/test';

const LOGIN_URL = 'http://127.0.0.1:8000/login';
const USER_URL = 'http://127.0.0.1:8000/users';
const USER_EMAIL = 'admin@jti.com';
const USER_PASSWORD = 'password';

async function loginAndGoToUsers(page) {
    console.log('Melakukan Login dan Navigasi ke /users');

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

    console.log('Berhasil login! Masuk ke halaman /users');

    await page.goto(USER_URL);
    await page.waitForLoadState('networkidle');
}

/* ===============================
   CREATE USER
================================*/
test('Create User', async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    await loginAndGoToUsers(page);

    await page.click('#createButton'); 

    await page.selectOption('select[name="id_level"]', '1');
    await page.fill('input[name="nama"]', 'User Testing');
    await page.fill('input[name="email"]', 'usertesting@example.com');

    await page.click('#submitButton');

    await expect(page.locator('text=User Testing')).toBeVisible();

    await browser.close();
});

/* ===============================
   READ USER PAGE
================================*/
test('Read User Page', async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    await loginAndGoToUsers(page);

    await expect(page.locator('#table-users')).toBeVisible();

    await browser.close();
});

/* ===============================
   UPDATE USER
================================*/
test('Update User', async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    await loginAndGoToUsers(page);

    await page.click('button.btn-info'); // tombol edit

    await page.fill('input[name="nama"]', 'User Updated');

    await page.click('#submitUpdate');

    await expect(page.locator('text=User Updated')).toBeVisible();

    await browser.close();
});

/* ===============================
   DELETE USER
================================*/
test('Delete User', async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    await loginAndGoToUsers(page);

    await page.click('button.btn-danger');

    await expect(page.locator('text=User Updated')).not.toBeVisible();

    await browser.close();
});
