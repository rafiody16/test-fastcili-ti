export const config = {
    // Izinkan override via env: BASE_URL
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
        // HTTP errors seharusnya kurang dari 1%
        http_req_failed: ["rate<0.01"],

        // 95% request seharusnya kurang dari 2 detik
        http_req_duration: ["p(95)<2000"],

        // 99% request seharusnya kurang dari 3 detik
        "http_req_duration{expected_response:true}": ["p(99)<3000"],

        // Median seharusnya kurang dari 500ms
        "http_req_duration{expected_response:true}": ["med<500"],
    },

    // Load test options
    loadTest: {
        stages: [
            { duration: "2m", target: 10 }, // Naikkan ke 10 users selama 2 menit
            { duration: "5m", target: 10 }, // Pertahankan 10 users selama 5 menit
            { duration: "2m", target: 20 }, // Naikkan ke 20 users selama 2 menit
            { duration: "5m", target: 20 }, // Pertahankan 20 users selama 5 menit
            { duration: "2m", target: 0 }, // Turunkan ke 0 users selama 2 menit
        ],
    },

    // Stress test options
    stressTest: {
        stages: [
            { duration: "2m", target: 10 }, // Naikkan ke 10 users selama 2 menit
            { duration: "5m", target: 10 }, // Pertahankan 10 users selama 5 menit
            { duration: "2m", target: 20 }, // Naikkan ke 20 users selama 2 menit
            { duration: "5m", target: 20 }, // Pertahankan 20 users selama 5 menit
            { duration: "2m", target: 30 }, // Naikkan ke 30 users selama 2 menit
            { duration: "5m", target: 30 }, // Pertahankan 30 users selama 5 menit
            { duration: "2m", target: 40 }, // Naikkan ke 40 users selama 2 menit
            { duration: "5m", target: 40 }, // Pertahankan 40 users selama 5 menit
            { duration: "10m", target: 0 }, // Turunkan ke 0 users selama 10 menit
        ],
    },

    // Smoke test options (quick validation)
    smokeTest: {
        vus: 1,
        duration: "1m",
    },
};

// Helper function untuk mendapatkan CSRF token
export function getCsrfToken(response) {
    const matches = response.body.match(
        /<meta name="csrf-token" content="(.+?)"/
    );
    return matches ? matches[1] : null;
}

// Helper untuk membaca cookie tambahan dari env (mis. __test dari challenge)
export function getExtraCookie() {
    return __ENV.EXTRA_COOKIE || "";
}

// Helper function untuk mengekstrak cookies
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

// Helper function untuk membangun string cookie
export function buildCookieString(cookies) {
    return Object.entries(cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join("; ");
}
