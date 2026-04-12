import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.tpaigames.zentru',
  appName: 'Zentru',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchFadeOutDuration: 300,
      backgroundColor: '#0f172a',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_zentru',
      iconColor: '#3b82f6',
    },
    Camera: {
      presentationStyle: 'fullscreen',
    },
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#0f172a',
  },
  ios: {
    backgroundColor: '#0f172a',
    contentInset: 'automatic',
    scheme: 'Zentru',
  },
}

export default config
