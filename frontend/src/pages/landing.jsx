import { Link } from 'react-router-dom';
import '../App.css';

export default function Landing() {
  return (
    <main className="landing-page-shell">
      <section className="landing-card">
        <div className="landing-hero">
          <h1 className="landing-title">
            Let Anyone Reach You
            <br />
            <span className="text-accent">Privately &amp; Instantly</span>
            <br />
            Via Your Vehicle QR
          </h1>

          <p className="landing-description">
            Place a SmartCar QR code on your vehicle. When someone needs to reach you — blocked parking,
            lights left on, or an emergency — they scan and contact you instantly without ever seeing your private phone number.
          </p>

          <div className="landing-actions">
            <Link to="/signup" className="btn btn-primary landing-btn-primary">
              Get Started
            </Link>
            <Link to="/login" className="btn btn-secondary landing-btn-secondary">
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
