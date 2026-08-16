import React from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

export default function Landing() {
  return (
    <main className="page-shell home-page">
      <section className="home-card surface-card">
        <div className="home-welcome">
          <p className="eyebrow">Smart Vehicle QR System</p>
          <h1>
            Let Anyone Reach You
            <br />
            <span style={{ color: 'var(--accent)' }}>Privately &amp; Instantly</span>
            <br />Via Your Vehicle QR
          </h1>

          <p className="page-description" style={{ maxWidth: 720, margin: '1rem auto' }}>
            Place a Scanigo QR sticker on your vehicle. When someone needs to reach you — wrong parking,
            lights left on, or a minor accident — they scan and contact you without ever seeing your phone number.
          </p>

          <div className="home-actions" style={{ justifyContent: 'center', marginTop: '1.5rem' }}>
            <Link to="/signup" className="auth-button">
              Get Started
            </Link>
            <Link to="/login" className="home-actions a" style={{ textDecoration: 'none' }}>
              <button className="dashboard-link" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-h)', padding: '0.6rem 1rem', borderRadius: 12 }}>
                Login
              </button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
