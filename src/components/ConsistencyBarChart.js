import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line } from 'react-native-svg';
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ConsistencyBarChart({
  points = [],
  selectedIndex,
  onSelectIndex,
  height = 180,
  showToggle = true,
  defaultChartType = 'curve', // 'curve' or 'bars'
}) {
  const { themeMode } = useAuth();
  const colors = Colors[themeMode === 'LIGHT' ? 'light' : 'dark'];
  const [chartType, setChartType] = useState(defaultChartType);

  if (!points || points.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height, backgroundColor: colors.surface }]}>
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No consistency data available</Text>
      </View>
    );
  }

  const activeIndex =
    selectedIndex !== undefined && points[selectedIndex]
      ? selectedIndex
      : points.length - 1;
  const selectedPoint = points[activeIndex] || points[points.length - 1];

  // SVG Area/Curve Calculations
  const chartWidth = SCREEN_WIDTH - 64; // accounts for container padding
  const chartHeight = height - 70;
  const paddingX = 8;
  const paddingY = 12;

  // Generate smooth SVG curve path from points
  const generatePath = () => {
    if (points.length < 2) return { linePath: '', areaPath: '', coords: [] };

    const usableWidth = chartWidth - paddingX * 2;
    const usableHeight = chartHeight - paddingY * 2;

    const coords = points.map((p, idx) => {
      const x = paddingX + (idx / (points.length - 1)) * usableWidth;
      const pct = Math.max(0, Math.min(100, p.consistencyPercent || 0));
      // Invert Y because SVG 0 is top
      const y = paddingY + usableHeight - (pct / 100) * usableHeight;
      return { x, y, point: p };
    });

    // Generate smooth bezier curve
    let linePath = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const curr = coords[i];
      const next = coords[i + 1];
      const midX = (curr.x + next.x) / 2;
      linePath += ` C ${midX} ${curr.y}, ${midX} ${next.y}, ${next.x} ${next.y}`;
    }

    const last = coords[coords.length - 1];
    const first = coords[0];
    const areaPath = `${linePath} L ${last.x} ${chartHeight} L ${first.x} ${chartHeight} Z`;

    return { linePath, areaPath, coords };
  };

  const { linePath, areaPath, coords } = generatePath();
  const activeCoord = coords[activeIndex] || coords[coords.length - 1];

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Chart Top Header (Selected Point Info + Chart Style Toggle) */}
      <View style={styles.headerRow}>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerScore, { color: colors.text }]}>
            {selectedPoint.consistencyPercent}%{' '}
            <Text
              style={[
                styles.headerDelta,
                {
                  color:
                    (selectedPoint.deltaPercent || 0) >= 0 ? colors.primary : colors.danger,
                },
              ]}
            >
              {selectedPoint.deltaPercent !== null && selectedPoint.deltaPercent !== undefined
                ? selectedPoint.deltaPercent >= 0
                  ? `+${selectedPoint.deltaPercent}%`
                  : `${selectedPoint.deltaPercent}%`
                : ''}
            </Text>
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {selectedPoint.title || selectedPoint.rangeLabel} · {selectedPoint.completedTasks}/
            {selectedPoint.totalExpectedTasks} habits
          </Text>
        </View>

        {showToggle && (
          <View style={[styles.toggleWrap, { backgroundColor: colors.surfaceElevated }]}>
            <TouchableOpacity
              style={[styles.toggleBtn, chartType === 'curve' && { backgroundColor: colors.border }]}
              onPress={() => setChartType('curve')}
            >
              <Text
                style={[
                  styles.toggleText,
                  { color: chartType === 'curve' ? colors.accent : colors.textSecondary },
                ]}
              >
                Line
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleBtn, chartType === 'bars' && { backgroundColor: colors.border }]}
              onPress={() => setChartType('bars')}
            >
              <Text
                style={[
                  styles.toggleText,
                  { color: chartType === 'bars' ? colors.primary : colors.textSecondary },
                ]}
              >
                Bars
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Mode 1: Binance Smooth Golden Line / Area Curve */}
      {chartType === 'curve' ? (
        <View style={{ height: chartHeight + 30 }}>
          <Svg width={chartWidth} height={chartHeight}>
            <Defs>
              <LinearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={colors.accent} stopOpacity="0.35" />
                <Stop offset="80%" stopColor={colors.accent} stopOpacity="0.03" />
                <Stop offset="100%" stopColor={colors.accent} stopOpacity="0" />
              </LinearGradient>
            </Defs>

            {/* Subtle Horizontal Reference Grid Lines */}
            <Line
              x1="0"
              y1={paddingY}
              x2={chartWidth}
              y2={paddingY}
              stroke={colors.borderSubtle}
              strokeDasharray="4,4"
              strokeWidth="1"
            />
            <Line
              x1="0"
              y1={chartHeight / 2}
              x2={chartWidth}
              y2={chartHeight / 2}
              stroke={colors.borderSubtle}
              strokeDasharray="4,4"
              strokeWidth="1"
            />
            <Line
              x1="0"
              y1={chartHeight - 4}
              x2={chartWidth}
              y2={chartHeight - 4}
              stroke={colors.borderSubtle}
              strokeWidth="1"
            />

            {/* Gradient Area Fill */}
            {areaPath ? <Path d={areaPath} fill="url(#goldGradient)" /> : null}

            {/* Golden Curve Line */}
            {linePath ? (
              <Path
                d={linePath}
                fill="none"
                stroke={colors.accent}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {/* Active Indicator Pin & Glow */}
            {activeCoord && (
              <>
                <Line
                  x1={activeCoord.x}
                  y1={0}
                  x2={activeCoord.x}
                  y2={chartHeight}
                  stroke={colors.textSecondary}
                  strokeDasharray="2,3"
                  strokeWidth="1"
                />
                <Circle cx={activeCoord.x} cy={activeCoord.y} r="6" fill={colors.accent} />
                <Circle cx={activeCoord.x} cy={activeCoord.y} r="3" fill="#181A20" />
              </>
            )}
          </Svg>

          {/* Interactive touch row across the line */}
          <View style={[styles.touchRow, { height: chartHeight }]}>
            {coords.map((c, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.touchCol}
                activeOpacity={1}
                onPress={() => onSelectIndex && onSelectIndex(idx)}
              />
            ))}
          </View>

          {/* Clean X-Axis Labels: Show only 4 evenly-spaced labels to prevent cramped text */}
          <View style={styles.xAxisRow}>
            {points.map((p, idx) => {
              // Only display label at start, 1/3rd, 2/3rd, and end
              const total = points.length;
              const shouldShowLabel =
                idx === 0 ||
                idx === Math.floor(total / 3) ||
                idx === Math.floor((total * 2) / 3) ||
                idx === total - 1;

              if (!shouldShowLabel) {
                return <View key={p.id || idx} style={styles.emptyLabelSlot} />;
              }

              const isSelected = activeIndex === idx;
              return (
                <View key={p.id || idx} style={styles.axisLabelBox}>
                  <Text
                    style={[
                      styles.axisLabelText,
                      {
                        color: isSelected ? colors.accent : colors.textSecondary,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {p.rangeLabel || p.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : (
        /* Mode 2: Clean Spaced Binance Bars */
        <View style={{ height: chartHeight + 34 }}>
          <View style={[styles.barsContainer, { height: chartHeight }]}>
            {points.map((point, index) => {
              const isSelected = activeIndex === index;
              const pct = point.consistencyPercent || 0;
              const minHeight = 6;
              const barHeight = Math.max(
                minHeight,
                Math.min(chartHeight - 16, (pct / 100) * (chartHeight - 16))
              );

              let barColor = colors.danger;
              if (pct >= 60) barColor = colors.primary;
              else if (pct >= 30) barColor = colors.accent;

              if (point.isFuture) barColor = colors.surfaceElevated;

              return (
                <TouchableOpacity
                  key={point.id || index}
                  style={styles.barItem}
                  activeOpacity={0.8}
                  onPress={() => onSelectIndex && onSelectIndex(index)}
                >
                  <View style={[styles.barSlot, { height: chartHeight - 12 }]}>
                    <View
                      style={[
                        styles.barFillShape,
                        {
                          height: barHeight,
                          backgroundColor: barColor,
                          borderWidth: isSelected ? 1.5 : 0,
                          borderColor: '#FFFFFF',
                        },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Clean X-Axis Dates for Bars (spaced out, no multi-line wrapping!) */}
          <View style={styles.xAxisRow}>
            {points.map((p, idx) => {
              const total = points.length;
              // Show label only every 3-4 items to prevent crowded text
              const shouldShow =
                idx === 0 ||
                idx === Math.floor(total / 3) ||
                idx === Math.floor((total * 2) / 3) ||
                idx === total - 1;

              if (!shouldShow) return <View key={p.id || idx} style={styles.emptyLabelSlot} />;

              const isSelected = activeIndex === idx;
              return (
                <View key={p.id || idx} style={styles.axisLabelBox}>
                  <Text
                    style={[
                      styles.axisLabelText,
                      {
                        color: isSelected ? colors.primary : colors.textSecondary,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {p.rangeLabel || p.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginVertical: 10,
  },
  emptyContainer: {
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerScore: {
    fontSize: 22,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  headerDelta: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  toggleWrap: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  touchRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  touchCol: {
    flex: 1,
    height: '100%',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    paddingHorizontal: 2,
  },
  barSlot: {
    width: '100%',
    maxWidth: 16,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFillShape: {
    width: '100%',
    borderRadius: 3,
  },
  xAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  axisLabelBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyLabelSlot: {
    flex: 1,
  },
  axisLabelText: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
});
