import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'animate.css'
import './old.css'
import './i18n'
import OldApp from './OldApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OldApp />
  </StrictMode>,
)
