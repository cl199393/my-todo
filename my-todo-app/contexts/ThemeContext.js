import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEMES } from '../constants/themes';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState('default');

  useEffect(() => {
    AsyncStorage.getItem('app_theme').then(id => {
      if (id && THEMES[id]) setThemeId(id);
    });
  }, []);

  async function setTheme(id) {
    setThemeId(id);
    await AsyncStorage.setItem('app_theme', id);
  }

  return (
    <ThemeContext.Provider value={{ theme: THEMES[themeId], themeId, setTheme, allThemes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
