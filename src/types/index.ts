export type Category = string;

export const DEFAULT_CATEGORIES: string[] = [
  'Redes Sociais',
  'Financeiro',
  'Email',
  'Trabalho',
  'Streaming',
  'Outros',
];

export interface CredentialItem {
  id: string;
  serviceName: string;
  username: string;
  ciphertext: string; // Base64 encrypted password (AES-256-GCM)
  iv: string;         // Base64 initialization vector (12 bytes)
  authTag: string;    // Base64 authentication tag (16 bytes GCM)
  salt: string;       // Hex CSPRNG salt unique to this item
  iterations: number; // PBKDF2 iterations (>= 100,000)
  category: Category;
  url?: string;
  notes?: string;
  isFavorite?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface BackupData {
  appName: 'Null';
  version: '2.0';
  timestamp: number;
  categories?: string[];
  items: CredentialItem[];
  checksum: string;    // SHA-256 hash of items payload
}

export interface PasswordGeneratorConfig {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
}

export interface SecurityScore {
  bits: number;
  label: 'Fraca' | 'Média' | 'Forte' | 'Ultra Segura';
  color: string;
}