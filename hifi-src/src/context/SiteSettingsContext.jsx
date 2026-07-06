import { createContext, useContext } from 'react';

// Defaults entsprechen dem, was früher fest im Code stand - greifen, solange
// der eigentliche /site-settings-Request noch lädt oder fehlschlägt.
const SiteSettingsContext = createContext({
  phone: '09373 20 62 390',
  whatsapp: null,
  contact_email: 'info@hifi-planet-amorbach.de',
  hero_image_path: null,
});

export const SiteSettingsProvider = SiteSettingsContext.Provider;

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
