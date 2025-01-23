import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Streamer from './streamer.jsx'
import Viewer from './viewer.jsx'
import WebRTCVideoApp from './video-streamer-app.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* <App /> */}
    <WebRTCVideoApp />
    {/* <Streamer /> */}
    {/* <Viewer /> */}
  </StrictMode>,
)
