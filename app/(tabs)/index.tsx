import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ViewShot from 'react-native-view-shot';
// 방금 만든 컴포넌트 import (경로 확인 필수!)
import LottieView from 'lottie-react-native';
import CoinFlip from '../../components/CoinFlip';

export default function HomeScreen() {
  const [worry, setWorry] = useState('');
  const [capturedWorry, setCapturedWorry] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [ratio, setRatio] = useState(50);

  // [NEW] 애니메이션 진행 중인지 체크하는 상태
  const [isAnimating, setIsAnimating] = useState(false);

  // [NEW] 모드 상태 추가 ('BASIC' 또는 'FUN')
  const [mode, setMode] = useState<'BASIC' | 'FUN'>('BASIC');

  // [NEW] Fun 모드에서 숫자가 증/감 하는 방향 (true: 증가, false: 감소)
  const directionRef = useRef(true);

  // [NEW] Fun 모드용 타이머 (useEffect로 제어)
  React.useEffect(() => {
    let interval: any

    // Fun 모드이고, 아직 결과가 안 나왔고, 애니메이션(동전) 중이 아닐 때만 실행
    if (mode === 'FUN' && !result && !isAnimating) {
      interval = setInterval(() => {
        setRatio((prev) => {
          // 0~100 사이를 왔다갔다 하게 함
          let next = prev;
          if (directionRef.current) {
            next += 2; // 속도 조절: 숫자가 클수록 빠름
            if (next >= 100) directionRef.current = false;
          } else {
            next -= 2;
            if (next <= 0) directionRef.current = true;
          }
          // 0과 100을 넘어가지 않도록 보정
          return Math.max(0, Math.min(100, next));
        });
      }, 20); // 0.02초마다 업데이트 (부드러운 움직임)
    }

    return () => clearInterval(interval);
  }, [mode, result, isAnimating]);

  // [NEW] 텍스트 클릭 시 1%씩 조절 (Hard 모드 아이디어 반영)
  const adjustRatio = (amount: number) => {
    if (mode === 'FUN') return; // 게임 모드일 땐 터치 금지
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRatio(prev => Math.max(0, Math.min(100, prev + amount)));
  };

  // [NEW] 결정된 순간의 확률을 저장할 상태 추가
  const [capturedRatio, setCapturedRatio] = useState(50);

  const viewShotRef = useRef<any>(null);
  const coinRef = useRef<any>(null); // CoinFlip 제어용 ref

  const getSliderColor = () => {
    if (ratio === 50) return '#333333';
    if (ratio > 50) return '#2ecc71';
    return '#e74c3c';
  };

  const makeDecision = async () => {
    Keyboard.dismiss();

    // 1. 애니메이션 모드 진입
    setIsAnimating(true);

    // 2. 햅틱 반응 (동전 던지는 느낌)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // 3. 동전 애니메이션 재생 시작
    if (coinRef.current) {
      coinRef.current.play();
    }

    // 4. 2.5초(2500ms) 후에 결과를 보여줌 (동전이 충분히 돈 후)
    setTimeout(async () => {
      const randomVal = Math.random() * 100;
      const decision = randomVal <= ratio ? 'DO' : 'DONT';

      setCapturedWorry(worry.trim() === '' ? '말 못 할 고민' : worry);
      setCapturedRatio(ratio); // [NEW] 현재 설정된 확률을 박제(Capture)!
      setResult(decision);

      // 결과에 따른 햅틱 피드백
      if (decision === 'DO') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      // 히스토리 저장
      try {
        const existingHistory = await AsyncStorage.getItem('decisionHistory');
        const history = existingHistory ? JSON.parse(existingHistory) : [];
        const newRecord = {
          id: Date.now(),
          text: worry.trim() === '' ? '말 못 할 고민' : worry,
          result: decision,
          date: new Date().toLocaleDateString(),
          ratio: ratio // [NEW] 기록에도 확률 정보(ratio)를 같이 저장
        };
        await AsyncStorage.setItem('decisionHistory', JSON.stringify([newRecord, ...history]));
      } catch (e) { console.log("저장 실패"); }

      // 입력값 초기화 및 애니메이션 종료
      setWorry('');
      setIsAnimating(false);

    }, 2500); // 2.5초 딜레이
  };

  const shareResult = async () => {
    try {
      const uri = await viewShotRef.current?.capture();
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.log('공유 실패', error);
    }
  };

  const reset = () => {
    setResult(null);
    setCapturedWorry('');
    setWorry('');
    setRatio(50);
    // 동전 애니메이션도 초기화
    if (coinRef.current) coinRef.current.reset();
  };

  // [NEW] 뒤로가기 버튼 제어 (결과 화면에서만 작동)
  useEffect(() => {
    const backAction = () => {
      // 1. 결과가 나와있는 상태(result가 있음)라면?
      if (result) {
        reset(); // 다시하기(초기화) 실행
        return true; // "내가 처리했으니 앱 끄지 마!" (true 반환)
      }

      // 2. 애니메이션 중이라면?
      if (isAnimating) {
        // 취향에 따라 선택:
        return true; // 아무 반응 안 하게 하기 (실수 방지)
        //return false; // 그냥 앱 끄기
      }

      // 3. 입력 화면(첫 화면)이라면?
      return false; // "난 할 일 없으니 원래대로 앱 꺼도 돼" (false 반환)
    };

    // 이벤트 리스너 등록
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    // 컴포넌트가 사라질 때 리스너 청소 (필수!)
    return () => backHandler.remove();
  }, [result, isAnimating]); // result나 isAnimating 상태가 바뀔 때마다 판단 기준 업데이트

  return (
    <View style={styles.container}>

      {/* [화면 구성 논리]
        1. 애니메이션 중이면? -> 동전만 보여준다.
        2. 결과가 나왔으면? -> 결과 화면(ViewShot)과 버튼들을 보여준다.
        3. 둘 다 아니면(처음)? -> 입력창과 슬라이더를 보여준다.
      */}

      {/* --- 1. 애니메이션 화면 --- */}
      {isAnimating && (
        <View style={styles.centerContent}>
          <CoinFlip ref={coinRef} />
          <Text style={styles.animatingText}></Text>
        </View>
      )}

      {/* --- 2. 결과 화면 --- */}
      {!isAnimating && result && (
        <View style={{ width: '100%', alignItems: 'center' }}>
          {/* 캡처 영역: 고민 + 결과 */}
          <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.9 }} style={styles.captureCard}>
            <View style={styles.divider} />
            <Text style={styles.worryText}>"{capturedWorry}"</Text>

            {result === 'DO' ? (
              <Text style={[styles.resultBigText, styles.doIt]}>DO IT!</Text>
            ) : (
              <Text style={[styles.resultBigText, styles.dontDoIt]}>DON'T!</Text>
            )}

            {/* [NEW] 확률 정보 표시 */}
            <Text style={styles.ratioResultText}>
              {result === 'DO'
                ? `${Math.round(capturedRatio)}%`
                : `${100 - Math.round(capturedRatio)}%`
              }
            </Text>

            <Text style={styles.dateText}>{new Date().toLocaleDateString()}</Text>
          </ViewShot>

          {/* 버튼 영역: 다시하기 & 공유하기 */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#555' }]} onPress={reset}>
              <Text style={styles.actionButtonText}>🔄 다시하기</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#3b5998' }]} onPress={shareResult}>
              <Text style={styles.actionButtonText}>📤 공유하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* --- 3. 입력 화면 (초기 화면) --- */}
      {!isAnimating && !result && (
        <>
          {/* [NEW] 모드 전환 토글 버튼 */}
          <View style={styles.modeToggleContainer}>
            <TouchableOpacity
              onPress={() => setMode('BASIC')}
              style={[styles.modeButton, mode === 'BASIC' && styles.modeButtonActive]}
            >
              <Text style={[styles.modeText, mode === 'BASIC' && styles.modeTextActive]}>🎚️ 기본 모드</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMode('FUN')}
              style={[styles.modeButton, mode === 'FUN' && styles.modeButtonActive]}
            >
              <Text style={[styles.modeText, mode === 'FUN' && styles.modeTextActive]}>🎮 타이밍 모드</Text>
            </TouchableOpacity>
          </View>


          <View style={styles.logoContainer}>
            <LottieView
              // 나중에 'thinking.json' 같은 걸 받아서 assets/images에 넣고 경로를 바꾸세요.
              // 지금은 에러 방지를 위해 coin-flip을 씁니다.
              source={require('../../assets/images/Cat-Playing.json')}
              autoPlay
              loop // 계속 움직이게 함
              style={{ width: 150, height: 150 }} // 크기 조절
            />
          </View>

          <TextInput
            style={[styles.input, { textAlign: 'center' }]}
            placeholder="고민을 입력하세요"
            placeholderTextColor="#999"
            onChangeText={setWorry}
            value={worry}
            maxLength={50}
          />

          <View style={styles.sliderContainer}>
            <View style={styles.sliderLabels}>
              {/* [UPGRADE] 텍스트를 누르면 수치가 변함 (Hard 모드 기능) */}
              <TouchableOpacity onPress={() => adjustRatio(1)}>
                <Text style={[styles.sliderText, { color: ratio > 50 ? '#2ecc71' : '#ccc' }]}>
                  할래 {Math.round(ratio)}% {mode === 'BASIC' && "👆"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => adjustRatio(-1)}>
                <Text style={[styles.sliderText, { color: ratio < 50 ? '#e74c3c' : '#ccc' }]}>
                  {mode === 'BASIC' && "👆"} 말래 {100 - Math.round(ratio)}%
                </Text>
              </TouchableOpacity>
            </View>

            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={0}
              maximumValue={100}
              step={1} // 미세 조정을 위해 1로 변경
              value={ratio}
              onValueChange={setRatio}
              // [핵심] Fun 모드일 땐 사용자가 슬라이더를 못 움직이게 막음
              disabled={mode === 'FUN'}
              minimumTrackTintColor="#2ecc71"
              maximumTrackTintColor="#e74c3c"
              thumbTintColor={getSliderColor()}
            />

            <Text style={[styles.helpText, { color: getSliderColor() }]}>
              {mode === 'FUN'
                ? "타이밍을 맞춰 버튼을 누르세요!"
                : ratio === 50 ? "반반 확률로 결정!" : ratio > 50 ? "하고싶은 마음이 더 커요" : "하기싫은 마음이 더 커요"
              }
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={makeDecision} // Fun 모드일 때도 이 버튼을 누르면 그 시점의 확률로 결정됨
            style={{ width: '100%' }}
          >
            <View style={[styles.button, { backgroundColor: getSliderColor() }]}>
              <Text style={styles.buttonText}>
                {mode === 'FUN' ? "결정하기" : "결정하기"}
              </Text>
            </View>
          </TouchableOpacity>
        </>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // [NEW] 모드 토글 버튼 스타일
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    padding: 4,
    marginBottom: 100,
  },
  modeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  modeButtonActive: {
    backgroundColor: 'white',
    elevation: 2,
  },
  modeText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  modeTextActive: {
    color: '#333',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 40,
    color: '#333',
  },
  // [NEW] 로고 애니메이션의 위치를 잡아주는 스타일
  logoContainer: {
    marginBottom: 20, // 입력창과의 간격
    alignItems: 'center',
    justifyContent: 'center',
    height: 100, // 애니메이션이 들어갈 충분한 높이 확보
  },
  input: {
    width: '100%',
    backgroundColor: 'white',
    padding: 18,
    borderRadius: 15,
    fontSize: 18,
    marginBottom: 20,
    elevation: 2,
  },
  sliderContainer: {
    width: '100%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
    elevation: 2,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sliderText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  helpText: {
    textAlign: 'center',
    marginTop: 10,
    fontWeight: 'bold',
    fontSize: 14,
  },
  button: {
    width: '100%',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 5,
    height: 80,
  },
  buttonText: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 40,
  },
  // 애니메이션 관련 스타일
  animatingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
  },
  // 결과 카드 스타일 (캡처용)
  captureCard: {
    width: '100%',
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 5,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    color: '#888',
    marginBottom: 10,
  },
  divider: {
    width: 40,
    height: 4,
    backgroundColor: '#eee',
    borderRadius: 2,
    marginBottom: 20,
  },
  worryText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  resultBigText: {
    fontSize: 48,
    fontWeight: '900',
    marginBottom: 10,
  },
  doIt: { color: '#2ecc71' },
  dontDoIt: { color: '#e74c3c' },
  dateText: {
    marginTop: 20,
    color: '#ccc',
    fontSize: 12,
  },
  ratioResultText: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
    fontWeight: '500',
  },
  // 하단 버튼 그룹
  buttonGroup: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});