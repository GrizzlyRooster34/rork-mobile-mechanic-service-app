import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Button } from '@/components/Button';
import { Colors } from '@/constants/colors';
import { copyToClipboard } from '@/utils/misc';
import * as Icons from 'lucide-react-native';

interface QuickPayMenuProps {
  total: number;
  customerName?: string;
  jobId?: string;
}

const paymentLinks = {
  CashApp: 'https://cash.app/$heinicus',
  Chime: 'https://chime.com/pay/heinicus',
  PayPal: 'https://paypal.me/heinicus',
  Venmo: 'https://venmo.com/u/heinicus',
};

export default function QuickPayMenu({ total, customerName, jobId }: QuickPayMenuProps) {
  const [copiedMethod, setCopiedMethod] = useState<string | null>(null);

  const handleCopyLink = async (method: keyof typeof paymentLinks) => {
    try {
      const baseLink = paymentLinks[method];
      const amount = total.toFixed(2);
      
      // Create payment link with amount
      let paymentLink = `${baseLink}/${amount}`;
      
      // Add note for some services
      if (method === 'PayPal') {
        paymentLink = `${baseLink}/${amount}`;
      } else if (method === 'CashApp') {
        paymentLink = `${baseLink}/${amount}`;
      }
      
      // Add job reference if available
      if (jobId) {
        const separator = paymentLink.includes('?') ? '&' : '?';
        paymentLink += `${separator}note=Job%20${jobId}`;
      }
      
      await copyToClipboard(paymentLink);
      
      setCopiedMethod(method);
      setTimeout(() => setCopiedMethod(null), 2000);
      
      Alert.alert(
        'Link Copied',
        `${method} payment link copied to clipboard. Send this to the customer to request payment.`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Failed to copy payment link:', error);
      Alert.alert('Error', 'Failed to copy payment link. Please try again.');
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'CashApp': return Icons.Zap;
      case 'Chime': return Icons.CreditCard;
      case 'PayPal': return Icons.DollarSign;
      case 'Venmo': return Icons.Users;
      default: return Icons.Link;
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'CashApp': return '#00d632';
      case 'Chime': return '#00c851';
      case 'PayPal': return '#0070ba';
      case 'Venmo': return '#3d95ce';
      default: return Colors.primary;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icons.Share size={20} color={Colors.primary} />
        <Text style={styles.title}>Quick Payment Links</Text>
      </View>
      
      <Text style={styles.subtitle}>
        Copy payment links to send to customer
      </Text>
      
      <View style={styles.amountContainer}>
        <Text style={styles.amountLabel}>Total Amount:</Text>
        <Text style={styles.amountValue}>${total.toFixed(2)}</Text>
      </View>
      
      {customerName && (
        <Text style={styles.customerName}>
          Customer: {customerName}
        </Text>
      )}
      
      <View style={styles.methodsContainer}>
        {Object.keys(paymentLinks).map((method) => {
          const IconComponent = getMethodIcon(method);
          const methodColor = getMethodColor(method);
          const isCopied = copiedMethod === method;
          
          return (
            <Button
              key={method}
              title={isCopied ? 'Copied!' : `Copy ${method} Link`}
              onPress={() => handleCopyLink(method as keyof typeof paymentLinks)}
              style={[
                styles.methodButton,
                { 
                  backgroundColor: isCopied ? Colors.success : methodColor,
                  opacity: isCopied ? 0.8 : 1,
                }
              ]}
            />
          );
        })}
      </View>
      
      <View style={styles.instructions}>
        <Icons.Info size={14} color={Colors.textSecondary} />
        <Text style={styles.instructionText}>
          Tap any method to copy the payment link. Send the link to your customer via text, email, or messaging app.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.success,
  },
  customerName: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  methodsContainer: {
    gap: 8,
    marginBottom: 16,
  },
  methodButton: {
    padding: 0,
  },
  methodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  methodText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    flex: 1,
    textAlign: 'center',
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 8,
  },
  instructionText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
});