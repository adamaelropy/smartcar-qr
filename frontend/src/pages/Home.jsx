import { useEffect, useState } from 'react';
import ServiceCard from '../components/ServiceCard';
import { fetchServices, searchServices } from '../services/api';

function Home() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        setError('');

        const data = query.trim() ? await searchServices(query) : await fetchServices();
        setServices(data);
      } catch (err) {
        setError(err.message || 'Unable to load services.');
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, [query]);

  return (
    <main className="page home-page">
      <header>
        <h1>SmartCar Services</h1>
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search services, type or location"
          aria-label="Search services"
        />
      </header>

      {loading && <p>Loading services...</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && !error && services.length === 0 && (
        <p>No services found.</p>
      )}

      <section className="service-list">
        {services.map((service) => (
          <ServiceCard key={service.service_id} service={service} />
        ))}
      </section>
    </main>
  );
}

export default Home;
