import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

export type UserRole = 'Admin' | 'Manager' | 'Analyst' | 'Viewer';

interface User {
  username: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, refreshToken: string, username: string, email: string, role: UserRole) => void;
  logout: () => void;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 15 minutes in milliseconds for session inactivity timeout
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; 

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logout = useCallback(() => {
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Only set timer if user is logged in
    if (token) {
      timeoutRef.current = setTimeout(() => {
        logout();
        alert("Session Expired: You have been logged out due to 15 minutes of inactivity.");
      }, INACTIVITY_TIMEOUT);
    }
  }, [token, logout]);

  useEffect(() => {
    // Check local storage for existing session
    const savedToken = localStorage.getItem('token');
    const savedRefreshToken = localStorage.getItem('refreshToken');
    const savedUsername = localStorage.getItem('username');
    const savedEmail = localStorage.getItem('email');
    const savedRole = localStorage.getItem('role') as UserRole;

    if (savedToken && savedRefreshToken && savedUsername && savedEmail && savedRole) {
      setToken(savedToken);
      setRefreshToken(savedRefreshToken);
      setUser({
        username: savedUsername,
        email: savedEmail,
        role: savedRole,
      });
    }
    setIsLoading(false);
  }, []);

  // Set up event listeners for inactivity timeout when logged in
  useEffect(() => {
    if (!token) return;

    resetInactivityTimer();

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    const handleActivity = () => resetInactivityTimer();

    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [token, resetInactivityTimer]);

  const login = (token: string, rToken: string, username: string, email: string, role: UserRole) => {
    setToken(token);
    setRefreshToken(rToken);
    setUser({ username, email, role });
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', rToken);
    localStorage.setItem('username', username);
    localStorage.setItem('email', email);
    localStorage.setItem('role', role);
  };

  const hasRole = (allowedRoles: UserRole[]) => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        refreshToken,
        user,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
