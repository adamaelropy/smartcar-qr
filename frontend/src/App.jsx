import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import { ProtectedRoute, RegisterRoute } from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SignUp from "./pages/SignUp";
import QR from "./QR";
import { fetchVehicleByQrToken } from "./services/api";

import "./App.css";


// ==============================
// Scanned QR Page
// ==============================

function ScannedQR() {
  const { token } = useParams();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          <button type="button">Message Owner</button>
          <button type="button">Call Owner</button>
        </div>

        <h2>Emergency</h2>

        <div className="action-grid">
          <button type="button">Message Relative</button>
          <button type="button">Call Relative</button>
        </div>
      </section>
    </main>
  );
}


// ==============================
// Main App
// ==============================

function App() {
  return (
    <Routes>
      {/* Main application pages */}
      <Route path="/" element={<Home />} />
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