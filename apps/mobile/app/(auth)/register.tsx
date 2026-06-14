import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AuthTokens, User } from '@thunder-spark/shared';
import { Button, Input, ScreenHeader } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/lib/api';

export default function RegisterScreen() {
  const { signIn } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setLoading(true);
    setError('');
    const result = await apiRequest<{ user: User; tokens: AuthTokens }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    setLoading(false);
    if (!result.success) {
      setError(result.error.message);
      return;
    }
    await signIn(result.data.user, result.data.tokens);
    router.replace('/(tabs)/dashboard');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <ScreenHeader title="Create account" subtitle="Join Thunder and start grabbing blocks" />
          <View style={styles.form}>
            <Input placeholder="Full name" value={name} onChangeText={setName} />
            <Input autoCapitalize="none" keyboardType="email-address" placeholder="Email" value={email} onChangeText={setEmail} />
            <Input secureTextEntry placeholder="Password (min 8 characters)" value={password} onChangeText={setPassword} />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button title="Sign up" onPress={handleRegister} loading={loading} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.xl },
  form: { gap: 12, marginTop: spacing.lg },
  error: { color: colors.error, fontSize: 14 },
});
