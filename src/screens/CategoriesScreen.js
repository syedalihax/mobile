import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { categoriesAPI } from '../services/api';
import { ICON_OPTIONS, COLOR_OPTIONS, getIconMeta } from '../constants/icons';
import Header from '../components/Header';

export default function CategoriesScreen({ navigation }) {
  const { themeMode } = useAuth();
  const colors = Colors[themeMode === 'LIGHT' ? 'light' : 'dark'];

  const [categories, setCategories] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Form Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [name, setName] = useState('');
  const [goalType, setGoalType] = useState('CHECK_OFF');
  const [targetValue, setTargetValue] = useState('1');
  const [unitLabel, setUnitLabel] = useState('done');
  const [selectedIcon, setSelectedIcon] = useState('code');
  const [selectedColor, setSelectedColor] = useState('#0ECB81');
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await categoriesAPI.getAll(showArchived);
      setCategories(res.data.data || []);
    } catch (err) {
      console.error('Error fetching habits:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showArchived]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCategories();
  };

  const openCreateModal = () => {
    setEditingHabit(null);
    setName('');
    setGoalType('CHECK_OFF');
    setTargetValue('1');
    setUnitLabel('done');
    setSelectedIcon('code');
    setSelectedColor('#0ECB81');
    setModalVisible(true);
  };

  const openEditModal = (habit) => {
    setEditingHabit(habit);
    setName(habit.name);
    setGoalType(habit.goalType);
    setTargetValue(habit.targetValue.toString());
    setUnitLabel(habit.unitLabel);
    setSelectedIcon(habit.iconKey || 'code');
    setSelectedColor(habit.colorHex || '#0ECB81');
    setModalVisible(true);
  };

  const handleGoalTypeChange = (type) => {
    setGoalType(type);
    if (type === 'CHECK_OFF') {
      setTargetValue('1');
      setUnitLabel('done');
    } else if (type === 'DURATION') {
      setTargetValue('30');
      setUnitLabel('min');
    } else if (type === 'COUNT') {
      setTargetValue('10');
      setUnitLabel('reps');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a habit name');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        goalType,
        targetValue: parseInt(targetValue, 10) || 1,
        unitLabel: unitLabel.trim(),
        iconKey: selectedIcon,
        colorHex: selectedColor,
      };

      if (editingHabit) {
        await categoriesAPI.update(editingHabit._id, payload);
      } else {
        await categoriesAPI.create(payload);
      }

      setModalVisible(false);
      fetchCategories();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save habit');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleArchive = async (habit) => {
    try {
      await categoriesAPI.toggleArchive(habit._id);
      fetchCategories();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update archive status');
    }
  };

  const handleDelete = (habit) => {
    Alert.alert('Delete Habit', `Are you sure you want to delete "${habit.name}" and its logs?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await categoriesAPI.delete(habit._id);
            fetchCategories();
          } catch (err) {
            Alert.alert('Error', err.message || 'Failed to delete');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Habits"
        subtitle={`${categories.length} configured`}
        rightElement={
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={openCreateModal}
          >
            <MaterialIcons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      {/* Filter Tabs */}
      <View style={[styles.filterBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.filterBtn, !showArchived && { backgroundColor: colors.surfaceElevated }]}
          onPress={() => setShowArchived(false)}
        >
          <Text style={[styles.filterBtnText, { color: !showArchived ? colors.primary : colors.textSecondary }]}>
            Active
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn, showArchived && { backgroundColor: colors.surfaceElevated }]}
          onPress={() => setShowArchived(true)}
        >
          <Text style={[styles.filterBtnText, { color: showArchived ? colors.primary : colors.textSecondary }]}>
            All & Archived
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const iconMeta = getIconMeta(item.iconKey);
          return (
            <TouchableOpacity
              style={[styles.habitRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('HabitDetail', { habitId: item._id, habit: item })}
            >
              <View style={[styles.iconWrap, { backgroundColor: item.colorHex || colors.primary }]}>
                <MaterialIcons name={iconMeta.name} size={22} color="#FFFFFF" />
              </View>

              <View style={styles.habitInfo}>
                <Text style={[styles.habitName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.habitDetails, { color: colors.textSecondary }]}>
                  {item.goalType} · Target: {item.targetValue} {item.unitLabel}
                  {item.archived && ' · (Archived)'}
                </Text>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.actionIconBtn} onPress={() => openEditModal(item)}>
                  <MaterialIcons name="edit" size={20} color={colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionIconBtn} onPress={() => handleToggleArchive(item)}>
                  <MaterialIcons
                    name={item.archived ? 'unarchive' : 'archive'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionIconBtn} onPress={() => handleDelete(item)}>
                  <MaterialIcons name="delete-outline" size={20} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={[styles.emptyBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No habits found</Text>
          </View>
        }
      />

      {/* Create / Edit Habit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingHabit ? 'Edit Habit' : 'New Habit'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              {/* Habit Name */}
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Habit Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="e.g. Read Book, Daily Run"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />

              {/* Goal Type */}
              <Text style={[styles.formLabel, { color: colors.textSecondary, marginTop: 14 }]}>
                Tracking Mode
              </Text>
              <View style={styles.typeOptionsRow}>
                {[
                  { key: 'CHECK_OFF', label: 'Check-off' },
                  { key: 'DURATION', label: 'Duration' },
                  { key: 'COUNT', label: 'Count' },
                ].map((t) => (
                  <TouchableOpacity
                    key={t.key}
                    style={[
                      styles.typeOptionBtn,
                      { borderColor: colors.border },
                      goalType === t.key && {
                        backgroundColor: colors.primaryLight,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => handleGoalTypeChange(t.key)}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        { color: goalType === t.key ? colors.primary : colors.textSecondary },
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Target & Unit */}
              {goalType !== 'CHECK_OFF' && (
                <View style={styles.targetRow}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={[styles.formLabel, { color: colors.textSecondary, marginTop: 14 }]}>
                      Daily Target
                    </Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      keyboardType="numeric"
                      value={targetValue}
                      onChangeText={setTargetValue}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.formLabel, { color: colors.textSecondary, marginTop: 14 }]}>
                      Unit Label
                    </Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      placeholder="min, pages, etc."
                      placeholderTextColor={colors.textMuted}
                      value={unitLabel}
                      onChangeText={setUnitLabel}
                    />
                  </View>
                </View>
              )}

              {/* Icon Selector */}
              <Text style={[styles.formLabel, { color: colors.textSecondary, marginTop: 14 }]}>Icon</Text>
              <View style={styles.pickerGrid}>
                {ICON_OPTIONS.map((ico) => {
                  const isSelected = selectedIcon === ico.key;
                  return (
                    <TouchableOpacity
                      key={ico.key}
                      style={[
                        styles.iconOption,
                        { borderColor: isSelected ? colors.primary : colors.border },
                        isSelected && { backgroundColor: colors.primaryLight },
                      ]}
                      onPress={() => setSelectedIcon(ico.key)}
                    >
                      <MaterialIcons
                        name={ico.name}
                        size={22}
                        color={isSelected ? colors.primary : colors.textSecondary}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Color Selector */}
              <Text style={[styles.formLabel, { color: colors.textSecondary, marginTop: 14 }]}>Color</Text>
              <View style={styles.colorRow}>
                {COLOR_OPTIONS.map((col) => {
                  const isSelected = selectedColor === col;
                  return (
                    <TouchableOpacity
                      key={col}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: col },
                        isSelected && { borderWidth: 3, borderColor: colors.text },
                      ]}
                      onPress={() => setSelectedColor(col)}
                    />
                  );
                })}
              </View>

              {/* Submit */}
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>{editingHabit ? 'Save Changes' : 'Create Habit'}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    padding: 16,
    paddingTop: 8,
  },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    marginBottom: 10,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '700',
  },
  habitDetails: {
    fontSize: 12,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconBtn: {
    padding: 6,
    marginLeft: 2,
  },
  emptyBox: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 20,
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
  modalForm: {
    paddingBottom: 20,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  typeOptionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOptionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeOptionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  targetRow: {
    flexDirection: 'row',
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
    marginTop: 24,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});
