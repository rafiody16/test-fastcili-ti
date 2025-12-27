import http from "k6/http";
import { check, group, sleep } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";
import {
    config,
    getCsrfToken,
    extractCookies,
    buildCookieString,
} from "./config.js";

// Custom metrics
const loginSuccessRate = new Rate("login_success_rate");
const gedungLoadTime = new Trend("gedung_load_time");
const ruanganLoadTime = new Trend("ruangan_load_time");
const fasilitasLoadTime = new Trend("fasilitas_load_time");
const dashboardLoadTime = new Trend("dashboard_load_time");
const laporanLoadTime = new Trend("laporan_load_time");
const apiCalls = new Counter("api_calls");

// Test configuration
export const options = {
    stages: config.loadTest.stages,
    thresholds: {
        ...config.thresholds,
        login_success_rate: ["rate>0.95"],
        gedung_load_time: ["p(95)<1500"],
        ruangan_load_time: ["p(95)<1500"],
        fasilitas_load_time: ["p(95)<1500"],
        dashboard_load_time: ["p(95)<2000"],
    },
};

// Setup function - runs once
export function setup() {
    console.log("🚀 Memulai Load Test...");
    console.log(`Base URL: ${config.baseURL}`);
    return { baseURL: config.baseURL };
}

// Main test function
export default function (data) {
    const baseURL = data.baseURL;
    let cookies = {};
    let csrfToken = "";

    // ========== Alur Autentikasi ==========
    group("Autentikasi", () => {
        // Dapatkan halaman login dan token CSRF
        group("GET Halaman Login", () => {
            const loginPageRes = http.get(`${baseURL}/login`);

            check(loginPageRes, {
                "login page loaded": (r) => r.status === 200,
                "login page has form": (r) => r.body.includes("form"),
            });

            csrfToken = getCsrfToken(loginPageRes);
            cookies = extractCookies(loginPageRes);
        });

        sleep(1);

        // Login dengan kredensial admin
        group("POST Login", () => {
            const loginRes = http.post(
                `${baseURL}/login`,
                {
                    email: config.credentials.admin.email,
                    password: config.credentials.admin.password,
                    _token: csrfToken,
                },
                {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        Cookie: buildCookieString(cookies),
                    },
                    redirects: 0,
                }
            );

            const loginSuccess = check(loginRes, {
                "login successful": (r) => r.status === 302 || r.status === 200,
                "redirected to dashboard": (r) =>
                    r.headers["Location"] &&
                    r.headers["Location"].includes("/home"),
            });

            loginSuccessRate.add(loginSuccess);

            if (loginRes.headers["Set-Cookie"]) {
                const newCookies = extractCookies(loginRes);
                cookies = { ...cookies, ...newCookies };
            }
        });

        sleep(1);
    });

    // ========== Akses Dashboard ==========
    group("Dashboard", () => {
        const start = Date.now();
        const dashboardRes = http.get(`${baseURL}/home`, {
            headers: {
                Cookie: buildCookieString(cookies),
            },
        });

        const duration = Date.now() - start;
        dashboardLoadTime.add(duration);

        check(dashboardRes, {
            "dashboard loaded": (r) => r.status === 200,
            "dashboard has content": (r) => r.body.includes("Dashboard"),
        });

        sleep(2);
    });

    // ========== Operasi CRUD Gedung ==========
    group("Operasi Gedung", () => {
        // Daftar Gedung
        group("Daftar Gedung", () => {
            const start = Date.now();
            const listRes = http.get(`${baseURL}/gedung`, {
                headers: {
                    Cookie: buildCookieString(cookies),
                },
            });

            const duration = Date.now() - start;
            gedungLoadTime.add(duration);
            apiCalls.add(1);

            check(listRes, {
                "gedung list loaded": (r) => r.status === 200,
                "has gedung data": (r) => r.body.includes("Gedung"),
            });
        });

        sleep(1);

        // View Gedung Detail
        group("View Gedung Detail", () => {
            const detailRes = http.get(`${baseURL}/gedung/1`, {
                headers: {
                    Cookie: buildCookieString(cookies),
                },
            });

            check(detailRes, {
                "gedung detail loaded": (r) => r.status === 200,
            });

            apiCalls.add(1);
        });

        sleep(1);
    });

    // ========== Operasi CRUD Ruangan ==========
    group("Operasi Ruangan", () => {
        // Daftar Ruangan
        group("Daftar Ruangan", () => {
            const start = Date.now();
            const listRes = http.get(`${baseURL}/ruangan`, {
                headers: {
                    Cookie: buildCookieString(cookies),
                },
            });

            const duration = Date.now() - start;
            ruanganLoadTime.add(duration);
            apiCalls.add(1);

            check(listRes, {
                "ruangan list loaded": (r) => r.status === 200,
                "has ruangan data": (r) => r.body.includes("Ruangan"),
            });
        });

        sleep(1);
    });

    // ========== Operasi CRUD Fasilitas ==========
    group("Operasi Fasilitas", () => {
        // Daftar Fasilitas
        group("Daftar Fasilitas", () => {
            const start = Date.now();
            const listRes = http.get(`${baseURL}/fasilitas`, {
                headers: {
                    Cookie: buildCookieString(cookies),
                },
            });

            const duration = Date.now() - start;
            fasilitasLoadTime.add(duration);
            apiCalls.add(1);

            check(listRes, {
                "fasilitas list loaded": (r) => r.status === 200,
                "has fasilitas data": (r) => r.body.includes("Fasilitas"),
            });
        });

        sleep(1);
    });

    // ========== Laporan ==========
    group("Operasi Laporan", () => {
        // Daftar Laporan
        group("Daftar Laporan", () => {
            const start = Date.now();
            const listRes = http.get(`${baseURL}/laporan`, {
                headers: {
                    Cookie: buildCookieString(cookies),
                },
            });

            const duration = Date.now() - start;
            laporanLoadTime.add(duration);
            apiCalls.add(1);

            check(listRes, {
                "laporan list loaded": (r) => r.status === 200,
            });
        });

        sleep(1);
    });

    // ========== Manajemen Pengguna ==========
    group("Manajemen Pengguna", () => {
        // Daftar Pengguna
        group("Daftar Pengguna", () => {
            const listRes = http.get(`${baseURL}/users`, {
                headers: {
                    Cookie: buildCookieString(cookies),
                },
            });

            apiCalls.add(1);

            check(listRes, {
                "users list loaded": (r) => r.status === 200,
            });
        });

        sleep(1);
    });

    // ========== Manajemen Level ==========
    group("Manajemen Level", () => {
        // Daftar Level
        group("Daftar Level", () => {
            const listRes = http.get(`${baseURL}/level`, {
                headers: {
                    Cookie: buildCookieString(cookies),
                },
            });

            apiCalls.add(1);

            check(listRes, {
                "level list loaded": (r) => r.status === 200,
            });
        });

        sleep(1);
    });

    sleep(2);
}

// Teardown function - jalankan sekali setelah semua iterasi
export function teardown(data) {
    console.log("✅ Load Test Selesai!");
    console.log(`Total API calls yang dilakukan: ${data.api_calls}`);
}

// Handle ringkasan untuk pelaporan kustom
export function handleSummary(data) {
    return {
        "k6-reports/load-test-summary.json": JSON.stringify(data, null, 2),
        stdout: textSummary(data, { indent: " ", enableColors: true }),
    };
}

function textSummary(data, options) {
    const indent = options.indent || "";
    const colors = options.enableColors;

    let summary = "\n" + indent + "📊 Ringkasan Load Test\n";
    summary += indent + "═══════════════════════════════════════\n\n";

    // Overall stats
    const metrics = data.metrics;

    if (metrics.http_reqs) {
        summary +=
            indent + `Total Requests: ${metrics.http_reqs.values.count}\n`;
    }

    if (metrics.http_req_duration) {
        summary +=
            indent +
            `Response Time (rata-rata): ${metrics.http_req_duration.values.avg.toFixed(
                2
            )}ms\n`;
        summary +=
            indent +
            `Response Time (p95): ${metrics.http_req_duration.values[
                "p(95)"
            ].toFixed(2)}ms\n`;
        summary +=
            indent +
            `Response Time (p99): ${metrics.http_req_duration.values[
                "p(99)"
            ].toFixed(2)}ms\n`;
    }

    if (metrics.http_req_failed) {
        const failRate = (metrics.http_req_failed.values.rate * 100).toFixed(2);
        summary += indent + `Failed Requests: ${failRate}%\n`;
    }

    if (metrics.login_success_rate) {
        const loginRate = (
            metrics.login_success_rate.values.rate * 100
        ).toFixed(2);
        summary += indent + `Login Success Rate: ${loginRate}%\n`;
    }

    summary += "\n" + indent + "═══════════════════════════════════════\n";

    return summary;
}
