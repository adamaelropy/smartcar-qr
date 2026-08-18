import { Link } from 'react-router-dom';
import BrandMark from '../components/BrandMark';
import { useAuth } from '../context/AuthContext';
import '../App.css';

const FEATURES = [
  {
    title: 'Privacy First',
    text: 'Your personal number stays private. Share only what’s necessary.',
    tone: 'blue',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
    ),
  },
  {
    title: 'Instant Connection',
    text: 'Anyone can scan and reach you within seconds.',
    tone: 'green',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
      </svg>
    ),
  },
  {
    title: 'Safe & Secure',
    text: 'We protect your data with industry-standard security.',
    tone: 'purple',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3l8 4v6c0 5-3.4 8.4-8 9-4.6-.6-8-4-8-9V7l8-4z" />
      </svg>
    ),
  },
  {
    title: 'Smart Notifications',
    text: 'Get notified instantly when someone scans your QR.',
    tone: 'orange',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
        <path d="M13.7 21a2 2 0 0 1-3.4 0" />
      </svg>
    ),
  },
];

export default function Landing() {
  const { isAuthenticated, registrationComplete } = useAuth();
  const nextPath = isAuthenticated ? (registrationComplete ? '/home' : '/register') : '/signup';

  return (
    <main className="landing-shell">
      <header className="landing-nav">
        <Link to="/" className="landing-logo">
          <BrandMark />
          <span>SmartCar QR</span>
        </Link>
        <div className="landing-nav-actions">
          {isAuthenticated ? (
            <Link to={nextPath} className="btn btn-primary">Open Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline landing-signin">Sign In</Link>
              <Link to="/signup" className="btn btn-primary">Get Started</Link>
            </>
          )}
        </div>
      </header>

      <section className="landing-hero-grid">
        <div className="landing-hero-copy">
          <p className="landing-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Smart. Secure. Connected.
          </p>
          <h1>
            Let Anyone Reach You
            <br />
            <span className="text-accent">Privately &amp; Instantly</span>
            <br />
            Via Your Vehicle QR.
          </h1>
          <p className="landing-description">
            Place a SmartCar QR code on your vehicle. When someone needs to reach you — blocked parking,
            lights left on, or an emergency — they scan and contact you instantly without ever seeing your private phone number.
          </p>
          <Link to={nextPath} className="btn btn-primary landing-cta">
            {isAuthenticated ? 'Open Dashboard' : 'Get Started'}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
          <div className="landing-trust">
            <span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
              100% Private
            </span>
            <span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" /></svg>
              Instant Alerts
            </span>
            <span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l8 4v6c0 5-3.4 8.4-8 9-4.6-.6-8-4-8-9V7l8-4z" /></svg>
              Secure &amp; Reliable
            </span>
          </div>
        </div>

        <div className="landing-hero-visual">
          <div className="hero-car-frame hero-car-frame--landing">
            <img
              src="/images/hero-landing.png"
              alt="Silver sedan with a SmartCar QR sticker on the windshield"
            />
          </div>
        </div>
      </section>

      <section className="landing-why">
        <p className="landing-why-badge">Why SmartCar QR?</p>
        <h2>Built for Privacy. Designed for Real Life.</h2>
        <p className="landing-why-sub">
          SmartCar QR helps you stay connected in the moments that matter, without compromising your personal information.
        </p>
        <div className="landing-feature-grid">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="landing-feature-card">
              <div className={`landing-feature-icon landing-feature-icon--${feature.tone}`}>
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
