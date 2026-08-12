require("dotenv").config({ quiet: true });

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

function uniqueSuffix() {
    return Date.now().toString(36);
}

async function requestJson(path, body, token) {
    const response = await fetch(`${BASE_URL}${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(body)
    });

    const data = await response.json();
    return {
        ok: response.ok,
        status: response.status,
        data
    };
}

function buildSignupBody() {
    const suffix = uniqueSuffix();

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
        yearModel: 2020
    };
}

async function main() {
    const body = buildSignupBody();

    console.log("Base URL:", BASE_URL);
    console.log("Testing signup, login, and registration flow with a unique account...");

    const signup = await requestJson("/api/auth/signup", {
        username: body.username,
        password: body.password,
        confirmPassword: body.confirmPassword
    });

    console.log("Signup:", signup.status, signup.data.message || signup.data);

    if (!signup.ok) {
        process.exit(1);
    }

    const login = await requestJson("/api/auth/login", {
        username: body.username,
        password: body.password
    });

    console.log("Login:", login.status, login.data.message || login.data);

    if (!login.ok) {
        process.exit(1);
    }

    const registration = await requestJson("/api/registration", body, login.data.token);

    console.log("Registration:", registration.status, registration.data.message || registration.data);

    if (!registration.ok) {
        process.exit(1);
    }

    const relogin = await requestJson("/api/auth/login", {
        username: body.username,
        password: body.password
    });

    console.log("Re-login:", relogin.status, relogin.data.message || relogin.data);
    console.log("registrationComplete:", relogin.data.registrationComplete);

    if (!relogin.ok || relogin.data.registrationComplete !== true) {
        process.exit(1);
    }

    console.log("Smoke test passed.");
}

main().catch((error) => {
    console.error("Smoke test failed:", error.message);
    process.exit(1);
});
