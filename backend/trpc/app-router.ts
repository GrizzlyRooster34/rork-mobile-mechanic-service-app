import { createTRPCRouter } from './create-context';
import { hiProcedure } from './routes/example/hi/route';
import { diagnoseProcedure } from './routes/diagnosis/route';
import { authRouter } from './routes/auth/route';
import { adminRouter } from './routes/admin/route';
import { quoteRouter } from './routes/quote/route';
import { jobRouter } from './routes/job/route';
import { configRouter } from './routes/config/route';
import { decodeFromPlateProcedure, getSupportedStatesProcedure, validatePlateProcedure } from './routes/vin/route';

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiProcedure,
  }),
  diagnosis: createTRPCRouter({
    diagnose: diagnoseProcedure,
  }),
  vin: createTRPCRouter({
    decodeFromPlate: decodeFromPlateProcedure,
    getSupportedStates: getSupportedStatesProcedure,
    validatePlate: validatePlateProcedure,
  }),
  auth: authRouter,
  admin: adminRouter,
  quote: quoteRouter,
  job: jobRouter,
  config: configRouter,
});

export type AppRouter = typeof appRouter;