import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AuthTokens, User } from '@thunder-spark/shared';
import { Button, Input } from '@/components/ui';
import { APP_NAME, colors, spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/lib/api';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError('');
    const result = await apiRequest<{ user: User; tokens: AuthTokens }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
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
          <LinearGradient colors={['#1A1400', colors.bg]} style={styles.hero}>
            <View style={styles.logoRow}>
              <Ionicons name="flash" size={28} color={colors.primary} />
              <Text style={styles.logoText}>{APP_NAME}</Text>
            </View>
            <Text style={styles.tagline}>Grab the best delivery blocks</Text>
            <Text style={styles.sub}>Maximize earnings · Save time · Drive smarter</Text>
          </LinearGradient>

          <View style={styles.form}>
            <Input
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
            />
            <Input
              secureTextEntry
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button title="Sign in" onPress={handleLogin} loading={loading} style={{ marginTop: spacing.sm }} />
            <Link href="/(auth)/register" asChild>
              <Text style={styles.link}>Create an account</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  hero: {
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.2)',
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  logoText: { color: colors.primary, fontSize: 32, fontWeight: '900', letterSpacing: 1 },
  tagline: { color: colors.text, fontSize: 22, fontWeight: '700' },
  sub: { color: colors.textSecondary, fontSize: 14, marginTop: 8, lineHeight: 20 },
  form: { gap: 12 },
  error: { color: colors.error, fontSize: 14 },
  link: { color: colors.primary, textAlign: 'center', marginTop: spacing.md, fontSize: 15, fontWeight: '600' },
});
