import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Keyboard,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

export default function FeedbackScreen() {
  const [content, setContent] = useState('');
  const router = useRouter();

  // 메일 보내기 함수
  const sendEmail = async () => {
    const email = 'pjs930224@gmail.com';
    const subject = '[할래말래] 사용자 피드백';
    const body = content;

    // mailto URL 생성 (한글 깨짐 방지를 위해 인코딩 필요)
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // 열 수 있는지 확인 후 실행
    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);

      if (canOpen) {
        await Linking.openURL(mailtoUrl); // 여기서 사용자의 기본 메일 앱이 열립니다.
      } else {
        // 시뮬레이터거나 메일 앱이 아예 없는 경우
        Alert.alert("알림", "메일 앱을 열 수 없습니다. 직접 메일을 보내주세요!\n(pjs930224@gmail.com)");
      }
    } catch (err) {
      Alert.alert("오류", "메일 앱 실행 중 오류가 발생했습니다.");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Text style={styles.title}>개발자에게 편지쓰기 📮</Text>
        <Text style={styles.subtitle}>
          버그 제보, 기능 추가 요청, 응원 메시지 등{'\n'}
          자유롭게 이야기를 들려주세요!
        </Text>

        <TextInput
          style={styles.input}
          placeholder="여기에 내용을 적어주세요..."
          multiline={true} // 여러 줄 입력 가능
          textAlignVertical="top" // 안드로이드에서 글자가 위에서부터 시작하게
          value={content}
          onChangeText={setContent}
        />

        <TouchableOpacity style={styles.sendButton} onPress={sendEmail}>
          <Text style={styles.sendButtonText}>보내기</Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 20,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    lineHeight: 24,
  },
  input: {
    flex: 1, // 남은 공간 차지
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRadius: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 20,
  },
  sendButton: {
    backgroundColor: '#333',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  }
});