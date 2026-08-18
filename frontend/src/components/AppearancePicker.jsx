const APPEARANCE_OPTIONS = [
  {
    id: 'light',
    label: 'Light',
    text: 'Clean and bright interface',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    ),
  },
  {
    id: 'dark',
    label: 'Dark',
    text: 'Easy on the eyes',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z" />
      </svg>
    ),
  },
];

export default function AppearancePicker({ value, onChange }) {
  return (
    <div className="appearance-picker">
      <p className="appearance-picker__heading">Theme Mode</p>
      <div className="appearance-picker__options" role="radiogroup" aria-label="Appearance">
        {APPEARANCE_OPTIONS.map((option) => {
          const selected = value === option.id;

          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`appearance-picker__option appearance-picker__option--${option.id} ${selected ? 'is-selected' : ''}`}
              onClick={() => onChange(option.id)}
            >
              <span className={`appearance-picker__check ${selected ? 'is-visible' : ''}`} aria-hidden="true">
                {selected ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : null}
              </span>
              <span className="appearance-picker__icon">{option.icon}</span>
              <span className="appearance-picker__copy">
                <strong>{option.label}</strong>
                <span className="appearance-picker__label">{option.text}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="appearance-picker__note">
        <span className="appearance-picker__note-icon" aria-hidden="true">i</span>
        <div>
          <strong>Your preference is saved automatically.</strong>
          <p>You can change it anytime from this page.</p>
        </div>
      </div>
    </div>
  );
}
