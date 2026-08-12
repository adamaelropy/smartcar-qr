import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ServiceCard from '../components/ServiceCard';
import { fetchServices, searchServices } from '../services/api';
import '../styles/auth.css';

function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        setError('');

        const data = query.trim()
          ? await searchServices(query)
          : await fetchServices();

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
    <div className="home-page">
      <div className="home-card">
        <h1>SmartCar QR</h1>

        {isAuthenticated ? (
          <>
            <p>Welcome, <strong>{user.username}</strong>!</p>
            <p>You are logged in successfully.</p>
            <div className="home-actions">
              <button type="button" onClick={logout}>
                Log out
              </button>
            </div>
          </>
        ) : (
          <>
            <p>Please sign in to continue.</p>
            <div className="home-actions">
              <Link to="/login">Sign In</Link>
              <Link to="/signup">Sign Up</Link>
            </div>
          </>
        )}

        <div className="service-search">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search services, type or location"
            aria-label="Search services"
          />
        </div>

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
      </div>
    </div>
  );
}

export default Home;
