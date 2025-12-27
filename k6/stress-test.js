import http from "k6/http";
import { check, group, sleep } from "k6";
import { Rate, Trend, Counter, Gauge } from "k6/metrics";
import {
    config,
    getCsrfToken,
    extractCookies,
    buildCookieString,
} from "./config.js";

const errorRate = new Rate("error_rate");
const successRate = new Rate("success_rate");
const responseTime = new Trend("response_time");
const activeUsers = new Gauge("active_users");
const requestsPerSecond = new Counter("requests_per_second");
const systemBreakpoint = new Gauge("system_breakpoint");

// Test configuration - Stress Test
export const options = {
    stages: config.stressTest.stages,
    thresholds: {
        http_req_duration: ["p(95)<3000", "p(99)<5000"], // Lebih longgar untuk stress test
        http_req_failed: ["rate<0.05"], // Izinkan hingga 5% tingkat kesalahan
        error_rate: ["rate<0.10"], // Lacak tingkat kesalahan khusus
        response_time: ["p(95)<3000"],
    },
};

// Setup function
export function setup() {
    console.log("Memulai Stress Test...");
    console.log(`Base URL: ${config.baseURL}`);
    return { baseURL: config.baseURL };
}

// Main test function
export default function (data) {
    const baseURL = data.baseURL;
    let cookies = {};
    let csrfToken = "";
    let testPassed = true;

    // Update active users metric
    activeUsers.add(1);

    // ========== Autentikasi ==========
    group("Stress - Autentikasi", () => {
        try {
            // Dapatkan halaman login
            const loginPageRes = http.get(`${baseURL}/login`, {
                timeout: "10s",
            });

            const pageLoaded = check(loginPageRes, {
                "login page loaded": (r) => r.status === 200,
            });

            if (!pageLoaded) {
                errorRate.add(1);
                successRate.add(0);
                testPassed = false;
                return;
            }

            csrfToken = getCsrfToken(loginPageRes);
            cookies = extractCookies(loginPageRes);

            sleep(0.5);

            // Login
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
                    timeout: "10s",
                }
            );

            const loginSuccess = check(loginRes, {
                "login successful": (r) => r.status === 302 || r.status === 200,
            });

            if (!loginSuccess) {
                errorRate.add(1);
                successRate.add(0);
                testPassed = false;
                return;
            }

            successRate.add(1);

            if (loginRes.headers["Set-Cookie"]) {
                const newCookies = extractCookies(loginRes);
                cookies = { ...cookies, ...newCookies };
            }

            requestsPerSecond.add(2);
        } catch (e) {
            errorRate.add(1);
            successRate.add(0);
            console.error(`Authentication error: ${e.message}`);
            return;
        }

        sleep(0.3);
    });

    if (!testPassed) return;

    // ========== High-Load Dashboard Access ==========
    group("Stress - Dashboard", () => {
        try {
            const start = Date.now();
            const dashboardRes = http.get(`${baseURL}/home`, {
                headers: {
                    Cookie: buildCookieString(cookies),
                },
                timeout: "15s",
            });

            const duration = Date.now() - start;
            responseTime.add(duration);

            const dashboardOk = check(dashboardRes, {
                "dashboard loaded": (r) => r.status === 200,
                "dashboard responds in time": (r) => r.timings.duration < 5000,
            });

            if (!dashboardOk) {
                errorRate.add(1);
                successRate.add(0);
            } else {
                successRate.add(1);
            }

            requestsPerSecond.add(1);
        } catch (e) {
            errorRate.add(1);
            successRate.add(0);
            console.error(`Dashboard error: ${e.message}`);
        }

        sleep(0.5);
    });

    // ========== Intensive Database Operations ==========
    group("Stress - Database Operations", () => {
        const endpoints = [
            "/gedung",
            "/ruangan",
            "/fasilitas",
            "/laporan",
            "/users",
            "/level",
        ];

        endpoints.forEach((endpoint, index) => {
            try {
                const start = Date.now();
                const res = http.get(`${baseURL}${endpoint}`, {
                    headers: {
                        Cookie: buildCookieString(cookies),
                    },
                    timeout: "10s",
                });

                const duration = Date.now() - start;
                responseTime.add(duration);

                const endpointOk = check(res, {
                    [`${endpoint} loaded`]: (r) => r.status === 200,
                    [`${endpoint} response time ok`]: (r) =>
                        r.timings.duration < 4000,
                });

                if (!endpointOk) {
                    errorRate.add(1);
                    successRate.add(0);
                } else {
                    successRate.add(1);
                }

                requestsPerSecond.add(1);

                // Minimal sleep between requests
                sleep(0.2);
            } catch (e) {
                errorRate.add(1);
                successRate.add(0);
                console.error(`Error on ${endpoint}: ${e.message}`);
            }
        });
    });

    // ========== Concurrent Detail Views ==========
    group("Stress - Detail Views", () => {
        try {
            // Try to load multiple details concurrently
            const detailRequests = [
                ["GET", `${baseURL}/gedung/1`, null],
                ["GET", `${baseURL}/ruangan/1`, null],
                ["GET", `${baseURL}/fasilitas/1`, null],
            ];

            const responses = http.batch(
                detailRequests.map((req) => ({
                    method: req[0],
                    url: req[1],
                    params: {
                        headers: {
                            Cookie: buildCookieString(cookies),
                        },
                        timeout: "10s",
                    },
                }))
            );

            responses.forEach((res, index) => {
                const detailOk = check(res, {
                    [`detail ${index + 1} loaded`]: (r) => r.status === 200,
                });

                if (!detailOk) {
                    errorRate.add(1);
                    successRate.add(0);
                } else {
                    successRate.add(1);
                }
            });

            requestsPerSecond.add(detailRequests.length);
        } catch (e) {
            errorRate.add(1);
            successRate.add(0);
            console.error(`Detail views error: ${e.message}`);
        }

        sleep(0.5);
    });

    // ========== Search and Filter Operations ==========
    group("Stress - Search Operations", () => {
        try {
            const searchRes = http.get(`${baseURL}/gedung?search=test`, {
                headers: {
                    Cookie: buildCookieString(cookies),
                },
                timeout: "10s",
            });

            const searchOk = check(searchRes, {
                "search executed": (r) => r.status === 200,
            });

            if (!searchOk) {
                errorRate.add(1);
                successRate.add(0);
            } else {
                successRate.add(1);
            }

            requestsPerSecond.add(1);
        } catch (e) {
            errorRate.add(1);
            successRate.add(0);
            console.error(`Search error: ${e.message}`);
        }

        sleep(0.3);
    });

    // Minimal sleep between iterations to maintain pressure
    sleep(0.5);
}

// Teardown function
export function teardown(data) {
    console.log("✅ Stress Test Selesai!");
    console.log("Cek hasil untuk mengidentifikasi system breaking points");
}

// Handle summary
export function handleSummary(data) {
    const metrics = data.metrics;

    // Tentukan system breaking point (ketika error rate melebihi threshold)
    let breakpoint = "Not reached";
    if (metrics.error_rate && metrics.error_rate.values.rate > 0.05) {
        breakpoint = `Error rate exceeded at ${(
            metrics.error_rate.values.rate * 100
        ).toFixed(2)}%`;
    }

    const summary = {
        "k6-reports/stress-test-summary.json": JSON.stringify(data, null, 2),
        stdout: generateStressSummary(data, breakpoint),
    };

    return summary;
}

function generateStressSummary(data, breakpoint) {
    const metrics = data.metrics;

    let summary = "\n📊 Ringkasan Stress Test\n";
    summary += "═══════════════════════════════════════════════════\n\n";

    summary += "System Performance Under Stress:\n\n";

    if (metrics.http_reqs) {
        summary += `  Total Requests: ${metrics.http_reqs.values.count}\n`;
    }

    if (metrics.http_req_duration) {
        summary += `  Response Time (avg): ${metrics.http_req_duration.values.avg.toFixed(
            2
        )}ms\n`;
        summary += `  Response Time (p95): ${metrics.http_req_duration.values[
            "p(95)"
        ].toFixed(2)}ms\n`;
        summary += `  Response Time (p99): ${metrics.http_req_duration.values[
            "p(99)"
        ].toFixed(2)}ms\n`;
        summary += `  Response Time (max): ${metrics.http_req_duration.values.max.toFixed(
            2
        )}ms\n`;
    }

    if (metrics.http_req_failed) {
        const failRate = (metrics.http_req_failed.values.rate * 100).toFixed(2);
        summary += `  Failed Requests: ${failRate}%\n`;
    }

    if (metrics.error_rate) {
        const errRate = (metrics.error_rate.values.rate * 100).toFixed(2);
        summary += `  Error Rate: ${errRate}%\n`;
    }

    if (metrics.success_rate) {
        const succRate = (metrics.success_rate.values.rate * 100).toFixed(2);
        summary += `  Success Rate: ${succRate}%\n`;
    }

    summary += `\n🎯 System Breaking Point: ${breakpoint}\n`;

    summary += "\n═══════════════════════════════════════════════════\n";

    // Rekomendasi kinerja
    summary += "\n💡 Rekomendasi:\n\n";

    if (
        metrics.http_req_duration &&
        metrics.http_req_duration.values["p(95)"] > 3000
    ) {
        summary += "  ⚠️  Waktu respons tinggi di bawah beban\n";
        summary += "     - Pertimbangkan optimasi query database\n";
        summary += "     - Terapkan strategi caching\n";
        summary += "     - Tinjau masalah query N+1\n";
    }

    if (metrics.error_rate && metrics.error_rate.values.rate > 0.05) {
        summary += "  ⚠️  Tingkat kesalahan tinggi terdeteksi\n";
        summary += "     - Periksa ukuran pool koneksi database\n";
        summary += "     - Tinjau log aplikasi untuk kesalahan\n";
        summary += "     - Pertimbangkan penskalaan horizontal\n";
    }

    if (metrics.http_req_failed && metrics.http_req_failed.values.rate > 0.01) {
        summary += "  ⚠️  Request failures terdeteksi\n";
        summary += "     - Periksa sumber daya server (CPU, Memori)\n";
        summary += "     - Tinjau pengaturan timeout\n";
        summary += "     - Pertimbangkan load balancing\n";
    }

    summary += "\n═══════════════════════════════════════════════════\n\n";

    return summary;
}
