import PropTypes from 'prop-types';
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import http, { AUTH_TOKEN_KEY } from '../api/httpClient.js';

export const AuthContext = createContext({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {},
  logout: () => {},
  isAuthorized: () => false,
});

AuthContext.displayName = 'AuthContext';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() =>
    typeof window !== 'undefined' ? window.localStorage.getItem(AUTH_TOKEN_KEY) : null
  );
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!token) {
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
      setUser(null);
      setIsLoading(false);
      return;
    }

    window.localStorage.setItem(AUTH_TOKEN_KEY, token);

    let isSubscribed = true;
    setIsLoading(true);

    http
      .get('/auth/me')
      .then((response) => {
        if (isSubscribed) {
          setUser(response.data);
        }
      })
      .catch(() => {
        if (isSubscribed) {
          window.localStorage.removeItem(AUTH_TOKEN_KEY);
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (isSubscribed) {
          setIsLoading(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [token]);

  const login = useCallback(async ({ username, password }) => {
    const { data } = await http.post('/auth/login', { username, password });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleForcedLogout = () => logout();
    window.addEventListener('auth:logout', handleForcedLogout);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, [logout]);

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      login,
      logout,
      isAuthorized: (roles) => {
        if (!roles || !roles.length) {
          return Boolean(user);
        }
        return roles.includes(user?.role ?? '');
      },
    }),
    [isLoading, login, logout, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
