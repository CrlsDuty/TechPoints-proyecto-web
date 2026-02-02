import React from 'react'
import { useTheme } from '../context/ThemeContext'

export const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      style={styles.toggle}
      title={isDarkMode ? 'Modo claro' : 'Modo oscuro'}
    >
      {isDarkMode ? '☀️' : '🌙'}
    </button>
  )
}

const styles = {
  toggle: {
    background: 'rgba(255,255,255,0.2)',
    border: '2px solid rgba(255,255,255,0.4)',
    borderRadius: '12px',
    padding: '0.5rem 0.75rem',
    fontSize: '1.25rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
    lineHeight: 1
  }
}

export default ThemeToggle
