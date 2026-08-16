import { useEffect, useMemo, useState } from 'react';
import ServiceCard from '../components/ServiceCard';
import {
  SERVICE_TYPE_OPTIONS,
  getServiceTypeLabel,
} from '../constants/serviceTypes';
import { fetchServices } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

function matchesQuery(service, normalizedQuery) {
  const searchableText = [service.service_name]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return searchableText.includes(normalizedQuery);
}

function Home() {
  const { user } = useAuth();
  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedAvailability, setSelectedAvailability] = useState('all');

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

  const availableLocations = useMemo(
    () =>
      [...new Set(allServices.map((service) => service.location).filter(Boolean))].sort(
        (left, right) => left.localeCompare(right),
      ),
    [allServices],
  );

  const filteredServices = useMemo(() => {
    const trimmedQuery = query.trim();

    return allServices.filter((service) => {
      const matchesName =
        !trimmedQuery || matchesQuery(service, trimmedQuery.toLowerCase());
      const matchesType =
        selectedType === 'all' || service.service_type === selectedType;
      const matchesLocation =
        selectedLocation === 'all' || service.location === selectedLocation;
      const matchesAvailability =
        selectedAvailability === 'all' ||
        (selectedAvailability === 'available' && service.availability === true) ||
        (selectedAvailability === 'unavailable' && service.availability === false);

      return (
        matchesName &&
        matchesType &&
        matchesLocation &&
        matchesAvailability
      );
    });
  }, [allServices, query, selectedAvailability, selectedLocation, selectedType]);

  const showInitialLoading = loading && allServices.length === 0;
  const showEmptyState =
    !loading && !error && allServices.length > 0 && filteredServices.length === 0;
  const showNoServicesLoaded =
    !loading && !error && allServices.length === 0;

  return (
    <main className="page-shell dashboard-page home-page">
      <section className="home-welcome">
        <h1>Welcome {user?.username || 'user'}!</h1>
      </section>

      <section className="home-card services-page-card">
        <p className="eyebrow">Services</p>
        <h1>Find Vehicle Services</h1>
        <p className="page-description">
          Search by service name.
        </p>

        <div className="service-toolbar">
          <div className="service-search">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search service name"
              aria-label="Search services by name"
            />
          </div>

          <div className="service-filter-row" aria-label="Service filters">
            <label className="service-filter-field">
              <span>Type</span>
              <select
                value={selectedType}
                onChange={(event) => setSelectedType(event.target.value)}
              >
                <option value="all">All types</option>
                {SERVICE_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="service-filter-field">
              <span>Location</span>
              <select
                value={selectedLocation}
                onChange={(event) => setSelectedLocation(event.target.value)}
              >
                <option value="all">All locations</option>
                {availableLocations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </label>

            <label className="service-filter-field">
              <span>Availability</span>
              <select
                value={selectedAvailability}
                onChange={(event) => setSelectedAvailability(event.target.value)}
              >
                <option value="all">All availability</option>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </label>
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

export default Home;