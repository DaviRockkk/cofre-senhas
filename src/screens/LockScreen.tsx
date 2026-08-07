import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Shield, Fingerprint, Lock, AlertCircle, RefreshCw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface LockScreenProps {
  onUnlock: () => Promise<boolean>;
  biometricLabel?: string;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  onUnlock,
  biometricLabel = 'Biometria',
}) => {
  const insets = useSafeAreaInsets();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);
    setErrorMessage(null);

    try {
      const success = await onUnlock();
      if (!success) {
        setErrorMessage('Autenticação não realizada. Tente novamente.');
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch {}
      } else {
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
      }
    } catch (err) {
      setErrorMessage('Ocorreu um erro ao verificar biometria.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  useEffect(() => {
    handleAuthenticate();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom, 24) }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />

      <View style={styles.card}>
        {/* Shield Icon Badge */}
        <View style={styles.iconContainer}>
          <View style={styles.iconOuterRing}>
            <Shield size={48} color="#06B6D4" />
            <View style={styles.lockBadge}>
              <Lock size={14} color="#0F172A" />
            </View>
          </View>
        </View>

        {/* Title and Description */}
        <Text style={styles.title}>Null Protegido</Text>
        <Text style={styles.subtitle}>
          Confirme sua {biometricLabel} nativa para desbloquear a interface do app.
        </Text>

        {/* Note on decryption security */}
        <View style={styles.securityBadge}>
          <Lock size={12} color="#06B6D4" style={{ marginRight: 6 }} />
          <Text style={styles.securityText}>
            A chave mestra continua sendo exigida para descriptografar senhas.
          </Text>
        </View>

        {/* Error message */}
        {errorMessage && (
          <View style={styles.errorContainer}>
            <AlertCircle size={16} color="#EF4444" style={{ marginRight: 8 }} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Unlock Button */}
        <TouchableOpacity
          style={[styles.unlockButton, isAuthenticating && styles.unlockButtonDisabled]}
          onPress={handleAuthenticate}
          disabled={isAuthenticating}
          activeOpacity={0.8}
        >
          {isAuthenticating ? (
            <ActivityIndicator size="small" color="#0F172A" />
          ) : (
            <>
              <Fingerprint size={22} color="#0F172A" style={{ marginRight: 8 }} />
              <Text style={styles.unlockButtonText}>Desbloquear com Biometria</Text>
            </>
          )}
        </TouchableOpacity>

        {errorMessage && !isAuthenticating && (
          <TouchableOpacity style={styles.retryButton} onPress={handleAuthenticate}>
            <RefreshCw size={14} color="#94A3B8" style={{ marginRight: 6 }} />
            <Text style={styles.retryText}>Tentar Novamente</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#151D2A',
    borderRadius: 24,
    borderColor: '#1E293B',
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconOuterRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    position: 'relative',
  },
  lockBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#06B6D4',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 24,
  },
  securityText: {
    fontSize: 11,
    color: '#06B6D4',
    fontWeight: '500',
    flexShrink: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
    width: '100%',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  unlockButton: {
    width: '100%',
    height: 52,
    backgroundColor: '#06B6D4',
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  unlockButtonDisabled: {
    opacity: 0.7,
  },
  unlockButtonText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  retryText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
});
