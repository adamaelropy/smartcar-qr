import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { fetchMyVehicleQr } from "./services/api";
import "./styles/auth.css";

function QR() {
  const { token, isAuthenticated } = useAuth();
  const [qrToken, setQrToken] = useState("");
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchQR = async () => {
      try {
        const { ok, data } = await fetchMyVehicleQr(token);

        if (!ok) {
          throw new Error(data.message || "Failed to retrieve QR information.");
        }

        setVehicle(data.vehicle);
        setQrToken(data.vehicle.qr_token);
      } catch (error) {
        console.error("QR error:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQR();
  }, [token]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <main className="page-shell qr-owner-page">
        <section className="surface-card qr-owner-card">
          <p className="eyebrow">SmartCar QR</p>
          <h1>My QR Code</h1>
          <p className="state-message">Loading your QR code...</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page-shell qr-owner-page">
        <section className="surface-card qr-owner-card">
          <p className="eyebrow">SmartCar QR</p>
          <h1>My QR Code</h1>
          <p className="state-message state-message--error">{error}</p>
        </section>
      </main>
    );
  }

  if (!vehicle || !qrToken) {
    return (
      <main className="page-shell qr-owner-page">
        <section className="surface-card qr-owner-card">
          <p className="eyebrow">SmartCar QR</p>
          <h1>My QR Code</h1>
          <p className="state-message">QR code not found.</p>
        </section>
      </main>
    );
  }

  const qrUrl = `${window.location.origin}/qr/${qrToken}`;

  return (
    <main className="page-shell qr-owner-page">
      <section className="surface-card qr-owner-card">
        <p className="eyebrow">SmartCar QR</p>
        <h1>My QR Code</h1>
        <p className="page-description">
          Share this QR code so others can scan your vehicle information.
        </p>

        <div className="qr-canvas-shell">
          <QRCodeCanvas value={qrUrl} size={240} includeMargin />
        </div>

        <p className="qr-note">
          This QR links to your stored token and stays consistent until you update your registration.
        </p>
      </section>
    </main>
  );
}

export default QR;