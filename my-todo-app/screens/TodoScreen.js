import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'todos';

export default function TodoScreen() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    load();
  }, []);

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
    save([...todos, { id: Date.now(), text, done: false }]);
    setInput('');
  }

  function toggleDone(id) {
    save(todos.map(t => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function deleteTodo(id) {
    Alert.alert('Delete', 'Remove this todo?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => save(todos.filter(t => t.id !== id)) },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>My Todo</Text>

      <FlatList
        data={todos}
        keyExtractor={t => t.id.toString()}
        style={styles.list}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <TouchableOpacity onPress={() => toggleDone(item.id)} style={styles.check}>
              <Text style={styles.checkText}>{item.done ? '✓' : '○'}</Text>
            </TouchableOpacity>
            <Text style={[styles.todoText, item.done && styles.done]}>{item.text}</Text>
            <TouchableOpacity onPress={() => deleteTodo(item.id)}>
              <Text style={styles.delete}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No todos yet.</Text>}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Add a todo..."
          onSubmitEditing={addTodo}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addBtn} onPress={addTodo}>
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', paddingTop: 60 },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#333' },
  list: { flex: 1, paddingHorizontal: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  check: { marginRight: 12 },
  checkText: { fontSize: 20, color: '#4CAF50' },
  todoText: { flex: 1, fontSize: 16, color: '#333' },
  done: { textDecorationLine: 'line-through', color: '#aaa' },
  delete: { fontSize: 16, color: '#f44336', paddingLeft: 10 },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40, fontSize: 16 },
  inputRow: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginRight: 10,
  },
  addBtn: { backgroundColor: '#4CAF50', borderRadius: 8, paddingHorizontal: 18, justifyContent: 'center' },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
