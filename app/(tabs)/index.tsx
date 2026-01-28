import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Platform, SafeAreaView, StyleSheet } from 'react-native';
import { TestIds, useRewardedAd, useRewardedInterstitialAd } from 'react-native-google-mobile-ads';
import { WebView } from 'react-native-webview';

// ★ [설정] 웹 주소 (배포된 실제 주소 또는 로컬 주소)
// '운세'나 '할래말래' 어느 페이지로 시작하든 상관없습니다. (네비게이션 바가 있으니까요)
const WEBSITE_URL = 'https://mealwiki.com/decision'; 

// ★ [광고 ID 설정]
// 1순위: 보상형 전면 광고 (화면 전환 시 자연스러움)
const AD_UNIT_ID_INTERSTITIAL = __DEV__
  ? TestIds.REWARDED_INTERSTITIAL
  : 'ca-app-pub-3217076747522132/8914209122';

// 2순위: 일반 보상형 광고 (확실한 보상)
const AD_UNIT_ID_REWARDED = __DEV__
  ? TestIds.REWARDED
  : 'ca-app-pub-3217076747522132/5411870393';

export default function AppShell() {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);

  // 1. 광고 훅 준비 (두 가지 무기 장착)
  const interstitial = useRewardedInterstitialAd(AD_UNIT_ID_INTERSTITIAL, {
    requestNonPersonalizedAdsOnly: true,
  });

  const rewarded = useRewardedAd(AD_UNIT_ID_REWARDED, {
    requestNonPersonalizedAdsOnly: true,
  });

  // 2. 광고 로딩 (앱 켜자마자 둘 다 장전)
  useEffect(() => {
    interstitial.load();
    rewarded.load();
  }, []);

  // 3. 광고 시청 완료 처리 함수 (공통)
  const handleAdComplete = () => {
    // 웹사이트에 "광고 다 봤음!" 신호 전송
    const script = `window.postMessage(JSON.stringify({ type: 'AD_COMPLETED' }), '*');`;
    webViewRef.current?.injectJavaScript(script);
    console.log("보상 지급 완료 (AD_COMPLETED 전송)");
  };

  // 4-A. [전면 광고] 닫힘 감지
  useEffect(() => {
    if (interstitial.isClosed) {
      if (interstitial.reward) handleAdComplete();
      interstitial.load(); // 재장전
    }
  }, [interstitial.isClosed, interstitial.reward]);

  // 4-B. [일반 광고] 닫힘 감지
  useEffect(() => {
    if (rewarded.isClosed) {
      if (rewarded.reward) handleAdComplete();
      rewarded.load(); // 재장전
    }
  }, [rewarded.isClosed, rewarded.reward]);

  // 5. 뒤로가기 버튼 처리
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (webViewRef.current && canGoBack) {
          webViewRef.current.goBack();
          return true; 
        }
        return false; 
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove(); 
    }, [canGoBack])
  );

  // 6. 브릿지 메시지 처리 (웹 -> 앱 명령 수행)
  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
        // [기능 1] 햅틱 (진동)
        case 'HAPTIC':
          if (data.payload === 'Light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          else if (data.payload === 'Medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          else if (data.payload === 'Success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          else if (data.payload === 'Error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;

        // [기능 2] 광고 보여주기 (할래말래 & 운세 공통 사용)
        // 운세 페이지에서는 'SHOW_REWARD_AD', 할래말래에서는 'SHOW_AD'를 보낼 수 있음
        case 'SHOW_AD':
        case 'SHOW_REWARD_AD':
          // 1순위: 전면 광고가 준비되었나?
          if (interstitial.isLoaded) {
            console.log("1순위: 전면 광고 송출");
            interstitial.show();
          } 
          // 2순위: 일반 보상형 광고가 준비되었나?
          else if (rewarded.isLoaded) {
            console.log("2순위: 일반 보상형 송출");
            rewarded.show();
          } 
          // 3순위: 둘 다 없으면? (광고 로드 실패 시)
          else {
            console.log("광고 없음: 무료 패스 적용");
            handleAdComplete(); // 유저 기다리게 하지 말고 그냥 통과
            
            // 다음을 위해 재로딩 시도
            interstitial.load();
            rewarded.load();
          }
          break;
      }
    } catch (error) {
      console.log('Message Error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: WEBSITE_URL }}
        onMessage={handleMessage}
        onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => <ActivityIndicator size="large" color="#FF5722" style={styles.loading} />}
        userAgent={Platform.OS === 'android' ? 'HalLaeMalLaeApp/Android' : 'HalLaeMalLaeApp/iOS'}
        style={{ flex: 1 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loading: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    zIndex: 1,
  },
});