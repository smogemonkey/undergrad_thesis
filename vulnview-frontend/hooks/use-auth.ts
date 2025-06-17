import { useState, useEffect } from 'react';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    isAuthenticated: false,
  });

  useEffect(() => {
    // Check for token in localStorage on mount
    const token = localStorage.getItem('auth_token');
    if (token) {
      setAuthState({
        token,
        isAuthenticated: true,
      });
    }
  }, []);

  const login = (token: string) => {
    localStorage.setItem('auth_token', token);
    setAuthState({
      token,
      isAuthenticated: true,
    });
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setAuthState({
      token: null,
      isAuthenticated: false,
    });
  };

  return {
    token: authState.token,
    isAuthenticated: authState.isAuthenticated,
    login,
    logout,
  };
} 