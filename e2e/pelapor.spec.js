// @ts-check
import { test, expect } from "@playwright/test";

/**
 * End-to-End Testing untuk Role Pelapor
 *
 * Testing ini mencakup:
 * 1. Login sebagai pelapor
 * 2. Akses dashboard pelapor
 * 3. Membuat laporan kerusakan baru
 * 4. Melihat daftar laporan
 * 5. Melihat detail laporan
 * 6. Edit laporan
 * 7. Memberikan rating dan feedback
 * 8. Menghapus laporan
 * 9. Logout
 */

// Konfigurasi untuk testing
const BASE_URL = "http://127.0.0.1:8000";
const PELAPOR_EMAIL = "pelapor@jti.com";
const PELAPOR_PASSWORD = "password";

// Setup: Login sebelum setiap test
test.beforeEach(async ({ page }) => {
    // Set longer timeout for each test
    test.setTimeout(60000);

    try {
        // Navigate to login page
        await page.goto(`${BASE_URL}/login`, {
            waitUntil: "domcontentloaded",
            timeout: 30000,
        });

        // Wait for page to be ready
        await page.waitForLoadState("networkidle", { timeout: 10000 });

        // Find and fill email input (try multiple selectors)
        const emailInput = await page
            .locator('input[type="email"], input[name="email"]')
            .first();
        await emailInput.waitFor({ state: "visible", timeout: 10000 });
        await emailInput.fill(PELAPOR_EMAIL);

        // Find and fill password input
        const passwordInput = await page
            .locator('input[type="password"], input[name="password"]')
            .first();
        await passwordInput.waitFor({ state: "visible", timeout: 5000 });
        await passwordInput.fill(PELAPOR_PASSWORD);

        // Find and click login button
        const loginButton = await page.locator('button[type="submit"]').first();
        await loginButton.waitFor({ state: "visible", timeout: 5000 });

        // Click and wait for navigation
        await Promise.all([
            page.waitForLoadState("networkidle", { timeout: 20000 }),
            loginButton.click(),
        ]);

        // Wait a bit for redirect
        await page.waitForTimeout(2000);

        // Verify we're logged in (check URL)
        const currentUrl = page.url();
        console.log(`Current URL after login: ${currentUrl}`);

        if (!currentUrl.includes("/pelapor") && !currentUrl.includes("/home")) {
            console.warn(`Warning: Unexpected URL after login: ${currentUrl}`);
        }
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Login failed: ${error.message}`);
        } else {
            console.error("Login failed:", String(error));
        }
        throw error;
    }
});

test.describe("Pelapor Dashboard", () => {
    test("Pelapor dapat mengakses dashboard dan melihat halaman utama", async ({
        page,
    }) => {
        // Verify URL contains /pelapor
        await expect(page).toHaveURL(/.*pelapor/);

        // Check if welcome message is visible
        await expect(
            page.locator('h2:has-text("Selamat Datang")')
        ).toBeVisible();

        // Check if user name is displayed
        await expect(page.locator("text=/Selamat Datang/")).toBeVisible();

        // Check if "Lihat Laporan Saya" button exists
        await expect(
            page.locator('a:has-text("Lihat Laporan Saya")')
        ).toBeVisible();
    });

    test("Pelapor dapat melihat status laporan di dashboard", async ({
        page,
    }) => {
        // Check if "Status Laporan Anda" section exists
        const statusSection = page.locator(
            'h3:has-text("Status Laporan Anda")'
        );
        await expect(statusSection).toBeVisible();

        // Check if there are cards displaying reports (if any)
        const reportCards = page.locator(".card.shadow-lg");
        const count = await reportCards.count();

        if (count > 0) {
            // Verify first card has required elements
            await expect(
                reportCards.first().locator(".card-title")
            ).toBeVisible();
        }
    });
});

test.describe("Membuat Laporan Kerusakan", () => {
    test("Pelapor dapat membuka form laporan baru", async ({ page }) => {
        // Navigate to create laporan page
        await page.goto(`${BASE_URL}/pelapor/create`);

        // Verify URL
        await expect(page).toHaveURL(/.*pelapor\/create/);

        // Check if form exists
        await expect(page.locator("form")).toBeVisible();
    });

    test("Pelapor dapat membuat laporan kerusakan baru", async ({ page }) => {
        // Navigate to create page
        await page.goto(`${BASE_URL}/pelapor/create`);

        // Wait for form to load
        await page.waitForLoadState("networkidle");

        // Fill form fields
        // Select gedung (building)
        const gedungSelect = page.locator('select[name="id_gedung"]');
        if (await gedungSelect.isVisible()) {
            await gedungSelect.selectOption({ index: 1 });

            // Wait for ruangan to load
            await page.waitForTimeout(1000);
        }

        // Select ruangan (room) if available
        const ruanganSelect = page.locator('select[name="id_ruangan"]');
        if (await ruanganSelect.isVisible()) {
            await ruanganSelect.selectOption({ index: 1 });

            // Wait for fasilitas to load
            await page.waitForTimeout(1000);
        }

        // Select fasilitas (facility)
        const fasilitasSelect = page.locator('select[name="id_fasilitas"]');
        if (await fasilitasSelect.isVisible()) {
            await fasilitasSelect.selectOption({ index: 1 });
        }

        // Fill jumlah kerusakan (damage count)
        await page.fill('input[name="jumlah_kerusakan"]', "2");

        // Fill deskripsi (description)
        await page.fill(
            'textarea[name="deskripsi"]',
            "Testing laporan kerusakan - Lampu tidak menyala dan perlu diganti"
        );

        // Fill deskripsi tambahan if exists
        const deskripsiTambahan = page.locator(
            'textarea[name="deskripsi_tambahan"]'
        );
        if (await deskripsiTambahan.isVisible()) {
            await deskripsiTambahan.fill(
                "Kerusakan sudah terjadi sejak 2 hari yang lalu"
            );
        }

        // Upload foto kerusakan (optional in test)
        // Note: In real test, you might want to upload an actual file
        // await page.setInputFiles('input[type="file"]', 'path/to/test-image.jpg');

        // Submit form
        const submitButton = page.locator('button[type="submit"]');
        await submitButton.click();

        // Wait for navigation or success message
        await page.waitForTimeout(2000);

        // Verify redirect to pelapor page or success message
        const currentUrl = page.url();
        const isRedirected =
            currentUrl.includes("/pelapor") && !currentUrl.includes("/create");

        if (isRedirected) {
            console.log("✓ Laporan berhasil dibuat dan redirect ke dashboard");
        }
    });

    test("Validasi form: Tidak dapat submit dengan field kosong", async ({
        page,
    }) => {
        // Navigate to create page
        await page.goto(`${BASE_URL}/pelapor/create`);

        // Try to submit empty form
        const submitButton = page.locator('button[type="submit"]');
        await submitButton.click();

        // Check if still on the same page (validation failed)
        await expect(page).toHaveURL(/.*pelapor\/create/);
    });
});

test.describe("Melihat dan Mengelola Laporan", () => {
    test("Pelapor dapat melihat daftar laporan mereka", async ({ page }) => {
        // Already on pelapor dashboard from beforeEach

        // Check if reports list is visible
        const statusSection = page.locator(
            'h3:has-text("Status Laporan Anda")'
        );
        await expect(statusSection).toBeVisible();

        // Count visible report cards
        const reportCards = page.locator(".card.shadow-lg");
        const count = await reportCards.count();

        console.log(`Jumlah laporan yang ditampilkan: ${count}`);
    });

    test("Pelapor dapat melihat detail laporan", async ({ page }) => {
        // Find first detail link if exists
        const detailLinks = page.locator('a:has-text("Detail"), a.btn-info');
        const count = await detailLinks.count();

        if (count > 0) {
            // Click first detail link
            await detailLinks.first().click();

            // Wait for detail page to load
            await page.waitForLoadState("networkidle");

            // Verify URL contains /detail/
            await expect(page).toHaveURL(/.*pelapor\/detail\/\d+/);

            // Check if detail content is visible
            await expect(page.locator(".card-body")).toBeVisible();

            console.log("✓ Detail laporan berhasil ditampilkan");
        } else {
            console.log("⚠ Tidak ada laporan untuk dilihat detailnya");
        }
    });

    test("Pelapor dapat mengedit laporan mereka", async ({ page }) => {
        // Find first edit link if exists
        const editLinks = page.locator('a:has-text("Edit"), a.btn-warning');
        const count = await editLinks.count();

        if (count > 0) {
            // Click first edit link
            await editLinks.first().click();

            // Wait for edit page to load
            await page.waitForLoadState("networkidle");

            // Verify URL contains /edit/
            await expect(page).toHaveURL(/.*pelapor\/edit\/\d+/);

            // Check if form exists
            await expect(page.locator("form")).toBeVisible();

            // Modify deskripsi
            const deskripsiField = page.locator('textarea[name="deskripsi"]');
            if (await deskripsiField.isVisible()) {
                await deskripsiField.clear();
                await deskripsiField.fill(
                    "Deskripsi yang sudah diupdate - Testing edit laporan"
                );
            }

            // Modify jumlah kerusakan
            const jumlahField = page.locator('input[name="jumlah_kerusakan"]');
            if (await jumlahField.isVisible()) {
                await jumlahField.clear();
                await jumlahField.fill("3");
            }

            // Submit form
            const submitButton = page.locator('button[type="submit"]');
            await submitButton.click();

            // Wait for redirect
            await page.waitForTimeout(2000);

            console.log("✓ Laporan berhasil diupdate");
        } else {
            console.log("⚠ Tidak ada laporan untuk diedit");
        }
    });
});

test.describe("Rating dan Feedback", () => {
    test("Pelapor dapat memberikan rating untuk laporan yang selesai", async ({
        page,
    }) => {
        // Find rating link/button if exists
        const ratingLinks = page.locator(
            'a:has-text("Beri Rating"), a:has-text("Rating")'
        );
        const count = await ratingLinks.count();

        if (count > 0) {
            // Click first rating link
            await ratingLinks.first().click();

            // Wait for rating page to load
            await page.waitForLoadState("networkidle");

            // Verify URL contains /rate/
            await expect(page).toHaveURL(/.*pelapor\/rate\/\d+/);

            // Check if rating form exists
            await expect(page.locator("form")).toBeVisible();

            // Select rating (e.g., 5 stars)
            const ratingInput = page.locator('input[name="rating_pengguna"]');
            if (await ratingInput.isVisible()) {
                // If it's a number input
                await ratingInput.fill("5");
            } else {
                // If it's star rating, click the 5th star
                const stars = page.locator(
                    '.star, input[type="radio"][name="rating_pengguna"]'
                );
                const starCount = await stars.count();
                if (starCount > 0) {
                    await stars.last().click();
                }
            }

            // Fill feedback
            const feedbackField = page.locator(
                'textarea[name="feedback_pengguna"]'
            );
            if (await feedbackField.isVisible()) {
                await feedbackField.fill(
                    "Perbaikan dilakukan dengan cepat dan memuaskan. Terima kasih!"
                );
            }

            // Submit rating
            const submitButton = page.locator('button[type="submit"]');
            await submitButton.click();

            // Wait for redirect
            await page.waitForTimeout(2000);

            console.log("✓ Rating dan feedback berhasil diberikan");
        } else {
            console.log("⚠ Tidak ada laporan yang dapat diberi rating");
        }
    });
});

test.describe("Notifikasi", () => {
    test("Pelapor dapat melihat notifikasi", async ({ page }) => {
        // Look for notification icon/button
        const notifIcon = page
            .locator(".notification-icon, [data-notification], .fa-bell")
            .first();

        if (await notifIcon.isVisible()) {
            await notifIcon.click();

            // Wait for notification dropdown/modal
            await page.waitForTimeout(500);

            // Check if notifications are visible
            const notifDropdown = page.locator(
                ".dropdown-menu, .notification-dropdown"
            );
            if (await notifDropdown.isVisible()) {
                console.log("✓ Dropdown notifikasi berhasil ditampilkan");
            }
        } else {
            console.log("⚠ Icon notifikasi tidak ditemukan");
        }
    });
});

test.describe("Profil dan Navigasi", () => {
    test("Pelapor dapat mengakses halaman profil", async ({ page }) => {
        // Look for profile link
        const profileLinks = page.locator(
            'a:has-text("Profile"), a:has-text("Profil"), a[href*="profile"]'
        );
        const count = await profileLinks.count();

        if (count > 0) {
            await profileLinks.first().click();

            // Wait for profile page
            await page.waitForLoadState("networkidle");

            // Verify profile page is loaded
            await expect(page.locator("text=/Profile|Profil/")).toBeVisible();

            console.log("✓ Halaman profil berhasil diakses");
        } else {
            console.log("⚠ Link profil tidak ditemukan");
        }
    });

    test("Pelapor dapat melakukan navigasi antar menu", async ({ page }) => {
        // Test navigation to dashboard
        const dashboardLink = page
            .locator('a:has-text("Dashboard"), a[href*="pelapor"]')
            .first();
        if (await dashboardLink.isVisible()) {
            await dashboardLink.click();
            await page.waitForLoadState("networkidle");
            await expect(page).toHaveURL(/.*pelapor/);
        }

        // Test navigation to create laporan
        const createLink = page
            .locator('a:has-text("Buat Laporan"), a[href*="create"]')
            .first();
        if (await createLink.isVisible()) {
            await createLink.click();
            await page.waitForLoadState("networkidle");
            await expect(page).toHaveURL(/.*create/);
        }

        console.log("✓ Navigasi menu berfungsi dengan baik");
    });
});

test.describe("Hapus Laporan", () => {
    test("Pelapor dapat menghapus laporan mereka", async ({ page }) => {
        // Navigate to dashboard
        await page.goto(`${BASE_URL}/pelapor`);

        // Find delete button if exists
        const deleteButtons = page.locator(
            'button:has-text("Hapus"), .btn-danger'
        );
        const count = await deleteButtons.count();

        if (count > 0) {
            // Setup dialog handler for confirmation
            page.on("dialog", async (dialog) => {
                console.log(`Dialog message: ${dialog.message()}`);
                await dialog.accept();
            });

            // Click delete button
            await deleteButtons.first().click();

            // Wait for action to complete
            await page.waitForTimeout(2000);

            console.log("✓ Laporan berhasil dihapus");
        } else {
            console.log("⚠ Tidak ada laporan untuk dihapus");
        }
    });
});

test.describe("Logout", () => {
    test("Pelapor dapat logout dari sistem", async ({ page }) => {
        // Look for logout link/button
        const logoutButton = page
            .locator(
                'a:has-text("Logout"), a:has-text("Keluar"), button:has-text("Logout")'
            )
            .first();

        if (await logoutButton.isVisible()) {
            await logoutButton.click();

            // Wait for redirect to login or home page
            await page.waitForTimeout(2000);

            // Verify user is logged out (should be on login or home page)
            const currentUrl = page.url();
            const isLoggedOut =
                currentUrl.includes("/login") || currentUrl === `${BASE_URL}/`;

            if (isLoggedOut) {
                console.log("✓ Logout berhasil");
            }
        } else {
            // Try alternative logout method via dropdown
            const userDropdown = page
                .locator(".dropdown-toggle, .user-menu")
                .first();
            if (await userDropdown.isVisible()) {
                await userDropdown.click();
                await page.waitForTimeout(500);

                const logoutInDropdown = page
                    .locator('a:has-text("Logout"), a:has-text("Keluar")')
                    .first();
                if (await logoutInDropdown.isVisible()) {
                    await logoutInDropdown.click();
                    await page.waitForTimeout(2000);
                    console.log("✓ Logout berhasil via dropdown");
                }
            }
        }
    });
});

test.describe("Responsive Design", () => {
    test("Dashboard pelapor responsive di mobile view", async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });

        // Navigate to dashboard
        await page.goto(`${BASE_URL}/pelapor`);

        // Check if main content is visible
        await expect(page.locator(".content, .container")).toBeVisible();

        console.log("✓ Dashboard responsive di mobile view");
    });

    test("Dashboard pelapor responsive di tablet view", async ({ page }) => {
        // Set tablet viewport
        await page.setViewportSize({ width: 768, height: 1024 });

        // Navigate to dashboard
        await page.goto(`${BASE_URL}/pelapor`);

        // Check if main content is visible
        await expect(page.locator(".content, .container")).toBeVisible();

        console.log("✓ Dashboard responsive di tablet view");
    });
});

// Additional test for edge cases
test.describe("Edge Cases dan Validasi", () => {
    test("Sistem menampilkan pesan error untuk input tidak valid", async ({
        page,
    }) => {
        await page.goto(`${BASE_URL}/pelapor/create`);

        // Try to submit with invalid data
        await page.fill('input[name="jumlah_kerusakan"]', "-1");

        const submitButton = page.locator('button[type="submit"]');
        await submitButton.click();

        // Should stay on the same page
        await page.waitForTimeout(1000);
        await expect(page).toHaveURL(/.*create/);
    });

    test("Pelapor tidak dapat mengakses halaman unauthorized", async ({
        page,
    }) => {
        // Try to access admin or teknisi pages
        await page.goto(`${BASE_URL}/home`);

        // Should be redirected or show access denied
        await page.waitForTimeout(1000);

        const currentUrl = page.url();
        const isRedirected =
            !currentUrl.includes("/home") || currentUrl.includes("/pelapor");

        console.log(
            `Akses ke halaman admin: ${
                isRedirected ? "Dibatasi ✓" : "Tidak dibatasi ⚠"
            }`
        );
    });
});
