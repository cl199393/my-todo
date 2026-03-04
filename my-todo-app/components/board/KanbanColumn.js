import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useDroppable } from '@dnd-kit/core';
import { useTheme } from '../../contexts/ThemeContext';
import KanbanCard from './KanbanCard';

const COLUMN_LABELS = {
  backlog: 'Backlog',
  todo: 'To Do',
  inprogress: 'In Progress',
  done: 'Done',
};

export default function KanbanColumn({ columnId, cards }) {
  const { theme } = useTheme();
  const { setNodeRef, isOver } = useDroppable({ id: columnId });

  return (
    <View style={styles.column}>
      <Text style={[styles.header, { color: theme.headerText }]}>{COLUMN_LABELS[columnId]}</Text>
      <View
        ref={setNodeRef}
        style={[
          styles.dropArea,
          { backgroundColor: theme.columnBg, borderColor: theme.columnBorder },
          isOver && { borderColor: theme.primary, backgroundColor: theme.columnDropOver },
        ]}
      >
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {cards.map(card => <KanbanCard key={card.cardId} card={card} />)}
          {cards.length === 0 && (
            <Text style={[styles.empty, { color: theme.subtitleColor }]}>Drop here</Text>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  column: { flex: 1, marginHorizontal: 4 },
  header: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, textAlign: 'center' },
  dropArea: { flex: 1, borderRadius: 10, padding: 6, borderWidth: 2 },
  scroll: { flex: 1 },
  empty: { fontSize: 11, textAlign: 'center', marginTop: 20 },
});
