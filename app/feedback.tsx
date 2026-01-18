import * as MailComposer from 'expo-mail-composer';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Keyboard,
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
    // 1. 메일 기능 사용 가능한지 체크
    const isAvailable = await MailComposer.isAvailableAsync();

    if (!isAvailable) {
      Alert.alert("알림", "이 기기에서는 메일 앱을 실행할 수 없습니다.\n직접 메일을 보내주세요!\n(pjs930224@gmail.com)");
      return;
    }

    // 2. 내용이 없으면 경고
    if (content.trim() === '') {
      Alert.alert("알림", "내용을 입력해주세요!");
      return;
    }

    // 3. 메일 창 띄우기
    try {
      await MailComposer.composeAsync({
        recipients: ['pjs930224@gmail.com'], // 여기에 개발자님 이메일 입력!
        subject: '[할래말래] 사용자 피드백', // 메일 제목
        body: content, // 사용자가 입력한 내용
      });
      
      // 메일 앱 갔다 오면 감사 인사 (정확히는 메일 전송 성공 여부를 완벽히 알 순 없지만 UX상 보여줌)
      Alert.alert("감사합니다", "소중한 의견이 개발자에게 전달되었습니다! 💌", [
        { text: "확인", onPress: () => router.back() } // 뒤로 가기
      ]);
      
    } catch (error) {
      Alert.alert("오류", "메일 앱을 여는 도중 문제가 발생했습니다.");
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