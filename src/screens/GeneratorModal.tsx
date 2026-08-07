import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ScrollView,
} from 'react-native';
import { X, Sparkles, Copy, CheckCircle2, RefreshCw, ShieldCheck } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { PasswordGeneratorConfig, SecurityScore } from '../types';
import { evaluatePasswordStrength, generateSecurePassword } from '../services/cryptoService';

interface GeneratorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPassword?: (password: string) => void;
  isNested?: boolean;
}

export const GeneratorModal: React.FC<GeneratorModalProps> = ({
  visible,
  onClose,
  onSelectPassword,
  isNested = false,
}) => {
  const [config, setConfig] = useState<PasswordGeneratorConfig>({
    length: 18,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
  });

  const [generatedPassword, setGeneratedPassword] = useState('');
  const [score, setScore] = useState<SecurityScore>({ bits: 0, label: 'Forte', color: '#10B981' });
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    try {
      const pass = generateSecurePassword(config);
      setGeneratedPassword(pass);
      setScore(evaluatePasswordStrength(pass));
      setCopied(false);
    } catch (err) {
      console.error('Error generating password:', err);
    }
  };

  useEffect(() => {
    if (visible) {
      handleGenerate();
    }
  }, [visible, config]);

  const handleCopy = async () => {
    if (!generatedPassword) return;
    await Clipboard.setStringAsync(generatedPassword);
    setCopied(true);
    try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (_) {}
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUse = () => {
    if (onSelectPassword && generatedPassword) {
      onSelectPassword(generatedPassword);
      onClose();
    }
  };

  if (!visible) return null;

  const content = (
    <View style={isNested ? styles.nestedOverlay : styles.modalOverlay}>
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Sparkles size={20} color="#06B6D4" style={{ marginRight: 8 }} />
            <Text style={styles.headerTitle}>Gerador de Senha CSPRNG</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
            {/* Generated Password Box */}
            <View style={styles.passwordDisplayBox}>
              <Text style={styles.passwordText}>{generatedPassword}</Text>
              
              <View style={styles.displayActions}>
                <TouchableOpacity style={styles.displayBtn} onPress={handleGenerate}>
                  <RefreshCw size={18} color="#06B6D4" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.displayBtn} onPress={handleCopy}>
                  {copied ? <CheckCircle2 size={18} color="#10B981" /> : <Copy size={18} color="#94A3B8" />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Strength Metric */}
            <View style={styles.strengthRow}>
              <ShieldCheck size={16} color={score.color} style={{ marginRight: 6 }} />
              <Text style={styles.strengthLabel}>Entropia: </Text>
              <Text style={[styles.strengthValue, { color: score.color }]}>
                {score.bits} bits ({score.label})
              </Text>
            </View>

            {/* Length Control */}
            <Text style={styles.sectionLabel}>Tamanho da Senha: {config.length} caracteres</Text>
            <View style={styles.lengthChipsRow}>
              {[12, 16, 20, 24, 32].map((len) => (
                <TouchableOpacity
                  key={len}
                  style={[styles.lengthChip, config.length === len && styles.lengthChipSelected]}
                  onPress={() => setConfig({ ...config, length: len })}
                >
                  <Text style={[styles.lengthChipText, config.length === len && styles.lengthChipTextSelected]}>
                    {len}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Character Set Toggles */}
            <View style={styles.togglesContainer}>
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Letras Maiúsculas (A-Z)</Text>
                <Switch
                  value={config.includeUppercase}
                  onValueChange={(val) => setConfig({ ...config, includeUppercase: val })}
                  trackColor={{ false: '#1E293B', true: '#06B6D4' }}
                />
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Letras Minúsculas (a-z)</Text>
                <Switch
                  value={config.includeLowercase}
                  onValueChange={(val) => setConfig({ ...config, includeLowercase: val })}
                  trackColor={{ false: '#1E293B', true: '#06B6D4' }}
                />
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Números (0-9)</Text>
                <Switch
                  value={config.includeNumbers}
                  onValueChange={(val) => setConfig({ ...config, includeNumbers: val })}
                  trackColor={{ false: '#1E293B', true: '#06B6D4' }}
                />
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Símbolos Especiais (!@#$%)</Text>
                <Switch
                  value={config.includeSymbols}
                  onValueChange={(val) => setConfig({ ...config, includeSymbols: val })}
                  trackColor={{ false: '#1E293B', true: '#06B6D4' }}
                />
              </View>
            </View>

            {/* Action Buttons */}
            {onSelectPassword ? (
              <TouchableOpacity style={styles.useButton} onPress={handleUse}>
                <Text style={styles.useButtonText}>Usar Esta Senha</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.useButton} onPress={handleCopy}>
                <Text style={styles.useButtonText}>{copied ? 'Senha Copiada!' : 'Copiar Senha'}</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    );

  if (isNested) {
    return content;
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      {content}
    </Modal>
  );
};

const styles = StyleSheet.create({
  nestedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
    zIndex: 9999,
    elevation: 9999,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#151D2A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    borderColor: '#1E293B',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  closeButton: {
    padding: 4,
  },
  body: {
    padding: 20,
    gap: 14,
  },
  passwordDisplayBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0B0F19',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#06B6D4',
    padding: 14,
  },
  passwordText: {
    flex: 1,
    color: '#06B6D4',
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 1,
    marginRight: 10,
  },
  displayActions: {
    flexDirection: 'row',
    gap: 12,
  },
  displayBtn: {
    padding: 4,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -4,
  },
  strengthLabel: {
    color: '#94A3B8',
    fontSize: 12,
  },
  strengthValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionLabel: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
  },
  lengthChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  lengthChip: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#0B0F19',
    borderColor: '#334155',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lengthChipSelected: {
    backgroundColor: '#06B6D4',
    borderColor: '#06B6D4',
  },
  lengthChipText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  lengthChipTextSelected: {
    color: '#0F172A',
    fontWeight: '800',
  },
  togglesContainer: {
    backgroundColor: '#0B0F19',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginTop: 6,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  toggleLabel: {
    color: '#E2E8F0',
    fontSize: 13,
  },
  useButton: {
    backgroundColor: '#06B6D4',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  useButtonText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 15,
  },
});