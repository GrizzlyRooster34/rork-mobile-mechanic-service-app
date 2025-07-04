import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { configStore } from "@/lib/configStore";

interface ConfigItem {
  key: string;
  value: string | boolean | number | null;
}

/**
 * Hook to hydrate config store with persisted admin settings from backend
 * This ensures global toggles (VIN check, scooter support, etc.) are respected
 * across the entire app on startup
 */
export const useHydrateConfig = () => {
  // Query config from backend
  const { data, isSuccess, error } = trpc.config.getAll.useQuery();

  useEffect(() => {
    if (isSuccess && data) {
      console.log('Hydrating config store with backend settings:', data);
      
      // Apply each config setting to the store with proper typing
      data.forEach((item: ConfigItem) => {
        const { key, value } = item;
        try {
          configStore.set(key as any, value);
          console.log(`Config updated: ${key} = ${value}`);
        } catch (error) {
          console.warn(`Failed to set config ${key}:`, error);
        }
      });
      
      console.log('Config hydration complete');
    } else if (error) {
      console.warn('Config hydration failed - using default values:', error);
      
      // Set some reasonable defaults if backend is unavailable
      configStore.set('isProduction', false);
      configStore.set('enableChatbot', true);
      configStore.set('enableVINCheck', true);
      configStore.set('showScooterSupport', true);
      configStore.set('showMotorcycleSupport', true);
    }
  }, [isSuccess, data, error]);

  // Return current config state for debugging
  return {
    isHydrated: isSuccess,
    error,
    config: configStore.get(),
  };
};