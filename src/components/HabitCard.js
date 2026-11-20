import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { getIconMeta } from '../constants/icons';

export default function HabitCard({
  habit,
  log,
  onToggleCheck,
  onIncrement,
  onStartTimer,
  onPress,
}) {
  const { themeMode } = useAuth();
  const colors = Colors[themeMode === 'LIGHT' ? 'light' : 'dark'];

  const target = habit.targetValue || 1;
  const loggedValue = log ? log.value : 0;
  const isCompleted = log ? log.completed : false;
  const progressRatio = Math.min(1, Math.max(0, loggedValue / target));
  const progressPercent = Math.round(progressRatio * 100);
  const iconMeta = getIconMeta(habit.iconKey);

  // Binance accent color for the habit
  const habitColor = habit.colorHex || colors.primary;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: isCompleted ? 'rgba(14, 203, 129, 0.4)' : colors.border,
        },
      ]}
      activeOpacity={0.88}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        {/* Sleek Minimalist Badge (Binance Asset Icon Style) */}
        <View
          style={[
            styles.cryptoBadge,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: isCompleted ? colors.primary : colors.borderSubtle,
            },
          ]}
        >
          <MaterialIcons
            name={iconMeta.name}
            size={20}
            color={isCompleted ? colors.primary : habitColor}
          />
        </View>

        {/* Info Column */}
        <View style={styles.infoCol}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {habit.name}
            </Text>
            {isCompleted && (
              <View style={[styles.completedBadge, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.completedBadgeText, { color: colors.primary }]}>DONE</Text>
              </View>
            )}
          </View>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Target: {habit.targetValue} {habit.unitLabel} ·{' '}
            <Text style={{ color: isCompleted ? colors.primary : colors.accent, fontWeight: '700' }}>
              {loggedValue} {habit.unitLabel} ({progressPercent}%)
            </Text>
          </Text>
        </View>

        {/* Action Controls */}
        <View style={styles.actionCol}>
          {habit.goalType === 'CHECK_OFF' && (
            <TouchableOpacity
              style={[
                styles.checkToggle,
                {
                  backgroundColor: isCompleted ? colors.primary : colors.surfaceElevated,
                  borderColor: isCompleted ? colors.primary : colors.border,
                },
              ]}
              activeOpacity={0.8}
              onPress={onToggleCheck}
            >
              {isCompleted ? (
                <MaterialIcons name="check" size={18} color="#181A20" />
              ) : (
                <View style={[styles.uncheckedDot, { backgroundColor: colors.textMuted }]} />
              )}
            </TouchableOpacity>
          )}

          {habit.goalType === 'COUNT' && (
            <View style={[styles.counterStepper, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => onIncrement(-1)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="remove" size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              <Text style={[styles.stepperVal, { color: isCompleted ? colors.primary : colors.text }]}>
                {loggedValue}
              </Text>

              <TouchableOpacity
                style={[styles.stepperBtn, { backgroundColor: colors.primaryLight }]}
                onPress={() => onIncrement(1)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="add" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}

          {habit.goalType === 'DURATION' && (
            <TouchableOpacity
              style={[
                styles.timerPill,
                {
                  backgroundColor: isCompleted ? colors.primaryLight : colors.surfaceElevated,
                  borderColor: isCompleted ? colors.primary : colors.border,
                },
              ]}
              activeOpacity={0.8}
              onPress={onStartTimer}
            >
              <MaterialIcons
                name={isCompleted ? 'check-circle' : 'play-arrow'}
                size={16}
                color={isCompleted ? colors.primary : colors.accent}
              />
              <Text
                style={[
                  styles.timerPillText,
                  { color: isCompleted ? colors.primary : colors.text },
                ]}
              >
                {loggedValue > 0 ? `${loggedValue}m` : 'Timer'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Sleek Minimalist 3px Progress Line */}
      <View style={[styles.progressTrack, { backgroundColor: colors.borderSubtle }]}>
        <View
          style={[
            styles.progressLine,
            {
              width: `${progressPercent}%`,
              backgroundColor: isCompleted ? colors.primary : colors.accent,
            },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cryptoBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  completedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 6,
  },
  completedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 3,
    fontWeight: '500',
  },
  actionCol: {
    marginLeft: 10,
  },
  checkToggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uncheckedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  counterStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  stepperBtn: {
    width: 28,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperVal: {
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 8,
    fontVariant: ['tabular-nums'],
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  timerPillText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    height: 3,
    borderRadius: 1.5,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressLine: {
    height: '100%',
    borderRadius: 1.5,
  },
});
