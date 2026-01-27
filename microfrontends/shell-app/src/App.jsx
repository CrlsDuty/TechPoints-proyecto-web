import React from 'react'
import { AuthProvider } from './auth/AuthContext'
import Dashboard from './components/Dashboard'
import './styles/App.css'

function App() {
  return (
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  )
}

export default App
