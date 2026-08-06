import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  StatusBar,
} from 'react-native';
import {
  Shield,
  Search,
  Plus,
  Lock,
  Edit2,
  Trash2,
  Star,
  Settings,
  WifiOff,
  Sparkles,
  ExternalLink,
  Clock,
  ShieldCheck,
  KeyRound,
} from 'lucide-react-native';
import { Category, CredentialItem } from '../types';
import { useVault } from '../context/VaultContext';
import { CredentialModal } from './CredentialModal';
import { GeneratorModal } from './GeneratorModal';
import { BackupModal } from './BackupModal';
import { DecryptPromptModal } from './DecryptPromptModal';
import { SettingsModal } from './SettingsModal';

export const HomeScreen: React.FC = () => {
  const {
    items,
    categories,
    clipboardWipeTimer,
    deleteCredentialItem,
    toggleFavorite,
  } = useVault();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  // Modals state
  const [credentialModalVisible, setCredentialModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<CredentialItem | null>(null);
  const [generatorVisible, setGeneratorVisible] = useState(false);
  const [backupVisible, setBackupVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  
  // Decrypt Prompt Modal state
  const [decryptModalVisible, setDecryptModalVisible] = useState(false);
  const [selectedItemToDecrypt, setSelectedItemToDecrypt] = useState<CredentialItem | null>(null);

  // Dynamic filter chips: Todas, Favoritos, + dynamic categories
  const categoryFilters = useMemo(() => {
    return ['Todas', 'Favoritos', ...categories];
  }, [categories]);

  // Filtered credentials list
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCategory === 'Favoritos' && !item.isFavorite) return false;
      if (selectedCategory !== 'Todas' && selectedCategory !== 'Favoritos' && item.category !== selectedCategory) {
        return false;
      }

      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const nameMatch = item.serviceName.toLowerCase().includes(query);
        const userMatch = item.username.toLowerCase().includes(query);
        const categoryMatch = item.category.toLowerCase().includes(query);
        return nameMatch || userMatch || categoryMatch;
      }

      return true;
    });
  }, [items, searchQuery, selectedCategory]);

  const handleDelete = (item: CredentialItem) => {
    Alert.alert(
      'Excluir Acesso',
      `Deseja realmente remover o acesso "${item.serviceName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deleteCredentialItem(item.id),
        },
      ]
    );
  };

  const handleOpenDecryptModal = (item: CredentialItem) => {
    setSelectedItemToDecrypt(item);
    setDecryptModalVisible(true);
  };

  const handleEdit = (item: CredentialItem) => {
    setEditingItem(item);
    setCredentialModalVisible(true);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setCredentialModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />

      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        <View style={styles.titleContainer}>
          <Shield size={24} color="#06B6D4" style={{ marginRight: 8 }} />
          <Text style={styles.appTitle}>Null</Text>
          <View style={styles.offlineBadge}>
            <WifiOff size={10} color="#10B981" style={{ marginRight: 4 }} />
            <Text style={styles.offlineText}>100% Offline</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconHeaderBtn}
            onPress={() => setSettingsVisible(true)}
          >
            <Settings size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Clipboard Wipe Notification Banner */}
      {clipboardWipeTimer !== null && (
        <View style={styles.clipboardBanner}>
          <Clock size={16} color="#06B6D4" style={{ marginRight: 8 }} />
          <Text style={styles.clipboardBannerText}>
            Senha copiada! Limpando área de transferência em{' '}
            <Text style={{ fontWeight: '800', color: '#06B6D4' }}>{clipboardWipeTimer}s</Text>
          </Text>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchWrapper}>
          <Search size={18} color="#64748B" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por serviço, usuário ou categoria..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Category Chips */}
      <View style={styles.chipsContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categoryFilters}
          keyExtractor={(item: string) => item}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          renderItem={({ item }: { item: string }) => {
            const isSelected = selectedCategory === item;
            return (
              <TouchableOpacity
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => setSelectedCategory(item)}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Credentials List */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item: CredentialItem) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <ShieldCheck size={56} color="#1E293B" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>Nenhum Acesso Cadastrado</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Nenhum resultado corresponde à sua busca.'
                : 'Seu cofre está limpo. Clique em "+ Novo Acesso" para criar um acesso criptografado com AES-256.'}
            </Text>
          </View>
        }
        renderItem={({ item }: { item: CredentialItem }) => {
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleGroup}>
                  <Text style={styles.cardTitle}>{item.serviceName}</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{item.category}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => toggleFavorite(item.id)}
                  style={styles.starButton}
                >
                  <Star
                    size={18}
                    color={item.isFavorite ? '#F59E0B' : '#475569'}
                    fill={item.isFavorite ? '#F59E0B' : 'transparent'}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.cardUser}>{item.username}</Text>

              {/* Ciphertext AES-256 Box */}
              <View style={styles.ciphertextCardBox}>
                <View style={styles.ciphertextHeader}>
                  <Lock size={12} color="#06B6D4" style={{ marginRight: 4 }} />
                  <Text style={styles.ciphertextLabel}>Criptografado (AES-256-GCM):</Text>
                </View>
                <Text style={styles.ciphertextValue} numberOfLines={2}>
                  {item.ciphertext}
                </Text>
              </View>

              {/* Decrypt & Copy Action Button */}
              <TouchableOpacity
                style={styles.decryptActionBtn}
                onPress={() => handleOpenDecryptModal(item)}
              >
                <KeyRound size={16} color="#0F172A" style={{ marginRight: 6 }} />
                <Text style={styles.decryptActionText}>Descriptografar / Copiar Senha</Text>
              </TouchableOpacity>

              {/* URL if present */}
              {item.url ? (
                <View style={styles.urlRow}>
                  <ExternalLink size={12} color="#64748B" style={{ marginRight: 4 }} />
                  <Text style={styles.urlText} numberOfLines={1}>
                    {item.url}
                  </Text>
                </View>
              ) : null}

              {/* Card Footer Actions */}
              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={styles.footerActionBtn}
                  onPress={() => handleEdit(item)}
                >
                  <Edit2 size={14} color="#94A3B8" style={{ marginRight: 4 }} />
                  <Text style={styles.footerActionText}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.footerActionBtn}
                  onPress={() => handleDelete(item)}
                >
                  <Trash2 size={14} color="#EF4444" style={{ marginRight: 4 }} />
                  <Text style={[styles.footerActionText, { color: '#EF4444' }]}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* Bottom Floating Bar */}
      <View style={styles.floatingBar}>
        <TouchableOpacity
          style={styles.generatorFab}
          onPress={() => setGeneratorVisible(true)}
        >
          <Sparkles size={18} color="#06B6D4" />
          <Text style={styles.generatorFabText}>Gerador</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.addFab} onPress={handleAddNew}>
          <Plus size={20} color="#0F172A" />
          <Text style={styles.addFabText}>Novo Acesso</Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <CredentialModal
        visible={credentialModalVisible}
        itemToEdit={editingItem}
        onClose={() => setCredentialModalVisible(false)}
      />

      <DecryptPromptModal
        visible={decryptModalVisible}
        item={selectedItemToDecrypt}
        onClose={() => setDecryptModalVisible(false)}
      />

      <GeneratorModal
        visible={generatorVisible}
        onClose={() => setGeneratorVisible(false)}
      />

      <BackupModal
        visible={backupVisible}
        onClose={() => setBackupVisible(false)}
      />

      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    marginRight: 8,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  offlineText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconHeaderBtn: {
    width: 38,
    height: 38,
    backgroundColor: '#151D2A',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  clipboardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderWidth: 1,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 10,
    borderRadius: 10,
  },
  clipboardBannerText: {
    color: '#CBD5E1',
    fontSize: 12,
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151D2A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
  },
  chipsContainer: {
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#151D2A',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  chipSelected: {
    backgroundColor: '#06B6D4',
    borderColor: '#06B6D4',
  },
  chipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#0F172A',
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#151D2A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  cardTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  categoryBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    color: '#06B6D4',
    fontSize: 10,
    fontWeight: '600',
  },
  starButton: {
    padding: 4,
  },
  cardUser: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 10,
  },
  ciphertextCardBox: {
    backgroundColor: '#0B0F19',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 10,
  },
  ciphertextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ciphertextLabel: {
    color: '#06B6D4',
    fontSize: 11,
    fontWeight: '600',
  },
  ciphertextValue: {
    color: '#64748B',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  decryptActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#06B6D4',
    height: 42,
    borderRadius: 10,
    marginBottom: 10,
  },
  decryptActionText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 13,
  },
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  urlText: {
    color: '#64748B',
    fontSize: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  footerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerActionText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  floatingBar: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    flexDirection: 'row',
    gap: 12,
  },
  generatorFab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151D2A',
    borderColor: '#06B6D4',
    borderWidth: 1,
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 26,
    gap: 8,
  },
  generatorFabText: {
    color: '#06B6D4',
    fontWeight: '700',
    fontSize: 14,
  },
  addFab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#06B6D4',
    height: 52,
    borderRadius: 26,
    gap: 8,
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addFabText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 15,
  },
});