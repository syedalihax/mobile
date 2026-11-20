import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl, setApiBaseUrl } from '../services/api';
import Header from '../components/Header';

export default function SettingsScreen() {
  const { user, themeMode, updatePreferences, logout } = useAuth();
  const colors = Colors[themeMode === 'LIGHT' ? 'light' : 'dark'];

  const [remindersEnabled, setRemindersEnabled] = useState(
    user?.preferences?.remindersEnabled || false
  );
  const [reminderHour, setReminderHour] = useState(
    (user?.preferences?.reminderHour ?? 20).toString()
  );
  const [reminderMinute, setReminderMinute] = useState(
    (user?.preferences?.reminderMinute ?? 0).toString()
  );

  // Backend URL configuration
  const [backendUrl, setBackendUrl] = useState(getApiBaseUrl());
  const [savingUrl, setSavingUrl] = useState(false);

  const handleThemeChange = async (mode) => {
    try {
      await updatePreferences({ themeMode: mode });
    } catch (err) {
      Alert.alert('Error', 'Failed to update theme mode');
    }
  };

  const handleReminderToggle = async (val) => {
    setRemindersEnabled(val);
    try {
      await updatePreferences({
        remindersEnabled: val,
        reminderHour: parseInt(reminderHour, 10) || 20,
        reminderMinute: parseInt(reminderMinute, 10) || 0,
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to update reminders');
    }
  };

  const handleSaveBackendUrl = async () => {
    if (!backendUrl.trim()) return;
    setSavingUrl(true);
    try {
      await setApiBaseUrl(backendUrl.trim());
      Alert.alert('Updated', 'Backend API URL saved! Requests will now point to this address.');
    } catch (err) {
      Alert.alert('Error', 'Failed to save API URL');
    } finally {
      setSavingUrl(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Settings" subtitle="Preferences & Configuration" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        {user && (
          <View style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
              <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user.email}</Text>
            </View>
          </View>
        )}

        {/* Section: Appearance */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Appearance</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {[
            { key: 'DARK', label: 'Dark Mode (Binance Style)', icon: 'dark-mode' },
            { key: 'LIGHT', label: 'Light Mode', icon: 'light-mode' },
            { key: 'SYSTEM', label: 'System Default', icon: 'settings-brightness' },
          ].map((item, index) => {
            const isSelected = themeMode === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.optionRow,
                  index > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                ]}
                onPress={() => handleThemeChange(item.key)}
              >
                <MaterialIcons name={item.icon} size={22} color={colors.textSecondary} />
                <Text style={[styles.optionLabel, { color: colors.text }]}>{item.label}</Text>
                {isSelected && <MaterialIcons name="check" size={22} color={colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Section: Daily Reminders */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Daily Reminders</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.optionRow}>
            <MaterialIcons name="notifications-none" size={22} color={colors.textSecondary} />
            <Text style={[styles.optionLabel, { color: colors.text }]}>Enable Reminders</Text>
            <Switch
              value={remindersEnabled}
              onValueChange={handleReminderToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {remindersEnabled && (
            <View style={[styles.timeRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>Reminder Time</Text>
              <View style={styles.timeInputs}>
                <TextInput
                  style={[styles.timeInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  keyboardType="numeric"
                  maxLength={2}
                  value={reminderHour}
                  onChangeText={setReminderHour}
                  placeholder="20"
                />
                <Text style={[styles.timeColon, { color: colors.text }]}>:</Text>
                <TextInput
                  style={[styles.timeInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  keyboardType="numeric"
                  maxLength={2}
                  value={reminderMinute}
                  onChangeText={setReminderMinute}
                  placeholder="00"
                />
              </View>
            </View>
          )}
        </View>

        {/* Section: Backend API Configuration (For mobile testing) */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Backend API Connection
        </Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.apiUrlHint, { color: colors.textSecondary }]}>
            Phone par test karte waqt laptop ka local Wi-Fi IP address enter karein (e.g. http://192.168.1.X:5000/api):
          </Text>
          <View style={styles.apiUrlRow}>
            <TextInput
              style={[styles.apiUrlInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              value={backendUrl}
              onChangeText={setBackendUrl}
              placeholder="http://192.168.1.15:5000/api"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.saveUrlBtn, { backgroundColor: colors.primary }]}
              onPress={handleSaveBackendUrl}
            >
              <Text style={styles.saveUrlBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: colors.dangerLight, borderColor: colors.danger }]}
          onPress={handleLogout}
        >
          <MaterialIcons name="logout" size={20} color={colors.danger} />
          <Text style={[styles.logoutBtnText, { color: colors.danger }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  optionLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  timeLabel: {
    fontSize: 14,
  },
  timeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInput: {
    width: 44,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
  },
  timeColon: {
    fontSize: 18,
    fontWeight: '800',
    marginHorizontal: 4,
  },
  apiUrlHint: {
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  apiUrlRow: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 6,
    gap: 8,
  },
  apiUrlInput: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  saveUrlBtn: {
    paddingHorizontal: 16,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveUrlBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
});
