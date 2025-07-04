export function createContext({ req, res }: { req: any; res: any }) {
  return {
    req,
    res,
    environment: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
  };
}

export type Context = ReturnType<typeof createContext>;