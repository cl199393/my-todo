import { useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import useBoardState from '../hooks/useBoardState';
import KanbanBoard from '../components/board/KanbanBoard';
import CalendarPicker from '../components/board/CalendarPicker';
import DayView from '../components/board/DayView';
import { useTheme } from '../contexts/ThemeContext';
import ThemePicker from '../components/ThemePicker';

export default function BoardScreen() {
  const { theme } = useTheme();
  const { cards, loading, reload, moveCard } = useBoardState();
  const [selectedDate, setSelectedDate] = useState(new Date());

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.titleColor }]}>
          {theme.id === 'zootopia' ? '🦥 Board' : 'Board'}
        </Text>
        <ThemePicker />
      </View>

      <CalendarPicker selected={selectedDate} onSelect={setSelectedDate} />
      <DayView cards={cards} selectedDate={selectedDate} />

      {loading
        ? <ActivityIndicator style={styles.spinner} size="large" color={theme.primary} />
        : <KanbanBoard cards={cards} onMoveCard={moveCard} />
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  spinner: { flex: 1, alignSelf: 'center' },
});
