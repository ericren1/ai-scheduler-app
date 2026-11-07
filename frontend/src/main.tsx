import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { readTheme, saveTheme } from './utils/theme.ts'

// Apply the saved theme before React mounts; CSS itself defaults to dark.
try {
  const theme = readTheme(window.localStorage)
  document.documentElement.dataset.theme = theme
  document.documentElement.dataset.themePersisted = String(saveTheme(window.localStorage, theme))
} catch {
  document.documentElement.dataset.theme = 'dark'
  document.documentElement.dataset.themePersisted = 'false'
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
