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
} from 'react-native';
import { X, Plus, Trash2, RotateCcw, FolderPlus, Download, ShieldCheck, Settings } from 'lucide-react-native';
import { useVault } from '../context/VaultContext';
import { BackupModal } from './BackupModal';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
  const { categories, addCategory, deleteCategory, restoreDefaultCategories } = useVault();

  const [newCategoryName, setNewCategoryName] = useState('');
  const [backupModalVisible, setBackupModalVisible] = useState(false);

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
          <View style={styles.modalContainer}>
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

              {/* Backup & System Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Download size={18} color="#06B6D4" style={{ marginRight: 6 }} />
                  <Text style={styles.sectionTitle}>Backup & Segurança</Text>
                </View>

                <TouchableOpacity
                  style={styles.backupMenuBtn}
                  onPress={() => setBackupModalVisible(true)}
                >
                  <ShieldCheck size={20} color="#10B981" style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.backupMenuTitle}>Backup & Restauração Offline</Text>
                    <Text style={styles.backupMenuDesc}>Exportar ou importar payload AES-256 (JSON)</Text>
                  </View>
                </TouchableOpacity>
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
});
