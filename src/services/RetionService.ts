import { Customer } from '../types'
import { initialCustomers } from './mockData'

//#region RetionService - Xử lý tích hợp API Retion và ERP
// -----------------------------------------------------------------------------

/** Cấu hình cho Retion Service */
export interface IConfigRetionService {
  /** Chế độ giả lập (Mock) để test UI/UX */
  is_mock?: boolean
}

/** Interface định nghĩa các phương thức của Retion Service */
export interface IRetionService {
  /** Lấy ID khách hàng từ thông tin hội thoại */
  fetchCustomerId(page_id: string, client_id: string): Promise<string | null>
  /** Tìm kiếm thông tin khách hàng từ ERP */
  searchCustomer(code: string): Promise<Customer | null>
  /** Thực hiện liên kết khách hàng với Retion */
  linkCustomer(code: string, page_id: string, client_id: string): Promise<boolean>
}

/**
 * Lớp xử lý các nghiệp vụ tích hợp giữa Retion và hệ thống ERP
 */
export class RetionService implements IRetionService {
  /**
   * Chuẩn hóa dữ liệu text từ runtime để tránh crash khi nhận `null` / `undefined`.
   * TypeScript đảm bảo ở compile time là chưa đủ vì dữ liệu UI/API vẫn có thể lệch shape.
   */
  private normalizeText(value: unknown): string {
    return typeof value === 'string' ? value.trim() : ''
  }

  /**
   * Khởi tạo Retion Service
   * @param CONFIG - Cấu hình khởi tạo (mặc định không giả lập)
   */
  constructor(
    private readonly CONFIG: IConfigRetionService = { is_mock: false }
  ) {}

  /**
   * Lấy ID khách hàng từ thông tin hội thoại Retion
   * @param page_id - Facebook Page ID
   * @param client_id - Facebook Client ID
   */
  async fetchCustomerId(page_id: string, client_id: string): Promise<string | null> {
    // Kiểm tra xem ứng dụng có đang chạy ở chế độ giả lập không
    if (this.CONFIG.is_mock) {
      // Ghi log để kỹ thuật viên biết đang chạy mock
      console.log('[RetionService.fetchCustomerId] --- MOCK MODE ---')
      // Tạo độ trễ 1 giây để giả lập kết nối mạng và hiển thị loading trên UI
      await new Promise(resolve => setTimeout(resolve, 1000))
      // Trả về một mã khách hàng mẫu cố định để đồng bộ với dữ liệu mockData.ts
      return '202400000001'
    }

    /** Địa chỉ API tìm kiếm hội thoại lấy từ biến môi trường */
    const API_URL = import.meta.env.VITE_RETION_CONVERSATION_API_URL
    // Thực hiện gọi API POST đến Retion để lấy thông tin bio của khách hàng
    const RESPONSE = await fetch(API_URL, {
      // Phương thức POST yêu cầu body chứa filter
      method: 'POST',
      // Định dạng dữ liệu gửi đi là JSON
      headers: { 'Content-Type': 'application/json' },
      // Body filter theo page_id và client_id của Facebook
      body: JSON.stringify({
        body: {
          query: {
            bool: {
              must: [
                { term: { 'fb_page_id.keyword': page_id } },
                { term: { 'fb_client_id.keyword': client_id } },
              ],
            },
          },
          size: 1,
        },
      }),
    })

    // Nếu API trả về mã lỗi không thành công (không phải 2xx)
    if (!RESPONSE.ok) {
      // Trả về null để UI xử lý hiển thị thông báo lỗi phù hợp
      return null
    }
    
    /** Chuyển đổi dữ liệu thô từ API sang đối tượng JSON */
    const R = await RESPONSE.json()
    // Trích xuất thông tin customer_id nằm sâu trong cấu trúc source của Elasticsearch
    return R?.data?.hits?.hits?.[0]?._source?.client_bio?.customer_id || null
  }

  /**
   * Tìm kiếm thông tin khách hàng từ ERP dựa trên mã
   * @param code - Mã khách hàng
   */
  async searchCustomer(code: string): Promise<Customer | null> {
    // Kiểm tra chế độ chạy giả lập dữ liệu
    if (this.CONFIG.is_mock) {
      // Log trạng thái để dễ dàng theo dõi luồng test
      console.log('[RetionService.searchCustomer] --- MOCK MODE ---')
      // Tạo độ trễ 0.8 giây để người dùng thấy được hiệu ứng tìm kiếm
      await new Promise(resolve => setTimeout(resolve, 800))
      // Tìm kiếm khách hàng trong mảng dữ liệu mẫu dựa trên mã code đã trim khoảng trắng
      return initialCustomers.find(c => c.customer_code === code.trim()) || null
    }

    /** Endpoint tìm kiếm khách hàng ERP với tham số query customerCode */
    const API_URL = `${import.meta.env.VITE_ZEMA_API_URL}?customer_code=${code.trim()}`
    // Gọi API GET đến hệ thống ERP để truy vấn thông tin chi tiết
    const RESPONSE = await fetch(API_URL, {
      // Sử dụng phương thức GET để truy vấn dữ liệu
      method: 'GET',
      // Header yêu cầu format JSON và các token xác thực từ proxy
      headers: {
        accept: 'application/json',
        token: import.meta.env.VITE_ZEMA_API_TOKEN,
        product: import.meta.env.VITE_ZEMA_API_PRODUCT,
      },
    })

    // Nếu kết quả trả về từ server lỗi hoặc không tìm thấy
    if (!RESPONSE.ok) {
      // Kết thúc hàm và trả về null
      return null
    }
    
    /** Parse kết quả phản hồi sang JSON */
    const DATA = await RESPONSE.json()
    /** Lấy bản ghi đầu tiên trong danh sách kết quả (giả định mã khách hàng là duy nhất) */
    const MATCH_DATA = DATA?.data?.docs?.[0]
    
    // Nếu không tìm thấy bản ghi nào khớp với mã cung cấp
    if (!MATCH_DATA) {
      // Trả về null để UI báo lỗi "Không tìm thấy"
      return null
    }

    /** Ánh xạ dữ liệu từ API ERP sang cấu trúc Model Customer của ứng dụng */
    return {
      // Mã khách hàng từ hệ thống ERP
      customer_code: MATCH_DATA.customerCode,
      // Tên hiển thị của khách hàng
      name: MATCH_DATA.customerName,
      // Địa chỉ email (fallback rỗng nếu thiếu)
      email: MATCH_DATA.email || '',
      // Số điện thoại (fallback rỗng nếu thiếu)
      phone: MATCH_DATA.phone || '',
      // Địa chỉ cư trú (fallback rỗng nếu thiếu)
      address: MATCH_DATA.address || '',
      // Tổng điểm loyalty từ hệ thống ERP
      loyaltyPoints: MATCH_DATA.loyaltyPoints || 0,
      // Trạng thái tài khoản (active/inactive)
      status: MATCH_DATA.status || 'active',
      // API `cdp?customer_code` trả về `isMap`; true nghĩa là khách đã được liên kết
      isLinked: Boolean(MATCH_DATA.isMap),
    }
  }

  /**
   * Thực hiện liên kết khách hàng với Retion (Map & Update)
   * @param code - Mã khách hàng
   * @param page_id - Page ID
   * @param client_id - Client ID
   */
  async linkCustomer(code: string, page_id: string, client_id: string): Promise<boolean> {
    // Xử lý logic giả lập khi đang ở chế độ test
    if (this.CONFIG.is_mock) {
      // Log thông tin hành động liên kết mock
      console.log('[RetionService.linkCustomer] --- MOCK MODE ---')
      // Đợi 1.5 giây để giả lập các bước gọi API tuần tự
      await new Promise(resolve => setTimeout(resolve, 1500))
      // Luôn trả về true để cho phép người dùng test UI trạng thái "Đã liên kết"
      return true
    }

    try {
      /** Địa chỉ API thực hiện ánh xạ (map) khách hàng */
      const MAP_URL = import.meta.env.VITE_RETION_MAP_API_URL
      /** Chuẩn hóa payload trước khi gửi để dễ kiểm tra log và tránh dữ liệu rỗng */
      const MAP_PAYLOAD = {
        customer_code: this.normalizeText(code),
        page_id: this.normalizeText(page_id),
        client_id: this.normalizeText(client_id),
      }

      // Ngăn gọi API nếu thiếu endpoint hoặc dữ liệu định danh bắt buộc
      if (!MAP_URL || !MAP_PAYLOAD.customer_code || !MAP_PAYLOAD.page_id || !MAP_PAYLOAD.client_id) {
        console.error('[RetionService.linkCustomer] Thiếu dữ liệu map API:', {
          map_url_exists: Boolean(MAP_URL),
          payload: MAP_PAYLOAD,
        })
        return false
      }

      // Log payload thực tế để đối chiếu với Network tab và log phía backend
      console.log('[RetionService.linkCustomer] MAP payload:', MAP_PAYLOAD)
      // Thực hiện Bước 1: Gửi yêu cầu lưu thông tin liên kết vào database mapping
      const RESPONSE_MAP = await fetch(MAP_URL, {
        // Sử dụng POST để tạo mới bản ghi mapping
        method: 'POST',
        // Headers xác thực ứng dụng và định dạng dữ liệu
        headers: {
          'Content-Type': 'application/json',
          product: import.meta.env.VITE_ZEMA_API_PRODUCT,
          token: import.meta.env.VITE_ZEMA_API_TOKEN,
        },
        // Gửi thông tin định danh khách hàng và hội thoại
        body: JSON.stringify(MAP_PAYLOAD),
      })

      // Nếu bước mapping thất bại (server lỗi 500 hoặc 403 chẳng hạn)
      if (!RESPONSE_MAP.ok) {
        console.error('[RetionService.linkCustomer] Map API thất bại:', {
          status: RESPONSE_MAP.status,
          status_text: RESPONSE_MAP.statusText,
          payload: MAP_PAYLOAD,
          response_text: await RESPONSE_MAP.text(),
        })
        // Dừng quy trình và trả về thất bại
        return false
      }

      /** Địa chỉ API cập nhật bio cho cuộc hội thoại */
      const UPDATE_URL = import.meta.env.VITE_RETION_UPDATE_CONVERSATION_API_URL
      // Thực hiện Bước 2: Lưu ID khách hàng vào bio của cuộc hội thoại để Retion hiển thị sau này
      await fetch(UPDATE_URL, {
        // Phương thức POST để ghi đè/cập nhật thông tin bio
        method: 'POST',
        // Định dạng JSON chuẩn
        headers: { 'Content-Type': 'application/json' },
        // Cập nhật trường client_bio.customer_id theo định dạng của ES/Retion
        body: JSON.stringify({
          page_id,
          client_id,
          'client_bio.customer_id': code,
        }),
      })

      // Hoàn tất quy trình liên kết 2 bước thành công
      return true
    } catch (error) {
      // Ghi log lỗi ngoại lệ để phục vụ giám sát hệ thống
      console.error('[RetionService.linkCustomer] Lỗi nghiêm trọng:', error)
      // Trả về false để UI không chuyển sang trạng thái "Đã đồng bộ" sai trái
      return false
    }
  }
}

// -----------------------------------------------------------------------------
//#endregion
