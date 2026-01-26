import { useFocusEffect } from 'expo-router'; // 탭 포커스 감지용
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Platform, StyleSheet, View } from 'react-native';
import { TestIds, useRewardedAd } from 'react-native-google-mobile-ads';
import { WebView } from 'react-native-webview';

// ★ [설정 1] 배포한 웹사이트 주소 (http://... 말고 https://... 권장)
// 테스트 중이면 본인 PC IP 주소 (예: http://192.168.0.x:5173/fortune)
// 반드시 뒤에 /fortune 경로까지 적어주세요. 그래야 바로 운세 페이지가 뜹니다.
const WEBSITE_URL = 'https://mealwiki.com/fortune';

// ★ [설정 2] 보상형 광고 ID (테스트용 ID 넣어둠. 출시 전 실제 ID로 교체)

const AD_UNIT_ID = __DEV__
  ? TestIds.REWARDED
  : 'ca-app-pub-3217076747522132/8914209122';

export default function FortuneScreen() {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);

  // 1. 보상형 광고 훅 설정
  const { isLoaded, isClosed, load, show, reward } = useRewardedAd(AD_UNIT_ID, {
    requestNonPersonalizedAdsOnly: true,
  });

  // 2. 광고 로딩 (화면이 처음 열릴 때)
  useEffect(() => {
    load();
  }, [load]);

  // 3. 광고를 다 보고 닫았을 때 처리 -> 웹으로 '성공' 신호 전송
  useEffect(() => {
    if (isClosed) {
      if (reward) {
        // 웹(React)에게 "광고 다 봤음!" 메시지 쏘기
        const script = `
          window.postMessage(JSON.stringify({ type: 'AD_COMPLETED' }), '*');
        `;
        webViewRef.current?.injectJavaScript(script);
        // Alert.alert("성공", "운세 분석을 시작합니다! 🔮");
      } else {
        // Alert.alert("알림", "광고를 끝까지 시청해야 결과를 볼 수 있어요.");
      }
      load(); // 다음 번을 위해 광고 다시 로드
    }
  }, [isClosed, reward, load]);

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

  // 5. 웹에서 온 메시지 처리 ("광고 틀어줘!")
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'SHOW_REWARD_AD') {
        if (isLoaded) {
          show();
        } else {
          // Alert.alert("알림", "광고를 불러오는 중입니다. 잠시만 기다려주세요.");
          
        }
      }
    } catch (error) {
      // 무시 (다른 메시지일 수 있음)
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: WEBSITE_URL }}
        geolocationEnabled={true}
        // @ts-ignore
        onGeolocationRequest={(event: any) => {
          event.continue(true);
        }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        // 웹 -> 앱 메시지 수신
        onMessage={handleWebViewMessage}
        // 뒤로가기 상태 감지
        onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
        // 로딩 중 표시
        startInLoadingState={true}
        renderLoading={() => <ActivityIndicator size="large" color="#FF5722" style={styles.loading} />}
        // UserAgent 설정 (웹에서 앱임을 인식시키고 싶을 때)
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