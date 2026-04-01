/**
 * Interface cấu hình môi trường
 */
export interface IDomainSdk {
  /** Địa chỉ miền của ứng dụng Chatbox */
  APP: string
  /** Địa chỉ miền của Chatbox Widget */
  WIDGET: string
  /** Địa chỉ miền của Chatbot */
  CHATBOT: string
  /** Địa chỉn miền ứng dụng Chatbox version 2 */
  APP_V2: string
}

/**
 * Interface môi trường ứng dụng
 */
export interface IEnv {
  /** Khóa bảo mật của dịch vụ */
  secret_key: string
  /** Thông tin đối tác/người bán */
  merchant: string
  /** Thông tin liên hệ */
  contact: string
  /** Đường dẫn API Chatbot */
  chatbot: string
  /** Đường dẫn API Note */
  note: string
  /** Các miền của SDK */
  domain_sdk: IDomainSdk
}

/** Type alias cho Env để tương thích với code cũ */
export type Env = IEnv
