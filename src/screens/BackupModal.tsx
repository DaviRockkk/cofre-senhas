import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Download, Upload, ShieldCheck, Share2, Copy, Trash2, FileText, FolderOpen, Clipboard as ClipboardIcon } from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { useVault } from '../context/VaultContext';

interface BackupModalProps {
  visible: boolean;
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const { exportVaultBackup, importVaultBackup, wipeEntireVault } = useVault();

  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [backupJSON, setBackupJSON] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);

  // Import states
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleGenerateBackup = async (): Promise<string | null> => {
    if (backupJSON) return backupJSON;
    setIsExporting(true);
    const json = await exportVaultBackup();
    setIsExporting(false);
    if (json) {
      setBackupJSON(json);
      return json;
    } else {
      Alert.alert('Erro', 'Não foi possível gerar o backup.');
      return null;
    }
  };

  useEffect(() => {
    if (visible && activeTab === 'export' && !backupJSON) {
      handleGenerateBackup();
    }
  }, [visible, activeTab]);

  // Share file to WhatsApp, Google Drive, Files, etc.
  const handleShareFile = async () => {
    const jsonContent = await handleGenerateBackup();
    if (!jsonContent) return;

    try {
      const filename = `Null_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
      const fileUri = `${baseDir}${filename}`;
      
      await FileSystem.writeAsStringAsync(fileUri, jsonContent, {
        encoding: FileSystem.EncodingType?.UTF8 || 'utf8',
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Enviar / Salvar Backup',
          UTI: 'public.json',
        });
      } else {
        Alert.alert('Sucesso', 'Arquivo de backup gerado com sucesso.');
      }
    } catch (err) {
      console.error('Erro ao compartilhar backup:', err);
      Alert.alert('Erro', 'Falha ao exportar arquivo de backup.');
    }
  };

  // Copy raw JSON text to clipboard
  const handleCopyJSON = async () => {
    const jsonContent = await handleGenerateBackup();
    if (!jsonContent) return;

    await Clipboard.setStringAsync(jsonContent);
    setCopiedBackup(true);
    try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (_) {}
    setTimeout(() => setCopiedBackup(false), 2000);
  };

  // Pick backup file from Google Drive, WhatsApp, Files, Downloads
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        let fileContent = '';

        try {
          fileContent = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType?.UTF8 || 'utf8',
          });
        } catch (readErr) {
          console.warn('readAsStringAsync falhou, tentando fallback com fetch:', readErr);
          const response = await fetch(fileUri);
          fileContent = await response.text();
        }

        if (!fileContent) {
          throw new Error('Conteúdo do arquivo veio vazio.');
        }
        
        setImportText(fileContent);
        try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (_) {}
        Alert.alert('Arquivo Selecionado', `Arquivo "${result.assets[0].name}" carregado com sucesso. Clique em "Validar e Restaurar" para concluir.`);
      }
    } catch (err) {
      console.error('Erro ao escolher arquivo:', err);
      Alert.alert('Erro', 'Não foi possível ler o arquivo selecionado.');
    }
  };

  // Paste from clipboard button
  const handlePasteClipboard = async () => {
    const text = await Clipboard.getStringAsync();
    if (text && text.trim()) {
      setImportText(text.trim());
      try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (_) {}
    } else {
      Alert.alert('Atenção', 'Nenhum texto encontrado na área de transferência.');
    }
  };

  const handleRestore = async () => {
    if (!importText.trim()) {
      Alert.alert('Atenção', 'Cole o conteúdo do backup ou selecione um arquivo .json.');
      return;
    }

    setIsImporting(true);

    setTimeout(async () => {
      const res = await importVaultBackup(importText);
      setIsImporting(false);

      if (res.success) {
        Alert.alert('Sucesso!', 'Backup restaurado e cofre atualizado com sucesso.', [
          { text: 'OK', onPress: onClose },
        ]);
      } else {
        Alert.alert('Erro na Restauração', res.error || 'Não foi possível restaurar o backup.');
      }
    }, 100);
  };

  const handleWipeVault = () => {
    Alert.alert(
      '⚠️ APAGAR TODO O COFRE',
      'Tem certeza absoluta de que deseja apagar todos os acessos locais? Esta ação é irreversível.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, Apagar Tudo',
          style: 'destructive',
          onPress: async () => {
            await wipeEntireVault();
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Backup & Restauração Offline</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Segmented Control Tabs */}
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[styles.segmentBtn, activeTab === 'export' && styles.segmentBtnActive]}
              onPress={() => setActiveTab('export')}
            >
              <Download size={16} color={activeTab === 'export' ? '#0F172A' : '#94A3B8'} style={{ marginRight: 6 }} />
              <Text style={[styles.segmentText, activeTab === 'export' && styles.segmentTextActive]}>Exportar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, activeTab === 'import' && styles.segmentBtnActive]}
              onPress={() => setActiveTab('import')}
            >
              <Upload size={16} color={activeTab === 'import' ? '#0F172A' : '#94A3B8'} style={{ marginRight: 6 }} />
              <Text style={[styles.segmentText, activeTab === 'import' && styles.segmentTextActive]}>Restaurar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {activeTab === 'export' ? (
              <View style={styles.tabContent}>
                <View style={styles.infoBox}>
                  <ShieldCheck size={24} color="#10B981" style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoTitle}>Massa de Dados Criptografada</Text>
                    <Text style={styles.infoDesc}>
                      O backup é 100% criptografado. Você pode enviar para o Google Drive, WhatsApp, Email ou salvar nos seus arquivos com total segurança.
                    </Text>
                  </View>
                </View>

                {/* Export Destination Buttons */}
                <Text style={styles.sectionLabel}>Escolha para onde deseja exportar:</Text>
                
                <TouchableOpacity
                  style={styles.channelButtonPrimary}
                  onPress={handleShareFile}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <ActivityIndicator color="#0F172A" />
                  ) : (
                    <>
                      <Share2 size={18} color="#0F172A" style={{ marginRight: 8 }} />
                      <Text style={styles.channelButtonPrimaryText}>
                        Enviar Arquivo .JSON
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.channelButtonSecondary}
                  onPress={handleCopyJSON}
                  disabled={isExporting}
                >
                  <Copy size={18} color="#F8FAFC" style={{ marginRight: 8 }} />
                  <Text style={styles.channelButtonSecondaryText}>
                    {copiedBackup ? 'Texto Criptografado Copiado!' : 'Copiar Texto do Backup'}
                  </Text>
                </TouchableOpacity>

                {backupJSON && (
                  <View style={styles.exportedContainer}>
                    <Text style={styles.jsonLabel}>Prévia do Payload Criptografado:</Text>
                    <ScrollView style={styles.jsonBox} nestedScrollEnabled>
                      <Text style={styles.jsonText}>{backupJSON}</Text>
                    </ScrollView>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.tabContent}>
                <View style={styles.infoBox}>
                  <ShieldCheck size={24} color="#06B6D4" style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.infoTitle, { color: '#06B6D4' }]}>Restaurar Acessos</Text>
                    <Text style={styles.infoDesc}>
                      Escolha um arquivo de backup .json do seu dispositivo/Google Drive ou cole o texto criptografado.
                    </Text>
                  </View>
                </View>

                {/* Import Destination Buttons */}
                <Text style={styles.sectionLabel}>Escolha de onde deseja importar:</Text>

                <TouchableOpacity
                  style={styles.channelButtonPrimary}
                  onPress={handlePickDocument}
                >
                  <FolderOpen size={18} color="#0F172A" style={{ marginRight: 8 }} />
                  <Text style={styles.channelButtonPrimaryText}>
                    Buscar Arquivo .JSON
                  </Text>
                </TouchableOpacity>

                <View style={styles.pasteHeaderRow}>
                  <Text style={styles.inputLabel}>Ou cole o texto do Backup:</Text>
                  <TouchableOpacity style={styles.pasteClipboardBtn} onPress={handlePasteClipboard}>
                    <ClipboardIcon size={12} color="#06B6D4" style={{ marginRight: 4 }} />
                    <Text style={styles.pasteClipboardText}>Colar da Área de Transferência</Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.textArea}
                  placeholder="Cole aqui o conteúdo JSON do backup..."
                  placeholderTextColor="#64748B"
                  multiline
                  value={importText}
                  onChangeText={setImportText}
                />

                <TouchableOpacity
                  style={[styles.actionButton, { marginTop: 12 }, isImporting && { opacity: 0.7 }]}
                  onPress={handleRestore}
                  disabled={isImporting}
                >
                  {isImporting ? (
                    <ActivityIndicator color="#0F172A" />
                  ) : (
                    <>
                      <Upload size={18} color="#0F172A" style={{ marginRight: 8 }} />
                      <Text style={styles.actionButtonText}>Validar e Restaurar Backup</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Danger Zone */}
            <View style={styles.dangerZone}>
              <Text style={styles.dangerTitle}>Zona de Perigo</Text>
              <TouchableOpacity style={styles.dangerButton} onPress={handleWipeVault}>
                <Trash2 size={16} color="#EF4444" style={{ marginRight: 8 }} />
                <Text style={styles.dangerButtonText}>Resetar / Apagar Cofre Local</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
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
  segmentedControl: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#0B0F19',
    borderRadius: 10,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#06B6D4',
  },
  segmentText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 14,
  },
  segmentTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  body: {
    padding: 20,
  },
  tabContent: {
    gap: 12,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  infoTitle: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 2,
  },
  infoDesc: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 16,
  },
  sectionLabel: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  channelButtonPrimary: {
    backgroundColor: '#06B6D4',
    minHeight: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  channelButtonPrimaryText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
  },
  channelButtonSecondary: {
    backgroundColor: '#1E293B',
    minHeight: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  channelButtonSecondaryText: {
    color: '#F8FAFC',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  exportedContainer: {
    marginTop: 8,
    gap: 8,
  },
  jsonLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  jsonBox: {
    maxHeight: 120,
    backgroundColor: '#0B0F19',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 10,
  },
  jsonText: {
    color: '#06B6D4',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  pasteHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  inputLabel: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
  },
  pasteClipboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pasteClipboardText: {
    color: '#06B6D4',
    fontSize: 11,
    fontWeight: '600',
  },
  textArea: {
    backgroundColor: '#0B0F19',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 12,
    color: '#F8FAFC',
    height: 100,
    textAlignVertical: 'top',
    fontSize: 13,
  },
  actionButton: {
    backgroundColor: '#06B6D4',
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 15,
  },
  dangerZone: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  dangerTitle: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderRadius: 10,
    height: 44,
  },
  dangerButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
});