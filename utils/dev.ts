// Development utilities and configuration
export const devMode = process.env.NODE_ENV === 'development' || __DEV__;

export const hardcodedAdmin = {
  email: "admin@heinicus.dev",
  password: "HeinicusOverlord9000",
  role: "admin" as const,
  id: "admin-dev-id",
  firstName: "Dev",
  lastName: "Admin",
  createdAt: new Date(),
  isActive: true,
};

export const hardcodedMechanic = {
  email: "mechanic@heinicus.dev", 
  password: "MechanicDev2024",
  role: "mechanic" as const,
  id: "mechanic-dev-id",
  firstName: "Dev",
  lastName: "Mechanic",
  createdAt: new Date(),
  isActive: true,
};

export const devCredentials = {
  admin: {
    email: hardcodedAdmin.email,
    password: hardcodedAdmin.password,
  },
  mechanic: {
    email: hardcodedMechanic.email,
    password: hardcodedMechanic.password,
  },
};

export function isDevCredentials(email: string, password: string) {
  return (
    (email === hardcodedAdmin.email && password === hardcodedAdmin.password) ||
    (email === hardcodedMechanic.email && password === hardcodedMechanic.password)
  );
}

export function getDevUser(email: string) {
  if (email === hardcodedAdmin.email) {
    return hardcodedAdmin;
  }
  if (email === hardcodedMechanic.email) {
    return hardcodedMechanic;
  }
  return null;
}