/**
 * Enum định nghĩa các view trong ứng dụng
 */
export enum AppView {
  /** Giao diện chat RETION */
  RETION_CHAT = 'RETION_CHAT',
  /** Giao diện dashboard ERP */
  ERP_DASHBOARD = 'ERP_DASHBOARD',
}

/**
 * Interface thông tin khách hàng
 */
export interface ICustomer {
  /** Mã khách hàng (12 số) */
  customerCode: string
  /** Họ và tên khách hàng */
  name: string
  /** Địa chỉ email */
  email: string
  /** Số điện thoại */
  phone: string
  /** Địa chỉ */
  address: string
  /** Điểm tích lũy */
  loyaltyPoints: number
  /** Trạng thái hoạt động */
  status: 'active' | 'inactive'
  /** Đã liên kết với hệ thống chưa */
  isLinked: boolean
  /** Mã định danh người dùng từ ERP (optional) */
  userKey?: string
}

/**
 * Interface log tin nhắn
 */
export interface IMessageLog {
  /** ID duy nhất của log */
  id: string
  /** Mã khách hàng liên quan */
  customerCode: string
  /** Nội dung tin nhắn */
  content: string
  /** Trạng thái gửi tin nhắn */
  status: 'success' | 'failed'
  /** Thời gian gửi */
  timestamp: string
}

/**
 * Interface response từ API
 * @template T - Kiểu dữ liệu trả về
 */
export interface IApiResponse<T> {
  /** Trạng thái thành công */
  success: boolean
  /** Dữ liệu trả về (optional) */
  data?: T
  /** Thông báo lỗi (optional) */
  error?: string
}

/** Type alias cho Customer (backward compatible) */
export type Customer = ICustomer

/** Type alias cho MessageLog (backward compatible) */
export type MessageLog = IMessageLog

/** Type alias cho ApiResponse (backward compatible) */
export type ApiResponse<T> = IApiResponse<T>
