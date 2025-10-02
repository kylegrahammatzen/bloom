import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { BloomProvider } from '@bloom/react'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BloomProvider baseURL={import.meta.env.VITE_API_URL || 'http://localhost:5000'}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </BloomProvider>
  </React.StrictMode>,
)
