import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from '../api/client';

const STORAGE_KEY = 'miniledger.token';

interface AuthContextType {
  token: string | null;
  loading: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadToken() {
      try {
        const storedToken = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedToken) {
          setToken(storedToken);
          setAuthToken(storedToken);
        } else {
          setAuthToken(null);
        }
      } catch (err) {
        console.error('Failed to load auth token:', err);
        setAuthToken(null);
      } finally {
        setLoading(false);
      }
    }

    loadToken();
  }, []);

  const signIn = async (newToken: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, newToken);
      setToken(newToken);
      setAuthToken(newToken);
    } catch (err) {
      console.error('Failed to save auth token:', err);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setToken(null);
      setAuthToken(null);
    } catch (err) {
      console.error('Failed to remove auth token:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ token, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}
