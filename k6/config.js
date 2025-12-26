// K6 Configuration
export const config = {
    // Base URL aplikasi
    // Local: http://localhost
    // Production: https://fasilitas.rf.gd
    baseURL: __ENV.BASE_URL || "https://fasilitas.rf.gd",

    // Test credentials
    credentials: {
        admin: {
            email: "admin@admin.com",
            password: "admin123",
        },
        sarpras: {
            email: "sarpras@sarpras.com",
            password: "sarpras123",
        },
        teknisi: {
            email: "teknisi@teknisi.com",
            password: "teknisi123",
        },
        pelapor: {
            email: "pelapor@pelapor.com",
            password: "pelapor123",
        },
    },

    // Test thresholds
    thresholds: {
        // HTTP errors should be less than 1%
        http_req_failed: ["rate<0.01"],

        // 95% of requests should be below 2s
        http_req_duration: ["p(95)<2000"],

        // 99% of requests should be below 3s
        "http_req_duration{expected_response:true}": ["p(99)<3000"],

        // Median should be below 500ms
        "http_req_duration{expected_response:true}": ["med<500"],
    },

    // Load test options
    loadTest: {
        stages: [
            { duration: "2m", target: 10 }, // Ramp up to 10 users
            { duration: "5m", target: 10 }, // Stay at 10 users
            { duration: "2m", target: 20 }, // Ramp up to 20 users
            { duration: "5m", target: 20 }, // Stay at 20 users
            { duration: "2m", target: 0 }, // Ramp down to 0 users
        ],
    },

    // Stress test options
    stressTest: {
        stages: [
            { duration: "2m", target: 10 }, // Ramp up to 10 users
            { duration: "5m", target: 10 }, // Stay at 10 for warm up
            { duration: "2m", target: 20 }, // Bump to 20 users
            { duration: "5m", target: 20 }, // Stay at 20
            { duration: "2m", target: 30 }, // Bump to 30 users
            { duration: "5m", target: 30 }, // Stay at 30
            { duration: "2m", target: 40 }, // Bump to 40 users
            { duration: "5m", target: 40 }, // Stay at 40
            { duration: "10m", target: 0 }, // Ramp down to 0 users
        ],
    },

    // Smoke test options (quick validation)
    smokeTest: {
        vus: 1,
        duration: "1m",
    },
};

// Helper function to get CSRF token
export function getCsrfToken(response) {
    const matches = response.body.match(
        /<meta name="csrf-token" content="(.+?)"/
    );
    return matches ? matches[1] : null;
}

// Helper function to extract cookies
export function extractCookies(response) {
    const cookies = {};
    const setCookieHeaders = response.headers["Set-Cookie"];

    if (!setCookieHeaders) return cookies;

    const cookieArray = Array.isArray(setCookieHeaders)
        ? setCookieHeaders
        : [setCookieHeaders];

    cookieArray.forEach((cookie) => {
        const parts = cookie.split(";")[0].split("=");
        if (parts.length === 2) {
            cookies[parts[0]] = parts[1];
        }
    });

    return cookies;
}

// Helper function to build cookie string
export function buildCookieString(cookies) {
    return Object.entries(cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join("; ");
}
