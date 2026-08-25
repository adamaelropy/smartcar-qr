import AppearancePicker from '../AppearancePicker';

export default function AppearanceSection({ theme, onChange }) {
  return (
    <section className="profile-section">
      <div className="profile-section-header">
        <div>
          <h2>Appearance &amp; Theme</h2>
        </div>
      </div>
      <AppearancePicker value={theme} onChange={onChange} />
    </section>
  );
}
