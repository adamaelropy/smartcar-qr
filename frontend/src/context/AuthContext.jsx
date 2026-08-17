/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const TOKEN_KEY = 'smartcar_token';
const USER_KEY = 'smartcar_user';
const REGISTRATION_KEY = 'smartcar_registration_complete';

function readStoredAuth() {
  const token = localStorage.getItem(TOKEN_KEY);
  const userJson = localStorage.getItem(USER_KEY);
  const registrationComplete =
    localStorage.getItem(REGISTRATION_KEY) === 'true';

  if (!token || !userJson) {
    return { token: null, user: null, registrationComplete: false };
  }

  try {
    return {
      token,
      user: JSON.parse(userJson),
      registrationComplete,
    };
  } catch {
    return { token: null, user: null, registrationComplete: false };
  }
}

export function AuthProvider({ children }) {
  const stored = readStoredAuth();
  const [token, setToken] = useState(stored.token);
  const [user, setUser] = useState(stored.user);
  const [registrationComplete, setRegistrationComplete] = useState(
    stored.registrationComplete,
  );

  const login = (nextToken, nextUser, isRegistrationComplete = true) => {
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    localStorage.setItem(
      REGISTRATION_KEY,
      isRegistrationComplete ? 'true' : 'false',
    );
    setToken(nextToken);
    setUser(nextUser);
    setRegistrationComplete(isRegistrationComplete);
  };

  const completeRegistration = () => {
    localStorage.setItem(REGISTRATION_KEY, 'true');
    setRegistrationComplete(true);
  };

  const updateStoredUser = (nextUser) => {
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(REGISTRATION_KEY);
    setToken(null);
    setUser(null);
    setRegistrationComplete(false);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      registrationComplete,
      login,
      completeRegistration,
      updateStoredUser,
      logout,
    }),
    [token, user, registrationComplete],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
