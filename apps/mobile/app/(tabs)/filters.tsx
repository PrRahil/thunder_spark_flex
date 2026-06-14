import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { FilterPreset } from '@thunder-spark/shared';
import { Button, Card, Input, ScreenHeader } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { apiRequest, formatCents } from '@/lib/api';

export default function FiltersScreen() {
  const [filters, setFilters] = useState<FilterPreset[]>([]);
  const [name, setName] = useState('Morning blocks');
  const [location, setLocation] = useState('DSE2');
  const [minWage, setMinWage] = useState('150');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const result = await apiRequest<FilterPreset[]>('/filters');
    if (result.success) setFilters(result.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createFilter() {
    setSaving(true);
    const today = new Date().toISOString().slice(0, 10);
    const result = await apiRequest<FilterPreset>('/filters', {
      method: 'POST',
      body: JSON.stringify({
        name,
        dates: [today],
        timeRanges: [{ startHour: 6, startMinute: 0, endHour: 22, endMinute: 0 }],
        locations: [location],
        minWageCents: Math.round(parseFloat(minWage || '0') * 100),
      }),
    });
    setSaving(false);
    if (!result.success) {
      Alert.alert('Error', result.error.message);
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

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Filters" subtitle="Tailor blocks by date, time, location & wage" />

        {filters.map((f) => (
          <Card key={f.id} style={styles.presetCard}>
            <View style={styles.presetHeader}>
              <Ionicons name="funnel" size={18} color={colors.primary} />
              <Text style={styles.presetName}>{f.name}</Text>
            </View>
            <Text style={styles.meta}>Locations: {f.locations.join(', ')}</Text>
            <Text style={styles.meta}>Dates: {f.dates.join(', ')}</Text>
            {f.minWageCents ? <Text style={styles.meta}>Min wage: {formatCents(f.minWageCents)}</Text> : null}
          </Card>
        ))}

        <Card style={styles.createCard}>
          <Text style={styles.createTitle}>Quick create</Text>
          <Input placeholder="Preset name" value={name} onChangeText={setName} />
          <Input placeholder="Location code (e.g. DSE2)" value={location} onChangeText={setLocation} />
          <Input placeholder="Min wage ($)" keyboardType="numeric" value={minWage} onChangeText={setMinWage} />
          <Button title="Save filter" onPress={createFilter} loading={saving} style={{ marginTop: 8 }} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  presetCard: { gap: 4 },
  presetHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  presetName: { color: colors.text, fontSize: 17, fontWeight: '700' },
  meta: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  createCard: { gap: 10, marginTop: spacing.sm },
  createTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
});
