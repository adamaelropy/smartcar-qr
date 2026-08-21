import brandMark from '../assets/brandmark.png';

export default function BrandMark({ className = '', size = 34 }) {
  return (
    <img
      src={brandMark}
      alt="SmartCar QR"
      className={`brand-mark ${className}`.trim()}
      width={size}
      height={size}
      draggable="false"
    />
  );
}