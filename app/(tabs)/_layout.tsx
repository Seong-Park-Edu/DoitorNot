import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import React from 'react';
import { Pressable } from 'react-native';

// 탭 바 아이콘을 위한 도우미 함수 (기존에 있다면 그대로 두셔도 됩니다)
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        // 탭 바의 활성 색상 (앱 스타일에 맞춰 수정 가능)
        tabBarActiveTintColor: '#2ecc71', 
        headerShown: true, // 헤더가 보여야 버튼도 보입니다!
      }}>
      
      {/* 1. 홈 화면 (index) 설정 */}
      <Tabs.Screen
        name="index"
        options={{
          title: '할래말래',
          tabBarIcon: ({ color }) => <TabBarIcon name="check-circle" color={color} />,
          
          // [핵심] 헤더 오른쪽에 피드백 버튼 추가
          headerRight: () => (
            <Link href="/feedback" asChild>
              <Pressable>
                {({ pressed }) => (
                  <FontAwesome
                    name="envelope-o" // 편지 봉투 아이콘
                    size={24}
                    color="#807f7f"
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />

      {/* 2. 기록 화면 (history) 설정 */}
      <Tabs.Screen
        name="history"
        options={{
          title: '지난 고민',
          tabBarIcon: ({ color }) => <TabBarIcon name="history" color={color} />,
        }}
      />
    </Tabs>
  );
}