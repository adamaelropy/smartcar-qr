export default function EditField({ id, label, type = 'text', value, onChange, placeholder = '' }) {
  return (
    <label className="profile-edit-field" htmlFor={id}>
      <span className="profile-label">{label}</span>
      <input
        id={id}
        className="profile-input"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
