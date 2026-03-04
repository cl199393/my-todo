import { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import ThemePicker from '../components/ThemePicker';

const STORAGE_KEY = 'todos';

function todayISO() { return new Date().toISOString().slice(0, 10); }

function formatDate(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-');
  return new Date(Number(y), Number(m) - 1, Number(d))
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function dateBadgeColor(iso) {
  if (!iso) return '#aaa';
  const today = todayISO();
  if (iso < today) return '#e53935';
  if (iso === today) return '#FF6D00';
  return '#1565C0';
}

function WebDateInput({ value, onChange }) {
  return (
    <input type="date" value={value} min={todayISO()} onChange={e => onChange(e.target.value)}
      style={{ border: '1px solid #ddd', borderRadius: 8, padding: '6px 10px', fontSize: 14,
        color: value ? '#333' : '#aaa', backgroundColor: '#f0f0f0', outline: 'none', cursor: 'pointer' }}
    />
  );
}

export default function TodoScreen() {
  const { theme } = useTheme();
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) setTodos(JSON.parse(data));
  }

  async function save(updated) {
    setTodos(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  function addTodo() {
    const text = input.trim();
    if (!text) return;
    save([...todos, { id: Date.now(), text, done: false, dueDate: dueDate || null }]);
    setInput('');
    setDueDate('');
  }

  function toggleDone(id) {
    save(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }

  function deleteTodo(id) {
    if (Platform.OS === 'web') {
      if (window.confirm('Remove this todo?')) save(todos.filter(t => t.id !== id));
    } else {
      Alert.alert('Delete', 'Remove this todo?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => save(todos.filter(t => t.id !== id)) },
      ]);
    }
  }

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.titleColor }]}>
          {theme.id === 'zootopia' ? '🦊 My Todo' : 'My Todo'}
        </Text>
        <ThemePicker />
      </View>

      <FlatList
        data={todos}
        keyExtractor={t => t.id.toString()}
        style={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.row, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, borderWidth: theme.cardBorder !== 'transparent' ? 1 : 0 }]}>
            <TouchableOpacity onPress={() => toggleDone(item.id)} style={styles.check}>
              <Text style={[styles.checkText, { color: theme.primary }]}>{item.done ? '✓' : '○'}</Text>
            </TouchableOpacity>
            <View style={styles.textCol}>
              <Text style={[styles.todoText, { color: theme.headerText }, item.done && styles.done]}>{item.text}</Text>
              {item.dueDate && (
                <Text style={[styles.dateBadge, { color: dateBadgeColor(item.dueDate) }]}>
                  📅 {formatDate(item.dueDate)}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={() => deleteTodo(item.id)} style={styles.deleteBtn}>
              <Text style={styles.delete}>🗑</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={[styles.empty, { color: theme.subtitleColor }]}>No todos yet.</Text>}
      />

      <View style={[styles.inputArea, { backgroundColor: theme.cardBg }]}>
        <View style={styles.inputRow}>
          <TextInput style={[styles.input, { backgroundColor: theme.bg, color: theme.headerText }]}
            value={input} onChangeText={setInput} placeholder="Add a todo..."
            placeholderTextColor={theme.subtitleColor}
            onSubmitEditing={addTodo} returnKeyType="done" />
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.primary }]} onPress={addTodo}>
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.dateRow}>
          <Text style={[styles.dateLabel, { color: theme.subtitleColor }]}>Due date:</Text>
          {Platform.OS === 'web'
            ? <WebDateInput value={dueDate} onChange={setDueDate} />
            : <Text style={[styles.dateNative, { color: theme.headerText }]}>{dueDate ? formatDate(dueDate) : 'No date'}</Text>
          }
          {dueDate ? (
            <TouchableOpacity onPress={() => setDueDate('')} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20, paddingHorizontal: 20 },
  title: { fontSize: 32, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  list: { flex: 1, paddingHorizontal: 20 },
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  check: { marginRight: 12 },
  checkText: { fontSize: 20 },
  textCol: { flex: 1 },
  todoText: { fontSize: 16 },
  done: { textDecorationLine: 'line-through', color: '#aaa' },
  dateBadge: { fontSize: 11, marginTop: 3, fontWeight: '500' },
  deleteBtn: { padding: 6 },
  delete: { fontSize: 18 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 16 },
  inputArea: { borderTopWidth: 1, borderTopColor: '#eee' },
  inputRow: { flexDirection: 'row', padding: 16, paddingBottom: 8 },
  input: { flex: 1, fontSize: 16, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginRight: 10 },
  addBtn: { borderRadius: 8, paddingHorizontal: 18, justifyContent: 'center' },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  dateRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 14, gap: 10 },
  dateLabel: { fontSize: 13 },
  dateNative: { fontSize: 13 },
  clearBtn: { padding: 4 },
  clearBtnText: { fontSize: 12, color: '#f44336' },
});
