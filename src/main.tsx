import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
/** Nạp i18n hiện tại của dự án */
import './i18n'
/** Nạp cấu hình môi trường ENV */
import ENV from './env.dev'
/** Nạp SDK của Chatbox Widget */
import WIDGET from 'bbh-chatbox-widget-js-sdk'

/**
 * Hàm khởi tạo ngôn ngữ cho ứng dụng
 */
function loadLanguage() {
  // Logic i18n đã được nạp qua import './i18n'
}

/**
 * Hàm nạp cấu hình môi trường vào global scope
 */
async function loadEnv() {
  // Gán cấu hình ENV từ file dev vào biến global $env để sử dụng toàn cục
  globalThis.$env = ENV
}

/**
 * Hàm nạp các dịch vụ bổ trợ cho ứng dụng
 */
function loadApp() {
  // Có thể nạp các store hoặc context provider ở đây nếu cần
}

/**
 * Hàm chính để khởi chạy ứng dụng (Entry Point)
 */
async function startApp() {
  try {
    // Gọi hàm nạp ngôn ngữ
    loadLanguage()
    // Đợi nạp cấu hình môi trường xong
    await loadEnv()
    // Khởi tạo SDK Widget với secret_key và domain_sdk từ cấu hình đã nạp
    WIDGET.load(globalThis.$env.secret_key, globalThis.$env.domain_sdk)
    // Nạp các cấu hình app bổ trợ
    loadApp()

    /** Lấy element root từ DOM */
    const ROOT_ELEMENT = document.getElementById('root')

    // Kiểm tra element root tồn tại trước khi mount
    if (!ROOT_ELEMENT) throw new Error('Could not find root element to mount to')

    /** Tạo root mới của React từ element đã tìm thấy */
    const ROOT = ReactDOM.createRoot(ROOT_ELEMENT)

    // Render ứng dụng vào root đã tạo
    ROOT.render(
      <React.StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.StrictMode>
    )
  } catch (e) {
    // In lỗi ra console nếu quá trình khởi tạo thất bại
    console.error('Error starting app:', e)
  }
}

// Gọi hàm khởi chạy ứng dụng
startApp()
