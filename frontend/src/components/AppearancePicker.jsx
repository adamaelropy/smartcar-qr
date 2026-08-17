function ThemePreview({ mode }) {
  return (
    <div className={`appearance-preview appearance-preview--${mode}`} aria-hidden="true">
      <div className="appearance-preview__phone">
        <div className="appearance-preview__bezel">
          <div className="appearance-preview__notch" />
          <div className="appearance-preview__screen">
            <div className="appearance-preview__status">
              <span />
              <span />
            </div>
            <div className="appearance-preview__title" />
            <div className="appearance-preview__card">
              <div className="appearance-preview__row" />
              <div className="appearance-preview__row appearance-preview__row--short" />
              <div className="appearance-preview__row" />
            </div>
            <div className="appearance-preview__button" />
          </div>
        </div>
      </div>
    </div>
  );
}

const APPEARANCE_OPTIONS = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

export default function AppearancePicker({ value, onChange }) {
  return (
    <div className="appearance-picker">
      <p className="appearance-picker__heading">APPEARANCE</p>
      <div className="appearance-picker__options" role="radiogroup" aria-label="Appearance">
        {APPEARANCE_OPTIONS.map((option) => {
          const selected = value === option.id;

          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`appearance-picker__option ${selected ? 'is-selected' : ''}`}
              onClick={() => onChange(option.id)}
            >
              <ThemePreview mode={option.id} />
              <span className="appearance-picker__label">{option.label}</span>
              <span className={`appearance-picker__indicator ${selected ? 'is-visible' : ''}`} aria-hidden="true">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6.2l2.2 2.2 4.8-4.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
