import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/colors';
import * as Icons from 'lucide-react-native';

type PaymentMethod = 'cash' | 'paypal' | 'chime' | 'cashapp' | 'stripe';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  amount?: number;
}

const paymentMethods = [
  {
    id: 'cash' as PaymentMethod,
    name: 'Cash / Paid Offline',
    icon: 'DollarSign',
    description: 'Payment received in cash',
    available: true,
  },
  {
    id: 'paypal' as PaymentMethod,
    name: 'PayPal',
    icon: 'CreditCard',
    description: 'PayPal payment link',
    available: true,
  },
  {
    id: 'chime' as PaymentMethod,
    name: 'Chime',
    icon: 'Smartphone',
    description: 'Chime payment link',
    available: true,
  },
  {
    id: 'cashapp' as PaymentMethod,
    name: 'Cash App',
    icon: 'Zap',
    description: 'Cash App payment link',
    available: true,
  },
  {
    id: 'stripe' as PaymentMethod,
    name: 'Stripe',
    icon: 'CreditCard',
    description: 'Credit/Debit card via Stripe',
    available: false, // Coming soon
  },
];

export function PaymentMethodSelector({ 
  selectedMethod, 
  onMethodChange, 
  amount 
}: PaymentMethodSelectorProps) {
  const getIcon = (iconName: string) => {
    const IconComponent = Icons[iconName as keyof typeof Icons];
    if (IconComponent && typeof IconComponent === 'function') {
      const Icon = IconComponent as React.ComponentType<{ size: number; color: string }>;
      return Icon;
    }
    return Icons.DollarSign;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment Method</Text>
      {amount && (
        <Text style={styles.amount}>Amount: ${amount.toFixed(2)}</Text>
      )}
      
      <View style={styles.methodsList}>
        {paymentMethods.map((method) => {
          const IconComponent = getIcon(method.icon);
          const isSelected = selectedMethod === method.id;
          const isDisabled = !method.available;
          
          return (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodOption,
                isSelected && styles.selectedMethod,
                isDisabled && styles.disabledMethod,
              ]}
              onPress={() => method.available && onMethodChange(method.id)}
              disabled={isDisabled}
            >
              <View style={styles.methodContent}>
                <View style={styles.methodHeader}>
                  <IconComponent 
                    size={24} 
                    color={
                      isDisabled 
                        ? Colors.textMuted 
                        : isSelected 
                          ? Colors.primary 
                          : Colors.textSecondary
                    } 
                  />
                  <View style={styles.methodInfo}>
                    <Text style={[
                      styles.methodName,
                      isSelected && styles.selectedMethodName,
                      isDisabled && styles.disabledMethodName,
                    ]}>
                      {method.name}
                    </Text>
                    <Text style={[
                      styles.methodDescription,
                      isDisabled && styles.disabledMethodDescription,
                    ]}>
                      {method.description}
                    </Text>
                  </View>
                  
                  {!method.available && (
                    <View style={styles.comingSoonBadge}>
                      <Text style={styles.comingSoonText}>Coming Soon</Text>
                    </View>
                  )}
                  
                  {isSelected && method.available && (
                    <Icons.CheckCircle size={20} color={Colors.primary} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      
      <View style={styles.note}>
        <Icons.Info size={16} color={Colors.textMuted} />
        <Text style={styles.noteText}>
          Select the payment method used for this transaction. 
          Payment links can be generated for digital methods.
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
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 16,
  },
  methodsList: {
    gap: 12,
    marginBottom: 16,
  },
  methodOption: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 16,
  },
  selectedMethod: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  disabledMethod: {
    opacity: 0.6,
  },
  methodContent: {
    flex: 1,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  selectedMethodName: {
    color: Colors.primary,
  },
  disabledMethodName: {
    color: Colors.textMuted,
  },
  methodDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  disabledMethodDescription: {
    color: Colors.textMuted,
  },
  comingSoonBadge: {
    backgroundColor: Colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.black,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },
});