import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

import { lazy, Suspense } from "react";
import { ProtectedRoute, RegisterRoute } from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";
import { fetchVehicleByQrToken, postQrMessage } from "./services/api";
import { useAuth } from "./context/AuthContext";
import { getAnonymousDeviceId } from "./utils/anonymousId";
import { MessagesPollProvider } from "./context/MessagesPollContext";
import { buildGoogleMapsUrl } from "./constants/appConfig";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const SignUp = lazy(() => import("./pages/SignUp"));
const Messages = lazy(() => import("./pages/Messages"));
const Profile = lazy(() => import("./pages/Profile"));
const Users = lazy(() => import("./pages/Users"));
const Landing = lazy(() => import("./pages/landing"));

import "./App.css";

// ==============================
// Scanned QR Page (Public Visitor View)
// ==============================

function ScannedQR() {
  const { token } = useParams();
  const { token: authToken, user } = useAuth();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [messageFeedback, setMessageFeedback] = useState('');
  const [emergencySending, setEmergencySending] = useState(false);
  const [emergencyFeedback, setEmergencyFeedback] = useState('');
  const [messageMode, setMessageMode] = useState('auto');
  const feedbackTimeoutRef = useRef(null);
  const emergencyTimeoutRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchVehicle = async () => {
      try {
        const { ok, data } = await fetchVehicleByQrToken(token, { signal: controller.signal });
        if (controller.signal.aborted) return;
        if (!ok) {
          throw new Error(data?.message || "Failed to retrieve vehicle QR information.");
        }
        setVehicle(data.vehicle);
      } catch (err) {
        if (err?.name === 'AbortError') return;
        console.error("Scan QR error:", err);
        setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchVehicle();
    return () => controller.abort();
  }, [token]);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) window.clearTimeout(feedbackTimeoutRef.current);
      if (emergencyTimeoutRef.current) window.clearTimeout(emergencyTimeoutRef.current);
    };
  }, []);

  if (loading) {
    return (
      <main className="qr-scan-shell">
        <section className="qr-scan-card">
          <h1>Scanning Vehicle...</h1>
          <p className="state-message">Retrieving vehicle contact channels...</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="qr-scan-shell">
        <section className="qr-scan-card">
          <h1>Scan Error</h1>
          <p className="state-message state-message--error" role="alert">{error}</p>
        </section>
      </main>
    );
  }

  if (!vehicle) {
    return (
      <main className="qr-scan-shell">
        <section className="qr-scan-card">
          <h1>Vehicle Not Found</h1>
          <p className="state-message">This QR code is either unassigned or no longer active.</p>
        </section>
      </main>
    );
  }

  const handleSendMessage = async () => {
    const messageToSend =
      messageMode === 'auto'
        ? `Hello, you blocked my car in the parking please come and move it`
        : messageText;

    if (!messageToSend || !messageToSend.trim()) return;

    setSending(true);
    setMessageFeedback('');
    try {
      const isAnonymous = !authToken && !user?.username;
      const payload = { type: 'MESSAGE', message: messageToSend };
      if (isAnonymous) {
        try {
          payload.anonymousId = getAnonymousDeviceId();
        } catch {
          // ignore
        }
      }
      const response = await postQrMessage(token, payload, authToken);

      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to send message.');
      }

      setMessageFeedback(
        response.data?.threadId
          ? 'Message sent successfully. A chat has been created in Messages.'
          : 'Message sent successfully!',
      );
      setMessageText('');
    } catch (error) {
      setMessageFeedback(error.message || 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
      if (feedbackTimeoutRef.current) window.clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = window.setTimeout(() => setMessageFeedback(''), 4000);
    }
  };

  const handleEmergencyNotify = async () => {
    setEmergencySending(true);
    setEmergencyFeedback('');

    const getPosition = () =>
      new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos.coords),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });

    try {
      const coords = await getPosition();
      const timestamp = new Date().toISOString();
      const base = 'This vehicle got into an accident please head to this location asap';
      let message;
      let location = null;
      if (coords && typeof coords.latitude === 'number' && typeof coords.longitude === 'number') {
        const lat = coords.latitude;
        const lng = coords.longitude;
        const mapLink = buildGoogleMapsUrl(lat, lng);
        message = `${base} ${mapLink} (reported at ${timestamp})`;
        location = { lat, lng };
      } else {
        message = `${base} (reported at ${timestamp} - location unavailable)`;
      }
      const isAnonymousEmer = !authToken && !user?.username;
      const payload = location
        ? { type: 'EMERGENCY', message, location, timestamp }
        : { type: 'EMERGENCY', message, timestamp };
      if (isAnonymousEmer) {
        try {
          payload.anonymousId = getAnonymousDeviceId();
        } catch {
          // ignore
        }
      }

      const response = await postQrMessage(token, payload, authToken);

      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to notify contact.');
      }

      setEmergencyFeedback(coords ? 'Emergency relative notified with location!' : 'Emergency notification sent (location unavailable).');
    } catch (err) {
      console.error('Emergency notify failed', err);
      setEmergencyFeedback(err.message || 'Failed to notify relative.');
    } finally {
      setEmergencySending(false);
      if (emergencyTimeoutRef.current) window.clearTimeout(emergencyTimeoutRef.current);
      emergencyTimeoutRef.current = window.setTimeout(() => setEmergencyFeedback(''), 5000);
    }
  };

  return (
    <main className="page-shell qr-scan-page">
      <section className="surface-card qr-public-card">
        <div className="qr-public-header">
          <h1 className="qr-public-vehicle-name">{vehicle?.car_name || 'SmartCar QR'}</h1>
        </div>

        <p className="qr-public-subtitle">
          Reach the vehicle owner privately or notify emergency contact support if needed.
        </p>

        <div className="qr-public-message-panel">
          <h2>Send Message to Owner</h2>
          <p>Choose the message style that fits your situation.</p>

          <div className="qr-message-mode-switch" aria-label="Message mode">
            <button
              type="button"
              className={`btn ${messageMode === 'auto' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMessageMode('auto')}
            >
              Automated Message
            </button>
            <button
              type="button"
              className={`btn ${messageMode === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMessageMode('custom')}
            >
              Custom Message
            </button>
          </div>

          {messageMode === 'custom' && (
            <textarea
              className="scan-textarea"
              placeholder="Type a brief message to the vehicle owner..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={4}
            />
          )}

          <div className="qr-action-row">
            <button
              type="button"
              className="btn btn-primary qr-send-btn"
              onClick={handleSendMessage}
              disabled={sending || (messageMode === 'custom' && !messageText.trim())}
            >
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </div>

          {messageFeedback && (
            <p
              className={`scan-feedback ${
                messageFeedback.toLowerCase().includes('failed') ? 'scan-feedback--error' : 'scan-feedback--success'
              }`}
              role="status"
            >
              {messageFeedback}
            </p>
          )}
        </div>

        <div className="emergency-box">
          <h3 className="emergency-box__title">Emergency Assistance</h3>
          <p className="emergency-box__desc">
            In case of an accident or hazard, notify the owner&apos;s registered emergency relative with your current GPS location.
          </p>

          <button
            type="button"
            className="emergency-notify-btn"
            onClick={handleEmergencyNotify}
            disabled={emergencySending}
          >
            {emergencySending ? 'Acquiring GPS & Notifying...' : 'Notify Emergency Relative'}
          </button>

          {emergencyFeedback && (
            <p className={emergencyFeedback.includes('Failed') ? 'scan-feedback scan-feedback--error' : 'scan-feedback scan-feedback--success'} role="status">
              {emergencyFeedback}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

// ==============================
// Main Application Routing
// ==============================

function App() {
  return (
    <Suspense fallback={<main className="page-shell"><p className="state-message">Loading...</p></main>}>
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
              <MessagesPollProvider>
                <DashboardLayout />
              </MessagesPollProvider>
            </ProtectedRoute>
          }
        >
          <Route path="/home" element={<Home />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/users" element={<Users />} />
        </Route>

        {/* Scanned QR page */}
        <Route path="/qr/:token" element={<ScannedQR />} />

        {/* Unknown route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
