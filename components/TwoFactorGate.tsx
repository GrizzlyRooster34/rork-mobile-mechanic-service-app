import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert } from 'react-native';
import { Button } from '@/components/Button';
import { Colors } from '@/constants/colors';
import * as Icons from 'lucide-react-native';

interface TwoFactorGateProps {
  onVerified: () => void;
  onCancel: () => void;
  userEmail: string;
}

export function TwoFactorGate({ onVerified, onCancel, userEmail }: TwoFactorGateProps) {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a 6-digit verification code.');
      return;
    }

    setIsVerifying(true);

    try {
      // Mock 2FA verification - in production this would verify with Google Authenticator
      // For development, accept any 6-digit code
      if (code === '123456' || code.length === 6) {
        console.log('2FA verification successful for:', userEmail);
        onVerified();
      } else {
        Alert.alert('Verification Failed', 'Invalid verification code. Please try again.');
      }
    } catch (error) {
      console.error('2FA verification error:', error);
      Alert.alert('Error', 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = () => {
    Alert.alert(
      'Code Sent',
      'A new verification code has been sent to your authenticator app.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icons.Shield size={48} color={Colors.primary} />
        <Text style={styles.title}>Two-Factor Authentication</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code from your authenticator app
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Verification Code</Text>
        <TextInput
          style={styles.codeInput}
          value={code}
          onChangeText={setCode}
          placeholder="000000"
          placeholderTextColor={Colors.textMuted}
          keyboardType="numeric"
          maxLength={6}
          autoFocus
          editable={!isVerifying}
        />

        <View style={styles.actions}>
          <Button
            title={isVerifying ? 'Verifying...' : 'Verify'}
            onPress={handleVerify}
            disabled={code.length !== 6 || isVerifying}
            style={styles.verifyButton}
          />
          
          <Button
            title="Resend Code"
            variant="outline"
            onPress={handleResendCode}
            disabled={isVerifying}
            style={styles.resendButton}
          />
        </View>

        <Button
          title="Cancel"
          variant="outline"
          onPress={onCancel}
          disabled={isVerifying}
          style={styles.cancelButton}
        />
      </View>

      <View style={styles.info}>
        <Icons.Info size={16} color={Colors.textMuted} />
        <Text style={styles.infoText}>
          2FA is not fully implemented yet. For development, use any 6-digit code or "123456".
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  codeInput: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 16,
    fontSize: 24,
    color: Colors.text,
    textAlign: 'center',
    fontFamily: 'monospace',
    letterSpacing: 4,
    marginBottom: 24,
  },
  actions: {
    gap: 12,
    marginBottom: 16,
  },
  verifyButton: {
    backgroundColor: Colors.primary,
  },
  resendButton: {
    borderColor: Colors.textMuted,
  },
  cancelButton: {
    borderColor: Colors.error,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },
});