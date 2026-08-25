import { useEffect, useMemo, useState } from 'react';
import ServiceCard from '../components/ServiceCard';
import { SERVICE_TYPE_OPTIONS } from '../constants/serviceTypes';
import { fetchServices } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

function matchesQuery(service, normalizedQuery) {
  const searchableText = [service.service_name, service.location]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return searchableText.includes(normalizedQuery);
}

const HIGHLIGHTS = [
  { title: 'Instant Connect', text: 'Reach anyone in seconds.', icon: 'bolt' },
  { title: '100% Private', text: 'Your data stays private.', icon: 'lock' },
  { title: 'Smart Alerts', text: 'Get notified instantly.', icon: 'bell' },
  { title: 'Secure & Reliable', text: 'Always here for you.', icon: 'shield' },
];

function HighlightIcon({ name }) {
  if (name === 'lock') {
    return (
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
    );
  }
  if (name === 'bell') {
    return (
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
        <path d="M13.7 21a2 2 0 0 1-3.4 0" />
      </svg>
    );
  }
  if (name === 'shield') {
    return (
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3l8 4v6c0 5-3.4 8.4-8 9-4.6-.6-8-4-8-9V7l8-4z" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
    </svg>
  );
}

function Home() {
  const { user } = useAuth();
  const [allServices, setAllServices] = useState([]);
  const [showAllOffers, setShowAllOffers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedAvailability, setSelectedAvailability] = useState('all');

  useEffect(() => {
    const controller = new AbortController();
    const loadServices = async () => {
      try {
        setLoading(true);
        setError('');
        const { ok, status, data } = await fetchServices({ signal: controller.signal });
        if (controller.signal.aborted) return;
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
        if (err?.name === 'AbortError') return;
        setError(err?.message || 'Unable to load services.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    loadServices();
    return () => controller.abort();
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

      return matchesName && matchesType && matchesLocation && matchesAvailability;
    });
  }, [allServices, query, selectedAvailability, selectedLocation, selectedType]);

  const displayedServices = showAllOffers ? filteredServices : filteredServices.slice(0, 6);
  const showInitialLoading = loading && allServices.length === 0;
  const showEmptyState =
    !loading && !error && allServices.length > 0 && filteredServices.length === 0;
  const showNoServicesLoaded =
    !loading && !error && allServices.length === 0;

  const handleSearch = (event) => {
    event.preventDefault();
    setShowAllOffers(true);
  };

  return (
    <main className="page-shell dashboard-page home-page">
      <section className="home-hero">
        <div className="home-hero__copy">
          <h1>Welcome back, {user?.username || user?.name || 'Driver'} 👋</h1>
          <p>Find trusted car services near you and stay connected on the road.</p>
          <div className="home-highlights">
            {HIGHLIGHTS.map((item) => (
              <article key={item.title} className="home-highlight-card">
                <div className="home-highlight-icon">
                  <HighlightIcon name={item.icon} />
                </div>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
        <div className="home-hero__visual">
          <img
            src="/images/hero-home.png"
            alt="Silver sedan with a SmartCar QR sticker on the windshield"
            loading="lazy"
            width="640"
            height="320"
          />
        </div>
      </section>

      <form className="home-search-card" onSubmit={handleSearch}>
        <div className="service-search">
          <span className="service-search__icon" aria-hidden="true">
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3-3" />
            </svg>
          </span>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by service name or location..."
            aria-label="Search services"
          />
        </div>

        <div className="service-filter-row" aria-label="Service filters">
          <label className="service-filter-field">
            <span>Service Type</span>
            <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)}>
              <option value="all">All Service Types</option>
              {SERVICE_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="service-filter-field">
            <span>Location</span>
            <select value={selectedLocation} onChange={(event) => setSelectedLocation(event.target.value)}>
              <option value="all">All Locations</option>
              {availableLocations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </label>

          <label className="service-filter-field">
            <span>Availability</span>
            <select value={selectedAvailability} onChange={(event) => setSelectedAvailability(event.target.value)}>
              <option value="all">All Availability</option>
              <option value="available">Available Now</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </label>

          <button type="submit" className="btn btn-primary home-search-btn">
            Search
          </button>
        </div>
      </form>

      <section className="home-offers">
        <div className="home-offers__header">
          <h2>Popular Services</h2>
          {filteredServices.length > 6 && (
            <button type="button" className="home-offers__view-all" onClick={() => setShowAllOffers((current) => !current)}>
              {showAllOffers ? 'Show less' : 'View all'}
            </button>
          )}
        </div>

        {showInitialLoading && <p className="state-message">Loading verified services...</p>}
        {error && (
          <p className="state-message state-message--error" role="alert">
            {error}
          </p>
        )}
        {showEmptyState && <p className="state-message">No services match your active search filters.</p>}
        {showNoServicesLoaded && <p className="state-message">No services currently available.</p>}

        <section className="service-list">
          {displayedServices.map((service) => (
            <ServiceCard key={service.service_id} service={service} />
          ))}
        </section>
      </section>

      <section className="home-stats" aria-label="Platform statistics">
        <div className="home-stats__item">
          <span className="home-stats__icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 7h4l2 4v6h-3" /><path d="M4 17h3V9l3-4h4v12" /><circle cx="7.5" cy="18.5" r="1.5" /><circle cx="16.5" cy="18.5" r="1.5" /></svg>
          </span>
          <strong>100+</strong>
          <span>Trusted Services</span>
        </div>
        <div className="home-stats__item">
          <span className="home-stats__icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 11l3 3 7-7" /><path d="M21 12a9 9 0 1 1-3-6.7" /></svg>
          </span>
          <strong>50K+</strong>
          <span>Happy Users</span>
        </div>
        <div className="home-stats__item">
          <span className="home-stats__icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
          </span>
          <strong>24/7</strong>
          <span>Support</span>
        </div>
        <div className="home-stats__item">
          <span className="home-stats__icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.4 5.7 6.2.6-4.7 4.1 1.4 6.1L12 16.7 6.7 19l1.4-6.1L3.4 8.8l6.2-.6L12 2.5z" /></svg>
          </span>
          <strong>4.8</strong>
          <span>User Rating</span>
        </div>
      </section>
    </main>
  );
}

export default Home;
