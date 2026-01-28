import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native'; // ★ Platform 추가 확인
import mobileAds from 'react-native-google-mobile-ads';

// 1. 알림 핸들러 설정 (앱이 켜져 있을 때 처리)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  } as Notifications.NotificationBehavior),
});

export default function RootLayout() {

  useEffect(() => {
    (async () => {
      // 1. 위치 권한
      let { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== 'granted') console.log('위치 권한 거절됨');

      // 2. 안드로이드 알림 채널 설정 (중요!)
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: '기본 알림',
          importance: Notifications.AndroidImportance.HIGH, // ★ 배너 출력을 위해 HIGH 설정
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          showBadge: true,
        });
      }

      // 3. 광고 초기화
      mobileAds().initialize().then(s => console.log('광고 SDK Init', s));

      // 4. 알림 권한 및 스케줄링
      const { status: notificationStatus } = await Notifications.requestPermissionsAsync();

      if (notificationStatus === 'granted') {
        await Notifications.cancelAllScheduledNotificationsAsync();

        await Notifications.scheduleNotificationAsync({
          content: {
            title: "🍚 점심 메뉴 정하셨나요?",
            body: "오늘 뭐 먹을지 고민될 땐 '할래말래'에서 결정해보세요!",
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH, // ★ 안드로이드 우선순위 최상위
          },
          trigger: {
            hour: 11,  // 오전 1시
            minute: 0, // (테스트를 위해 현재 시간보다 2~3분 뒤로 설정하세요)
            repeats: true,
            channelId: 'default', // ★ 위에서 만든 채널 ID 'default'와 연결!
          } as Notifications.CalendarTriggerInput,
        });
        console.log("알림 예약 완료!");
      } else {
        console.log("알림 권한 거절됨");
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