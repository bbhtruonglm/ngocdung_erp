/**
 * Cấu hình môi trường phát triển (.env.dev)
 */

import type { Env } from '@/interface/env'

/** Định nghĩa biến ENV với cấu hình từ người dùng */
const ENV: Env = {
  /** Khóa bí mật cho dịch vụ */
  secret_key: '699fbebee4fb48cfa4c80477ffc19928',
  /** ID của người bán (đang để trống) */
  merchant: '',
  /** Thông tin liên lạc (đang để trống) */
  contact: '',
  /** Địa chỉ API Chatbot */
  chatbot: 'https://retion-api.drinkocany.com/v1/n6_static',
  /** Địa chỉ API Note */
  note: 'https://hskgo4cocg88ws8c4wswskg8.35.198.216.143.sslip.io',
  /** Các miền SDK */
  domain_sdk: {
    /** Địa chỉ miền của ứng dụng Chatbox */
    APP: 'https://wcss4s40o4g4c4wgc44w0gsw.35.198.216.143.sslip.io/v1',
    /** Địa chỉ miền của Chatbox Widget */
    WIDGET: 'https://cwo4kg8s8okss448sgo4o4c8.35.198.216.143.sslip.io/v1',
    /** Địa chỉ miền của Chatbot */
    CHATBOT: 'https://retion-chatbot-api.drinkocany.com/chatbot/v2/n3_service',
    /** Địa chỉ miền ứng dụng Chatbox version 2 */
    APP_V2: 'https://retion-api.drinkocany.com/v1/n5_app'
  }
}

/** Xuất cấu hình môi trường ra ngoài */
export default ENV
