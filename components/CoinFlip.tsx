import LottieView from 'lottie-react-native';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

// forwardRef를 써야 부모(index.tsx)에서 이 애니메이션을 제어할 수 있습니다.
const CoinFlip = forwardRef((props, ref) => {
  const animationRef = useRef<LottieView>(null);

  // 부모 컴포넌트에서 사용할 수 있는 함수들을 정의합니다.
  useImperativeHandle(ref, () => ({
    play: () => {
      animationRef.current?.play(0); // 0프레임부터 재생
    },
    reset: () => {
      animationRef.current?.reset(); // 초기화
    }
  }));

  return (
    <View style={styles.container}>
      <LottieView
        ref={animationRef}
        // assets 폴더가 components 폴더의 한 단계 위에 있으므로 ../ 사용
        source={require('../assets/images/coin-flip.json')} 
        style={{ width: 500, height: 500 }}
        loop={false} // 한 번만 재생
        autoPlay={true}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CoinFlip;