export default function BrandMark({ className = '', size = 34 }) {
  return (
    <img
      src="/brandmark.png"
      alt="SmartCar QR logo"
      className={`brand-mark ${className}`.trim()}
      style={{ width: size, height: size }}
      loading="lazy"
      width={size}
      height={size}
    />
  );
}