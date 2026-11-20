import React, { createContext, useState, useEffect, useContext } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  authAPI,
  clearAuthTokens,
  getAuthTokens,
  initApiConfig,
  saveAuthTokens,
  setUnauthorizedHandler,
} from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [themeMode, setThemeMode] = useState('DARK'); // Default Binance Dark style

  useEffect(() => {
    setUnauthorizedHandler(async () => {
      await AsyncStorage.removeItem('@routinecraft_user');
      setToken(null);
      setUser(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      await initApiConfig();

      if (Platform.OS === 'web') {
        try {
          await authAPI.refresh();
          const profileResponse = await authAPI.getProfile();
          const profile = profileResponse.data.data;
          setToken('cookie-session');
          setUser(profile);
          if (profile.preferences?.themeMode) {
            setThemeMode(profile.preferences.themeMode);
          }
          await AsyncStorage.setItem('@routinecraft_user', JSON.stringify(profile));
        } catch (e) {
          await clearAuthTokens();
          await AsyncStorage.removeItem('@routinecraft_user');
          setToken(null);
          setUser(null);
        }
        return;
      }

      const storedTokens = await getAuthTokens();
      const storedUser = await AsyncStorage.getItem('@routinecraft_user');

      if (storedTokens?.accessToken && storedTokens?.refreshToken && storedUser) {
        await saveAuthTokens(storedTokens);
        setToken(storedTokens.accessToken);
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        if (parsedUser.preferences?.themeMode) {
          setThemeMode(parsedUser.preferences.themeMode);
        }

        try {
          const profileResponse = await authAPI.getProfile();
          setUser(profileResponse.data.data);
          await AsyncStorage.setItem('@routinecraft_user', JSON.stringify(profileResponse.data.data));
          const latestTokens = await getAuthTokens();
          setToken(latestTokens?.accessToken || null);
        } catch (e) {
          if (e.response?.status === 401) {
            await clearAuthTokens();
            await AsyncStorage.removeItem('@routinecraft_user');
            setToken(null);
            setUser(null);
          }
        }
      } else {
        await clearAuthTokens();
        await AsyncStorage.removeItem('@routinecraft_token');
        await AsyncStorage.removeItem('@routinecraft_user');
      }
    } catch (e) {
      console.error('Error restoring auth state', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await authAPI.login(email, password);
    const {
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      refreshTokenRotateAt,
      ...userData
    } = res.data.data;
    await saveAuthTokens({
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      refreshTokenRotateAt,
    });

    setToken(accessToken || 'cookie-session');
    setUser(userData);
    if (userData.preferences?.themeMode) {
      setThemeMode(userData.preferences.themeMode);
    }

    await AsyncStorage.setItem('@routinecraft_user', JSON.stringify(userData));
    return userData;
  };

  const register = async (name, email, password) => {
    const res = await authAPI.register(name, email, password);
    const {
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      refreshTokenRotateAt,
      ...userData
    } = res.data.data;
    await saveAuthTokens({
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      refreshTokenRotateAt,
    });

    setToken(accessToken || 'cookie-session');
    setUser(userData);
    if (userData.preferences?.themeMode) {
      setThemeMode(userData.preferences.themeMode);
    }

    await AsyncStorage.setItem('@routinecraft_user', JSON.stringify(userData));
    return userData;
  };

  const logout = async () => {
    try {
      const authTokens = await getAuthTokens();
      await authAPI.logout(authTokens?.refreshToken);
    } catch (e) {
      console.warn('Server-side logout failed', e.message);
    }

    try {
      await clearAuthTokens();
      await AsyncStorage.removeItem('@routinecraft_token');
      await AsyncStorage.removeItem('@routinecraft_user');
    } catch (e) {
      console.error('Error logging out', e);
    }
    setToken(null);
    setUser(null);
  };

  const updatePreferences = async (newPrefs) => {
    try {
      const res = await authAPI.updatePreferences(newPrefs);
      const updatedPrefs = res.data.data;
      const updatedUser = { ...user, preferences: updatedPrefs };
      setUser(updatedUser);
      if (updatedPrefs.themeMode) {
        setThemeMode(updatedPrefs.themeMode);
      }
      await AsyncStorage.setItem('@routinecraft_user', JSON.stringify(updatedUser));
      return updatedPrefs;
    } catch (e) {
      console.error('Error updating preferences', e);
      throw e;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        themeMode,
        setThemeMode,
        login,
        register,
        logout,
        updatePreferences,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
