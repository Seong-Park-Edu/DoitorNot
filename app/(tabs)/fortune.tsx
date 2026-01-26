import { useFocusEffect } from 'expo-router'; // 탭 포커스 감지용
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Platform, StyleSheet, View } from 'react-native';
import { TestIds, useRewardedAd, useRewardedInterstitialAd } from 'react-native-google-mobile-ads';
import { WebView } from 'react-native-webview';

// ★ [설정 1] 배포한 웹사이트 주소 (http://... 말고 https://... 권장)
// 테스트 중이면 본인 PC IP 주소 (예: http://192.168.0.x:5173/fortune)
// 반드시 뒤에 /fortune 경로까지 적어주세요. 그래야 바로 운세 페이지가 뜹니다.
const WEBSITE_URL = 'https://mealwiki.com/fortune';

// ★ [설정 2] 보상형 광고 ID (테스트용 ID 넣어둠. 출시 전 실제 ID로 교체)

// ★ [설정 1] 보상형 전면 광고 ID (1순위)
const AD_UNIT_ID_INTERSTITIAL = __DEV__
  ? TestIds.REWARDED_INTERSTITIAL
  : 'ca-app-pub-3217076747522132/8914209122'; // 전면 광고 ID 입력

// ★ [설정 2] 일반 보상형 광고 ID (2순위)
const AD_UNIT_ID_REWARDED = __DEV__
  ? TestIds.REWARDED
  : 'ca-app-pub-3217076747522132/5411870393'; // 일반 보상형 ID 입력


export default function FortuneScreen() {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);

  // 1. 훅 2개 사용 (이름이 겹치니까 별칭 사용)
  const interstitial = useRewardedInterstitialAd(AD_UNIT_ID_INTERSTITIAL, {
    requestNonPersonalizedAdsOnly: true,
  });

  const rewarded = useRewardedAd(AD_UNIT_ID_REWARDED, {
    requestNonPersonalizedAdsOnly: true,
  });

  // 2. 초기 로딩 (둘 다 로드 시도)
  useEffect(() => {
    interstitial.load();
    rewarded.load();
  }, []);

  // 3-A. [전면 광고] 닫았을 때 처리
  useEffect(() => {
    if (interstitial.isClosed) {
      if (interstitial.reward) {
        sendSuccessMessage();
      }
      interstitial.load(); // 재로딩
    }
  }, [interstitial.isClosed, interstitial.reward]);

  // 3-B. [일반 광고] 닫았을 때 처리
  useEffect(() => {
    if (rewarded.isClosed) {
      if (rewarded.reward) {
        sendSuccessMessage();
      }
      rewarded.load(); // 재로딩
    }
  }, [rewarded.isClosed, rewarded.reward]);

  // 공통 성공 처리 함수
  const sendSuccessMessage = () => {
    const script = `window.postMessage(JSON.stringify({ type: 'AD_COMPLETED' }), '*');`;
    webViewRef.current?.injectJavaScript(script);
  };

  // 4. 안드로이드 뒤로가기 버튼 처리 (웹뷰 내에서 뒤로가기)
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (webViewRef.current && canGoBack) {
          webViewRef.current.goBack();
          return true; // 앱 종료 방지
        }
        return false; // 기본 동작 (앱 종료/이전 탭)
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => {
        if (Platform.OS === 'android') {
          subscription.remove();
        }
      };
    }, [canGoBack])
  );

  // 5. ★ [핵심 로직] 웹 메시지 처리 (우선순위 적용)
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'SHOW_REWARD_AD') {

        // [1순위] 보상형 전면 광고가 있나?
        if (interstitial.isLoaded) {
          console.log("1순위: 전면 광고 송출");
          interstitial.show();
        }
        // [2순위] 없으면 일반 보상형 광고가 있나?
        else if (rewarded.isLoaded) {
          console.log("2순위: 일반 보상형 송출");
          rewarded.show();
        }
        // [3순위] 둘 다 없으면? -> 무료 패스 (Fail-safe)
        else {
          console.log("광고 전멸: 무료 패스 적용");
          sendSuccessMessage();

          // 다음을 위해 둘 다 재로딩 시도
          interstitial.load();
          rewarded.load();
        }
      }
    } catch (error) { }
  };


  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: WEBSITE_URL }}
        geolocationEnabled={true}
        // @ts-ignore
        onGeolocationRequest={(event: any) => event.continue(true)}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={handleWebViewMessage}
        onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
        startInLoadingState={true}
        renderLoading={() => <ActivityIndicator size="large" color="#FF5722" style={styles.loading} />}
        userAgent={Platform.OS === 'android'
          ? "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 MealWikiApp/1.0"
          : "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1 MealWikiApp/1.0"
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  loading: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    zIndex: 1,
  },
});