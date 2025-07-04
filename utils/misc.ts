import { Platform } from 'react-native';

export async function copyToClipboard(text: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      // Use web clipboard API
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    } else {
      // Use expo-clipboard for native platforms
      try {
        const Clipboard = await import('expo-clipboard');
        await Clipboard.setStringAsync(text);
      } catch (clipboardError) {
        // Fallback to React Native's built-in clipboard
        const { Clipboard: RNClipboard } = await import('react-native');
        RNClipboard.setString(text);
      }
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    throw error;
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}