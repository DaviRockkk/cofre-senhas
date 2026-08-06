import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

import { Category, CredentialItem, DEFAULT_CATEGORIES } from '../types';
import {
  decryptCredentialPassword,
  encryptCredentialPassword,
} from '../services/cryptoService';
import {
  clearVaultData,
  createEncryptedBackupJSON,
  getCredentialItems,
  getStoredCategories,
  restoreEncryptedBackupJSON,
  saveCredentialItems,
  saveStoredCategories,
} from '../services/storageService';
import {
  checkBiometricAvailability,
  authenticateWithBiometrics,
  getBiometricEnabledPreference,
  setBiometricEnabledPreference,
} from '../services/biometricService';

interface VaultContextData {
  isLoading: boolean;
  isLocked: boolean;
  isBiometricSupported: boolean;
  isBiometricEnabled: boolean;
  biometricLabel: string;
  items: CredentialItem[];
  categories: string[];
  clipboardWipeTimer: number | null;
  
  unlockAppWithBiometrics: () => Promise<boolean>;
  toggleBiometricLock: (enabled: boolean) => Promise<void>;
  
  addCredentialItem: (data: {
    serviceName: string;
    username: string;
    passwordPlain: string;
    masterPassword: string;
    category: Category;
    url?: string;
    notes?: string;
  }) => Promise<boolean>;
  
  updateCredentialItem: (
    id: string,
    data: {
      serviceName: string;
      username: string;
      passwordPlain?: string;
      masterPassword?: string;
      category: Category;
      url?: string;
      notes?: string;
      isFavorite?: boolean;
    }
  ) => Promise<boolean>;
  
  deleteCredentialItem: (id: string) => Promise<boolean>;
  
  decryptPassword: (id: string, masterPassword: string) => Promise<{ success: boolean; password?: string; error?: string }>;
  copyPasswordToClipboard: (id: string, masterPassword: string) => Promise<{ success: boolean; error?: string }>;
  
  addCategory: (categoryName: string) => Promise<boolean>;
  deleteCategory: (categoryName: string) => Promise<boolean>;
  restoreDefaultCategories: () => Promise<void>;
  
  exportVaultBackup: () => Promise<string | null>;
  importVaultBackup: (jsonContent: string) => Promise<{ success: boolean; error?: string }>;
  wipeEntireVault: () => Promise<void>;
  
  toggleFavorite: (id: string) => Promise<void>;
}

const VaultContext = createContext<VaultContextData>({} as VaultContextData);

export const CLIPBOARD_CLEAR_DELAY_SECONDS = 60; // 60s auto-wipe clipboard (1 minuto)

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [isBiometricSupported, setIsBiometricSupported] = useState<boolean>(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState<boolean>(false);
  const [biometricLabel, setBiometricLabel] = useState<string>('Biometria');

  const [items, setItems] = useState<CredentialItem[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [clipboardWipeTimer, setClipboardWipeTimer] = useState<number | null>(null);
  
  const clipboardTimerRef = useRef<any>(null);
  const clipboardCountdownRef = useRef<any>(null);

  // Enable screen capture protection (FLAG_SECURE) on mobile platforms
  useEffect(() => {
    async function activateScreenProtection() {
      if (Platform.OS !== 'web') {
        try {
          await ScreenCapture.preventScreenCaptureAsync();
        } catch (err) {
          // Ignored on platforms without screen capture support
        }
      }
    }
    activateScreenProtection();
  }, []);

  // Load items, categories, and biometric preferences on launch
  useEffect(() => {
    async function loadVault() {
      setIsLoading(true);
      try {
        const storedItems = await getCredentialItems();
        const storedCats = await getStoredCategories();
        setItems(storedItems);
        setCategories(storedCats);

        // Check biometric availability and preference
        const bioStatus = await checkBiometricAvailability();
        const bioEnabled = await getBiometricEnabledPreference();

        setIsBiometricSupported(bioStatus.isAvailable);
        setBiometricLabel(bioStatus.label);
        setIsBiometricEnabled(bioEnabled);

        // Lock app if biometric is supported and enabled
        if (bioStatus.isAvailable && bioEnabled) {
          setIsLocked(true);
        } else {
          setIsLocked(false);
        }
      } catch (e) {
        console.error('Error loading vault data:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadVault();
  }, []);

  // Lock app automatically when app is backgrounded or inactive
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        if (isBiometricSupported && isBiometricEnabled) {
          setIsLocked(true);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isBiometricSupported, isBiometricEnabled]);

  const unlockAppWithBiometrics = async (): Promise<boolean> => {
    if (!isBiometricSupported || !isBiometricEnabled) {
      setIsLocked(false);
      return true;
    }
    const result = await authenticateWithBiometrics('Autentique com biometria para acessar o Null');
    if (result.success) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const toggleBiometricLock = async (enabled: boolean): Promise<void> => {
    await setBiometricEnabledPreference(enabled);
    setIsBiometricEnabled(enabled);
    if (!enabled) {
      setIsLocked(false);
    }
  };

  // Category Management
  const addCategory = async (categoryName: string): Promise<boolean> => {
    const trimmed = categoryName.trim();
    if (!trimmed) return false;
    if (categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) return false;

    const updated = [...categories, trimmed];
    await saveStoredCategories(updated);
    setCategories(updated);
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) {}
    return true;
  };

  const deleteCategory = async (categoryName: string): Promise<boolean> => {
    if (categories.length <= 1) return false;

    const updatedCategories = categories.filter(c => c !== categoryName);
    await saveStoredCategories(updatedCategories);
    setCategories(updatedCategories);

    const fallbackCategory = updatedCategories.includes('Outros') ? 'Outros' : updatedCategories[0];
    const updatedItems = items.map(item => {
      if (item.category === categoryName) {
        return { ...item, category: fallbackCategory };
      }
      return item;
    });

    await saveCredentialItems(updatedItems);
    setItems(updatedItems);
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (_) {}
    return true;
  };

  const restoreDefaultCategories = async (): Promise<void> => {
    await saveStoredCategories(DEFAULT_CATEGORIES);
    setCategories(DEFAULT_CATEGORIES);
    try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (_) {}
  };

  // Add item encrypted with item master password
  const addCredentialItem = async (data: {
    serviceName: string;
    username: string;
    passwordPlain: string;
    masterPassword: string;
    category: Category;
    url?: string;
    notes?: string;
  }): Promise<boolean> => {
    try {
      const encrypted = await encryptCredentialPassword(data.passwordPlain, data.masterPassword);
      
      const newItem: CredentialItem = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
        serviceName: data.serviceName.trim(),
        username: data.username.trim(),
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        salt: encrypted.salt,
        iterations: encrypted.iterations,
        category: data.category,
        url: data.url?.trim(),
        notes: data.notes?.trim(),
        isFavorite: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const updatedList = [newItem, ...items];
      await saveCredentialItems(updatedList);
      setItems(updatedList);
      
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (_) {}
      return true;
    } catch (err) {
      console.error('Error adding item:', err);
      return false;
    }
  };

  // Update item
  const updateCredentialItem = async (
    id: string,
    data: {
      serviceName: string;
      username: string;
      passwordPlain?: string;
      masterPassword?: string;
      category: Category;
      url?: string;
      notes?: string;
      isFavorite?: boolean;
    }
  ): Promise<boolean> => {
    try {
      const targetIndex = items.findIndex(i => i.id === id);
      if (targetIndex === -1) return false;

      const existing = items[targetIndex];
      let ciphertext = existing.ciphertext;
      let iv = existing.iv;
      let authTag = existing.authTag;
      let salt = existing.salt;
      let iterations = existing.iterations;

      if (data.passwordPlain && data.masterPassword) {
        const encrypted = await encryptCredentialPassword(data.passwordPlain, data.masterPassword);
        ciphertext = encrypted.ciphertext;
        iv = encrypted.iv;
        authTag = encrypted.authTag;
        salt = encrypted.salt;
        iterations = encrypted.iterations;
      }

      const updatedItem: CredentialItem = {
        ...existing,
        serviceName: data.serviceName.trim(),
        username: data.username.trim(),
        ciphertext,
        iv,
        authTag,
        salt,
        iterations,
        category: data.category,
        url: data.url?.trim(),
        notes: data.notes?.trim(),
        isFavorite: data.isFavorite !== undefined ? data.isFavorite : existing.isFavorite,
        updatedAt: Date.now(),
      };

      const updatedList = [...items];
      updatedList[targetIndex] = updatedItem;

      await saveCredentialItems(updatedList);
      setItems(updatedList);
      
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (_) {}
      return true;
    } catch (err) {
      console.error('Error updating item:', err);
      return false;
    }
  };

  // Delete item
  const deleteCredentialItem = async (id: string): Promise<boolean> => {
    const updatedList = items.filter(i => i.id !== id);
    await saveCredentialItems(updatedList);
    setItems(updatedList);

    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch (_) {}
    return true;
  };

  // Decrypt password on demand with provided Master Password
  const decryptPassword = async (
    id: string,
    masterPassword: string
  ): Promise<{ success: boolean; password?: string; error?: string }> => {
    const item = items.find(i => i.id === id);
    if (!item) return { success: false, error: 'Acesso não encontrado.' };

    try {
      const decrypted = await decryptCredentialPassword(
        item.ciphertext,
        item.iv,
        item.authTag,
        item.salt,
        item.iterations,
        masterPassword
      );

      return { success: true, password: decrypted };
    } catch (err: any) {
      return { success: false, error: 'Senha Mestre incorreta. Não foi possível descriptografar.' };
    }
  };

  // Copy password with 60-second auto-clear timer
  const copyPasswordToClipboard = async (
    id: string,
    masterPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    const res = await decryptPassword(id, masterPassword);
    if (!res.success || !res.password) {
      return { success: false, error: res.error || 'Falha na descriptografia.' };
    }

    await Clipboard.setStringAsync(res.password);
    try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (_) {}

    if (clipboardTimerRef.current) clearTimeout(clipboardTimerRef.current);
    if (clipboardCountdownRef.current) clearInterval(clipboardCountdownRef.current);

    let remainingSeconds = CLIPBOARD_CLEAR_DELAY_SECONDS;
    setClipboardWipeTimer(remainingSeconds);

    clipboardCountdownRef.current = setInterval(() => {
      remainingSeconds -= 1;
      if (remainingSeconds <= 0) {
        if (clipboardCountdownRef.current) clearInterval(clipboardCountdownRef.current);
        setClipboardWipeTimer(null);
      } else {
        setClipboardWipeTimer(remainingSeconds);
      }
    }, 1000);

    clipboardTimerRef.current = setTimeout(async () => {
      try {
        await Clipboard.setStringAsync('');
      } catch (_) {}
      setClipboardWipeTimer(null);
    }, CLIPBOARD_CLEAR_DELAY_SECONDS * 1000);

    return { success: true };
  };

  // Backup & Restore
  const exportVaultBackup = async (): Promise<string | null> => {
    return await createEncryptedBackupJSON();
  };

  const importVaultBackup = async (
    jsonContent: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const restored = await restoreEncryptedBackupJSON(jsonContent);
      await saveCredentialItems(restored.items);
      setItems(restored.items);

      if (restored.categories && restored.categories.length > 0) {
        await saveStoredCategories(restored.categories);
        setCategories(restored.categories);
      }

      try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (_) {}
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao restaurar o backup.' };
    }
  };

  const wipeEntireVault = async (): Promise<void> => {
    await clearVaultData();
    setItems([]);
    setCategories(DEFAULT_CATEGORIES);
  };

  const toggleFavorite = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (item) {
      await updateCredentialItem(id, {
        serviceName: item.serviceName,
        username: item.username,
        category: item.category,
        url: item.url,
        notes: item.notes,
        isFavorite: !item.isFavorite,
      });
    }
  };

  return (
    <VaultContext.Provider
      value={{
        isLoading,
        isLocked,
        isBiometricSupported,
        isBiometricEnabled,
        biometricLabel,
        items,
        categories,
        clipboardWipeTimer,
        unlockAppWithBiometrics,
        toggleBiometricLock,
        addCredentialItem,
        updateCredentialItem,
        deleteCredentialItem,
        decryptPassword,
        copyPasswordToClipboard,
        addCategory,
        deleteCategory,
        restoreDefaultCategories,
        exportVaultBackup,
        importVaultBackup,
        wipeEntireVault,
        toggleFavorite,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => useContext(VaultContext);