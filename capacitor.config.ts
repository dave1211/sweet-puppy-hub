import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.tannersterminal',
  appName: 'Tanner Terminal',
  webDir: 'dist',
  server: {
    url: 'https://1ea90a07-a73d-4c92-8e57-d5e9c08ba8cc.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
