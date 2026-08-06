import React from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar, Text } from 'react-native';
import { Shield } from 'lucide-react-native';
import { VaultProvider, useVault } from './src/context/VaultContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { LockScreen } from './src/screens/LockScreen';

const VaultMainNavigator: React.FC = () => {
  const { isLoading, isLocked, unlockAppWithBiometrics, biometricLabel } = useVault();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />
        <View style={styles.loadingIconBadge}>
          <Shield size={48} color="#06B6D4" />
        </View>
        <ActivityIndicator size="large" color="#06B6D4" style={{ marginTop: 20 }} />
        <Text style={styles.loadingText}>Carregando Null...</Text>
      </View>
    );
  }

  if (isLocked) {
    return (
      <LockScreen
        onUnlock={unlockAppWithBiometrics}
        biometricLabel={biometricLabel}
      />
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />
      <HomeScreen />
    </>
  );
};

export default function App() {
  return (
    <VaultProvider>
      <VaultMainNavigator />
    </VaultProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0B0F19',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingIconBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 16,
    fontWeight: '500',
  },
});