import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BlockJob, FilterPreset } from '@thunder-spark/shared';
import { BLOCK_JOB_STATUS, SERVICE_FEE_CENTS } from '@thunder-spark/shared';
import { Badge, Button, Card } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { apiRequest, formatCents } from '@/lib/api';

function statusTone(status?: string): 'default' | 'success' | 'warning' | 'error' {
  if (status === BLOCK_JOB_STATUS.RUNNING) return 'warning';
  if (status === BLOCK_JOB_STATUS.SUCCESS) return 'success';
  if (status === BLOCK_JOB_STATUS.FAILED) return 'error';
  return 'default';
}

export default function DashboardScreen() {
  const { user, signOut } = useAuth();
  const [filters, setFilters] = useState<FilterPreset[]>([]);
  const [activeJob, setActiveJob] = useState<BlockJob | null>(null);
  const [selectedFilterId, setSelectedFilterId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const refresh = useCallback(async () => {
    const [filtersRes, jobsRes] = await Promise.all([
      apiRequest<FilterPreset[]>('/filters'),
      apiRequest<BlockJob[]>('/block-jobs'),
    ]);
    if (filtersRes.success) {
      setFilters(filtersRes.data);
      if (!selectedFilterId && filtersRes.data[0]) setSelectedFilterId(filtersRes.data[0].id);
    }
    if (jobsRes.success) {
      const running = jobsRes.data.find(
        (j) => j.status === BLOCK_JOB_STATUS.RUNNING || j.status === BLOCK_JOB_STATUS.PAUSED,
      );
      setActiveJob(running ?? jobsRes.data[0] ?? null);
    }
    setLoading(false);
  }, [selectedFilterId]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [refresh]);

  async function handleStart() {
    if (!selectedFilterId) {
      Alert.alert('No filter', 'Create a filter preset in the Filters tab first.');
      return;
    }
    setActionLoading(true);
    const result = await apiRequest<BlockJob>('/block-jobs/start', {
      method: 'POST',
      body: JSON.stringify({ filterPresetId: selectedFilterId }),
    });
    setActionLoading(false);
    if (!result.success) {
      Alert.alert('Cannot start', result.error.message);
      return;
    }
    setActiveJob(result.data);
    refresh();
  }

  async function handleStop() {
    if (!activeJob) return;
    setActionLoading(true);
    await apiRequest(`/block-jobs/${activeJob.id}/stop`, { method: 'POST' });
    setActionLoading(false);
    refresh();
  }

  const isRunning = activeJob?.status === BLOCK_JOB_STATUS.RUNNING;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.greeting}>Hey, {user?.name?.split(' ')[0]}</Text>
            <Text style={styles.sub}>Fee per grab: {formatCents(SERVICE_FEE_CENTS)}</Text>
          </View>
          <Pressable onPress={signOut} style={styles.iconBtn}>
            <Ionicons name="log-out-outline" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.cardLabel}>Engine status</Text>
            <Badge label={activeJob?.status ?? 'IDLE'} tone={statusTone(activeJob?.status)} />
          </View>
          {activeJob?.pollCount != null ? (
            <Text style={styles.meta}>API polls: {activeJob.pollCount}</Text>
          ) : null}
          {activeJob?.grabbedBlock ? (
            <View style={styles.grabbedBox}>
              <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              <View style={{ flex: 1 }}>
                <Text style={styles.grabbedTitle}>Block grabbed!</Text>
                <Text style={styles.grabbedText}>
                  {formatCents(activeJob.grabbedBlock.wageCents)} ·{' '}
                  {activeJob.grabbedBlock.locationName}
                </Text>
              </View>
            </View>
          ) : null}
          {activeJob?.lastError ? <Text style={styles.error}>{activeJob.lastError}</Text> : null}
        </Card>

        <Card>
          <Text style={styles.cardLabel}>Active filter</Text>
          {filters.length === 0 ? (
            <Text style={styles.meta}>No filters yet — add one in the Filters tab.</Text>
          ) : (
            filters.map((f) => (
              <Pressable
                key={f.id}
                style={[styles.filterChip, selectedFilterId === f.id && styles.filterChipActive]}
                onPress={() => setSelectedFilterId(f.id)}
              >
                <Ionicons
                  name={selectedFilterId === f.id ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={selectedFilterId === f.id ? colors.primary : colors.textMuted}
                />
                <Text style={styles.filterChipText}>{f.name}</Text>
              </Pressable>
            ))
          )}
        </Card>

        <Button
          title={isRunning ? 'STOP SEARCH' : 'START SEARCH'}
          onPress={isRunning ? handleStop : handleStart}
          loading={actionLoading}
          variant={isRunning ? 'danger' : 'primary'}
          style={styles.startBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { color: colors.text, fontSize: 26, fontWeight: '800' },
  sub: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusCard: { borderColor: 'rgba(250, 204, 21, 0.25)' },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  meta: { color: colors.textSecondary, fontSize: 14 },
  grabbedBox: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  grabbedTitle: { color: colors.success, fontWeight: '700', fontSize: 15 },
  grabbedText: { color: colors.text, marginTop: 2, fontSize: 14 },
  error: { color: colors.error, fontSize: 14, marginTop: 8 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.bgInput,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  filterChipText: { color: colors.text, fontWeight: '600' },
  startBtn: { marginTop: spacing.sm, paddingVertical: 20 },
});
