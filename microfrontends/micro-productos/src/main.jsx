import React from 'react'
import ReactDOM from 'react-dom/client'
import { initShellSessionSync } from './utils/shellSessionSync'
import App from './App.jsx'

initShellSessionSync()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
