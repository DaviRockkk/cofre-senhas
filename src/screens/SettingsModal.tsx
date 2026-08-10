import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Plus,
  Trash2,
  RotateCcw,
  FolderPlus,
  Download,
  ShieldCheck,
  Settings,
  Fingerprint,
  Info,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react-native';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import { useVault } from '../context/VaultContext';
import { BackupModal } from './BackupModal';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const {
    categories,
    addCategory,
    deleteCategory,
    restoreDefaultCategories,
    isBiometricSupported,
    isBiometricEnabled,
    biometricLabel,
    toggleBiometricLock,
  } = useVault();

  const [newCategoryName, setNewCategoryName] = useState('');
  const [backupModalVisible, setBackupModalVisible] = useState(false);

  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [newUpdateMessage, setNewUpdateMessage] = useState<string | null>(null);

  const currentVersion = Constants.expoConfig?.version ?? '1.0.0';
  const currentChannel = Updates.channel ?? 'preview';
  const currentUpdateMessage = (Updates.manifest as any)?.message ?? 'Versão inicial (APK Base)';

  const handleCheckForUpdates = async () => {
    setCheckingUpdates(true);
    try {
      if (__DEV__) {
        Alert.alert('Modo Desenvolvedor', 'A verificação de atualizações OTA (EAS Update) está desativada no ambiente de desenvolvimento.');
        setCheckingUpdates(false);
        return;
      }

      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        const fetched = await Updates.fetchUpdateAsync();
        const message = (fetched.manifest as any)?.message || 'Nova atualização baixada com sucesso!';
        setNewUpdateMessage(message);
        setUpdateAvailable(true);
        Alert.alert(
          '🎉 Nova Atualização Baixada!',
          `O que há de novo:\n\n${message}\n\nClique no botão "Reiniciar e Aplicar" para usar a nova versão.`
        );
      } else {
        Alert.alert('Você já está atualizado', 'Nenhuma nova atualização encontrada para este aplicativo.');
      }
    } catch (error: any) {
      Alert.alert('Erro ao buscar atualização', error.message || 'Não foi possível conectar ao servidor de atualizações.');
    } finally {
      setCheckingUpdates(false);
    }
  };

  const handleApplyUpdate = async () => {
    try {
      await Updates.reloadAsync();
    } catch (error: any) {
      Alert.alert('Erro ao reiniciar', error.message || 'Não foi possível reiniciar o aplicativo.');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Atenção', 'Informe o nome da nova categoria.');
      return;
    }

    const ok = await addCategory(newCategoryName);
    if (ok) {
      setNewCategoryName('');
    } else {
      Alert.alert('Atenção', 'A categoria já existe ou o nome é inválido.');
    }
  };

  const handleDeleteCategory = (catName: string) => {
    if (categories.length <= 1) {
      Alert.alert('Atenção', 'É necessário manter ao menos uma categoria.');
      return;
    }

    Alert.alert(
      'Excluir Categoria',
      `Deseja excluir a categoria "${catName}"? Os acessos associados serão reatribuídos para "Outros".`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deleteCategory(catName),
        },
      ]
    );
  };

  const handleRestoreDefaults = () => {
    Alert.alert(
      'Restaurar Padrões',
      'Deseja restaurar a lista de categorias para o padrão do CofreZero?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restaurar',
          onPress: () => restoreDefaultCategories(),
        },
      ]
    );
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <Settings size={22} color="#06B6D4" style={{ marginRight: 8 }} />
                <Text style={styles.headerTitle}>Configurações do Cofre</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.body}>
              {/* Category Management Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <FolderPlus size={18} color="#06B6D4" style={{ marginRight: 6 }} />
                  <Text style={styles.sectionTitle}>Gerenciar Categorias</Text>
                </View>

                {/* Add Category Input */}
                <View style={styles.addCategoryRow}>
                  <TextInput
                    style={styles.categoryInput}
                    placeholder="Nova Categoria (ex: Jogos, Cripto)..."
                    placeholderTextColor="#64748B"
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                    onSubmitEditing={handleAddCategory}
                  />
                  <TouchableOpacity style={styles.addCategoryBtn} onPress={handleAddCategory}>
                    <Plus size={18} color="#0F172A" />
                  </TouchableOpacity>
                </View>

                {/* Categories List */}
                <View style={styles.categoriesList}>
                  {categories.map((cat) => (
                    <View key={cat} style={styles.categoryCard}>
                      <Text style={styles.categoryCardName}>{cat}</Text>
                      <TouchableOpacity
                        style={styles.deleteCategoryBtn}
                        onPress={() => handleDeleteCategory(cat)}
                      >
                        <Trash2 size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>

                {/* Restore Default Categories Button */}
                <TouchableOpacity
                  style={styles.restoreDefaultsBtn}
                  onPress={handleRestoreDefaults}
                >
                  <RotateCcw size={14} color="#06B6D4" style={{ marginRight: 6 }} />
                  <Text style={styles.restoreDefaultsText}>Restaurar Categorias Padrão</Text>
                </TouchableOpacity>
              </View>

              {/* Security & System Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Fingerprint size={18} color="#06B6D4" style={{ marginRight: 6 }} />
                  <Text style={styles.sectionTitle}>Segurança & Acesso</Text>
                </View>

                {/* Biometric Toggle Card */}
                <View style={styles.settingCard}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={styles.settingTitle}>Desbloqueio por Biometria</Text>
                    <Text style={styles.settingDesc}>
                      {isBiometricSupported
                        ? `Exigir ${biometricLabel} ao iniciar o app`
                        : 'Biometria nativa não disponível no aparelho'}
                    </Text>
                  </View>
                  <Switch
                    value={isBiometricEnabled}
                    onValueChange={(val) => {
                      if (!isBiometricSupported && val) {
                        Alert.alert('Indisponível', 'Nenhum sensor de biometria ativo foi detectado neste dispositivo.');
                        return;
                      }
                      toggleBiometricLock(val);
                    }}
                    disabled={!isBiometricSupported}
                    trackColor={{ false: '#334155', true: 'rgba(6, 182, 212, 0.4)' }}
                    thumbColor={isBiometricEnabled ? '#06B6D4' : '#94A3B8'}
                  />
                </View>

                {/* Backup Button */}
                <TouchableOpacity
                  style={styles.backupMenuBtn}
                  onPress={() => setBackupModalVisible(true)}
                >
                  <ShieldCheck size={20} color="#10B981" style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.backupMenuTitle}>Backup & Restauração Offline</Text>
                    <Text style={styles.backupMenuDesc}>Exportar ou importar payload AES-256</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Sobre & Atualizações Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Info size={18} color="#06B6D4" style={{ marginRight: 6 }} />
                  <Text style={styles.sectionTitle}>Sobre & Atualizações</Text>
                </View>

                <View style={styles.updateCard}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Versão do App:</Text>
                    <Text style={styles.infoValue}>v{currentVersion} ({currentChannel})</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Update Ativo:</Text>
                    <Text style={styles.infoMessage} numberOfLines={2}>
                      {currentUpdateMessage}
                    </Text>
                  </View>

                  {updateAvailable && (
                    <View style={styles.newUpdateBox}>
                      <CheckCircle2 size={16} color="#10B981" style={{ marginRight: 6 }} />
                      <Text style={styles.newUpdateText}>
                        Nova versão pronta: {newUpdateMessage}
                      </Text>
                    </View>
                  )}

                  {updateAvailable ? (
                    <TouchableOpacity style={styles.applyUpdateBtn} onPress={handleApplyUpdate}>
                      <Download size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.applyUpdateBtnText}>Reiniciar e Aplicar Atualização</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.checkUpdateBtn}
                      onPress={handleCheckForUpdates}
                      disabled={checkingUpdates}
                    >
                      {checkingUpdates ? (
                        <ActivityIndicator size="small" color="#06B6D4" />
                      ) : (
                        <>
                          <RefreshCw size={16} color="#06B6D4" style={{ marginRight: 8 }} />
                          <Text style={styles.checkUpdateBtnText}>Buscar Atualizações</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <BackupModal
        visible={backupModalVisible}
        onClose={() => setBackupModalVisible(false)}
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
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  addCategoryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#0B0F19',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    color: '#F8FAFC',
    fontSize: 14,
  },
  addCategoryBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#06B6D4',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesList: {
    gap: 8,
    marginTop: 4,
  },
  categoryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0B0F19',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  categoryCardName: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteCategoryBtn: {
    padding: 4,
  },
  restoreDefaultsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  restoreDefaultsText: {
    color: '#06B6D4',
    fontSize: 13,
    fontWeight: '600',
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0B0F19',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 14,
  },
  settingTitle: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 14,
  },
  settingDesc: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  backupMenuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B0F19',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 14,
  },
  backupMenuTitle: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 14,
  },
  backupMenuDesc: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  updateCard: {
    backgroundColor: '#0B0F19',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 14,
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    color: '#94A3B8',
    fontSize: 13,
  },
  infoValue: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
  },
  infoMessage: {
    color: '#06B6D4',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  newUpdateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  newUpdateText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  checkUpdateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  checkUpdateBtnText: {
    color: '#06B6D4',
    fontSize: 13,
    fontWeight: '600',
  },
  applyUpdateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  applyUpdateBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
