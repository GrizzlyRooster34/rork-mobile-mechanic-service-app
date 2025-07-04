#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';

interface AppConfig {
  expo: {
    name: string;
    slug: string;
    version: string;
    android?: {
      versionCode?: number;
      package?: string;
      adaptiveIcon?: any;
    };
    [key: string]: any;
  };
}

/**
 * Increment version number following semantic versioning
 * @param version Current version string (e.g., "1.0.0")
 * @returns New version string with patch incremented
 */
function incrementVersion(version: string): string {
  const parts = version.split('.');
  if (parts.length !== 3) {
    console.warn(`⚠️  Invalid version format: ${version}. Defaulting to 1.0.1`);
    return '1.0.1';
  }
  
  const [major, minor, patch] = parts.map(Number);
  if (isNaN(major) || isNaN(minor) || isNaN(patch)) {
    console.warn(`⚠️  Invalid version numbers in: ${version}. Defaulting to 1.0.1`);
    return '1.0.1';
  }
  
  return `${major}.${minor}.${patch + 1}`;
}

/**
 * Main function to bump version in app.json
 */
async function bumpVersion(): Promise<void> {
  const appJsonPath = path.join(process.cwd(), 'app.json');
  
  try {
    // Check if app.json exists
    if (!fs.existsSync(appJsonPath)) {
      console.error('❌ app.json not found in current directory');
      process.exit(1);
    }
    
    // Read current app.json
    console.log('📖 Reading app.json...');
    const appJsonContent = fs.readFileSync(appJsonPath, 'utf8');
    const appConfig: AppConfig = JSON.parse(appJsonContent);
    
    // Validate basic structure
    if (!appConfig.expo) {
      console.error('❌ Invalid app.json structure: missing expo configuration');
      process.exit(1);
    }
    
    // Store original values for logging
    const originalVersion = appConfig.expo.version || '1.0.0';
    const originalVersionCode = appConfig.expo.android?.versionCode || 0;
    
    // Bump expo.version (patch increment)
    const newVersion = incrementVersion(originalVersion);
    appConfig.expo.version = newVersion;
    
    // Ensure android object exists
    if (!appConfig.expo.android) {
      appConfig.expo.android = {};
    }
    
    // Bump android.versionCode (increment by 1)
    const newVersionCode = (originalVersionCode || 0) + 1;
    appConfig.expo.android.versionCode = newVersionCode;
    
    // Write updated app.json with proper formatting
    console.log('✍️  Writing updated app.json...');
    fs.writeFileSync(appJsonPath, JSON.stringify(appConfig, null, 2) + '\n');
    
    // Log all changes
    console.log('\n🎉 Version bump completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📱 App Version:     ${originalVersion} → ${newVersion}`);
    console.log(`🤖 Android Version: ${originalVersionCode} → ${newVersionCode}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📄 Updated: ${appJsonPath}`);
    
  } catch (error) {
    console.error('❌ Error bumping version:', error);
    
    if (error instanceof SyntaxError) {
      console.error('💡 app.json appears to have invalid JSON syntax');
    }
    
    process.exit(1);
  }
}

// Run the script if executed directly
if (require.main === module) {
  bumpVersion().catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
}

export { bumpVersion, incrementVersion };