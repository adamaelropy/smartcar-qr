function ServiceCard({ service }) {
  if (!service) {
    return null;
  }

  return (
    <article className="service-card">
      <div className="service-card__header">
        <h3>{service.service_name}</h3>
        <span className={`status ${service.availability ? 'available' : 'unavailable'}`}>
          {service.availability ? 'Available' : 'Unavailable'}
        </span>
      </div>

      <p>
        <strong>Type:</strong> {service.service_type}
      </p>
      <p>
        <strong>Location:</strong> {service.location}
      </p>
      <p>
        <strong>ID:</strong> {service.service_id}
      </p>
    </article>
  );
}

export default ServiceCard;
