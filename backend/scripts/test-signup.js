require("dotenv").config({ quiet: true });

const pool = require("../db");

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

const requiredEnv = ["DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME"];

async function checkEnvironment() {
    console.log("\n=== Environment ===");
    const missing = requiredEnv.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        console.log("Missing .env values:", missing.join(", "));
        console.log("Create backend/.env from backend/.env.example first.");
        return false;
    }

    console.log("DB_HOST:", process.env.DB_HOST);
    console.log("DB_NAME:", process.env.DB_NAME);
    return true;
}

async function checkDatabase() {
    console.log("\n=== Database ===");

    try {
        const [tables] = await pool.query("SHOW TABLES");
        console.log("Tables:", tables.map((row) => Object.values(row)[0]).join(", ") || "(none)");

        const [columns] = await pool.query("DESCRIBE users");
        console.log("users columns:", columns.map((col) => col.Field).join(", "));
        return true;
    } catch (error) {
        console.log("Database check failed:", error.message);
        return false;
    }
}

async function requestRegister(body) {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    const data = await response.json();
    return { status: response.status, data };
}

function sampleRegisterBody(overrides = {}) {
    const suffix = Date.now();

    return {
        username: `testuser_${suffix}`,
        password: "Hello1!",
        confirmPassword: "Hello1!",
        fullName: "Test User",
        age: 25,
        email: `test_${suffix}@example.com`,
        phone: "96170123456",
        relativeName: "Jane Doe",
        relativePhone: "96170987654",
        relationship: "Spouse",
        plateNumber: "ABC123",
        carName: "Toyota Corolla",
        yearModel: 2020,
        ...overrides
    };
}

async function runRegisterTests() {
    console.log("\n=== Register API Tests ===");
    console.log("Base URL:", BASE_URL);

    const duplicateBody = sampleRegisterBody({ username: "duplicate_user" });

    const tests = [
        {
            name: "Valid registration",
            body: sampleRegisterBody(),
            expectStatus: 201
        },
        {
            name: "Duplicate username",
            body: duplicateBody,
            expectStatus: 409,
            setupFirst: true
        },
        {
            name: "Password too short",
            body: sampleRegisterBody({
                username: "shortpass",
                password: "Hi1!",
                confirmPassword: "Hi1!"
            }),
            expectStatus: 400
        },
        {
            name: "Password confirmation mismatch",
            body: sampleRegisterBody({
                username: "mismatch_user",
                password: "Hello1!",
                confirmPassword: "Hello2!"
            }),
            expectStatus: 400
        },
        {
            name: "Missing username",
            body: sampleRegisterBody({ username: "" }),
            expectStatus: 400
        }
    ];

    let passed = 0;

    for (const test of tests) {
        try {
            if (test.setupFirst) {
                await requestRegister(test.body);
            }

            const result = await requestRegister(test.body);
            const ok = result.status === test.expectStatus;

            console.log(`${ok ? "PASS" : "FAIL"} - ${test.name}`);
            console.log(`  Expected: ${test.expectStatus}, Got: ${result.status}`);
            console.log(`  Response:`, JSON.stringify(result.data));

            if (ok) {
                passed += 1;
            }
        } catch (error) {
            console.log(`FAIL - ${test.name}`);
            console.log(`  Error: ${error.message}`);
            console.log("  Is the backend running? Start it with: npm run dev");
        }
    }

    console.log(`\nResult: ${passed}/${tests.length} tests passed`);
}

async function main() {
    const envOk = await checkEnvironment();
    if (!envOk) {
        process.exit(1);
    }

    const dbOk = await checkDatabase();
    if (!dbOk) {
        await pool.end();
        process.exit(1);
    }

    await runRegisterTests();
    await pool.end();
}

main().catch(async (error) => {
    console.error("Test runner failed:", error.message);
    await pool.end();
    process.exit(1);
});
