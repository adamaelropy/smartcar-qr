require("dotenv").config({ quiet: true });

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

function uniqueSuffix() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

async function requestJson(path, options = {}) {
    const { method = "GET", body = null, token = null } = options;
    const response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        ...(body ? { body: JSON.stringify(body) } : {})
    });

    const data = await response.json().catch(() => null);
    return {
        ok: response.ok,
        status: response.status,
        data
    };
}

async function createRegisteredUser(prefix) {
    const suffix = uniqueSuffix();
    const username = `${prefix}_${suffix}`;
    const password = "Password123!";
    const email = `${prefix}_${suffix}@test.com`;

    // 1. Signup
    const signup = await requestJson("/api/auth/signup", {
        method: "POST",
        body: { username, password, confirmPassword: password }
    });
    if (!signup.ok) throw new Error(`Signup failed for ${username}: ${JSON.stringify(signup.data)}`);

    // 2. Login
    const login = await requestJson("/api/auth/login", {
        method: "POST",
        body: { username, password }
    });
    if (!login.ok) throw new Error(`Login failed for ${username}: ${JSON.stringify(login.data)}`);
    const token = login.data.token;

    // 3. Complete Registration (vehicle + emergency contact)
    const plateNumber = `PL-${suffix}`.slice(0, 15).replace(/[^a-zA-Z0-9-]/g, '');
    const reg = await requestJson("/api/registration", {
        method: "POST",
        token,
        body: {
            fullName: `${prefix} Name`,
            age: 30,
            email,
            phone: "96170000000",
            relativeName: "Relative Name",
            relativePhone: "96170111111",
            relationship: "Sibling",
            plateNumber,
            carName: `${prefix} Car`,
            yearModel: 2022
        }
    });
    if (!reg.ok) throw new Error(`Registration failed for ${username}: ${JSON.stringify(reg.data)}`);

    // 4. Fetch Profile to get vehicle & QR token
    const profile = await requestJson("/api/auth/me", { method: "GET", token });
    if (!profile.ok) throw new Error(`Fetch profile failed for ${username}`);

    const qrToken = profile.data.vehicle?.qr_token;
    if (!qrToken) throw new Error(`No QR token in profile for ${username}`);

    // Also verify /api/vehicles/me/qr
    const vehicleQr = await requestJson("/api/vehicles/me/qr", { method: "GET", token });
    if (!vehicleQr.ok || vehicleQr.data.vehicle?.qr_token !== qrToken) {
        throw new Error(`Vehicle QR endpoint mismatch for ${username}`);
    }

    return {
        username,
        password,
        token,
        userId: profile.data.user.user_id,
        vehicleId: profile.data.vehicle.vehicle_id,
        qrToken
    };
}

async function runTests() {
    console.log("=== STARTING COMPREHENSIVE MESSAGES & QR TEST ===");
    console.log("Base URL:", BASE_URL);

    // Step 1: Create User A & User B
    console.log("\n1. Creating User A and User B with registered vehicles...");
    const userA = await createRegisteredUser("usera");
    console.log(`✓ User A created: ${userA.username} (Vehicle #${userA.vehicleId}, QR: ${userA.qrToken.slice(0, 10)}...)`);

    const userB = await createRegisteredUser("userb");
    console.log(`✓ User B created: ${userB.username} (Vehicle #${userB.vehicleId}, QR: ${userB.qrToken.slice(0, 10)}...)`);

    // Step 2: User A scans User B's QR code and sends a message
    console.log("\n2. User A sends message to User B via User B's QR portal...");
    const msgText1 = "Hello User B, you are blocking my car!";
    const sendRes1 = await requestJson(`/api/qr/${encodeURIComponent(userB.qrToken)}/message`, {
        method: "POST",
        token: userA.token,
        body: {
            type: "MESSAGE",
            message: msgText1,
            senderName: userA.username,
            from: `user:${userA.username}`
        }
    });
    console.log("Send status:", sendRes1.status, sendRes1.data);
    if (!sendRes1.ok) throw new Error("Failed to send message from User A to User B");

    // Step 3: User B checks messages
    console.log("\n3. User B fetches messages inbox...");
    const inboxB1 = await requestJson("/api/messages", { method: "GET", token: userB.token });
    console.log(`✓ User B received ${inboxB1.data?.messages?.length} threads.`);
    if (!inboxB1.ok || !inboxB1.data.messages || inboxB1.data.messages.length === 0) {
        throw new Error("User B did not receive the message from User A!");
    }

    const threadB = inboxB1.data.messages[0];
    console.log(`Thread ID: ${threadB.id}, Sender: ${threadB.senderName}, Blocked: ${threadB.blocked}`);
    console.log(`Messages in thread:`, threadB.messages);

    if (threadB.messages.length !== 1 || threadB.messages[0].text !== msgText1) {
        throw new Error("Message content mismatch in User B's inbox");
    }

    // Step 4: User B replies to User A
    console.log("\n4. User B sends auto-reply back to User A...");
    const replyRes = await requestJson("/api/messages/reply", {
        method: "POST",
        token: userB.token,
        body: {
            threadId: threadB.id,
            mode: "blocked"
        }
    });
    console.log("Reply status:", replyRes.status, replyRes.data);
    if (!replyRes.ok) throw new Error("Failed to send reply from User B");

    // Step 5: User B checks inbox again (verifying reply is in SAME thread, not a separate unknown thread)
    console.log("\n5. User B re-checks inbox (verifying reply stays in the same thread)...");
    const inboxB2 = await requestJson("/api/messages", { method: "GET", token: userB.token });
    if (inboxB2.data.messages.length !== 1) {
        throw new Error(`Expected exactly 1 thread for User B, but found ${inboxB2.data.messages.length}!`);
    }
    const updatedThreadB = inboxB2.data.messages[0];
    console.log(`✓ User B thread has ${updatedThreadB.messages.length} messages (Initial message + Reply).`);
    if (updatedThreadB.messages.length !== 2) {
        throw new Error(`Expected 2 messages in User B thread, found ${updatedThreadB.messages.length}`);
    }

    // Step 6: User A checks messages (verifying User A sees the conversation with User B and both messages)
    console.log("\n6. User A checks messages (verifying bidirectional thread visibility)...");
    const inboxA = await requestJson("/api/messages", { method: "GET", token: userA.token });
    console.log(`✓ User A received ${inboxA.data?.messages?.length} threads.`);
    if (!inboxA.ok || !inboxA.data.messages || inboxA.data.messages.length === 0) {
        throw new Error("User A did not see the conversation with User B!");
    }
    const threadA = inboxA.data.messages[0];
    console.log(`User A thread with: ${threadA.senderName}, Messages count: ${threadA.messages.length}`);
    if (threadA.messages.length !== 2) {
        throw new Error(`Expected 2 messages in User A thread, found ${threadA.messages.length}`);
    }
    console.log("User A messages:", threadA.messages);

    // Step 7: Anonymous visitor sends emergency message to User B
    console.log("\n7. Anonymous visitor sends emergency alert to User B's QR...");
    const emergencyMsg = "Emergency accident reported at https://maps.google.com/?q=33.89,35.50";
    const anonSend = await requestJson(`/api/qr/${encodeURIComponent(userB.qrToken)}/message`, {
        method: "POST",
        body: {
            type: "EMERGENCY",
            message: emergencyMsg,
            from: "visitor:emergency-visitor-1"
        }
    });
    console.log("Anon send status:", anonSend.status);
    if (!anonSend.ok) throw new Error("Failed to send emergency alert");

    // Step 8: User B checks inbox for emergency alert
    console.log("\n8. User B checks inbox for emergency alert...");
    const inboxB3 = await requestJson("/api/messages", { method: "GET", token: userB.token });
    console.log(`✓ User B has ${inboxB3.data.messages.length} total threads.`);
    const emergencyThread = inboxB3.data.messages.find(t => t.emergency === true);
    if (!emergencyThread) throw new Error("Emergency thread not found in User B's inbox!");
    console.log(`✓ Emergency thread found: ${emergencyThread.label}, Emergency tag: ${emergencyThread.emergency}`);

    // Step 9: User B replies to emergency alert
    console.log("\n9. User B replies to emergency alert...");
    const emergencyReply = await requestJson("/api/messages/reply", {
        method: "POST",
        token: userB.token,
        body: {
            threadId: emergencyThread.id,
            mode: "emergency"
        }
    });
    console.log("Emergency reply status:", emergencyReply.status, emergencyReply.data);
    if (!emergencyReply.ok) throw new Error("Failed to reply to emergency alert");

    const inboxB4 = await requestJson("/api/messages", { method: "GET", token: userB.token });
    const finalEmergencyThread = inboxB4.data.messages.find(t => t.emergency === true);
    if (finalEmergencyThread.messages.length !== 2) {
        throw new Error("Emergency thread reply was not grouped properly!");
    }
    console.log(`✓ Final emergency thread has ${finalEmergencyThread.messages.length} messages.`);

    console.log("\n=== ALL TESTS PASSED PERFECTLY ===");
}

runTests().catch(err => {
    console.error("\n❌ TEST FAILED:", err.message);
    process.exit(1);
});
