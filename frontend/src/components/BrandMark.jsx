import brandMark from '../assets/brandmark.png';

export default function BrandMark({ className = '', size = 34 }) {
  return (
    <img
      src={brandMark}
      alt="Brand mark"
      className={`brand-mark ${className}`.trim()}
      style={{ width: size, height: size }}
    />
  );
}