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
// vez de ir a la red. Con esto: se revisa cada cierto tiempo si hay una
// versión nueva en el servidor, y en cuanto el navegador la activa, se
// recarga sola una sola vez — sin que la asesora tenga que copiar el link de
// nuevo. El chequeo es cada 30 minutos (no cada minuto): revisarlo tan
// seguido no aporta nada en el uso normal (no se despliega una versión nueva
// cada minuto) y solo aumentaba el riesgo de que la recarga automática
// interrumpiera a alguien justo mientras estaba llenando un formulario.
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
    setInterval(() => registration.update(), 30 * 60_000)
  },
})
