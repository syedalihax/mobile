import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';

export default function ActiveTimerModal({
  visible,
  habit,
  onCommit,
  onDiscard,
}) {
  const { themeMode } = useAuth();
  const colors = Colors[themeMode === 'LIGHT' ? 'light' : 'dark'];

  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    let interval = null;
    if (visible && isRunning) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [visible, isRunning]);

  if (!habit) return null;

  const minutes = Math.floor(secondsElapsed / 60);
  const seconds = secondsElapsed % 60;
  const targetMinutes = habit.targetValue || 30;
  const progressRatio = Math.min(1, minutes / targetMinutes);

  const formatTime = (m, s) => {
    const mm = m < 10 ? `0${m}` : `${m}`;
    const ss = s < 10 ? `0${s}` : `${s}`;
    return `${mm}:${ss}`;
  };

  const handleCommit = () => {
    // If under 1 minute, commit at least 1 minute or the exact minutes
    const loggedMinutes = Math.max(1, Math.round(secondsElapsed / 60));
    onCommit(loggedMinutes);
    setSecondsElapsed(0);
    setIsRunning(true);
  };

  const handleDiscard = () => {
    setSecondsElapsed(0);
    setIsRunning(true);
    onDiscard();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={[styles.dialog, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{habit.name}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Target: {targetMinutes} min
            </Text>
          </View>

          {/* Large Stopwatch Display */}
          <View style={styles.timerCircle}>
            <Text style={[styles.timeText, { color: colors.accent }]}>
              {formatTime(minutes, seconds)}
            </Text>
            <Text style={[styles.minLabel, { color: colors.textSecondary }]}>
              {minutes >= targetMinutes ? '🎉 Target Reached!' : `${targetMinutes - minutes} min left`}
            </Text>
          </View>

          {/* Action buttons */}
          <View style={styles.btnRow}>
            {/* Play / Pause */}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.surfaceElevated }]}
              onPress={() => setIsRunning(!isRunning)}
            >
              <MaterialIcons
                name={isRunning ? 'pause' : 'play-arrow'}
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>

            {/* Commit / Save */}
            <TouchableOpacity
              style={[styles.commitBtn, { backgroundColor: colors.primary }]}
              onPress={handleCommit}
            >
              <MaterialIcons name="check" size={20} color="#FFFFFF" />
              <Text style={styles.commitBtnText}>Save {Math.max(1, Math.round(secondsElapsed / 60))}m</Text>
            </TouchableOpacity>

            {/* Discard */}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.dangerLight }]}
              onPress={handleDiscard}
            >
              <MaterialIcons name="close" size={24} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  timerCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 4,
    borderColor: 'rgba(240, 185, 11, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  timeText: {
    fontSize: 34,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  minLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
  },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commitBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  commitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 6,
  },
});
