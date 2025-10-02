import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { BloomProvider } from '@bloom/react'
import App from './App'
import './index.css'
import { config } from './config'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BloomProvider baseURL={config.apiUrl}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </BloomProvider>
  </React.StrictMode>,
)
