import { createContext, useContext } from 'react';

const MaintenanceContext = createContext({
  global: { enabled: false, message: null },
  services: { enabled: false, message: null },
  vehicles: { enabled: false, message: null },
  bypass: false,
});

export const MaintenanceProvider = MaintenanceContext.Provider;

export function useMaintenance() {
  return useContext(MaintenanceContext);
}
