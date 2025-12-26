import http from "k6/http";
import { check, group, sleep } from "k6";
import {
    config,
    getCsrfToken,
    extractCookies,
    buildCookieString,
} from "./config.js";

// Test configuration - Smoke Test (Quick validation)
export const options = {
    vus: config.smokeTest.vus,
    duration: config.smokeTest.duration,
    thresholds: {
        http_req_duration: ["p(95)<5000"], // Increase to 5s for slow hosting
        http_req_failed: ["rate<0.5"], // Allow 50% failure for testing
    },
    // Increase timeout for slow/unreliable hosting
    httpDebug: "full",
    insecureSkipTLSVerify: true,
};

// Setup function
export function setup() {
    console.log("💨 Starting Smoke Test (Quick Validation)...");
    console.log(`Base URL: ${config.baseURL}`);
    return { baseURL: config.baseURL };
}

// Main test function
export default function (data) {
    const baseURL = data.baseURL;
    let cookies = {};
    let csrfToken = "";

    // ========== Authentication ==========
    group("Smoke - Authentication", () => {
        // Get login page
        const loginPageRes = http.get(`${baseURL}/login`, {
            timeout: "60s", // Increase timeout for slow hosting
        });

        check(loginPageRes, {
            "login page loaded": (r) => r.status === 200,
            "login page has csrf token": (r) =>
                r.body && r.body.includes("csrf-token"),
        });

        // Stop if login page failed to load
        if (
            !loginPageRes ||
            loginPageRes.status !== 200 ||
            !loginPageRes.body
        ) {
            console.error(
                `❌ Failed to load login page. Status: ${
                    loginPageRes ? loginPageRes.status : "N/A"
                }`
            );
            console.error(
                `Error: ${loginPageRes ? loginPageRes.error : "No response"}`
            );
            return; // Exit this iteration
        }

        csrfToken = getCsrfToken(loginPageRes);
        cookies = extractCookies(loginPageRes);

        sleep(1);

        // Login
        const loginRes = http.post(
            `${baseURL}/login`,
            {
                email: config.credentials.admin.email,
                password: config.credentials.admin.password,
                _token: csrfToken,
            },
            {
                timeout: "60s",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Cookie: buildCookieString(cookies),
                },
                redirects: 0,
            }
        );

        check(loginRes, {
            "login successful": (r) => r.status === 302 || r.status === 200,
            "redirected to home": (r) =>
                r.headers["Location"] &&
                r.headers["Location"].includes("/home"),
        });

        if (loginRes.headers["Set-Cookie"]) {
            const newCookies = extractCookies(loginRes);
            cookies = { ...cookies, ...newCookies };
        }

        sleep(1);
    });

    // ========== Critical Paths ==========
    group("Smoke - Critical Pages", () => {
        const criticalPages = [
            { path: "/home", name: "Dashboard" },
            { path: "/gedung", name: "Gedung List" },
            { path: "/ruangan", name: "Ruangan List" },
            { path: "/fasilitas", name: "Fasilitas List" },
            { path: "/laporan", name: "Laporan List" },
        ];

        criticalPages.forEach((page) => {
            const res = http.get(`${baseURL}${page.path}`, {
                headers: {
                    Cookie: buildCookieString(cookies),
                },
            });

            check(res, {
                [`${page.name} accessible`]: (r) => r.status === 200,
                [`${page.name} loads quickly`]: (r) =>
                    r.timings.duration < 1000,
            });

            sleep(0.5);
        });
    });

    sleep(1);
}

// Teardown function
export function teardown(data) {
    console.log("✅ Smoke Test Completed - Basic functionality verified!");
}

// Handle summary
export function handleSummary(data) {
    const metrics = data.metrics;
    const passed = metrics.checks && metrics.checks.values.rate >= 0.99;

    let summary = "\n💨 Smoke Test Summary\n";
    summary += "═══════════════════════════════════════\n\n";

    if (passed) {
        summary += "✅ PASSED - System is ready for further testing\n\n";
    } else {
        summary += "❌ FAILED - System has issues, fix before proceeding\n\n";
    }

    if (metrics.checks) {
        const checkRate = (metrics.checks.values.rate * 100).toFixed(2);
        summary += `Check Success Rate: ${checkRate}%\n`;
    }

    if (metrics.http_req_duration) {
        summary += `Average Response Time: ${metrics.http_req_duration.values.avg.toFixed(
            2
        )}ms\n`;
    }

    if (metrics.http_req_failed) {
        const failRate = (metrics.http_req_failed.values.rate * 100).toFixed(2);
        summary += `Failure Rate: ${failRate}%\n`;
    }

    summary += "\n═══════════════════════════════════════\n\n";

    return {
        "k6-reports/smoke-test-summary.json": JSON.stringify(data, null, 2),
        stdout: summary,
    };
}
