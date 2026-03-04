import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemePicker() {
  const { theme, themeId, setTheme, allThemes } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)} style={styles.trigger}>
        <Text style={styles.triggerText}>🎨</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={[styles.sheet, { backgroundColor: theme.cardBg }]}>
            <Text style={[styles.title, { color: theme.titleColor }]}>Choose Theme</Text>
            {Object.values(allThemes).map(t => (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.option,
                  { borderColor: t.primary },
                  themeId === t.id && { backgroundColor: t.primary + '22' },
                ]}
                onPress={() => { setTheme(t.id); setOpen(false); }}
              >
                <Text style={styles.optionIcon}>{t.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionName, { color: t.titleColor }]}>{t.name}</Text>
                  <View style={styles.swatches}>
                    {[t.primary, t.bg, t.columnBg, t.cardBg].map((c, i) => (
                      <View key={i} style={[styles.swatch, { backgroundColor: c }]} />
                    ))}
                  </View>
                </View>
                {themeId === t.id && <Text style={{ color: t.primary, fontWeight: '700' }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: { padding: 6 },
  triggerText: { fontSize: 20 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheet: {
    width: 300,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  optionIcon: { fontSize: 28 },
  optionName: { fontSize: 15, fontWeight: '600', marginBottom: 6 },
  swatches: { flexDirection: 'row', gap: 4 },
  swatch: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
});
