import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';

export default function Header({ title, subtitle, rightElement }) {
  const { themeMode } = useAuth();
  const insets = useSafeAreaInsets();
  const colors = Colors[themeMode === 'LIGHT' ? 'light' : 'dark'];

  const safeTopPadding = Math.max(insets.top + 8, 36);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: safeTopPadding,
          borderBottomColor: colors.borderSubtle,
        },
      ]}
    >
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      {rightElement && <View style={styles.right}>{rightElement}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  right: {
    marginLeft: 12,
  },
});
