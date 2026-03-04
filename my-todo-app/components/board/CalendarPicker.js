import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function daysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function firstDayOfMonth(year, month) { return new Date(year, month, 1).getDay(); }
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function CalendarPicker({ selected, onSelect }) {
  const { theme } = useTheme();
  const today = new Date();
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());

  const numDays = daysInMonth(viewYear, viewMonth);
  const startDow = firstDayOfMonth(viewYear, viewMonth);
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= numDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = new Date(viewYear, viewMonth, 1)
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const rows = [];
  for (let r = 0; r < cells.length / 7; r++) rows.push(cells.slice(r * 7, r * 7 + 7));

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBg, borderBottomColor: theme.columnBorder || '#eee' }]}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
          <Text style={[styles.navArrow, { color: theme.headerText }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.monthLabel, { color: theme.titleColor }]}>{monthLabel}</Text>
        <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
          <Text style={[styles.navArrow, { color: theme.headerText }]}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        {DAYS.map(d => <Text key={d} style={[styles.dow, { color: theme.subtitleColor }]}>{d}</Text>)}
      </View>

      {rows.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((day, ci) => {
            if (!day) return <View key={ci} style={styles.cell} />;
            const date = new Date(viewYear, viewMonth, day);
            const isToday = isSameDay(date, today);
            const isSel = isSameDay(date, selected);
            return (
              <TouchableOpacity key={ci}
                style={[styles.cell,
                  isToday && { borderWidth: 1.5, borderColor: theme.calendarToday, borderRadius: CELL / 2 },
                  isSel && { backgroundColor: theme.calendarSelected, borderRadius: CELL / 2 },
                ]}
                onPress={() => onSelect(date)}
              >
                <Text style={[styles.dayText, { color: theme.headerText },
                  isToday && { color: theme.calendarToday, fontWeight: '700' },
                  isSel && { color: '#fff', fontWeight: '700' },
                ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const CELL = 36;

const styles = StyleSheet.create({
  container: { paddingHorizontal: 12, paddingBottom: 8, borderBottomWidth: 1 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  navBtn: { padding: 6 },
  navArrow: { fontSize: 22, lineHeight: 24 },
  monthLabel: { fontSize: 15, fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 2 },
  dow: { width: CELL, textAlign: 'center', fontSize: 11, fontWeight: '600' },
  cell: { width: CELL, height: CELL, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: 13 },
});
