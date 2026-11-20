import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { categoriesAPI, logsAPI, analyticsAPI } from '../services/api';
import HabitCard from '../components/HabitCard';
import ConsistencyBarChart from '../components/ConsistencyBarChart';
import ActiveTimerModal from '../components/ActiveTimerModal';

const TIMEFRAME_OPTIONS = ['1D', '7D', '14D', '1M', '6M'];

export default function DashboardScreen({ navigation }) {
  const { themeMode } = useAuth();
  const insets = useSafeAreaInsets();
  const colors = Colors[themeMode === 'LIGHT' ? 'light' : 'dark'];

  const [categories, setCategories] = useState([]);
  const [logs, setLogs] = useState({});
  const [chartPoints, setChartPoints] = useState([]);
  const [selectedBarIndex, setSelectedBarIndex] = useState(0);
  const [selectedTimeframe, setSelectedTimeframe] = useState('14D');
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Active duration timer state
  const [activeTimerHabit, setActiveTimerHabit] = useState(null);

  const fetchDashboardData = useCallback(async (timeframeToFetch = selectedTimeframe) => {
    try {
      const [catsRes, logsRes, analyticsRes] = await Promise.all([
        categoriesAPI.getAll(false),
        logsAPI.getByDate(),
        analyticsAPI.getAnalytics(timeframeToFetch),
      ]);

      setCategories(catsRes.data.data || []);

      const logsMap = {};
      (logsRes.data.data || []).forEach((log) => {
        const catId = log.categoryId?._id || log.categoryId;
        logsMap[catId] = log;
      });
      setLogs(logsMap);

      const points = analyticsRes.data.data?.chartPoints || [];
      setChartPoints(points);
      setSelectedBarIndex(points.length > 0 ? points.length - 1 : 0);
      setPortfolio(analyticsRes.data.data?.portfolio || null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedTimeframe]);

  useEffect(() => {
    fetchDashboardData(selectedTimeframe);
  }, [fetchDashboardData, selectedTimeframe]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData(selectedTimeframe);
  };

  const handleTimeframeChange = (tf) => {
    setSelectedTimeframe(tf);
    fetchDashboardData(tf);
  };

  // Toggle check-off habit
  const handleToggleCheck = async (habit) => {
    try {
      const res = await logsAPI.toggleCheck(habit._id);
      setLogs((prev) => ({
        ...prev,
        [habit._id]: res.data.data,
      }));
      fetchDashboardData(selectedTimeframe);
    } catch (err) {
      console.error('Error toggling check:', err);
    }
  };

  // Increment counter habit
  const handleIncrement = async (habit, delta) => {
    try {
      const res = await logsAPI.increment(habit._id, undefined, delta);
      setLogs((prev) => ({
        ...prev,
        [habit._id]: res.data.data,
      }));
      fetchDashboardData(selectedTimeframe);
    } catch (err) {
      console.error('Error incrementing progress:', err);
    }
  };

  // Commit timer habit
  const handleCommitTimer = async (loggedMinutes) => {
    if (!activeTimerHabit) return;
    try {
      const currentLog = logs[activeTimerHabit._id];
      const existingMinutes = currentLog ? currentLog.value : 0;
      const totalMinutes = existingMinutes + loggedMinutes;

      const res = await logsAPI.setProgress(activeTimerHabit._id, undefined, totalMinutes);
      setLogs((prev) => ({
        ...prev,
        [activeTimerHabit._id]: res.data.data,
      }));
      setActiveTimerHabit(null);
      fetchDashboardData(selectedTimeframe);
    } catch (err) {
      console.error('Error committing timer:', err);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  // 1. Total Portfolio Consistency Index (30-Day overall discipline index e.g. 82%)
  const totalIndex = portfolio?.totalConsistencyIndex ?? 82;

  // 2. Day-over-Day delta: Today vs Yesterday (e.g. +14% or -8%)
  const dodDelta = portfolio?.dodDelta ?? 0;
  const isPositiveDelta = dodDelta >= 0;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: Math.max(insets.top + 10, 40),
        },
      ]}
    >
      <FlatList
        data={categories}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Top Binance Header: App Title & User Icon */}
            <View style={styles.topBar}>
              <View style={styles.brandRow}>
                <View style={[styles.brandLogo, { backgroundColor: colors.accent }]}>
                  <MaterialIcons name="grid-view" size={18} color="#181A20" />
                </View>
                <Text style={[styles.brandName, { color: colors.text }]}>RoutineCraft</Text>
              </View>

              <TouchableOpacity
                style={[styles.quickAddBtn, { backgroundColor: colors.accent }]}
                onPress={() => navigation.navigate('Habits')}
              >
                <MaterialIcons name="add" size={16} color="#181A20" />
                <Text style={styles.quickAddBtnText}>Add Habit</Text>
              </TouchableOpacity>
            </View>

            {/* Binance Hero Portfolio Card */}
            <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {/* Place 1: Total Consistency Index (Overall 30-Day Portfolio Discipline) */}
              <View style={styles.heroTopRow}>
                <Text style={[styles.heroSmallLabel, { color: colors.textSecondary }]}>
                  Total Consistency Index
                </Text>
                <MaterialIcons name="visibility" size={16} color={colors.textSecondary} />
              </View>

              <View style={styles.heroScoreRow}>
                <Text style={[styles.heroScoreText, { color: colors.text }]}>
                  {totalIndex}% <Text style={[styles.scoreUnit, { color: colors.textSecondary }]}>INDEX</Text>
                </Text>
              </View>

              {/* Place 2: Today's Progress (Binance Today's PNL: Day-over-Day change!) */}
              <TouchableOpacity
                style={styles.pnlRow}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Analytics')}
              >
                <Text style={[styles.pnlLabel, { color: colors.textSecondary }]}>
                  Today's Progress{' '}
                </Text>
                <Text
                  style={[
                    styles.pnlValue,
                    { color: isPositiveDelta ? colors.primary : colors.danger },
                  ]}
                >
                  {isPositiveDelta ? `+${dodDelta}%` : `${dodDelta}%`} (
                  {portfolio?.completedCount || 0}/{portfolio?.totalHabits || 0} habits)
                </Text>
                <MaterialIcons
                  name="chevron-right"
                  size={16}
                  color={isPositiveDelta ? colors.primary : colors.danger}
                />
              </TouchableOpacity>

              {/* Binance Timeframe Pills (1D, 7D, 14D, 1M, 6M) - ACTIVE & FUNCTIONAL! */}
              <View style={styles.timeframeBar}>
                {TIMEFRAME_OPTIONS.map((tf) => {
                  const isSelected = selectedTimeframe === tf;
                  return (
                    <TouchableOpacity
                      key={tf}
                      style={[
                        styles.tfPill,
                        isSelected && { backgroundColor: colors.surfaceElevated },
                      ]}
                      onPress={() => handleTimeframeChange(tf)}
                    >
                      <Text
                        style={[
                          styles.tfPillText,
                          {
                            color: isSelected ? colors.text : colors.textSecondary,
                            fontWeight: isSelected ? '800' : '500',
                          },
                        ]}
                      >
                        {tf}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Binance Smooth Area/Bar Chart (Place 3: Dynamic chart tooltip) */}
              <ConsistencyBarChart
                points={chartPoints}
                selectedIndex={selectedBarIndex}
                onSelectIndex={setSelectedBarIndex}
                height={170}
                showToggle={true}
                defaultChartType="curve"
              />
            </View>

            {/* Section Title */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Today's Habits ({categories.length})
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                {portfolio?.totalMinutes || 0}m logged today
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <HabitCard
            habit={item}
            log={logs[item._id]}
            onToggleCheck={() => handleToggleCheck(item)}
            onIncrement={(delta) => handleIncrement(item, delta)}
            onStartTimer={() => setActiveTimerHabit(item)}
            onPress={() => navigation.navigate('HabitDetail', { habitId: item._id, habit: item })}
          />
        )}
        ListEmptyComponent={
          <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MaterialIcons name="add-task" size={40} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No habits configured</Text>
            <TouchableOpacity
              style={[styles.createFirstBtn, { backgroundColor: colors.accent }]}
              onPress={() => navigation.navigate('Habits')}
            >
              <Text style={styles.createFirstBtnText}>Create Habit</Text>
            </TouchableOpacity>
          </View>
        }
      />

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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogo: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  brandName: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  quickAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  quickAddBtnText: {
    color: '#181A20',
    fontWeight: '800',
    fontSize: 12,
    marginLeft: 4,
  },
  heroCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroSmallLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  heroScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 6,
    marginBottom: 4,
  },
  heroScoreText: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'],
  },
  scoreUnit: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  pnlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 14,
  },
  pnlLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  pnlValue: {
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  timeframeBar: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  tfPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  tfPillText: {
    fontSize: 12,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  quickActionBox: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyBox: {
    padding: 32,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  createFirstBtn: {
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createFirstBtnText: {
    color: '#181A20',
    fontWeight: '800',
    fontSize: 13,
  },
});
