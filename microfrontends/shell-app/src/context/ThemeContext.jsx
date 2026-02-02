import React, { createContext, useState, useEffect, useContext } from 'react'

const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Cargar preferencia guardada
    const savedTheme = localStorage.getItem('theme')
    return savedTheme === 'dark'
  })

  useEffect(() => {
    // Guardar preferencia
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light')
    
    // Aplicar clase al body
    if (isDarkMode) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
  }, [isDarkMode])

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev)
  }

  const theme = {
    isDarkMode,
    colors: isDarkMode ? darkColors : lightColors
  }

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider')
  }
  return context
}

// Paletas de colores
const lightColors = {
  background: '#f5f5f5',
  backgroundCard: 'white',
  text: '#1e293b',
  textSecondary: '#64748b',
  primary: '#667eea',
  primaryGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  border: '#e2e8f0',
  shadow: 'rgba(0,0,0,0.08)',
  input: '#ffffff',
  inputBorder: '#e0e0e0'
}

const darkColors = {
  background: '#0f172a',
  backgroundCard: '#1e293b',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  primary: '#818cf8',
  primaryGradient: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
  border: '#334155',
  shadow: 'rgba(0,0,0,0.3)',
  input: '#334155',
  inputBorder: '#475569'
}

export default ThemeContext
