import type { CapacitorConfig } from '@capacitor/cli';

const liveReloadUrl = process.env.CAPACITOR_LIVE_RELOAD
  ? 'https://1ea90a07-a73d-4c92-8e57-d5e9c08ba8cc.lovableproject.com?forceHideBadge=true'
  : undefined;

const config: CapacitorConfig = {
  appId: 'app.lovable.tannersterminal',
  appName: 'Tanner Terminal',
  webDir: 'dist',
  ...(liveReloadUrl
    ? { server: { url: liveReloadUrl, cleartext: true } }
    : {}),
};

export default config;
