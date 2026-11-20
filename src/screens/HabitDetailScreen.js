import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { categoriesAPI, logsAPI } from '../services/api';
import { ICON_OPTIONS, COLOR_OPTIONS, getIconMeta } from '../constants/icons';
import ConsistencyBarChart from '../components/ConsistencyBarChart';
import ActiveTimerModal from '../components/ActiveTimerModal';

export default function HabitDetailScreen({ route, navigation }) {
  const { habitId, habit: initialHabit } = route.params || {};
  const { themeMode } = useAuth();
  const insets = useSafeAreaInsets();
  const colors = Colors[themeMode === 'LIGHT' ? 'light' : 'dark'];

  const [detailData, setDetailData] = useState(
    initialHabit
      ? {
          category: initialHabit,
          delta24h: {
            todayValue: 0,
            yesterdayValue: 0,
            difference: 0,
            percentageChange: 0,
            isPositive: true,
            unitLabel: initialHabit.unitLabel || 'done',
          },
          chartPoints: [],
          stats: {
            streak: 0,
            completedDays: 0,
            evaluatedDays: 0,
            completionRate: 0,
            totalLoggedValue: 0,
          },
          todayLog: null,
        }
      : null
  );
  const [loading, setLoading] = useState(!initialHabit);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedChartIndex, setSelectedChartIndex] = useState(0);

  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(initialHabit ? initialHabit.name : '');
  const [editTarget, setEditTarget] = useState(initialHabit ? initialHabit.targetValue.toString() : '1');
  const [editUnit, setEditUnit] = useState(initialHabit ? initialHabit.unitLabel : 'done');
  const [editIcon, setEditIcon] = useState(initialHabit ? initialHabit.iconKey || 'code' : 'code');
  const [editColor, setEditColor] = useState(initialHabit ? initialHabit.colorHex || '#0ECB81' : '#0ECB81');
  const [savingEdit, setSavingEdit] = useState(false);

  // Active duration timer
  const [activeTimerHabit, setActiveTimerHabit] = useState(null);

  const fetchDetail = useCallback(async () => {
    try {
      const res = await categoriesAPI.getAnalytics(habitId);
      if (res.data?.data) {
        setDetailData(res.data.data);
        const points = res.data.data?.chartPoints || [];
        setSelectedChartIndex(points.length > 0 ? points.length - 1 : 0);
      }
    } catch (err) {
      console.warn('Error fetching habit detail:', err.message);
      if (!initialHabit) {
        Alert.alert('Notice', 'Make sure your backend server is restarted with npm start');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [habitId, initialHabit]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDetail();
  };

  const openEditModal = () => {
    if (!detailData?.category) return;
    const cat = detailData.category;
    setEditName(cat.name);
    setEditTarget(cat.targetValue.toString());
    setEditUnit(cat.unitLabel);
    setEditIcon(cat.iconKey || 'code');
    setEditColor(cat.colorHex || '#0ECB81');
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      Alert.alert('Required', 'Please enter habit name');
      return;
    }
    setSavingEdit(true);
    try {
      await categoriesAPI.update(habitId, {
        name: editName.trim(),
        targetValue: parseInt(editTarget, 10) || 1,
        unitLabel: editUnit.trim(),
        iconKey: editIcon,
        colorHex: editColor,
      });
      setEditModalVisible(false);
      fetchDetail();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save habit');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Habit',
      `Are you sure you want to delete "${detailData?.category?.name}" and all historical logs?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await categoriesAPI.delete(habitId);
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete habit');
            }
          },
        },
      ]
    );
  };

  // Quick logging actions
  const handleToggleCheck = async () => {
    try {
      await logsAPI.toggleCheck(habitId);
      fetchDetail();
    } catch (err) {
      console.error('Error toggling check:', err);
    }
  };

  const handleIncrement = async (delta) => {
    try {
      await logsAPI.increment(habitId, undefined, delta);
      fetchDetail();
    } catch (err) {
      console.error('Error incrementing:', err);
    }
  };

  const handleCommitTimer = async (loggedMinutes) => {
    try {
      const currentVal = detailData?.todayLog ? detailData.todayLog.value : 0;
      await logsAPI.setProgress(habitId, undefined, currentVal + loggedMinutes);
      setActiveTimerHabit(null);
      fetchDetail();
    } catch (err) {
      console.error('Error committing timer:', err);
    }
  };

  if (loading || !detailData) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const { category, delta24h, chartPoints, stats, todayLog } = detailData;
  const iconMeta = getIconMeta(category.iconKey);
  const isCompleted = todayLog ? todayLog.completed : false;
  const currentTodayValue = todayLog ? todayLog.value : 0;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: Math.max(insets.top + 8, 36),
        },
      ]}
    >
      {/* Top Navbar */}
      <View style={[styles.navBar, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.navTitle, { color: colors.text }]} numberOfLines={1}>
          {category.name}
        </Text>

        <View style={styles.navActions}>
          <TouchableOpacity style={styles.actionIcon} onPress={openEditModal}>
            <MaterialIcons name="edit" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon} onPress={handleDelete}>
            <MaterialIcons name="delete-outline" size={20} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Binance Style Asset Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.assetHeaderRow}>
            <View
              style={[
                styles.assetBadge,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: isCompleted ? colors.primary : colors.borderSubtle,
                },
              ]}
            >
              <MaterialIcons
                name={iconMeta.name}
                size={24}
                color={isCompleted ? colors.primary : category.colorHex || colors.accent}
              />
            </View>

            <View style={styles.assetHeaderInfo}>
              <Text style={[styles.assetName, { color: colors.text }]}>{category.name}</Text>
              <Text style={[styles.assetSub, { color: colors.textSecondary }]}>
                Target: {category.targetValue} {category.unitLabel} / day · {category.goalType}
              </Text>
            </View>
          </View>

          {/* Today's Logged Value */}
          <View style={styles.valueRow}>
            <Text style={[styles.bigValue, { color: colors.text }]}>
              {currentTodayValue}{' '}
              <Text style={[styles.unitText, { color: colors.textSecondary }]}>{category.unitLabel}</Text>
            </Text>
            {isCompleted && (
              <View style={[styles.doneTag, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.doneTagText, { color: colors.primary }]}>TARGET REACHED</Text>
              </View>
            )}
          </View>

          {/* Binance 24h Delta: Yesterday vs Today comparison! */}
          <View
            style={[
              styles.deltaPill,
              {
                backgroundColor: delta24h.isPositive ? colors.primaryLight : colors.dangerLight,
                borderColor: delta24h.isPositive ? colors.primary : colors.danger,
              },
            ]}
          >
            <MaterialIcons
              name={delta24h.isPositive ? 'trending-up' : 'trending-down'}
              size={18}
              color={delta24h.isPositive ? colors.primary : colors.danger}
            />
            <Text
              style={[
                styles.deltaText,
                { color: delta24h.isPositive ? colors.primary : colors.danger },
              ]}
            >
              24h Change: {delta24h.isPositive ? `+${delta24h.percentageChange}%` : `${delta24h.percentageChange}%`}{' '}
              ({delta24h.difference >= 0 ? `+${delta24h.difference}` : delta24h.difference} {delta24h.unitLabel})
            </Text>
          </View>

          <Text style={[styles.comparisonSub, { color: colors.textSecondary }]}>
            Yesterday: {delta24h.yesterdayValue} {delta24h.unitLabel} ➔ Today: {delta24h.todayValue}{' '}
            {delta24h.unitLabel}
          </Text>
        </View>

        {/* 14-Day Consistency Chart for this habit */}
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>14-Day Consistency History</Text>
        </View>

        <ConsistencyBarChart
          points={chartPoints}
          selectedIndex={selectedChartIndex}
          onSelectIndex={setSelectedChartIndex}
          height={170}
          showToggle={true}
          defaultChartType="curve"
        />

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MaterialIcons name="local-fire-department" size={20} color={colors.accent} />
            <Text style={[styles.statVal, { color: colors.accent }]}>{stats.streak} Days</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Current Streak</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MaterialIcons name="done-all" size={20} color={colors.primary} />
            <Text style={[styles.statVal, { color: colors.primary }]}>{stats.completionRate}%</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>30D Completion</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MaterialIcons name="analytics" size={20} color={colors.blue} />
            <Text style={[styles.statVal, { color: colors.text }]}>
              {stats.completedDays}/{stats.evaluatedDays}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Days Completed</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MaterialIcons name="insights" size={20} color={colors.text} />
            <Text style={[styles.statVal, { color: colors.text }]}>{stats.totalLoggedValue}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total {category.unitLabel}</Text>
          </View>
        </View>

        {/* Quick Log Controls */}
        <View style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.actionCardTitle, { color: colors.text }]}>Log Progress Today</Text>

          {category.goalType === 'CHECK_OFF' && (
            <TouchableOpacity
              style={[
                styles.largeCheckBtn,
                {
                  backgroundColor: isCompleted ? colors.primary : colors.surfaceElevated,
                  borderColor: isCompleted ? colors.primary : colors.border,
                },
              ]}
              onPress={handleToggleCheck}
            >
              <MaterialIcons
                name={isCompleted ? 'check-circle' : 'radio-button-unchecked'}
                size={24}
                color={isCompleted ? '#181A20' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.largeCheckText,
                  { color: isCompleted ? '#181A20' : colors.text },
                ]}
              >
                {isCompleted ? 'Completed Today!' : 'Mark Completed'}
              </Text>
            </TouchableOpacity>
          )}

          {category.goalType === 'COUNT' && (
            <View style={styles.counterControlRow}>
              <TouchableOpacity
                style={[styles.countStepBtn, { backgroundColor: colors.surfaceElevated }]}
                onPress={() => handleIncrement(-1)}
              >
                <MaterialIcons name="remove" size={24} color={colors.text} />
              </TouchableOpacity>

              <Text style={[styles.countDisplay, { color: colors.text }]}>
                {currentTodayValue}{' '}
                <Text style={{ fontSize: 14, color: colors.textSecondary }}>/ {category.targetValue}</Text>
              </Text>

              <TouchableOpacity
                style={[styles.countStepBtn, { backgroundColor: colors.primaryLight }]}
                onPress={() => handleIncrement(1)}
              >
                <MaterialIcons name="add" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}

          {category.goalType === 'DURATION' && (
            <View style={styles.durationActionWrap}>
              <TouchableOpacity
                style={[styles.bigTimerBtn, { backgroundColor: colors.accent }]}
                onPress={() => setActiveTimerHabit(category)}
              >
                <MaterialIcons name="timer" size={20} color="#181A20" />
                <Text style={styles.bigTimerBtnText}>Start Live Stopwatch</Text>
              </TouchableOpacity>

              <View style={styles.quickAddRow}>
                {[15, 30, 45].map((mins) => (
                  <TouchableOpacity
                    key={mins}
                    style={[styles.quickAddChip, { backgroundColor: colors.surfaceElevated }]}
                    onPress={() => handleIncrement(mins)}
                  >
                    <Text style={[styles.quickAddChipText, { color: colors.text }]}>+{mins}m</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Edit Habit Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Habit</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Habit Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={editName}
                onChangeText={setEditName}
              />

              {category.goalType !== 'CHECK_OFF' && (
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Target</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      keyboardType="numeric"
                      value={editTarget}
                      onChangeText={setEditTarget}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Unit</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      value={editUnit}
                      onChangeText={setEditUnit}
                    />
                  </View>
                </View>
              )}

              <Text style={[styles.formLabel, { color: colors.textSecondary, marginTop: 14 }]}>Icon</Text>
              <View style={styles.pickerGrid}>
                {ICON_OPTIONS.map((ico) => {
                  const isSel = editIcon === ico.key;
                  return (
                    <TouchableOpacity
                      key={ico.key}
                      style={[
                        styles.iconOption,
                        { borderColor: isSel ? colors.primary : colors.border },
                        isSel && { backgroundColor: colors.primaryLight },
                      ]}
                      onPress={() => setEditIcon(ico.key)}
                    >
                      <MaterialIcons name={ico.name} size={22} color={isSel ? colors.primary : colors.textSecondary} />
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.formLabel, { color: colors.textSecondary, marginTop: 14 }]}>Color</Text>
              <View style={styles.colorRow}>
                {COLOR_OPTIONS.map((col) => {
                  const isSel = editColor === col;
                  return (
                    <TouchableOpacity
                      key={col}
                      style={[styles.colorCircle, { backgroundColor: col }, isSel && { borderWidth: 3, borderColor: colors.text }]}
                      onPress={() => setEditColor(col)}
                    />
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveEdit}
                disabled={savingEdit}
              >
                {savingEdit ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Active Duration Timer Modal */}
      <ActiveTimerModal
        visible={!!activeTimerHabit}
        habit={activeTimerHabit}
        onCommit={handleCommitTimer}
        onDiscard={() => setActiveTimerHabit(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 6,
  },
  navTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  navActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIcon: {
    padding: 6,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  assetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  assetBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  assetHeaderInfo: {
    flex: 1,
  },
  assetName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  assetSub: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  bigValue: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'],
  },
  unitText: {
    fontSize: 16,
    fontWeight: '700',
  },
  doneTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 12,
  },
  doneTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  deltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 6,
  },
  deltaText: {
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 6,
    fontVariant: ['tabular-nums'],
  },
  comparisonSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 14,
  },
  statBox: {
    width: '48%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 6,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  actionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 6,
  },
  actionCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 14,
  },
  largeCheckBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  largeCheckText: {
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 8,
  },
  counterControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  countStepBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countDisplay: {
    fontSize: 24,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  durationActionWrap: {
    gap: 10,
  },
  bigTimerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
  },
  bigTimerBtnText: {
    color: '#181A20',
    fontWeight: '800',
    fontSize: 14,
    marginLeft: 6,
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickAddChip: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickAddChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  saveBtn: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});
