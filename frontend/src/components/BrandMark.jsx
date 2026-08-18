export default function BrandMark({ className = '', size = 34 }) {
  return (
    <span className={`brand-mark ${className}`.trim()} aria-hidden="true" style={{ width: size, height: size }}>
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="11" fill="#2563eb" />
        <path
          d="M20 8.5c-5.2 0-8.8 3.1-9.4 7.8-.2 1.4.2 2.4 1.2 3.1l1.1.8v2.3c0 .8.6 1.4 1.4 1.4h1.4v1.6c0 .5.4.9.9.9h1.6c.5 0 .9-.4.9-.9v-1.6h3.8v1.6c0 .5.4.9.9.9h1.6c.5 0 .9-.4.9-.9v-1.6h1.4c.8 0 1.4-.6 1.4-1.4v-2.3l1.1-.8c1-.7 1.4-1.7 1.2-3.1C28.8 11.6 25.2 8.5 20 8.5Z"
          fill="white"
        />
        <path d="M13.8 18.6h12.4" stroke="#93c5fd" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </span>
  );
}
