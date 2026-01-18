import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router'; // 화면에 들어올 때 감지하는 기능
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HistoryScreen() {
  const [history, setHistory] = useState<any[]>([]);

  // 화면이 '포커스' 될 때마다 실행 (탭 이동 시 새로고침 효과)
  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    try {
      const storedHistory = await AsyncStorage.getItem('decisionHistory');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.log('불러오기 실패');
    }
  };

  const clearHistory = async () => {
    Alert.alert("기록 삭제", "정말 다 지울까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem('decisionHistory');
          setHistory([]);
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>지난 고민들</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={clearHistory}>
            <Text style={styles.clearBtn}>전체 삭제</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.list}>
        {history.length === 0 ? (
          <Text style={styles.emptyText}>아직 고민한 기록이 없어요!</Text>
        ) : (
          history.map((item) => {
            // 1. 저장된 확률 가져오기 (예전 데이터라 ratio가 없으면 50으로 가정)
            const rawRatio = item.ratio ?? 50;

            // 2. 결과에 따라 보여줄 숫자 계산 (DO면 그대로, DONT면 100에서 뺌)
            const displayRatio = item.result === 'DO' ? rawRatio : 100 - rawRatio;
            const ratioLabel = item.result === 'DO' ? '할래' : '말래';

            return (
              <View key={item.id} style={styles.item}>
                {/* 왼쪽: 날짜와 고민 내용 */}
                <View style={styles.textContainer}>
                  <Text style={styles.date}>{item.date}</Text>
                  <Text style={styles.worryText}>{item.text}</Text>
                </View>

                {/* 오른쪽: 확률과 결과 */}
                <View style={styles.resultContainer}>
                  {/* 작은 글씨로 확률 표시 */}
                  <Text style={styles.ratioText}>
                    {ratioLabel} {Math.round(displayRatio)}%
                  </Text>

                  {/* 큰 글씨로 결과 표시 */}
                  <Text style={[styles.resultText, item.result === 'DO' ? styles.doIt : styles.dontDoIt]}>
                    {item.result === 'DO' ? '한다' : '안한다'}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60, // 상단 여백 (헤더가 없으므로)
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  clearBtn: {
    color: '#999',
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#999',
    fontSize: 16,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  // [NEW] 텍스트가 너무 길어지면 디자인이 깨지지 않게 영역 확보
  textContainer: {
    flex: 1,
    paddingRight: 10,
  },
  date: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 4,
  },
  worryText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  // [NEW] 오른쪽 결과 영역 정렬 (오른쪽 끝으로 붙임)
  resultContainer: {
    alignItems: 'flex-end',
    minWidth: 60, // 최소 너비 확보
  },
  // [NEW] 확률 표시용 작은 텍스트 스타일
  ratioText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2, // 결과 텍스트와의 간격
  },
  resultText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  doIt: { color: '#2ecc71' },
  dontDoIt: { color: '#e74c3c' },
});