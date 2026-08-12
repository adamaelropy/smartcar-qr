import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

function QR() {
  const [qrToken, setQrToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchQR = async () => {
      try {
        const response = await fetch(
          "http://localhost:3000/api/vehicles/2/qr"
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to retrieve QR information."
          );
        }

        setQrToken(data.vehicle.qr_token);
      } catch (error) {
        console.error("QR error:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQR();
  }, []);

  if (loading) {
    return <h2>Loading QR Code...</h2>;
  }

  if (error) {
    return <h2>Error: {error}</h2>;
  }

  const qrUrl = `http://localhost:5173/qr/${qrToken}`;

  return (
    <div>
      <h1>SmartCar QR</h1>

      <h2>My QR Code</h2>

      <QRCodeCanvas value={qrUrl} size={250} />
    </div>
  );
}

export default QR;