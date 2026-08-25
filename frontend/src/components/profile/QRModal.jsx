import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

export default function QRModal({ qrUrl, onClose, onDownload, onCopy }) {
  const modalCanvasId = 'profile-qr-modal';
  const canvasRef = useRef(null);

  const handleDownload = () => {
    if (onDownload) onDownload(modalCanvasId);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="QR code preview"
      className="service-modal-backdrop"
      onClick={onClose}
    >
      <div className="service-modal" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
        <div className="service-modal__header">
          <h2>Vehicle QR Code</h2>
          <button type="button" className="service-modal__close" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
          <div className="profile-qr-canvas-box">
            <QRCodeCanvas ref={canvasRef} id={modalCanvasId} value={qrUrl} size={240} includeMargin />
          </div>
        </div>
        <div className="profile-qr-url-box" style={{ margin: '0 auto 1.25rem' }}>
          <a href={qrUrl} target="_blank" rel="noopener noreferrer">
            {qrUrl}
          </a>
        </div>
        <div className="profile-qr-actions">
          <button type="button" onClick={handleDownload} className="btn btn-primary">
            Download
          </button>
          <button type="button" onClick={onCopy} className="btn btn-secondary">
            Copy Link
          </button>
          <button type="button" onClick={onClose} className="btn btn-outline">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
