import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import { RegisterRoute } from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SignUp from "./pages/SignUp";
import QR from "./QR";

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
        const response = await fetch(
          `http://localhost:3000/api/qr/${token}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to retrieve QR information."
          );
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
    return <h2>Loading...</h2>;
  }

  if (error) {
    return (
      <div>
        <h1>SmartCar QR</h1>
        <h2>QR Code Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!vehicle) {
    return <h2>QR Code not found.</h2>;
  }

  return (
    <div>
      <h1>SmartCar QR</h1>

      <h2>Contact Vehicle Owner</h2>

      <button>Message Owner</button>
      <button>Call Owner</button>

      <h2>Emergency</h2>

      <button>Message Relative</button>
      <button>Call Relative</button>
    </div>
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
      <Route path="/qr" element={<QR />} />

      {/* Scanned QR page */}
      <Route path="/qr/:token" element={<ScannedQR />} />

      {/* Unknown route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;