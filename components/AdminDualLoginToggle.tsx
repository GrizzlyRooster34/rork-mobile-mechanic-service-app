import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '@/components/Button';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/stores/auth-store';
import { devMode, devCredentials } from '@/utils/dev';
import * as Icons from 'lucide-react-native';

export default function AdminDualLoginToggle() {
  const { login, isLoading } = useAuthStore();

  if (!devMode) {
    return null;
  }

  const handleDevLogin = async (role: 'admin' | 'mechanic') => {
    const credentials = devCredentials[role];
    const success = await login(credentials.email, credentials.password);
    
    if (success) {
      console.log(`Dev ${role} login successful`);
    } else {
      console.error(`Dev ${role} login failed`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icons.Code size={20} color={Colors.development} />
        <Text style={styles.title}>Development Login</Text>
        <View style={styles.devBadge}>
          <Text style={styles.devBadgeText}>DEV</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Quick login for development and testing
      </Text>

      <View style={styles.buttonContainer}>
        <Button
          title="Login as Admin"
          onPress={() => handleDevLogin('admin')}
          disabled={isLoading}
          style={[styles.loginButton, { backgroundColor: Colors.primary }]}
        />

        <Button
          title="Login as Mechanic"
          onPress={() => handleDevLogin('mechanic')}
          disabled={isLoading}
          style={[styles.loginButton, { backgroundColor: Colors.mechanic }]}
        />
      </View>

      <View style={styles.credentials}>
        <Text style={styles.credentialsTitle}>Dev Credentials:</Text>
        <Text style={styles.credentialText}>
          Admin: {devCredentials.admin.email}
        </Text>
        <Text style={styles.credentialText}>
          Mechanic: {devCredentials.mechanic.email}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 20,
    margin: 16,
    borderWidth: 2,
    borderColor: Colors.development,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  devBadge: {
    backgroundColor: Colors.development,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  devBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.black,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 16,
  },
  loginButton: {
    padding: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
  },
  credentials: {
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  credentialsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  credentialText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: 'monospace',
  },
});