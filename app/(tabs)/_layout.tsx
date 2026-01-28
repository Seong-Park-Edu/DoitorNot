import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Platform, SafeAreaView, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
// ★ [추가] BannerAd, BannerAdSize 임포트
import { useFocusEffect } from 'expo-router';
import { BannerAd, BannerAdSize, TestIds, useRewardedAd, useRewardedInterstitialAd } from 'react-native-google-mobile-ads';

const WEBSITE_URL = 'https://mealwiki.com/decision'; 

const AD_UNIT_ID_INTERSTITIAL = __DEV__ ? TestIds.REWARDED_INTERSTITIAL : 'ca-app-pub-3217076747522132/8914209122';
const AD_UNIT_ID_REWARDED = __DEV__ ? TestIds.REWARDED : 'ca-app-pub-3217076747522132/5411870393';

// ★ [설정] 배너 광고 ID (테스트용 vs 실전용)
// 나중에 애드몹 홈페이지에서 '배너' 단위 만들어서 ID 교체하세요.
const AD_UNIT_ID_BANNER = __DEV__ 
  ? TestIds.BANNER 
  : 'ca-app-pub-3217076747522132/4038060077'; // 여기에 실제 배너 ID 입력

export default function AppShell() {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);

  const interstitial = useRewardedInterstitialAd(AD_UNIT_ID_INTERSTITIAL, { requestNonPersonalizedAdsOnly: true });
  const rewarded = useRewardedAd(AD_UNIT_ID_REWARDED, { requestNonPersonalizedAdsOnly: true });

  useEffect(() => {
    interstitial.load();
    rewarded.load();
  }, []);

  const handleAdComplete = () => {
    const script = `window.postMessage(JSON.stringify({ type: 'AD_COMPLETED' }), '*');`;
    webViewRef.current?.injectJavaScript(script);
  };

  useEffect(() => {
    if (interstitial.isClosed) {
      if (interstitial.reward) handleAdComplete();
      interstitial.load();
    }
  }, [interstitial.isClosed, interstitial.reward]);

  useEffect(() => {
    if (rewarded.isClosed) {
      if (rewarded.reward) handleAdComplete();
      rewarded.load();
    }
  }, [rewarded.isClosed, rewarded.reward]);

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

  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      switch (data.type) {
        case 'HAPTIC':
          if (data.payload === 'Light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          else if (data.payload === 'Medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          else if (data.payload === 'Success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          else if (data.payload === 'Error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'SHOW_AD':
        case 'SHOW_REWARD_AD':
          if (interstitial.isLoaded) interstitial.show();
          else if (rewarded.isLoaded) rewarded.show();
          else {
            handleAdComplete();
            interstitial.load();
            rewarded.load();
          }
          break;
      }
    } catch (error) { console.log('Message Error:', error); }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. 웹뷰 영역 (flex: 1로 남은 공간 꽉 채움) */}
      <View style={{ flex: 1 }}>
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
      </View>

      {/* 2. ★ [추가] 하단 배너 광고 영역 */}
      <View style={styles.bannerContainer}>
        <BannerAd
          unitId={AD_UNIT_ID_BANNER}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} // 화면 너비에 꽉 차게 자동 조절
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
        />
      </View>
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
  // ★ 배너 스타일: 화면 중앙 정렬
  bannerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0', // 광고 로딩 전 배경색
  }
});