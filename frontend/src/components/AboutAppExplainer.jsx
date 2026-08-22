const BENEFITS = [
  {
    title: 'Reachable when it matters',
    text: 'If someone needs to contact you about your parked car, they can scan your QR and message you without hunting for a phone number.',
  },
  {
    title: 'Built for real situations',
    text: 'Useful for blocking issues, emergencies, or quick coordination in parking lots and on the road.',
  },
  {
    title: 'You stay in control',
    text: 'Your personal details stay private. People only reach you through your vehicle’s unique SmartCar QR link.',
  },
];

export default function AboutAppExplainer() {
  return (
    <div className="about-explainer">
      <div className="about-explainer__header">
        <p className="about-explainer__eyebrow">What SmartCar QR does</p>
        <h3>A simple way for people to reach you through your car</h3>
        <p className="about-explainer__subtitle">
          SmartCar QR links your vehicle to a secure contact channel. When someone scans the code on
          your car, they can connect with you quickly while your private information stays protected.
        </p>
      </div>

      <div className="about-explainer__visual" aria-hidden="true">
        <svg className="about-explainer__svg" viewBox="0 0 920 340" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect className="about-explainer__bg" x="0" y="0" width="920" height="340" rx="18" />

          <g className="about-explainer__skyline" opacity="0.55">
            <rect x="620" y="118" width="34" height="92" rx="4" />
            <rect x="662" y="98" width="28" height="112" rx="4" />
            <rect x="698" y="128" width="38" height="82" rx="4" />
            <rect x="744" y="108" width="30" height="102" rx="4" />
            <rect x="782" y="138" width="42" height="72" rx="4" />
            <rect x="832" y="112" width="36" height="98" rx="4" />
          </g>

          <g className="about-explainer__callout">
            <rect x="470" y="28" width="250" height="118" rx="14" />
            <rect x="486" y="44" width="28" height="28" rx="8" className="about-explainer__callout-icon" />
            <path d="M494 58h12M500 52v12" strokeWidth="1.6" strokeLinecap="round" className="about-explainer__callout-mark" />
            <text x="522" y="62" className="about-explainer__callout-brand">SmartCar QR</text>
            <text x="486" y="88" className="about-explainer__callout-title">SCAN TO CONNECT</text>
            <text x="486" y="106" className="about-explainer__callout-title">WITH CAR OWNER</text>
            <text x="486" y="132" className="about-explainer__callout-url">smartcar-qr.app</text>
          </g>

          <path
            d="M595 146 C595 188 548 206 508 218"
            className="about-explainer__connector"
            strokeWidth="2.5"
            strokeDasharray="7 6"
            strokeLinecap="round"
          />

          <g className="about-explainer__phone">
            <rect x="54" y="58" width="148" height="248" rx="22" />
            <rect x="68" y="78" width="120" height="208" rx="12" className="about-explainer__phone-screen" />
            <rect x="104" y="66" width="48" height="6" rx="3" className="about-explainer__phone-notch" />
            <text x="78" y="104" className="about-explainer__phone-label">Your vehicle link</text>

            <rect x="88" y="116" width="80" height="80" rx="8" className="about-explainer__qr-frame" />
            <g className="about-explainer__qr-pattern">
              <rect x="96" y="124" width="16" height="16" rx="2" />
              <rect x="144" y="124" width="16" height="16" rx="2" />
              <rect x="96" y="172" width="16" height="16" rx="2" />
              <rect x="120" y="148" width="8" height="8" rx="1" />
              <rect x="132" y="160" width="8" height="8" rx="1" />
              <rect x="144" y="148" width="8" height="8" rx="1" />
              <rect x="112" y="132" width="8" height="8" rx="1" />
              <rect x="128" y="172" width="8" height="8" rx="1" />
            </g>

            <text x="128" y="218" textAnchor="middle" className="about-explainer__phone-caption">
              Secure contact channel
            </text>
          </g>

          <g className="about-explainer__car">
            <ellipse cx="640" cy="268" rx="118" ry="10" className="about-explainer__car-shadow" />
            <path
              d="M510 250h176c12 0 22-10 22-22v-12c0-8-6-14-14-14h-18l-20-28c-4-6-10-10-17-10h-72c-7 0-13 4-17 10l-20 28h-18c-8 0-14 6-14 14v12c0 12 10 22 22 22z"
              className="about-explainer__car-body"
            />
            <circle cx="548" cy="250" r="18" className="about-explainer__car-wheel" />
            <circle cx="548" cy="250" r="8" className="about-explainer__car-wheel-inner" />
            <circle cx="662" cy="250" r="18" className="about-explainer__car-wheel" />
            <circle cx="662" cy="250" r="8" className="about-explainer__car-wheel-inner" />

            <rect x="536" y="184" width="24" height="24" rx="4" className="about-explainer__sticker" />
            <g className="about-explainer__sticker-qr">
              <rect x="540" y="188" width="4" height="4" />
              <rect x="552" y="188" width="4" height="4" />
              <rect x="540" y="200" width="4" height="4" />
              <rect x="548" y="196" width="3" height="3" />
            </g>
          </g>

          <path
            d="M214 186 C300 186 360 206 490 228"
            className="about-explainer__flow"
            strokeWidth="2"
            strokeDasharray="6 5"
            strokeLinecap="round"
            markerEnd="url(#about-arrow)"
          />

          <defs>
            <marker id="about-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0 0 L8 4 L0 8 Z" className="about-explainer__flow-head" />
            </marker>
          </defs>
        </svg>
      </div>

      <div className="about-explainer__benefits">
        {BENEFITS.map((benefit) => (
          <article key={benefit.title} className="about-explainer__benefit">
            <strong>{benefit.title}</strong>
            <p>{benefit.text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
