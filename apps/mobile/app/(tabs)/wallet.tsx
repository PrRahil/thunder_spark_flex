import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Wallet, WalletTransaction } from '@thunder-spark/shared';
import { MIN_WALLET_BALANCE_CENTS } from '@thunder-spark/shared';
import { Button, Card, ScreenHeader } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { apiRequest, formatCents } from '@/lib/api';

export default function WalletScreen() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [paymentProvider, setPaymentProvider] = useState<'dodo' | 'stub'>('stub');
  const [loading, setLoading] = useState(true);
  const [recharging, setRecharging] = useState(false);

  const load = useCallback(async () => {
    const result = await apiRequest<{
      wallet: Wallet;
      transactions: WalletTransaction[];
      paymentProvider?: 'dodo' | 'stub';
    }>('/wallet');
    if (result.success) {
      setWallet(result.data.wallet);
      setTransactions(result.data.transactions);
      if (result.data.paymentProvider) setPaymentProvider(result.data.paymentProvider);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function recharge(amountCents: number) {
    setRecharging(true);

    if (paymentProvider === 'dodo') {
      const checkout = await apiRequest<{ checkoutUrl: string }>('/wallet/checkout', {
        method: 'POST',
        body: JSON.stringify({ amountCents }),
      });
      setRecharging(false);
      if (!checkout.success) {
        Alert.alert('Checkout failed', checkout.error.message);
        return;
      }
      await WebBrowser.openBrowserAsync(checkout.data.checkoutUrl);
      Alert.alert(
        'Complete payment',
        'Finish checkout in the browser. Your balance will update shortly after payment.',
      );
      setTimeout(load, 4000);
      return;
    }

    const result = await apiRequest('/wallet/recharge', {
      method: 'POST',
      body: JSON.stringify({ amountCents }),
    });
    setRecharging(false);
    if (!result.success) {
      Alert.alert('Recharge failed', result.error.message);
      return;
    }
    load();
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const lowBalance = (wallet?.balanceCents ?? 0) < MIN_WALLET_BALANCE_CENTS;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Wallet" subtitle="Pay per successful block grab" />

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available balance</Text>
          <Text style={styles.balance}>{formatCents(wallet?.balanceCents ?? 0)}</Text>
          {lowBalance ? (
            <View style={styles.warningRow}>
              <Ionicons name="warning" size={16} color={colors.warning} />
              <Text style={styles.warning}>
                Need at least {formatCents(MIN_WALLET_BALANCE_CENTS)} to start
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.rechargeRow}>
          <Button title="+ $25" onPress={() => recharge(2500)} loading={recharging} style={styles.rechargeBtn} />
          <Button title="+ $50" onPress={() => recharge(5000)} loading={recharging} style={styles.rechargeBtn} />
          <Button title="+ $100" onPress={() => recharge(10000)} loading={recharging} style={styles.rechargeBtn} />
        </View>
        <Text style={styles.stubNote}>
          {paymentProvider === 'dodo'
            ? 'Secure checkout via Dodo Payments (cards, UPI, PayPal)'
            : 'Dev mode: instant credit stub — configure Dodo on server for real payments'}
        </Text>

        <Text style={styles.sectionTitle}>Transactions</Text>
        {transactions.length === 0 ? (
          <Text style={styles.meta}>No transactions yet</Text>
        ) : (
          transactions.map((txn) => (
            <Card key={txn.id} style={styles.txnCard}>
              <View style={styles.txnRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txnDesc}>{txn.description}</Text>
                  <Text style={styles.meta}>{new Date(txn.createdAt).toLocaleString()}</Text>
                </View>
                <Text style={[styles.txnAmount, txn.type === 'DEBIT' && styles.debit]}>
                  {txn.type === 'DEBIT' ? '-' : '+'}
                  {formatCents(txn.amountCents)}
                </Text>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  balanceCard: {
    backgroundColor: colors.primaryMuted,
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.35)',
  },
  balanceLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  balance: { color: colors.primary, fontSize: 42, fontWeight: '900', marginTop: 8 },
  warningRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  warning: { color: colors.warning, fontSize: 13, flex: 1 },
  rechargeRow: { flexDirection: 'row', gap: 8 },
  rechargeBtn: { flex: 1, paddingVertical: 12 },
  stubNote: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: spacing.sm },
  meta: { color: colors.textMuted, fontSize: 12 },
  txnCard: { paddingVertical: 12, paddingHorizontal: 14 },
  txnRow: { flexDirection: 'row', alignItems: 'center' },
  txnDesc: { color: colors.text, fontWeight: '600', fontSize: 14 },
  txnAmount: { color: colors.success, fontWeight: '800', fontSize: 16 },
  debit: { color: colors.error },
});
