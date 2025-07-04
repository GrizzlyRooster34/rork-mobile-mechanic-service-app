export const Colors = {
  // Primary brand colors (matching logo)
  primary: '#00BFFF', // Bright blue from logo
  primaryDark: '#0099CC',
  secondary: '#1E90FF', // Slightly different blue
  
  // Dark theme (matching logo background)
  background: '#000000', // Pure black like logo
  surface: '#1a1a1a', // Slightly lighter black
  card: '#2a2a2a', // Card backgrounds
  border: '#333333', // Subtle borders
  
  // Text colors
  text: '#FFFFFF', // White text on black
  textSecondary: '#CCCCCC', // Light gray
  textMuted: '#888888', // Muted gray
  
  // Status colors
  success: '#00FF88',
  warning: '#FFB800',
  error: '#FF4444',
  
  // Background colors for status
  successBackground: '#E8F5E8',
  errorBackground: '#FFE8E8',
  warningBackground: '#FFF3CD',
  
  // Utility colors
  white: '#FFFFFF',
  black: '#000000',
  
  // Role-specific colors
  customer: '#00BFFF', // Blue for customer
  mechanic: '#FF6B35', // Orange for mechanic distinction
  
  // Production environment indicator
  production: '#00FF88', // Green for production mode
  development: '#FFB800', // Yellow for development mode
};

export default {
  light: {
    text: Colors.text,
    background: Colors.background,
    tint: Colors.primary,
    tabIconDefault: Colors.textMuted,
    tabIconSelected: Colors.primary,
  },
};