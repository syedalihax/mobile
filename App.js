import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

function RootApp() {
  const { themeMode } = useAuth();
  return (
    <>
      <StatusBar style={themeMode === 'LIGHT' ? 'dark' : 'light'} />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootApp />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
