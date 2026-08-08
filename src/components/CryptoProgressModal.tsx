import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { Shield, Lock, KeyRound, Cpu, ShieldCheck } from 'lucide-react-native';

export interface CryptoProgressModalProps {
  visible: boolean;
  title?: string;
  message?: string;
  mode?: 'encrypt' | 'decrypt' | 'backup';
  progress?: number | null;
}

export const CryptoProgressModal: React.FC<CryptoProgressModalProps> = ({
  visible,
  title,
  message,
  mode = 'encrypt',
  progress = null,
}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Continuous rotation for icon
      rotateAnim.setValue(0);
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();

      // Pulsing glow effect
      pulseAnim.setValue(0.4);
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 800,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => {
        rotateAnimation.stop();
        pulseAnimation.stop();
      };
    }
  }, [visible]);

  // Update progress bar animation when numeric progress updates
  useEffect(() => {
    if (progress !== null && progress !== undefined) {
      Animated.timing(progressAnim, {
        toValue: Math.min(1, Math.max(0, progress)),
        duration: 120,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    } else if (visible) {
      progressAnim.setValue(0);
    }
  }, [progress, visible]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['3%', '100%'],
  });

  if (!visible) return null;

  const defaultTitle =
    mode === 'encrypt'
      ? 'Criptografando Dados...'
      : mode === 'decrypt'
      ? 'Descriptografando Acesso...'
      : 'Processando Cofre...';

  const defaultMessage =
    mode === 'encrypt'
      ? 'Derivando chave AES-256 com PBKDF2 (100.000 iterações)...'
      : mode === 'decrypt'
      ? 'Verificando integridade MAC e autenticidade da senha...'
      : 'Executando algoritmos de cifra no cofre local...';

  const displayTitle = title || defaultTitle;
  const displayMessage = message || defaultMessage;
  const percentText =
    progress !== null && progress !== undefined
      ? `${Math.min(100, Math.round(progress * 100))}%`
      : null;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.cardContainer}>
          {/* Animated Glow Border Header */}
          <Animated.View style={[styles.glowRing, { opacity: pulseAnim }]}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              {mode === 'encrypt' ? (
                <Shield size={36} color="#06B6D4" />
              ) : mode === 'decrypt' ? (
                <KeyRound size={36} color="#06B6D4" />
              ) : (
                <Lock size={36} color="#06B6D4" />
              )}
            </Animated.View>
          </Animated.View>

          {/* Title & Status Message */}
          <Text style={styles.titleText}>{displayTitle}</Text>
          <Text style={styles.messageText}>{displayMessage}</Text>

          {/* Dynamic Animated Progress Bar */}
          <View style={styles.progressBarBackground}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressWidth,
                },
              ]}
            />
          </View>

          {percentText ? (
            <Text style={styles.progressPercentText}>{percentText}</Text>
          ) : null}

          {/* High-Tech Security Indicators */}
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Cpu size={12} color="#06B6D4" style={{ marginRight: 4 }} />
              <Text style={styles.badgeText}>PBKDF2 100k</Text>
            </View>

            <View style={styles.badge}>
              <ShieldCheck size={12} color="#10B981" style={{ marginRight: 4 }} />
              <Text style={styles.badgeText}>AES-256-GCM</Text>
            </View>

            <View style={styles.badge}>
              <Lock size={12} color="#F59E0B" style={{ marginRight: 4 }} />
              <Text style={styles.badgeText}>CSPRNG</Text>
            </View>
          </View>

          <Text style={styles.footerNote}>
            🔒 Proteção de Memória Ativa • 100% Offline
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 15, 25, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#151D2A',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(6, 182, 212, 0.4)',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  glowRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(6, 182, 212, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 6,
  },
  messageText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  progressBarBackground: {
    width: '100%',
    height: 6,
    backgroundColor: '#0B0F19',
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#06B6D4',
    borderRadius: 3,
  },
  progressPercentText: {
    color: '#06B6D4',
    fontSize: 13,
    fontWeight: '800',
    marginTop: -10,
    marginBottom: 14,
    fontFamily: 'monospace',
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B0F19',
    borderColor: '#1E293B',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '700',
  },
  footerNote: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
});
