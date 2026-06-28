import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ProviderConnection } from '@thunder-spark/shared';
import { PROVIDERS } from '@thunder-spark/shared';
import { Badge, Button, Card, ScreenHeader } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { apiRequest } from '@/lib/api';

export default function ProviderScreen() {
  const [connections, setConnections] = useState<ProviderConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const load = useCallback(async () => {
    const result = await apiRequest<ProviderConnection[]>('/providers');
    if (result.success) setConnections(result.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function connectAmazonFlex() {
    setConnecting(true);
    const result = await apiRequest<ProviderConnection>('/providers/connect', {
      method: 'POST',
      body: JSON.stringify({ provider: PROVIDERS.AMAZON_FLEX, sessionPayload: { stub: true } }),
    });
    setConnecting(false);
    if (!result.success) {
      Alert.alert('Connect failed', result.error.message);
      return;
    }
    Alert.alert('Connected', 'Amazon Flex linked (dev mode).');
    load();
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const flex = connections.find((c) => c.provider === PROVIDERS.AMAZON_FLEX);
  const connected = flex?.status === 'ACTIVE';

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Connect" subtitle="Link your delivery provider accounts" />

        <Card style={connected ? styles.connectedCard : undefined}>
          <View style={styles.providerRow}>
            <View style={styles.iconBox}>
              <Ionicons name="cube" size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.providerName}>Amazon Flex</Text>
              <Text style={styles.providerSub}>Primary · US, AU & more</Text>
            </View>
            <Badge
              label={connected ? 'Active' : 'Offline'}
              tone={connected ? 'success' : 'default'}
            />
          </View>
          {flex?.expiresAt ? (
            <Text style={styles.meta}>
              Session expires {new Date(flex.expiresAt).toLocaleString()}
            </Text>
          ) : null}
          <Button
            title={connected ? 'Reconnect Flex' : 'Connect Amazon Flex'}
            onPress={connectAmazonFlex}
            loading={connecting}
            variant={connected ? 'secondary' : 'primary'}
            style={{ marginTop: spacing.md }}
          />
        </Card>

        <Card style={styles.comingSoon}>
          <Text style={styles.comingTitle}>Coming soon</Text>
          {['Uber', 'Zomato', 'DoorDash'].map((name) => (
            <View key={name} style={styles.comingRow}>
              <Ionicons name="time-outline" size={16} color={colors.textMuted} />
              <Text style={styles.comingText}>{name}</Text>
            </View>
          ))}
        </Card>

        <Card style={styles.noteCard}>
          <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
          <Text style={styles.note}>
            Production uses secure WebView login. Session tokens are encrypted on our servers —
            never shared.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  connectedCard: { borderColor: 'rgba(34, 197, 94, 0.3)' },
  providerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerName: { color: colors.text, fontSize: 18, fontWeight: '700' },
  providerSub: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 10 },
  comingSoon: { opacity: 0.7 },
  comingTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  comingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  comingText: { color: colors.textSecondary, fontSize: 14 },
  noteCard: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: colors.bgInput,
  },
  note: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, flex: 1 },
});
