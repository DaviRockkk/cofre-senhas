import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Sparkles, Eye, EyeOff, Lock, User, Globe2, Key } from 'lucide-react-native';
import { Category, CredentialItem } from '../types';
import { useVault } from '../context/VaultContext';
import { GeneratorModal } from './GeneratorModal';

interface CredentialModalProps {
  visible: boolean;
  itemToEdit?: CredentialItem | null;
  onClose: () => void;
}

export const CredentialModal: React.FC<CredentialModalProps> = ({
  visible,
  itemToEdit,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const { addCredentialItem, updateCredentialItem, categories } = useVault();

  const [serviceName, setServiceName] = useState('');
  const [username, setUsername] = useState('');
  const [passwordPlain, setPasswordPlain] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [category, setCategory] = useState<Category>('Outros');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showMasterPassword, setShowMasterPassword] = useState(false);
  const [generatorVisible, setGeneratorVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (itemToEdit) {
      setServiceName(itemToEdit.serviceName);
      setUsername(itemToEdit.username);
      setCategory(itemToEdit.category);
      setUrl(itemToEdit.url || '');
      setNotes(itemToEdit.notes || '');
      setPasswordPlain('');
      setMasterPassword('');
    } else {
      setServiceName('');
      setUsername('');
      setPasswordPlain('');
      setMasterPassword('');
      setCategory(categories[0] || 'Outros');
      setUrl('');
      setNotes('');
    }
  }, [visible, itemToEdit, categories]);

  const handleClose = () => {
    setPasswordPlain('');
    setMasterPassword('');
    onClose();
  };

  const handleSave = async () => {
    if (!serviceName.trim()) {
      Alert.alert('Campo Obrigatório', 'Informe o Nome do Serviço (ex: Nubank).');
      return;
    }
    if (!itemToEdit && !passwordPlain) {
      Alert.alert('Campo Obrigatório', 'Informe a Senha do Acesso.');
      return;
    }
    if (!itemToEdit && !masterPassword) {
      Alert.alert('Campo Obrigatório', 'Informe a Senha Mestre que será usada para derivar a chave de criptografia AES-256 deste acesso.');
      return;
    }

    setIsSubmitting(true);

    let ok = false;
    if (itemToEdit) {
      ok = await updateCredentialItem(itemToEdit.id, {
        serviceName,
        username,
        passwordPlain: passwordPlain || undefined,
        masterPassword: masterPassword || undefined,
        category,
        url,
        notes,
      });
    } else {
      ok = await addCredentialItem({
        serviceName,
        username,
        passwordPlain,
        masterPassword,
        category,
        url,
        notes,
      });
    }

    setIsSubmitting(false);

    if (ok) {
      handleClose();
    } else {
      Alert.alert('Erro', 'Não foi possível criptografar e salvar a credencial.');
    }
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>
                {itemToEdit ? 'Editar Acesso' : 'Novo Acesso Criptografado'}
              </Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <X size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formContent}>
              {/* Service Name */}
              <Text style={styles.label}>Nome do Serviço *</Text>
              <View style={styles.inputWrapper}>
                <Globe2 size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Nubank, Instagram, Google..."
                  placeholderTextColor="#64748B"
                  value={serviceName}
                  onChangeText={setServiceName}
                />
              </View>

              {/* Username */}
              <Text style={styles.label}>Usuário / Email / Login (Opcional)</Text>
              <View style={styles.inputWrapper}>
                <User size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ex: usuario@email.com..."
                  placeholderTextColor="#64748B"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>

              {/* Password */}
              <View style={styles.passwordHeaderRow}>
                <Text style={styles.label}>Senha do Acesso *</Text>
                <TouchableOpacity
                  style={styles.generateButton}
                  onPress={() => setGeneratorVisible(true)}
                >
                  <Sparkles size={14} color="#06B6D4" style={{ marginRight: 4 }} />
                  <Text style={styles.generateButtonText}>Gerar Senha</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputWrapper}>
                <Lock size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={itemToEdit ? 'Manter senha atual...' : 'Ex: avJ=IXDq5KWA%A-['}
                  placeholderTextColor="#64748B"
                  secureTextEntry={!showPassword}
                  value={passwordPlain}
                  onChangeText={setPasswordPlain}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#94A3B8" />
                  ) : (
                    <Eye size={18} color="#94A3B8" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Master Password for this item */}
              <Text style={styles.label}>Senha Mestre para Criptografar (AES-256) *</Text>
              <View style={styles.inputWrapper}>
                <Key size={18} color="#06B6D4" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Senha mestre usada para criptografar este item..."
                  placeholderTextColor="#64748B"
                  secureTextEntry={!showMasterPassword}
                  value={masterPassword}
                  onChangeText={setMasterPassword}
                  autoCapitalize="none"
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
              <Text style={styles.helperText}>
                💡 Esta Senha Mestre será exigida para descriptografar este acesso no futuro.
              </Text>

              {/* Dynamic Category selector */}
              <Text style={styles.label}>Categoria</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryChips}
              >
                {categories.map((cat) => {
                  const selected = category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.chip,
                        selected && styles.chipSelected,
                      ]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* URL */}
              <Text style={styles.label}>Link / URL (Opcional)</Text>
              <View style={styles.inputWrapper}>
                <Globe2 size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="https://..."
                  placeholderTextColor="#64748B"
                  value={url}
                  onChangeText={setUrl}
                  autoCapitalize="none"
                />
              </View>

              {/* Submit */}
              <TouchableOpacity
                style={[styles.saveButton, isSubmitting && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={isSubmitting}
              >
                <Text style={styles.saveButtonText}>
                  {itemToEdit ? 'Salvar Alterações' : 'Criptografar (AES-256) e Salvar'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Embedded CSPRNG Generator */}
      <GeneratorModal
        visible={generatorVisible}
        isNested={true}
        onClose={() => setGeneratorVisible(false)}
        onSelectPassword={(genPassword) => {
          setPasswordPlain(genPassword);
          setShowPassword(true);
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#151D2A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  closeButton: {
    padding: 4,
  },
  formContent: {
    padding: 20,
    gap: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
    marginTop: 4,
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
    height: 46,
    color: '#F8FAFC',
    fontSize: 14,
  },
  eyeButton: {
    padding: 6,
  },
  helperText: {
    fontSize: 11,
    color: '#06B6D4',
    marginTop: -4,
  },
  passwordHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  generateButtonText: {
    color: '#06B6D4',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryChips: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#0B0F19',
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipSelected: {
    backgroundColor: '#06B6D4',
    borderColor: '#06B6D4',
  },
  chipText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#0F172A',
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: '#06B6D4',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
});