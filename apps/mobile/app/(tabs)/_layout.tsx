import { Tabs, Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth-context';
import { APP_NAME, colors } from '@/constants/theme';

export default function TabsLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgElevated },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        tabBarStyle: {
          backgroundColor: colors.bgElevated,
          borderTopColor: colors.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: APP_NAME,
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="flash" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="filters"
        options={{
          title: 'Filters',
          tabBarIcon: ({ color, size }) => <Ionicons name="options" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color, size }) => <Ionicons name="wallet" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="provider"
        options={{
          title: 'Connect',
          tabBarIcon: ({ color, size }) => <Ionicons name="link" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
});
