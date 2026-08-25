import { QRCodeCanvas } from 'qrcode.react';

export default function ProfileHeader({ qrToken, onOpenQrModal }) {
  const qrUrl = qrToken ? `${window.location.origin}/qr/${qrToken}` : '';
  return (
    <div className="profile-header">
      <div className="profile-title-with-thumb">
        <div>
          <div className="profile-title-row">
            <h1>My Profile</h1>
            {qrToken && (
              <button
                type="button"
                className="profile-qr-thumb"
                onClick={onOpenQrModal}
                title="Click to view enlarged QR code"
                aria-label="View enlarged QR code"
              >
                <QRCodeCanvas value={qrUrl} size={32} marginSize={0} />
              </button>
            )}
          </div>
          <p className="page-description">Manage your account and keep your information secure.</p>
        </div>
      </div>
      <div className="profile-header__visual" aria-hidden="true">
        <img src="/images/hero-profile.png" alt="" loading="lazy" width="360" height="128" />
      </div>
    </div>
  );
}
