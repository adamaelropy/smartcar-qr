import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchMyVehicleQr } from "../services/api";
import "../styles/auth.css";

function QR() {
  const { token, isAuthenticated } = useAuth();
  const [qrToken, setQrToken] = useState("");
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchQR = async () => {
      if (!token) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const { ok, data } = await fetchMyVehicleQr(token);

        if (!isMounted) return;

        if (!ok) {
          throw new Error(data.message || "Failed to retrieve QR information.");
        }

        setVehicle(data.vehicle);
        setQrToken(data.vehicle.qr_token);
      } catch (err) {
        if (isMounted) {
          console.error("QR error:", err);
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchQR();

    return () => {
      isMounted = false;
    };
  }, [token]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <main className="page-shell qr-owner-page">
        <section className="surface-card qr-owner-card">
          <p className="eyebrow">SmartCar QR</p>
          <h1>My Vehicle QR</h1>
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
          <h1>My Vehicle QR</h1>
          <p className="state-message state-message--error" role="alert">{error}</p>
        </section>
      </main>
    );
  }

  if (!vehicle || !qrToken) {
    return (
      <main className="page-shell qr-owner-page">
        <section className="surface-card qr-owner-card">
          <p className="eyebrow">SmartCar QR</p>
          <h1>My Vehicle QR</h1>
          <p className="state-message">No QR code found for this account.</p>
        </section>
      </main>
    );
  }

  const qrUrl = `${window.location.origin}/qr/${qrToken}`;

  const downloadQr = () => {
    try {
      const canvas = document.getElementById("owner-qr-canvas");
      if (!canvas) return;
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `smartcar-qr-${vehicle.plate_number || 'code'}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      // ignore
    }
  };

  const copyQrLink = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <main className="page-shell qr-owner-page">
      <section className="surface-card qr-owner-card">
        <p className="eyebrow">Vehicle QR Code</p>
        <h1>{vehicle.car_name || "My Vehicle"}</h1>
        <p className="page-description">
          Plate: <strong>{vehicle.plate_number || "Registered"}</strong> · Share or print this QR code to place on your vehicle.
        </p>

        <div className="qr-canvas-shell">
          <QRCodeCanvas id="owner-qr-canvas" value={qrUrl} size={220} includeMargin />
        </div>

        <div className="profile-qr-url-box">
          <a href={qrUrl} target="_blank" rel="noopener noreferrer">
            {qrUrl}
          </a>
        </div>

        {copied && <p className="profile-success" role="status">Link copied to clipboard!</p>}

        <div className="home-actions" style={{ marginTop: "0.5rem" }}>
          <button type="button" className="btn btn-primary" onClick={downloadQr}>
            Download QR Code
          </button>
          <button type="button" className="btn btn-secondary" onClick={copyQrLink}>
            Copy Link
          </button>
        </div>

        <p className="qr-note">
          When anyone scans this code, they can reach you or notify your emergency contact securely without seeing your private phone number.
        </p>
      </section>
    </main>
  );
}

export default QR;
