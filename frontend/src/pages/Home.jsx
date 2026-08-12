import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

function Home() {
  const { user, isAuthenticated, logout } = useAuth();

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
      </div>
    </div>
  );
}

export default Home;
