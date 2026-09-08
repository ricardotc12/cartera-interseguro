import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

// Autoactualización del PWA: sin esto, el service worker viejo puede seguir
// sirviendo la versión anterior de la app aunque el usuario recargue la
// página, porque intercepta la navegación y responde con su propio caché en
// vez de ir a la red. Con esto: se revisa cada minuto si hay una versión
// nueva en el servidor, y en cuanto el navegador la activa, se recarga sola
// una sola vez — sin que la asesora tenga que copiar el link de nuevo.
let refreshingAfterUpdate = false
navigator.serviceWorker?.addEventListener('controllerchange', () => {
  if (refreshingAfterUpdate) return
  refreshingAfterUpdate = true
  window.location.reload()
})

registerSW({
  immediate: true,
  onRegistered(registration) {
    if (!registration) return
    setInterval(() => registration.update(), 60_000)
  },
})
