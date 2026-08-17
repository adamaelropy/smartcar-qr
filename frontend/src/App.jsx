import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import { ProtectedRoute, RegisterRoute } from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SignUp from "./pages/SignUp";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import Users from "./pages/Users";
import QR from "./pages/QR";
import Landing from "./pages/Landing";
import { fetchVehicleByQrToken } from "./services/api";
import { useAuth } from "./context/AuthContext";

import "./App.css";


// ==============================
// Scanned QR Page
// ==============================

function ScannedQR() {
  const { token } = useParams();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [sentMessage, setSentMessage] = useState('');
  const [messageMode, setMessageMode] = useState('auto');
  const { token: authToken, user } = useAuth();
  // determine a stable sender identity for this client: prefer logged-in username, else a persistent visitor id
  let fromValue = null;
  try {
    if (user && user.username) {
      fromValue = `user:${user.username}`;
    } else {
      const storedUser = localStorage.getItem('smartcar_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed?.username) fromValue = `user:${parsed.username}`;
      }
    }
  } catch (e) {
    // ignore
  }

  if (!fromValue) {
    let visitor = localStorage.getItem('smartcar_visitor_id');
    if (!visitor) {
      visitor = `visitor:${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      try { localStorage.setItem('smartcar_visitor_id', visitor); } catch (e) {}
    }
    fromValue = visitor;
  }

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const { ok, data } = await fetchVehicleByQrToken(token);

        if (!ok) {
          throw new Error(data.message || "Failed to retrieve QR information.");
        }

        setVehicle(data.vehicle);
      } catch (error) {
        console.error("Scan QR error:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, [token]);

  if (loading) {
    return (
      <main className="page-shell qr-scan-page">
        <section className="surface-card qr-scan-card">
          <p className="eyebrow">Scanned QR</p>
          <h1>SmartCar QR</h1>
          <p className="state-message">Loading vehicle details...</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page-shell qr-scan-page">
        <section className="surface-card qr-scan-card">
          <p className="eyebrow">Scanned QR</p>
          <h1>SmartCar QR</h1>
          <h2>QR Code Error</h2>
          <p className="state-message state-message--error">{error}</p>
        </section>
      </main>
    );
  }

  if (!vehicle) {
    return (
      <main className="page-shell qr-scan-page">
        <section className="surface-card qr-scan-card">
          <p className="eyebrow">Scanned QR</p>
          <h1>SmartCar QR</h1>
          <p className="state-message">QR code not found.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell qr-scan-page">
      <section className="surface-card qr-scan-card">
        <p className="eyebrow">Scanned QR</p>
        <h1>SmartCar QR</h1>
        <h2>Contact Vehicle Owner</h2>
        <p className="page-description">
          Choose how you want to reach the vehicle owner or emergency contact.
        </p>

        <div className="action-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="radio"
                  name="messageMode"
                  value="auto"
                  checked={messageMode === 'auto'}
                  onChange={() => setMessageMode('auto')}
                />
                Send automated message
              </label>

              <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="radio"
                  name="messageMode"
                  value="custom"
                  checked={messageMode === 'custom'}
                  onChange={() => setMessageMode('custom')}
                />
                Send custom message
              </label>
            </div>

            {messageMode === 'custom' && (
              <textarea
                placeholder="Type a short message to the owner..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={4}
                style={{ minWidth: 320 }}
              />
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={async () => {
                  const senderName = (user && user.username) ? user.username : fromValue;
                  const messageToSend =
                    messageMode === 'auto'
                      ? `Hello, you blocked my car in the parking please come and move it`
                      : messageText;

                  if (!messageToSend || !messageToSend.trim()) return;

                  setSending(true);
                  try {
                    const headers = { 'Content-Type': 'application/json' };
                    if (authToken) headers.Authorization = `Bearer ${authToken}`;

                    await fetch(`/api/qr/${encodeURIComponent(token)}/message`, {
                      method: 'POST',
                      headers,
                      body: JSON.stringify({ type: 'MESSAGE', message: messageToSend, senderName, from: fromValue }),
                    });
                    setSentMessage('Message sent');
                    setMessageText('');
                  } catch (err) {
                    setSentMessage('Failed to send message');
                  } finally {
                    setSending(false);
                    setTimeout(() => setSentMessage(''), 3000);
                  }
                }}
                disabled={sending}
              >
                {sending ? 'Sending…' : 'Send Message'}
              </button>
            </div>

            {sentMessage && <p className="state-message">{sentMessage}</p>}
          </div>
        </div>

        <h2>Emergency</h2>

        <div className="action-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p className="page-description">Automatically notify the registered relative with your current location.</p>
            <button
              type="button"
              onClick={async () => {
                setSending(true);
                setSentMessage('');

                const getPosition = () =>
                  new Promise((resolve, reject) => {
                    if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
                    navigator.geolocation.getCurrentPosition(
                      (pos) => resolve(pos.coords),
                      (err) => reject(err),
                      { enableHighAccuracy: true, timeout: 10000 }
                    );
                  });

                try {
                  const coords = await getPosition();
                  const lat = coords.latitude;
                  const lng = coords.longitude;
                  const mapLink = `https://maps.google.com/?q=${lat},${lng}`;
                  const timestamp = new Date().toISOString();
                  const visitorInfo = (navigator && navigator.userAgent) || 'visitor';
                  const senderName = (user && user.username) ? user.username : fromValue;
                  const base = 'This vehicle got into an accident please head to this location asap';
                  const message = `${base} ${mapLink} (reported at ${timestamp} by ${visitorInfo})`;

                  const headers = { 'Content-Type': 'application/json' };
                  if (authToken) headers.Authorization = `Bearer ${authToken}`;

                  await fetch(`/api/qr/${encodeURIComponent(token)}/message`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ type: 'EMERGENCY', message, location: { lat, lng }, timestamp, senderName, from: fromValue }),
                  });

                  setSentMessage('Relative notified');
                } catch (err) {
                  console.error('Emergency notify failed', err);
                  setSentMessage('Failed to get location or notify relative');
                } finally {
                  setSending(false);
                  setTimeout(() => setSentMessage(''), 5000);
                }
              }}
              disabled={sending}
            >
              {sending ? 'Notifying…' : 'Notify Relative'}
            </button>
            {sentMessage && <p className="state-message">{sentMessage}</p>}
          </div>
        </div>
      </section>
    </main>
  );
}


// ==============================
// Main App
// ==============================

function RootRedirect() {
  const { isAuthenticated, registrationComplete } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!registrationComplete) {
    return <Navigate to="/register" replace />;
  }

  return <Navigate to="/home" replace />;
}

function App() {
  return (
    <Routes>
      {/* Public auth pages */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />

      {/* Registration */}
      <Route
        path="/register"
        element={
          <RegisterRoute>
            <Register />
          </RegisterRoute>
        }
      />

      {/* Authenticated dashboard pages */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/home" element={<Home />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/users" element={<Users />} />
      </Route>

      {/* Owner QR page */}
      <Route
        path="/qr"
        element={
          <ProtectedRoute>
            <QR />
          </ProtectedRoute>
        }
      />

      {/* Scanned QR page */}
      <Route path="/qr/:token" element={<ScannedQR />} />

      {/* Unknown route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;