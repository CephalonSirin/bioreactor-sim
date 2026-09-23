import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// After a redeploy, a cached index.html can point at chunks that no longer exist.
// Reload once to pick up the fresh build; the flag prevents a reload loop.
window.addEventListener('vite:preloadError', () => {
  try {
    if (sessionStorage.getItem('chunk-reload')) return
    sessionStorage.setItem('chunk-reload', '1')
  } catch {
    return
  }
  window.location.reload()
})

window.addEventListener('load', () => {
  window.setTimeout(() => {
    try {
      sessionStorage.removeItem('chunk-reload')
    } catch {
      /* storage unavailable */
    }
  }, 5000)
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
