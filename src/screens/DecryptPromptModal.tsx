import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { X, Eye, EyeOff, Copy, CheckCircle2, ShieldCheck, Key } from 'lucide-react-native';
import { CredentialItem } from '../types';
import { useVault } from '../context/VaultContext';

interface DecryptPromptModalProps {
  visible: boolean;
  item: CredentialItem | null;
  onClose: () => void;
}

export const DecryptPromptModal: React.FC<DecryptPromptModalProps> = ({
  visible,
  item,
  onClose,
}) => {
  const { decryptPassword, copyPasswordToClipboard, copyPlainPasswordToClipboard } = useVault();

  const [masterPassword, setMasterPassword] = useState('');
  const [showMasterPassword, setShowMasterPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [decryptedPassword, setDecryptedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (visible) {
      setMasterPassword('');
      setErrorMessage(null);
      setDecryptedPassword(null);
      setCopied(false);
    }
  }, [visible, item]);

  const handleClose = () => {
    // Zero out memory state immediately on close
    setMasterPassword('');
    setDecryptedPassword(null);
    setErrorMessage(null);
    setCopied(false);
    onClose();
  };

  const handleDecryptView = async () => {
    if (!masterPassword) {
      setErrorMessage('Digite a Senha Mestre.');
      return;
    }
    if (!item) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    setTimeout(async () => {
      const res = await decryptPassword(item.id, masterPassword);
      setIsSubmitting(false);

      if (res.success && res.password) {
        setDecryptedPassword(res.password);
      } else {
        setErrorMessage(res.error || 'Senha Mestre incorreta.');
      }
    }, 50);
  };

  const handleDecryptCopy = async () => {
    if (!masterPassword) {
      setErrorMessage('Digite a Senha Mestre.');
      return;
    }
    if (!item) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    setTimeout(async () => {
      const res = await copyPasswordToClipboard(item.id, masterPassword);
      setIsSubmitting(false);

      if (res.success) {
        setCopied(true);
        setTimeout(() => {
          handleClose();
        }, 1200);
      } else {
        setErrorMessage(res.error || 'Senha Mestre incorreta.');
      }
    }, 50);
  };

  if (!item) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <ShieldCheck size={22} color="#06B6D4" style={{ marginRight: 8 }} />
              <Text style={styles.headerTitle}>Descriptografar Acesso</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <Text style={styles.serviceTitle}>{item.serviceName}</Text>
            <Text style={styles.usernameText}>{item.username}</Text>

            {!decryptedPassword ? (
              <>
                <Text style={styles.instruction}>
                  Insira a Senha Mestre definida no cadastro deste acesso para derivar a chave AES-256:
                </Text>

                <View style={styles.inputWrapper}>
                  <Key size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Senha Mestre do Acesso..."
                    placeholderTextColor="#64748B"
                    secureTextEntry={!showMasterPassword}
                    value={masterPassword}
                    onChangeText={(text: string) => {
                      setMasterPassword(text);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    autoCapitalize="none"
                    onSubmitEditing={handleDecryptView}
                  />
                  <TouchableOpacity
                    onPress={() => setShowMasterPassword(!showMasterPassword)}
                    style={styles.eyeButton}
                  >
                    {showMasterPassword ? (
                      <EyeOff size={18} color="#94A3B8" />
                    ) : (
                      <Eye size={18} color="#94A3B8" />
                    )}
                  </TouchableOpacity>
                </View>

                {errorMessage && (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                )}

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.viewButton, isSubmitting && { opacity: 0.7 }]}
                    onPress={handleDecryptView}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#F8FAFC" />
                    ) : (
                      <>
                        <Eye size={16} color="#F8FAFC" style={{ marginRight: 6 }} />
                        <Text style={styles.viewButtonText}>Visualizar</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.copyButton, isSubmitting && { opacity: 0.7 }]}
                    onPress={handleDecryptCopy}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#0F172A" />
                    ) : (
                      <>
                        {copied ? <CheckCircle2 size={16} color="#0F172A" style={{ marginRight: 6 }} /> : <Copy size={16} color="#0F172A" style={{ marginRight: 6 }} />}
                        <Text style={styles.copyButtonText}>{copied ? 'Copiado!' : 'Copiar'}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.revealedBox}>
                <Text style={styles.revealedLabel}>Senha Descriptografada em RAM:</Text>
                <Text style={styles.revealedPassword}>{decryptedPassword}</Text>
                
                <TouchableOpacity style={styles.copyDirectButton} onPress={async () => {
                  if (decryptedPassword) {
                    await copyPlainPasswordToClipboard(decryptedPassword);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}>
                  {copied ? <CheckCircle2 size={18} color="#0F172A" /> : <Copy size={18} color="#0F172A" />}
                  <Text style={styles.copyDirectText}>{copied ? 'Senha Copiada! (Timer de 60s ativo)' : 'Copiar para Área de Transferência'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.closeViewBtn} onPress={handleClose}>
                  <Text style={styles.closeViewText}>Fechar e Limpar Memória</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#151D2A',
    borderRadius: 20,
    borderColor: '#1E293B',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  closeButton: {
    padding: 4,
  },
  body: {
    padding: 20,
  },
  serviceTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#06B6D4',
    textAlign: 'center',
  },
  usernameText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 16,
  },
  instruction: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B0F19',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    color: '#F8FAFC',
    fontSize: 15,
  },
  eyeButton: {
    padding: 6,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  viewButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 14,
  },
  copyButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#06B6D4',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyButtonText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 14,
  },
  revealedBox: {
    alignItems: 'center',
    gap: 12,
  },
  revealedLabel: {
    color: '#94A3B8',
    fontSize: 12,
  },
  revealedPassword: {
    fontSize: 22,
    fontWeight: '800',
    color: '#06B6D4',
    fontFamily: 'monospace',
    letterSpacing: 1,
    backgroundColor: '#0B0F19',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#06B6D4',
    width: '100%',
    textAlign: 'center',
  },
  copyDirectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#06B6D4',
    height: 46,
    borderRadius: 10,
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 8,
    width: '100%',
    justifyContent: 'center',
  },
  copyDirectText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 13,
  },
  closeViewBtn: {
    paddingVertical: 8,
    marginTop: 4,
  },
  closeViewText: {
    color: '#64748B',
    fontSize: 13,
  },
});
