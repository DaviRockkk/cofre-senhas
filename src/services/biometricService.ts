import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_BIOMETRIC_ENABLED = '@null_biometric_enabled_v1';

export interface BiometricStatus {
  isAvailable: boolean;
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
  label: string;
}

/**
  * Checks if biometric hardware is present and if biometrics are enrolled on the device
  */
export async function checkBiometricAvailability(): Promise<BiometricStatus> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    const isAvailable = hasHardware && isEnrolled;
    const label = getBiometricLabel(supportedTypes);

    return {
      isAvailable,
      hasHardware,
      isEnrolled,
      supportedTypes,
      label,
    };
  } catch (error) {
    console.error('Erro ao verificar disponibilidade de biometria:', error);
    return {
      isAvailable: false,
      hasHardware: false,
      isEnrolled: false,
      supportedTypes: [],
      label: 'Biometria',
    };
  }
}

/**
  * Formats a user-friendly label depending on available biometric types
  */
export function getBiometricLabel(types: LocalAuthentication.AuthenticationType[]): string {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'Face ID / Reconhecimento Facial';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'Impressão Digital / Touch ID';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return 'Leitor de Íris';
  }
  return 'Biometria Nativa';
}

/**
  * Prompts native biometric / device passcode authentication
  */
export async function authenticateWithBiometrics(
  promptMessage: string = 'Autentique com biometria para acessar o Null'
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Usar Senha do Celular',
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false,
    });

    if (result.success) {
      return { success: true };
    } else {
      return {
        success: false,
        error: result.error === 'user_cancel' ? 'Autenticação cancelada pelo usuário' : 'Falha na verificação biométrica',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro inesperado durante a biometria',
    };
  }
}

/**
  * Gets user preference for biometric lock
  */
export async function getBiometricEnabledPreference(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(KEY_BIOMETRIC_ENABLED);
    if (raw === null) {
      // By default, if device has biometrics available, enable it
      const status = await checkBiometricAvailability();
      return status.isAvailable;
    }
    return raw === 'true';
  } catch {
    return false;
  }
}

/**
  * Saves user preference for biometric lock
  */
export async function setBiometricEnabledPreference(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_BIOMETRIC_ENABLED, enabled ? 'true' : 'false');
  } catch (error) {
    console.error('Erro ao salvar preferência de biometria:', error);
  }
}