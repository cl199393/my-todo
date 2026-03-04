import { View, Text, SectionList, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import useDeadlines from '../hooks/useDeadlines';
import useNotifications from '../hooks/useNotifications';
import DeadlineCard from '../components/DeadlineCard';
import DateSectionHeader from '../components/DateSectionHeader';
import { useTheme } from '../contexts/ThemeContext';
import ThemePicker from '../components/ThemePicker';

function groupByDate(deadlines) {
  const map = new Map();
  for (const d of deadlines) {
    const date = new Date(d.due_at);
    const key = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(d);
  }
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

export default function DeadlinesScreen() {
  const { theme } = useTheme();
  const { deadlines, loading, error, refresh, dismiss } = useDeadlines();
  useNotifications(deadlines);

  const sections = groupByDate(deadlines);

  if (loading && deadlines.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.subtitleColor }]}>Loading deadlines...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.titleColor }]}>
          {theme.id === 'zootopia' ? '🐰 Deadlines' : 'Deadlines'}
        </Text>
        <ThemePicker />
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>Offline — showing cached data</Text>
        </View>
      ) : null}

      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <DeadlineCard item={item} onDismiss={dismiss} />}
        renderSectionHeader={({ section }) => <DateSectionHeader title={section.title} />}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={theme.primary} />}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={[styles.emptyText, { color: theme.headerText }]}>No upcoming deadlines</Text>
            <Text style={[styles.emptySubtext, { color: theme.subtitleColor }]}>Pull down to refresh</Text>
          </View>
        }
        contentContainerStyle={deadlines.length === 0 && styles.emptyContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20 },
  title: { fontSize: 32, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyContainer: { flex: 1 },
  loadingText: { marginTop: 12, fontSize: 15 },
  emptyText: { fontSize: 18, fontWeight: '600' },
  emptySubtext: { fontSize: 13, marginTop: 6 },
  errorBanner: { backgroundColor: '#fff3e0', paddingVertical: 8, paddingHorizontal: 16, marginHorizontal: 16, borderRadius: 8, marginBottom: 8 },
  errorText: { color: '#e65100', fontSize: 13, textAlign: 'center' },
});
