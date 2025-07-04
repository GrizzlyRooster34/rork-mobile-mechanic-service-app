import { z } from 'zod';
import { publicProcedure, createTRPCRouter } from '../../create-context';

// Mock config storage - in production this would be a database
const configStorage = new Map<string, any>([
  ['isProduction', false],
  ['enableChatbot', true],
  ['enableVINCheck', true],
  ['showScooterSupport', true],
  ['showMotorcycleSupport', true],
  ['defaultLaborRate', 95],
  ['travelFeePerMile', 0.65],
  ['minimumTravelFee', 15],
  ['showVINDebug', false],
]);

export const configRouter = createTRPCRouter({
  getAll: publicProcedure
    .query(async () => {
      console.log('Config: Getting all config settings');
      
      // Convert Map to array of key-value pairs
      const configArray = Array.from(configStorage.entries()).map(([key, value]) => ({
        key,
        value,
      }));
      
      return configArray;
    }),

  get: publicProcedure
    .input(z.object({
      key: z.string(),
    }))
    .query(async ({ input }) => {
      console.log('Config: Getting config setting:', input.key);
      
      return {
        key: input.key,
        value: configStorage.get(input.key) ?? null,
      };
    }),

  set: publicProcedure
    .input(z.object({
      key: z.string(),
      value: z.union([z.string(), z.boolean(), z.number(), z.null()]),
    }))
    .mutation(async ({ input }) => {
      console.log('Config: Setting config:', input);
      
      // In production, this would persist to database
      configStorage.set(input.key, input.value);
      
      return {
        success: true,
        key: input.key,
        value: input.value,
        message: `Config ${input.key} updated successfully`
      };
    }),

  reset: publicProcedure
    .mutation(async () => {
      console.log('Config: Resetting all config to defaults');
      
      // Reset to defaults
      configStorage.clear();
      configStorage.set('isProduction', false);
      configStorage.set('enableChatbot', true);
      configStorage.set('enableVINCheck', true);
      configStorage.set('showScooterSupport', true);
      configStorage.set('showMotorcycleSupport', true);
      configStorage.set('defaultLaborRate', 95);
      configStorage.set('travelFeePerMile', 0.65);
      configStorage.set('minimumTravelFee', 15);
      configStorage.set('showVINDebug', false);
      
      return {
        success: true,
        message: 'Config reset to defaults'
      };
    }),
});