import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.toolinger.app',
  appName: 'Toolinger',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
