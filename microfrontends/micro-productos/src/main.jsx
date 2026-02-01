
import React from 'react'
import ReactDOM from 'react-dom/client'
import { initShellSessionSync } from './utils/shellSessionSync'
import App from './App.jsx'
import './import-micro-canje.js'

initShellSessionSync()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
