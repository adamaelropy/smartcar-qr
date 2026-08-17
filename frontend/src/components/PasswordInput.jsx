import { useState } from 'react';

function EyeIcon({ hidden }) {
  if (hidden) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 3l18 18" />
        <path d="M10.58 10.58A3 3 0 0113.42 13.42" />
        <path d="M14.12 14.12A9 9 0 0112 17c-4.97 0-9-5-9-5a19.6 19.6 0 014.28-4.77" />
      </svg>
    );
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1.05 12a19.6 19.6 0 014.28-4.77C7.99 4.99 11.03 3 12 3c4.97 0 9 5 9 5s-4.03 5-9 5a9 9 0 01-2.35-.31" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  required = false,
  inputClassName = '',
  label = 'Show password',
  hideLabel = 'Hide password',
  ...rest
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="input-with-icon">
      <input
        id={id}
        className={inputClassName}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required={required}
        {...rest}
      />
      <button
        type="button"
        className="icon-button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? hideLabel : label}
      >
        <EyeIcon hidden={visible} />
      </button>
    </div>
  );
}
