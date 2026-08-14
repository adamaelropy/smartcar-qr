import { useEffect, useMemo, useState } from 'react';
import ServiceCard from '../components/ServiceCard';
import { getServiceTypeLabel } from '../constants/serviceTypes';
import { fetchServices } from '../services/api';
import '../styles/auth.css';

function matchesQuery(service, normalizedQuery) {
  const searchableText = [
    service.service_name,
    service.location,
    service.service_type,
    getServiceTypeLabel(service.service_type),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return searchableText.includes(normalizedQuery);
}

function Services() {
  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadServices = async () => {
      try {
        setLoading(true);
        setError('');
        const { ok, status, data } = await fetchServices();

        if (!isMounted) return;

        if (!ok) {
          const message =
            data?.message ||
            (status === 404
              ? 'Services endpoint not found.'
              : status >= 500
              ? `Server error (${status}). Please try again later.`
              : 'Failed to retrieve services.');
          setError(message);
          return;
        }

        if (Array.isArray(data?.services)) {
          setAllServices(data.services);
        } else {
          setError('Invalid response format received from server.');
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Unable to load services.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadServices();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredServices = useMemo(() => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return allServices;
    }

    const normalizedQuery = trimmedQuery.toLowerCase();

    return allServices.filter((service) =>
      matchesQuery(service, normalizedQuery),
    );
  }, [allServices, query]);

  const showInitialLoading = loading && allServices.length === 0;
  const showEmptyState =
    !loading && !error && allServices.length > 0 && filteredServices.length === 0;
  const showNoServicesLoaded =
    !loading && !error && allServices.length === 0;

  return (
    <main className="page-shell dashboard-page">
      <section className="home-card services-page-card">
        <p className="eyebrow">Services</p>
        <h1>Find Vehicle Services</h1>
        <p className="page-description">
          Search by service name or location.
        </p>

        <div className="service-toolbar">
          <div className="service-search">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search services or location"
              aria-label="Search services"
            />
          </div>
        </div>

        {showInitialLoading && (
          <p className="state-message">Loading services...</p>
        )}

        {error && (
          <p className="state-message state-message--error" role="alert">
            {error}
          </p>
        )}

        {showEmptyState && (
          <p className="state-message">No services found.</p>
        )}

        {showNoServicesLoaded && (
          <p className="state-message">No services found.</p>
        )}

        <section className="service-list">
          {filteredServices.map((service) => (
            <ServiceCard key={service.service_id} service={service} />
          ))}
        </section>
      </section>
    </main>
  );
}

export default Services;
