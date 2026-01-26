import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Location from 'expo-location';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import mobileAds from 'react-native-google-mobile-ads';
import 'react-native-reanimated';

export const unstable_settings = {
  anchor: '(tabs)',
};



export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    (async () => {
      // 1. [하드웨어] 위치 권한 요청
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('위치 권한을 허용해야 주변 맛집을 볼 수 있어요!');
      }

      // 2. [소프트웨어] 광고 SDK 초기화
      // await를 써서 순차적으로 해도 되고, 지금처럼 비동기로 둬도 됩니다.
      mobileAds()
        .initialize()
        .then(adapterStatuses => {
          console.log('광고 SDK 초기화 완료!', adapterStatuses);
        });
    })();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
