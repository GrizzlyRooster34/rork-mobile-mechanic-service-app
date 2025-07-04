import { Platform } from 'react-native';

// Production configuration
export const PRODUCTION_CONFIG = {
  isProduction: true,
  enableToolsModule: true,
  requireSignature: true,
  enablePhotoUpload: true,
  enableJobTimeline: true,
  maxPhotosPerJob: 15,
  enableVehicleTypes: true,
  supportMotorcycles: true,
  supportScooters: true,
};

// Environment configuration with safe defaults
export const ENV_CONFIG = {
  isProduction: PRODUCTION_CONFIG.isProduction ?? false,
  showQuickAccess: true, // Enabled for development testing
  enableDemoMode: false, // Disabled in production
  enableToolsModule: PRODUCTION_CONFIG.enableToolsModule ?? true,
  requireSignature: PRODUCTION_CONFIG.requireSignature ?? true,
  enablePhotoUpload: PRODUCTION_CONFIG.enablePhotoUpload ?? true,
  enableJobTimeline: PRODUCTION_CONFIG.enableJobTimeline ?? true,
  maxPhotosPerJob: PRODUCTION_CONFIG.maxPhotosPerJob ?? 10,
  enableVehicleTypes: PRODUCTION_CONFIG.enableVehicleTypes ?? true,
  supportMotorcycles: PRODUCTION_CONFIG.supportMotorcycles ?? true,
  supportScooters: PRODUCTION_CONFIG.supportScooters ?? true,
};

// Firebase configuration (mock for now)
export const FIREBASE_CONFIG = {
  apiKey: "mock-api-key",
  authDomain: "heinicus-mechanic.firebaseapp.com",
  projectId: "heinicus-mechanic",
  storageBucket: "heinicus-mechanic.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
};

// Validation functions
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Production event logging
export function logProductionEvent(event: string, data: any) {
  const timestamp = new Date().toISOString();
  const logData = {
    event,
    data,
    timestamp,
    platform: Platform.OS,
    environment: 'production',
    version: '1.0.0',
  };
  
  // Console logging for development
  console.log('Production Event:', logData);
  
  // In a real production app, this would send to analytics service
  if (ENV_CONFIG.isProduction) {
    // Send to Firebase Analytics, Mixpanel, etc.
    // analytics.track(event, data);
  }
}

// Feature flags
export const FEATURE_FLAGS = {
  enableAIDiagnosis: true,
  enableVinScanner: true,
  enableSignatureCapture: ENV_CONFIG.requireSignature,
  enableJobPhotos: ENV_CONFIG.enablePhotoUpload,
  enableJobTimeline: ENV_CONFIG.enableJobTimeline,
  enableToolsChecklist: ENV_CONFIG.enableToolsModule,
  enableMotorcycleSupport: ENV_CONFIG.supportMotorcycles,
  enableScooterSupport: ENV_CONFIG.supportScooters,
  enableVehicleTypeSelection: ENV_CONFIG.enableVehicleTypes,
  enablePaymentProcessing: true,
  enableNotifications: true,
  enableLocationServices: true,
  enableChatSupport: true,
  enableMaintenanceReminders: true,
  enableReportsAnalytics: true,
};

// Validation helpers
export function validateProductionConfig() {
  const requiredFeatures = [
    'enableToolsModule',
    'requireSignature',
    'enablePhotoUpload',
    'enableJobTimeline'
  ];
  
  const missingFeatures = requiredFeatures.filter(
    feature => !ENV_CONFIG[feature as keyof typeof ENV_CONFIG]
  );
  
  if (missingFeatures.length > 0) {
    console.warn('Missing required production features:', missingFeatures);
  }
  
  return missingFeatures.length === 0;
}

// Initialize production environment
export function initializeProductionEnvironment() {
  logProductionEvent('app_initialized', {
    platform: Platform.OS,
    config: ENV_CONFIG,
    features: FEATURE_FLAGS,
  });
  
  const isValid = validateProductionConfig();
  if (!isValid) {
    console.error('Production configuration validation failed');
  }
  
  return isValid;
}

// Export default configuration
export default {
  PRODUCTION_CONFIG,
  ENV_CONFIG,
  FIREBASE_CONFIG,
  FEATURE_FLAGS,
  validateEmail,
  validatePassword,
  logProductionEvent,
  validateProductionConfig,
  initializeProductionEnvironment,
};