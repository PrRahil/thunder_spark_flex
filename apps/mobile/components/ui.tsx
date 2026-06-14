import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import { colors, radius } from '@/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  style?: ViewStyle;
}

export function Button({ title, onPress, loading, disabled, variant = 'primary', style }: ButtonProps) {
  const variantStyle = {
    primary: styles.primary,
    secondary: styles.secondary,
    danger: styles.danger,
    ghost: styles.ghost,
  }[variant];

  const textStyle = {
    primary: styles.primaryText,
    secondary: styles.secondaryText,
    danger: styles.dangerText,
    ghost: styles.ghostText,
  }[variant];

  return (
    <Pressable
      style={[styles.base, variantStyle, (disabled || loading) && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.bg : colors.primary} />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Input(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.textMuted}
      {...props}
      style={[styles.input, props.style]}
    />
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{title}</Text>
      {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function Badge({ label, tone = 'default' }: { label: string; tone?: 'default' | 'success' | 'warning' | 'error' }) {
  const toneStyle = {
    default: styles.badgeDefault,
    success: styles.badgeSuccess,
    warning: styles.badgeWarning,
    error: styles.badgeError,
  }[tone];

  return (
    <View style={[styles.badge, toneStyle]}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  danger: { backgroundColor: colors.error },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.55 },
  primaryText: { color: colors.bg, fontSize: 16, fontWeight: '700' },
  secondaryText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  dangerText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  ghostText: { color: colors.textSecondary, fontSize: 15, fontWeight: '600' },
  input: {
    backgroundColor: colors.bgInput,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: { marginBottom: 8 },
  headerTitle: { color: colors.text, fontSize: 26, fontWeight: '800' },
  headerSubtitle: { color: colors.textSecondary, fontSize: 14, marginTop: 4, lineHeight: 20 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgeDefault: { backgroundColor: colors.primaryMuted },
  badgeSuccess: { backgroundColor: 'rgba(34, 197, 94, 0.15)' },
  badgeWarning: { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
  badgeError: { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
  badgeText: { color: colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
});
