import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './i18n'

/** Lấy element root từ DOM */
const ROOT_ELEMENT = document.getElementById('root')

// Kiểm tra element root tồn tại
if (!ROOT_ELEMENT) throw new Error('Could not find root element to mount to')

/** Tạo root để render React app */
const root = ReactDOM.createRoot(ROOT_ELEMENT)

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
