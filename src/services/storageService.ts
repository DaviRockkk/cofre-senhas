import AsyncStorage from '@react-native-async-storage/async-storage';
import { BackupData, CredentialItem, DEFAULT_CATEGORIES } from '../types';
import { calculateChecksum } from './cryptoService';

const KEY_VAULT_ITEMS = '@null_vault_items_v2';
const KEY_VAULT_CATEGORIES = '@null_categories_v1';

export async function getCredentialItems(): Promise<CredentialItem[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY_VAULT_ITEMS);
    if (!raw) return [];
    return JSON.parse(raw) as CredentialItem[];
  } catch (err) {
    console.error('Erro ao carregar itens:', err);
    return [];
  }
}

export async function saveCredentialItems(items: CredentialItem[]): Promise<void> {
  await AsyncStorage.setItem(KEY_VAULT_ITEMS, JSON.stringify(items));
}

export async function getStoredCategories(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY_VAULT_CATEGORIES);
    if (!raw) return DEFAULT_CATEGORIES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return DEFAULT_CATEGORIES;
  } catch (err) {
    console.error('Erro ao carregar categorias:', err);
    return DEFAULT_CATEGORIES;
  }
}

export async function saveStoredCategories(categories: string[]): Promise<void> {
  await AsyncStorage.setItem(KEY_VAULT_CATEGORIES, JSON.stringify(categories));
}

export async function clearVaultData(): Promise<void> {
  await AsyncStorage.multiRemove([KEY_VAULT_ITEMS, KEY_VAULT_CATEGORIES]);
}

/**
 * Creates an offline encrypted backup payload JSON string
 */
export async function createEncryptedBackupJSON(): Promise<string | null> {
  const items = await getCredentialItems();
  const categories = await getStoredCategories();

  const backupObject: Omit<BackupData, 'checksum'> = {
    appName: 'Null',
    version: '2.0',
    timestamp: Date.now(),
    categories,
    items,
  };

  const payloadString = JSON.stringify(backupObject);
  const checksum = calculateChecksum(payloadString);

  const fullBackup: BackupData = {
    ...backupObject,
    checksum,
  };

  return JSON.stringify(fullBackup, null, 2);
}

/**
 * Validates and restores an offline encrypted backup JSON object
 */
export async function restoreEncryptedBackupJSON(jsonContent: string): Promise<{ items: CredentialItem[]; categories?: string[] }> {
  let parsed: BackupData;
  try {
    parsed = JSON.parse(jsonContent);
  } catch (e) {
    throw new Error('FORMATO_INVALIDO: O arquivo fornecido não é um JSON de backup válido.');
  }

  if ((parsed.appName !== 'Null' && parsed.appName !== ('CofreZero' as any)) || !Array.isArray(parsed.items)) {
    throw new Error('ESTRUTURA_INVALIDA: O arquivo de backup não pertence ao Null ou está corrompido.');
  }

  const { checksum, ...objectWithoutChecksum } = parsed;
  const recalculatedChecksum = calculateChecksum(JSON.stringify(objectWithoutChecksum));

  if (checksum && checksum !== recalculatedChecksum) {
    throw new Error('INTEGRIDADE_VIOLADA: O hash SHA-256 do arquivo de backup não confere.');
  }

  return {
    items: parsed.items,
    categories: parsed.categories,
  };
}