import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import mobileAds from 'react-native-google-mobile-ads';

// 1. 앱 켜져있을 때 배너 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  } as Notifications.NotificationBehavior),
});

export default function RootLayout() {

  useEffect(() => {
    (async () => {
      // (1) 위치/광고 (기존)
      await Location.requestForegroundPermissionsAsync();
      mobileAds().initialize();

      // (2) ★ [채널 ID 변경] 기존 'default' 버리고 'meal-alert'로 새로 만듦
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('meal-alert', {
          name: '점심 알림',
          importance: Notifications.AndroidImportance.HIGH, // HIGH: 소리/배너 O, 화면켜짐 X
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          showBadge: true,
        });
      }

      // (3) 알림 예약
      const { status } = await Notifications.requestPermissionsAsync();

      if (status === 'granted') {
        await Notifications.cancelAllScheduledNotificationsAsync();

       
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "🍚 점심 메뉴 정하셨나요?",
            body: "오늘 뭐 먹을지 고민될 땐 '할래말래'에서 결정해보세요!",
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: {
            hour: 11,
            minute: 0,
            repeats: true,
            channelId: 'meal-alert', // ★ 여기도 바뀐 ID랑 똑같이!
          },
        });
      }
    })();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: true,
            title: 'MealWiki',
            headerTitleAlign: 'center',
            headerStyle: { backgroundColor: 'black' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        />
      </Stack>
    </>
  );
}